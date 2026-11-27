import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { EMAIL_CODE_MAX_ATTEMPTS, Verification } from "./Verification.js";
import { EmailVerificationRepository } from "../../infra/db/repository/EmailVerificationRepository.js";
import { PasswordResetRepository } from "../../infra/db/repository/PasswordResetRepository.js";
import { UserRepository } from "../../infra/db/repository/UserRepository.js";
import { Role } from "./entity/User.js";
import { InvalidEmailError } from "../errors/InvalidEmailError.js";
import crypto from "node:crypto";
import { EmailVerificationNotFoundError } from "../errors/EmailVerificationNotFound.js";
import { InvalidEmailVerificationError } from "../errors/InvalidEmailVerification.js";
import { VerificationEmailLimitError } from "../errors/VerificationEmailLimitError.js";

vi.mock("../../infra/db/repository/EmailVerificationRepository.js", () => ({
    EmailVerificationRepository: { findOneByEmail: vi.fn(), deleteById: vi.fn(), save: vi.fn(), recordAttempt: vi.fn(), issueCodeIfUnderLimit: vi.fn() }
}));
vi.mock("../../infra/db/repository/PasswordResetRepository.js", () => ({
    PasswordResetRepository: { saveIfUnderLimit: vi.fn() }
}));
vi.mock("../../infra/db/repository/UserRepository.js", () => ({
    UserRepository: { findOneByEmail: vi.fn() }
}));

describe("Verification", () => {
    const email = "test@example.com";
    const now = new Date("2030-01-15T12:00:00Z");

    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
        vi.setSystemTime(now);
        vi.mocked(EmailVerificationRepository.findOneByEmail).mockResolvedValue(null);
        vi.mocked(EmailVerificationRepository.deleteById).mockResolvedValue(undefined);
        vi.mocked(EmailVerificationRepository.issueCodeIfUnderLimit).mockImplementation(async (code) => ({ id: "new-email", ...code }));
        vi.mocked(PasswordResetRepository.saveIfUnderLimit).mockImplementation(async (reset) => ({ id: "new-reset", createdAt: now, ...reset }));
        vi.mocked(UserRepository.findOneByEmail).mockResolvedValue({
            id: "user-id", username: "testuser", email, password: "hash", role: Role.User
        });
    });

    afterEach(() => vi.useRealTimers());

    test("creates an email verification code with a ten-minute lifetime, under the 3-per-hour limit", async () => {
        const { emailCode } = await Verification.createEmailVerificationCode(email);
        expect(emailCode).toMatchObject({ id: "new-email", email, code: expect.stringMatching(/^[1-9]\d{5}$/) });
        expect(emailCode.expiresAt.getTime()).toBe(now.getTime() + 10 * 60_000);
        expect(EmailVerificationRepository.issueCodeIfUnderLimit).toHaveBeenCalledWith(
            { email, code: emailCode.code, expiresAt: emailCode.expiresAt }, 3, 60 * 60_000
        );
    });

    test("refuses to send another code once the address reached its hourly limit", async () => {
        vi.mocked(EmailVerificationRepository.issueCodeIfUnderLimit).mockResolvedValueOnce(null);
        await expect(Verification.createEmailVerificationCode(email)).rejects.toBeInstanceOf(VerificationEmailLimitError);
    });

    test("creates a 256-bit reset token and stores only its SHA-256 hash", async () => {
        const result = await Verification.createPasswordResetToken(email);
        if (!result) throw new Error("Expected a reset token");
        const { token, passwordReset } = result;

        expect(Buffer.from(token, "base64url")).toHaveLength(32);
        const expectedHash = crypto.createHash("sha256").update(token).digest("hex");
        expect(passwordReset).toMatchObject({ id: "new-reset", userId: "user-id", email, tokenHash: expectedHash });
        expect(passwordReset.expiresAt.getTime()).toBe(now.getTime() + 30 * 60_000);
        expect(PasswordResetRepository.saveIfUnderLimit).toHaveBeenCalledWith(
            { userId: "user-id", email, tokenHash: expectedHash, expiresAt: passwordReset.expiresAt }, 3, 60 * 60_000
        );
        expect(JSON.stringify(vi.mocked(PasswordResetRepository.saveIfUnderLimit).mock.calls)).not.toContain(token);
    });

    test("creates a different token on every request", async () => {
        const first = await Verification.createPasswordResetToken(email);
        const second = await Verification.createPasswordResetToken(email);
        expect(first?.token).not.toBe(second?.token);
    });

    test("returns null once the account reaches its hourly reset email limit", async () => {
        vi.mocked(PasswordResetRepository.saveIfUnderLimit).mockResolvedValueOnce(null);
        await expect(Verification.createPasswordResetToken(email)).resolves.toBeNull();
    });

    test("rejects malformed emails before accessing the repositories", async () => {
        await expect(Verification.createEmailVerificationCode("bad-email")).rejects.toBeInstanceOf(InvalidEmailError);
        await expect(Verification.createPasswordResetToken("bad-email")).rejects.toBeInstanceOf(InvalidEmailError);
        expect(EmailVerificationRepository.findOneByEmail).not.toHaveBeenCalled();
        expect(UserRepository.findOneByEmail).not.toHaveBeenCalled();
    });

    test("returns null for unknown emails without creating a token", async () => {
        vi.mocked(UserRepository.findOneByEmail).mockResolvedValueOnce(null);
        await expect(Verification.createPasswordResetToken(email)).resolves.toBeNull();
        expect(PasswordResetRepository.saveIfUnderLimit).not.toHaveBeenCalled();
    });

    describe("checkEmailCode", () => {
        const stored = () => ({ id: "code-id", email, code: "123456", expiresAt: new Date(now.getTime() + 60_000) });
        const attemptNumber = (attempts: number, overrides: Record<string, unknown> = {}) =>
            vi.mocked(EmailVerificationRepository.recordAttempt).mockResolvedValueOnce({ verification: { ...stored(), ...overrides }, attempts });

        test("allows 5 submissions per code", () => {
            expect(EMAIL_CODE_MAX_ATTEMPTS).toBe(5);
        });

        test("returns the code when it matches, counting the attempt first", async () => {
            attemptNumber(1);
            await expect(Verification.checkEmailCode(email, "123456")).resolves.toMatchObject({ id: "code-id" });
            expect(EmailVerificationRepository.recordAttempt).toHaveBeenCalledWith(email);
            expect(EmailVerificationRepository.deleteById).not.toHaveBeenCalled();
        });

        test("rejects a wrong code and keeps it while attempts remain", async () => {
            attemptNumber(4);
            await expect(Verification.checkEmailCode(email, "000000")).rejects.toBeInstanceOf(EmailVerificationNotFoundError);
            expect(EmailVerificationRepository.deleteById).not.toHaveBeenCalled();
        });

        test("locks the code on the 5th wrong submission, keeping the row and its send count", async () => {
            attemptNumber(5);
            await expect(Verification.checkEmailCode(email, "000000"))
                .rejects.toThrow(new InvalidEmailVerificationError("Too many incorrect codes. Request a new verification code."));
            expect(EmailVerificationRepository.deleteById).not.toHaveBeenCalled();
        });

        test("rejects even the correct code once 5 submissions were used", async () => {
            attemptNumber(6);
            await expect(Verification.checkEmailCode(email, "123456"))
                .rejects.toThrow(new InvalidEmailVerificationError("Too many incorrect codes. Request a new verification code."));
            expect(EmailVerificationRepository.deleteById).not.toHaveBeenCalled();
        });

        test("rejects an expired code without deleting the row, so expiry can't reset the send count", async () => {
            attemptNumber(1, { expiresAt: new Date(now.getTime() - 1) });
            await expect(Verification.checkEmailCode(email, "123456"))
                .rejects.toThrow(new InvalidEmailVerificationError("Email verification code has expired. Request a new verification code."));
            expect(EmailVerificationRepository.deleteById).not.toHaveBeenCalled();
        });

        test("rejects an email with no code, and codes of the wrong type or length", async () => {
            vi.mocked(EmailVerificationRepository.recordAttempt).mockResolvedValueOnce(null);
            await expect(Verification.checkEmailCode(email, "123456")).rejects.toBeInstanceOf(EmailVerificationNotFoundError);
            attemptNumber(1);
            await expect(Verification.checkEmailCode(email, 123456 as unknown as string)).rejects.toBeInstanceOf(EmailVerificationNotFoundError);
            attemptNumber(2);
            await expect(Verification.checkEmailCode(email, "1234567")).rejects.toBeInstanceOf(EmailVerificationNotFoundError);
        });
    });
});
