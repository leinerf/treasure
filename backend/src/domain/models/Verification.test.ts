import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { Verification } from "./Verification.js";
import { EmailVerificationRepository } from "../../infra/db/repository/EmailVerificationRepository.js";
import { PasswordResetRepository } from "../../infra/db/repository/PasswordResetRepository.js";
import { UserRepository } from "../../infra/db/repository/UserRepository.js";
import { Role } from "./entity/User.js";
import { InvalidEmailError } from "../errors/InvalidEmailError.js";
import crypto from "node:crypto";

vi.mock("../../infra/db/repository/EmailVerificationRepository.js", () => ({
    EmailVerificationRepository: { findOneByEmail: vi.fn(), deleteById: vi.fn(), save: vi.fn() }
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
    const existingCode = { id: "old-code", userId: "user-id", email, code: "123456", expiresAt: now };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
        vi.setSystemTime(now);
        vi.mocked(EmailVerificationRepository.findOneByEmail).mockResolvedValue(null);
        vi.mocked(EmailVerificationRepository.deleteById).mockResolvedValue(undefined);
        vi.mocked(EmailVerificationRepository.save).mockImplementation(async (code) => ({ id: "new-email", ...code }));
        vi.mocked(PasswordResetRepository.saveIfUnderLimit).mockImplementation(async (reset) => ({ id: "new-reset", createdAt: now, ...reset }));
        vi.mocked(UserRepository.findOneByEmail).mockResolvedValue({
            id: "user-id", username: "testuser", email, password: "hash", role: Role.User
        });
    });

    afterEach(() => vi.useRealTimers());

    test("creates an email verification code with a ten-minute lifetime", async () => {
        const { emailCode } = await Verification.createEmailVerificationCode(email);
        expect(emailCode).toMatchObject({ id: "new-email", email, code: expect.stringMatching(/^[1-9]\d{5}$/) });
        expect(emailCode.expiresAt.getTime()).toBe(now.getTime() + 10 * 60_000);
        expect(EmailVerificationRepository.save).toHaveBeenCalledWith({
            email, code: emailCode.code, expiresAt: emailCode.expiresAt
        });
        expect(EmailVerificationRepository.deleteById).not.toHaveBeenCalled();
    });

    test("deletes an existing email verification before saving a replacement", async () => {
        vi.mocked(EmailVerificationRepository.findOneByEmail).mockResolvedValueOnce(existingCode);
        await Verification.createEmailVerificationCode(email);
        expect(EmailVerificationRepository.deleteById).toHaveBeenCalledWith(existingCode.id);
        expect(vi.mocked(EmailVerificationRepository.deleteById).mock.invocationCallOrder[0])
            .toBeLessThan(vi.mocked(EmailVerificationRepository.save).mock.invocationCallOrder[0]!);
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
});
