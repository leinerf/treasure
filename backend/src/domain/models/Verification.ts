import crypto from "node:crypto";
import { ValidationService } from "../services/validationService.js";
import type { EmailVerification } from "./entity/EmailVerification.js";
import type { PasswordReset } from "./entity/PasswordReset.js";
import { EmailVerificationRepository } from "../../infra/db/repository/EmailVerificationRepository.js";
import { PasswordResetRepository } from "../../infra/db/repository/PasswordResetRepository.js";
import { UserRepository } from "../../infra/db/repository/UserRepository.js";
import { InvalidEmailError } from "../errors/InvalidEmailError.js";
import { EmailVerificationNotFoundError } from "../errors/EmailVerificationNotFound.js";
import { InvalidEmailVerificationError } from "../errors/InvalidEmailVerification.js";

/** Submissions allowed per email verification code; the 5th wrong one deletes it. */
export const EMAIL_CODE_MAX_ATTEMPTS = 5;

// 256 bits of randomness: guessing a token is infeasible, so submissions need no per-account limit.
const PASSWORD_RESET_TOKEN_BYTES = 32;
const PASSWORD_RESET_TOKEN_LIFETIME_MINUTES = 30;
const PASSWORD_RESET_EMAILS_PER_WINDOW = 3;
const PASSWORD_RESET_EMAIL_WINDOW_MS = 60 * 60 * 1000;

export class Verification {
    /**
     * Checks a submitted email verification code and returns it if it's right. Every submission
     * is counted before the comparison, so at most EMAIL_CODE_MAX_ATTEMPTS are ever compared, even
     * when many arrive at once. With 900,000 possible codes, that leaves a guesser about 5 in
     * 900,000 per code, and each new code sends the owner another email. The caller still deletes
     * the code once it's used.
     */
    public static async checkEmailCode(email: string, code: string): Promise<EmailVerification> {
        const attempt = await EmailVerificationRepository.recordAttempt(email);
        if (!attempt) {
            throw new EmailVerificationNotFoundError(email);
        }
        const { verification, attempts } = attempt;
        if (ValidationService.isExpired(verification.expiresAt)) {
            await EmailVerificationRepository.deleteById(verification.id);
            throw new InvalidEmailVerificationError("Email verification code has expired. Request a new verification code.");
        }
        if (attempts > EMAIL_CODE_MAX_ATTEMPTS) {
            await EmailVerificationRepository.deleteById(verification.id);
            throw new InvalidEmailVerificationError("Too many incorrect codes. Request a new verification code.");
        }
        if (!Verification.codesMatch(code, verification.code)) {
            if (attempts === EMAIL_CODE_MAX_ATTEMPTS) {
                await EmailVerificationRepository.deleteById(verification.id);
                throw new InvalidEmailVerificationError("Too many incorrect codes. Request a new verification code.");
            }
            throw new EmailVerificationNotFoundError(email);
        }
        return verification;
    }

    /** Compares in constant time, so response time doesn't reveal how many digits were right. */
    private static codesMatch(submitted: unknown, expected: string): boolean {
        if (typeof submitted !== "string" || submitted.length !== expected.length) {
            return false;
        }
        return crypto.timingSafeEqual(Buffer.from(submitted), Buffer.from(expected));
    }

    public static async createEmailVerificationCode(email: string): Promise<{ emailCode: EmailVerification }> {
        email = ValidationService.normalizeEmail(email);
        if(!ValidationService.isValidEmail(email)){
            throw new InvalidEmailError("Invalid email format: " + email);
        }
        const existingEmailCode = await EmailVerificationRepository.findOneByEmail(email);
        if(existingEmailCode){
            await EmailVerificationRepository.deleteById(existingEmailCode.id);
        }
        const emailCode = await EmailVerificationRepository.save({
            email,
            code: Verification.generateRandomCode(),
            expiresAt: Verification.expireAt()
        });
        return { emailCode };
    }

    /**
     * Creates a single-use password reset token for the account with this email.
     * Returns null, without revealing why, when no account has the email or the
     * account has reached its hourly limit of reset emails. Earlier tokens stay
     * valid until they expire or one of them is used, so a third party requesting
     * resets cannot cancel the link the account owner is about to open.
     */
    public static async createPasswordResetToken(email: string): Promise<{ token: string; passwordReset: PasswordReset } | null> {
        email = ValidationService.normalizeEmail(email);
        if(!ValidationService.isValidEmail(email)){
            throw new InvalidEmailError("Invalid email format");
        }
        const existingUser = await UserRepository.findOneByEmail(email);
        if(!existingUser){
            return null;
        }

        const token = crypto.randomBytes(PASSWORD_RESET_TOKEN_BYTES).toString("base64url");
        const passwordReset = await PasswordResetRepository.saveIfUnderLimit({
            userId: existingUser.id,
            email,
            tokenHash: Verification.hashPasswordResetToken(token),
            expiresAt: Verification.expireAt(PASSWORD_RESET_TOKEN_LIFETIME_MINUTES)
        }, PASSWORD_RESET_EMAILS_PER_WINDOW, PASSWORD_RESET_EMAIL_WINDOW_MS);
        if(!passwordReset){
            return null;
        }
        return { token, passwordReset };
    }

    public static hashPasswordResetToken(token: string): string {
        return crypto.createHash("sha256").update(token).digest("hex");
    }

    private static generateRandomCode(length: number = 6): string {
        return crypto.randomInt(Math.pow(10, length - 1), Math.pow(10, length)).toString();
    }

    private static expireAt(minutes: number = 10): Date {
        const now = new Date();
        now.setMinutes(now.getMinutes() + minutes);
        return now;
    }
}
