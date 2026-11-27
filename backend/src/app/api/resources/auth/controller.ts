import { type Request, type Response } from "express";  
import User from "../../../../domain/models/user.js";
import { Verification } from "../../../../domain/models/Verification.js";
import EmailService from "../../../../domain/services/emailService.js";
import { ValidationService } from "../../../../domain/services/validationService.js";
import LoggingService from "../../../../domain/services/loggingService.js";
import { Session } from "../../../../domain/models/session.js";
import { TokenService } from "../../../../domain/services/tokenService.js";
import { UserNotFoundError } from "../../../../domain/errors/UserNotFoundError.js";
import { InvalidRefreshTokenError } from "../../../../domain/errors/InvalidRefreshTokenError.js";
import { VerificationEmailLimitError } from "../../../../domain/errors/VerificationEmailLimitError.js";
import { clearRefreshCookie, setRefreshCookie } from "./refreshCookie.js";

export const PASSWORD_RESET_REQUESTED_MESSAGE = "If an account uses that email, a password reset link has been sent.";

class AuthController {
    public static async createVerificationEmail(req: Request, res: Response): Promise<Response> {
        const { email } = req.body ?? {};
        let emailCode: Awaited<ReturnType<typeof Verification.createEmailVerificationCode>>["emailCode"];
        try {
            ({ emailCode } = await Verification.createEmailVerificationCode(email));
        } catch (error) {
            if (error instanceof VerificationEmailLimitError) {
                return res.status(429).json({ error: error.message });
            }
            throw error;
        }
        await EmailService.sendVerificationEmail(emailCode.email, emailCode.code);
        
        return res.status(200).json({ message: "Verification email sent successfully" });
    }

    public static async register(req: Request, res: Response): Promise<Response> {
        const { username, email, emailVerificationCode, password } = req.body;
        const { user } = await User.createNewUser(username, email, emailVerificationCode, password);
        
        // Log the id only: logs are copied and kept, so they shouldn't hold email addresses.
        LoggingService.info(`New user registered with id: ${user.id}`);
        return res.status(200).json({ message: "User registered successfully" });
    }

    public static async login(req: Request, res: Response): Promise<Response> {
        const { username, password } = req.body;
        const { jwt: accessToken, userId } = await User.createUserAuthentication(username, password);
        const { refreshToken } = await Session.create(userId);

        setRefreshCookie(res, refreshToken);
        return res.status(200).json({ message: "Authentication successful", accessToken });
    }

    public static async logout(req: Request, res: Response): Promise<Response> {
        const refreshToken = req.cookies?.refreshToken;
        await Session.revoke(typeof refreshToken === "string" ? refreshToken : undefined);
        clearRefreshCookie(res);
        return res.status(200).json({ message: "Authentication cleared successfully" });
    }

    public static async refreshToken(req: Request, res: Response): Promise<Response> {
        const refreshToken = req.cookies?.refreshToken;
        if (typeof refreshToken !== "string") {
            return res.status(401).json({ error: "Unauthorized" });
        }
        let session: Awaited<ReturnType<typeof Session.refresh>>;
        try {
            session = await Session.refresh(refreshToken);
        } catch (error) {
            if (error instanceof InvalidRefreshTokenError) {
                clearRefreshCookie(res);
                return res.status(401).json({ error: "Unauthorized" });
            }
            throw error;
        }
        try {
            await User.getUser(session.userId);
        } catch (error) {
            if (error instanceof UserNotFoundError) {
                await Session.revokeAll(session.userId);
                clearRefreshCookie(res);
                return res.status(401).json({ error: "Unauthorized" });
            }
            throw error;
        }
        if (session.refreshToken) {
            setRefreshCookie(res, session.refreshToken);
        }
        return res.status(200).json({ accessToken: session.accessToken });
    }

    /**
     * Reports whether the caller's tokens are present and usable, without revealing them.
     * The refresh cookie reaches this route because it is scoped to /api/auth. The access
     * token is read from the Authorization header when the caller sends one.
     */
    public static async status(req: Request, res: Response): Promise<Response> {
        const bearer = /^Bearer (\S+)$/i.exec(req.headers.authorization ?? "")?.[1];
        let accessTokenValid = false;
        if (bearer) {
            try {
                TokenService.verifyAccessToken(bearer);
                accessTokenValid = true;
            } catch {
                accessTokenValid = false;
            }
        }
        const refreshToken = req.cookies?.refreshToken;
        const refreshTokenPresent = typeof refreshToken === "string" && refreshToken.length > 0;
        const refreshTokenValid = refreshTokenPresent ? await Session.isActive(refreshToken) : false;

        return res.status(200).set("Cache-Control", "no-store").json({
            accessToken: { present: Boolean(bearer), valid: accessTokenValid },
            refreshToken: { present: refreshTokenPresent, valid: refreshTokenValid }
        });
    }

    public static async createPasswordReset(req: Request, res: Response): Promise<Response> {
        const email = ValidationService.normalizeEmail(req.body?.email);
        if (!ValidationService.isValidEmail(email)) {
            return res.status(400).json({ error: "Enter a valid email address" });
        }
        // Everything that depends on whether the account exists (the lookup, the token, the
        // email) runs after the response, so existing and unknown emails answer equally fast.
        EmailService.sendInBackground(AuthController.issuePasswordReset(email), "password reset link");
        // Same response whether or not the email has an account or hit the hourly email limit.
        return res.status(200).json({ message: PASSWORD_RESET_REQUESTED_MESSAGE });
    }

    /** Creates a reset token and emails the link, if the email has an account under its hourly cap. */
    private static async issuePasswordReset(email: string): Promise<void> {
        const reset = await Verification.createPasswordResetToken(email);
        if (!reset) {
            return;
        }
        try {
            await EmailService.sendPasswordResetEmail(reset.passwordReset.email, reset.token);
        } catch (error) {
            const reason = error instanceof Error ? error.message : String(error);
            throw new Error(`for user ${reset.passwordReset.userId}: ${reason}`);
        }
    }

    public static async resetPassword(req: Request, res: Response): Promise<Response> {
        const { token, newPassword } = req.body ?? {};
        if (typeof token !== "string" || typeof newPassword !== "string") {
            return res.status(400).json({ error: "Password reset token and new password are required" });
        }
        const { user } = await User.resetPassword(newPassword, token);
        await Session.revokeAll(user.id);
        EmailService.sendInBackground(EmailService.sendPasswordChangedEmail(user.email), `password changed notice for user ${user.id}`);

        LoggingService.info(`Password reset successfully for user with id: ${user.id}`);
        return res.status(200).json({ message: "Password reset successfully" });
    }
}

export default AuthController;