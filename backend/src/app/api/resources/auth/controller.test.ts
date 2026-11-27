import { beforeEach, describe, expect, test, vi } from "vitest";
import type { Request, Response } from "express";
import AuthController, { PASSWORD_RESET_REQUESTED_MESSAGE } from "./controller.js";
import User from "../../../../domain/models/user.js";
import { Verification } from "../../../../domain/models/Verification.js";
import EmailService from "../../../../domain/services/emailService.js";
import { TokenService } from "../../../../domain/services/tokenService.js";
import { UserNotFoundError } from "../../../../domain/errors/UserNotFoundError.js";
import { Role } from "../../../../domain/models/entity/User.js";
import { Session } from "../../../../domain/models/session.js";
import { InvalidRefreshTokenError } from "../../../../domain/errors/InvalidRefreshTokenError.js";

vi.mock("../../../../config.js", () => ({
    config: { jwt_secret_key: "unit-test-secret" }
}));
vi.mock("../../../../domain/models/user.js", () => ({
    default: { createUserAuthentication: vi.fn(), getUser: vi.fn(), resetPassword: vi.fn() }
}));
vi.mock("../../../../domain/models/Verification.js", () => ({
    Verification: { createEmailVerificationCode: vi.fn(), createPasswordResetToken: vi.fn() }
}));
vi.mock("../../../../domain/services/emailService.js", () => ({
    default: {
        sendVerificationEmail: vi.fn(), sendPasswordResetEmail: vi.fn(), sendPasswordChangedEmail: vi.fn(async () => undefined),
        sendInBackground: vi.fn((send: Promise<void>) => { send.catch(() => undefined); })
    }
}));
vi.mock("../../../../domain/services/loggingService.js", () => ({ default: { info: vi.fn(), error: vi.fn() } }));
vi.mock("../../../../domain/models/session.js", () => ({
    Session: { create: vi.fn(), refresh: vi.fn(), revoke: vi.fn(), revokeAll: vi.fn(), isActive: vi.fn() }
}));

const response = () => ({
    status: vi.fn().mockReturnThis(),
    cookie: vi.fn().mockReturnThis(),
    clearCookie: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis()
});

describe("AuthController tokens", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("AuthController verification", () => {
        test("creates and sends an email verification code", async () => {
            const email = "test@example.com";
            const code = { id: "code-id", email, code: "123456", expiresAt: new Date() };
            vi.mocked(Verification.createEmailVerificationCode).mockResolvedValueOnce({ emailCode: code });
            const res = response();

            await AuthController.createVerificationEmail({ body: { email } } as Request, res as unknown as Response);

            expect(Verification.createEmailVerificationCode).toHaveBeenCalledWith(email);
            expect(EmailService.sendVerificationEmail).toHaveBeenCalledWith(email, code.code);
        });
    });

    describe("AuthController password reset requests", () => {
        const email = "test@example.com";
        const passwordReset = {
            id: "reset-id", userId: "user-id", email, tokenHash: "hash", createdAt: new Date(), expiresAt: new Date()
        };

        /** The background work the controller handed to sendInBackground, for tests to await. */
        const backgroundWork = (): Promise<void> => vi.mocked(EmailService.sendInBackground).mock.calls.at(-1)![0];

        test("emails the reset token for an existing account, after responding", async () => {
            vi.mocked(Verification.createPasswordResetToken).mockResolvedValueOnce({ token: "reset-token", passwordReset });
            vi.mocked(EmailService.sendPasswordResetEmail).mockResolvedValueOnce(undefined);
            const res = response();

            await AuthController.createPasswordReset({ body: { email: "  Test@Example.com " } } as Request, res as unknown as Response);
            expect(res.json).toHaveBeenCalledWith({ message: PASSWORD_RESET_REQUESTED_MESSAGE });
            await backgroundWork();

            expect(Verification.createPasswordResetToken).toHaveBeenCalledWith(email);
            expect(EmailService.sendPasswordResetEmail).toHaveBeenCalledWith(email, "reset-token");
            expect(res.status).toHaveBeenCalledWith(200);
        });

        test("responds before looking the account up, so timing doesn't reveal whether it exists", async () => {
            let finishLookup: (value: null) => void = () => undefined;
            vi.mocked(Verification.createPasswordResetToken).mockReturnValueOnce(new Promise((resolve) => { finishLookup = resolve; }));
            const res = response();

            await AuthController.createPasswordReset({ body: { email } } as Request, res as unknown as Response);

            expect(res.json).toHaveBeenCalledWith({ message: PASSWORD_RESET_REQUESTED_MESSAGE });
            finishLookup(null);
            await backgroundWork();
        });

        test("gives the same response for an unknown or rate-limited email and sends nothing", async () => {
            vi.mocked(Verification.createPasswordResetToken).mockResolvedValueOnce(null);
            const res = response();

            await AuthController.createPasswordReset({ body: { email } } as Request, res as unknown as Response);
            await backgroundWork();

            expect(EmailService.sendPasswordResetEmail).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ message: PASSWORD_RESET_REQUESTED_MESSAGE });
        });

        test("reports a failed send with the user id, not the email address", async () => {
            vi.mocked(Verification.createPasswordResetToken).mockResolvedValueOnce({ token: "reset-token", passwordReset });
            vi.mocked(EmailService.sendPasswordResetEmail).mockRejectedValueOnce(new Error("SMTP down"));
            const res = response();

            await AuthController.createPasswordReset({ body: { email } } as Request, res as unknown as Response);

            expect(res.json).toHaveBeenCalledWith({ message: PASSWORD_RESET_REQUESTED_MESSAGE });
            const failure = await backgroundWork().catch((error: unknown) => error);
            expect((failure as Error).message).toBe("for user user-id: SMTP down");
            expect((failure as Error).message).not.toContain(email);
        });

        test("rejects a malformed email with 400 before doing any work", async () => {
            const res = response();
            await AuthController.createPasswordReset({ body: { email: "not-an-email" } } as Request, res as unknown as Response);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(EmailService.sendInBackground).not.toHaveBeenCalled();
        });

        test("rejects a request without an email", async () => {
            const res = response();
            await AuthController.createPasswordReset({ body: {} } as Request, res as unknown as Response);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(Verification.createPasswordResetToken).not.toHaveBeenCalled();
        });
    });

    const user = { id: "user-id", username: "alice", email: "alice@example.com", password: "hash", role: Role.User };

    test("returns an access token and stores a new session's refresh token in an HttpOnly cookie", async () => {
        const accessToken = TokenService.createAccessToken("user-id");
        vi.mocked(User.createUserAuthentication).mockResolvedValue({ jwt: accessToken });
        vi.mocked(Session.create).mockResolvedValue({ refreshToken: "refresh-token" });
        const req = { body: { username: "alice", password: "password" } } as Request;
        const res = response();

        await AuthController.login(req, res as unknown as Response);

        expect(Session.create).toHaveBeenCalledWith("user-id");
        expect(res.json).toHaveBeenCalledWith({ message: "Authentication successful", accessToken });
        expect(res.cookie).toHaveBeenCalledWith("refreshToken", "refresh-token",
            expect.objectContaining({ httpOnly: true, sameSite: "strict", path: "/api/auth", maxAge: 7 * 24 * 60 * 60 * 1000 }));
    });

    test("rotates the refresh cookie and returns a new access token for an existing user", async () => {
        const accessToken = TokenService.createAccessToken("user-id");
        vi.mocked(Session.refresh).mockResolvedValue({ userId: "user-id", accessToken, refreshToken: "next-refresh-token" });
        vi.mocked(User.getUser).mockResolvedValue({ user });
        const res = response();

        const req: Partial<Request> = { cookies: { refreshToken: "refresh-token" } };
        await AuthController.refreshToken(req as Request, res as unknown as Response);

        expect(Session.refresh).toHaveBeenCalledWith("refresh-token");
        expect(User.getUser).toHaveBeenCalledWith(accessToken);
        expect(res.cookie).toHaveBeenCalledWith("refreshToken", "next-refresh-token", expect.objectContaining({ path: "/api/auth" }));
        expect(res.json).toHaveBeenCalledWith({ accessToken });
    });

    test("keeps the current cookie when a concurrent request already rotated the token", async () => {
        vi.mocked(Session.refresh).mockResolvedValue({ userId: "user-id", accessToken: "access-token" });
        vi.mocked(User.getUser).mockResolvedValue({ user });
        const res = response();

        const req: Partial<Request> = { cookies: { refreshToken: "refresh-token" } };
        await AuthController.refreshToken(req as Request, res as unknown as Response);

        expect(res.cookie).not.toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith({ accessToken: "access-token" });
    });

    test("rejects a missing refresh cookie without touching sessions", async () => {
        const res = response();
        await AuthController.refreshToken({ cookies: {} } as Request, res as unknown as Response);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(Session.refresh).not.toHaveBeenCalled();
    });

    test("rejects an invalid, revoked or reused refresh token and clears the cookie", async () => {
        vi.mocked(Session.refresh).mockRejectedValue(new InvalidRefreshTokenError("revoked"));
        const res = response();

        const req: Partial<Request> = { cookies: { refreshToken: "refresh-token" } };
        await AuthController.refreshToken(req as Request, res as unknown as Response);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.clearCookie).toHaveBeenCalledWith("refreshToken", expect.objectContaining({ path: "/api/auth" }));
        expect(User.getUser).not.toHaveBeenCalled();
    });

    test("revokes the sessions of a user that no longer exists", async () => {
        vi.mocked(Session.refresh).mockResolvedValue({ userId: "user-id", accessToken: "access-token", refreshToken: "next" });
        vi.mocked(User.getUser).mockRejectedValue(new UserNotFoundError("missing"));
        const res = response();

        const req: Partial<Request> = { cookies: { refreshToken: "refresh-token" } };
        await AuthController.refreshToken(req as Request, res as unknown as Response);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(Session.revokeAll).toHaveBeenCalledWith("user-id");
        expect(res.cookie).not.toHaveBeenCalled();
    });

    test("revokes the session and clears the refresh cookie on logout", async () => {
        const res = response();
        const req: Partial<Request> = { cookies: { refreshToken: "refresh-token" } };
        await AuthController.logout(req as Request, res as unknown as Response);
        expect(Session.revoke).toHaveBeenCalledWith("refresh-token");
        expect(res.clearCookie).toHaveBeenCalledWith("refreshToken", expect.objectContaining({ path: "/api/auth" }));
    });

    describe("status", () => {
        const statusOf = async (req: Partial<Request>) => {
            const res = response();
            await AuthController.status({ headers: {}, cookies: {}, ...req } as Request, res as unknown as Response);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.set).toHaveBeenCalledWith("Cache-Control", "no-store");
            return { body: res.json.mock.calls[0]![0], res };
        };

        test("reports both tokens as present and valid without returning them", async () => {
            vi.mocked(Session.isActive).mockResolvedValueOnce(true);
            const accessToken = TokenService.createAccessToken("user-id");
            const { body } = await statusOf({
                headers: { authorization: `Bearer ${accessToken}` }, cookies: { refreshToken: "refresh-token" }
            });
            expect(body).toEqual({ accessToken: { present: true, valid: true }, refreshToken: { present: true, valid: true } });
            expect(Session.isActive).toHaveBeenCalledWith("refresh-token");
            expect(JSON.stringify(body)).not.toContain(accessToken);
            expect(JSON.stringify(body)).not.toContain("refresh-token");
        });

        test("reports missing tokens without checking sessions", async () => {
            const { body } = await statusOf({});
            expect(body).toEqual({ accessToken: { present: false, valid: false }, refreshToken: { present: false, valid: false } });
            expect(Session.isActive).not.toHaveBeenCalled();
        });

        test("reports present but invalid tokens", async () => {
            vi.mocked(Session.isActive).mockResolvedValueOnce(false);
            const refreshAsAccess = TokenService.createRefreshToken("user-id", "token-id");
            const { body } = await statusOf({
                headers: { authorization: `Bearer ${refreshAsAccess}` }, cookies: { refreshToken: "revoked" }
            });
            expect(body).toEqual({ accessToken: { present: true, valid: false }, refreshToken: { present: true, valid: false } });
        });
    });

    test("logs out cleanly without a refresh cookie", async () => {
        const res = response();
        await AuthController.logout({} as Request, res as unknown as Response);
        expect(Session.revoke).toHaveBeenCalledWith(undefined);
        expect(res.status).toHaveBeenCalledWith(200);
    });

    test("resets the password from the token in the body and revokes every session", async () => {
        vi.mocked(User.resetPassword).mockResolvedValue({ user });
        const res = response();
        const req: Partial<Request> = { params: {}, body: { token: "reset-token", newPassword: "New!12345" } };
        await AuthController.resetPassword(req as Request, res as unknown as Response);
        expect(User.resetPassword).toHaveBeenCalledWith("New!12345", "reset-token");
        expect(Session.revokeAll).toHaveBeenCalledWith("user-id");
        expect(EmailService.sendPasswordChangedEmail).toHaveBeenCalledWith(user.email);
        expect(res.status).toHaveBeenCalledWith(200);
    });

    test("rejects a password reset without a token", async () => {
        const res = response();
        const req: Partial<Request> = { params: {}, body: { newPassword: "New!12345" } };
        await AuthController.resetPassword(req as Request, res as unknown as Response);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(User.resetPassword).not.toHaveBeenCalled();
    });
});
