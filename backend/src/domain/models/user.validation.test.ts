import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import User from "./user.js";
import { UserRepository } from "../../infra/db/repository/UserRepository.js";
import { PasswordResetRepository } from "../../infra/db/repository/PasswordResetRepository.js";
import { InvalidEmailError } from "../errors/InvalidEmailError.js";
import { InvalidUsernameError } from "../errors/InvalidUsernameError.js";
import { InvalidPasswordError } from "../errors/InvalidPasswordError.js";
import { InvalidPasswordResetCodeError } from "../errors/InvalidPasswordResetCode.js";
import { InvalidOffsetOrLimitError } from "../errors/InvalidOffsetOrLimitError.js";
import { InvalidQueryError } from "../errors/InvalidQueryError.js";
import { PasswordResetCodeNotFoundError } from "../errors/PasswordResetCodeNotFound.js";
import { Role } from "./entity/User.js";
import { InvalidCredentialsError } from "../errors/InvalidCredentialsError.js";
import { ValidationService } from "../services/validationService.js";
import bcrypt from "bcrypt";
import crypto from "node:crypto";

vi.mock("../../config.js", () => ({ config: { jwt_secret_key: "test-secret", salt_rounds: 4 } }));
vi.mock("../../infra/db/repository/UserRepository.js", () => ({
    UserRepository: { findOneByEmail: vi.fn(), findOneByUsername: vi.fn(), findOneById: vi.fn(), updatePasswordAndDeletePasswordResetCode: vi.fn() }
}));
vi.mock("../../infra/db/repository/EmailVerificationRepository.js", () => ({
    EmailVerificationRepository: { findOneByCodeAndEmail: vi.fn() }
}));
vi.mock("../../infra/db/repository/PasswordResetRepository.js", () => ({
    PasswordResetRepository: { findOneByTokenHash: vi.fn(), deleteById: vi.fn() }
}));

describe("User validation integration", () => {
    beforeEach(() => {
        vi.mocked(UserRepository.findOneByEmail).mockResolvedValue({
            id: "user-id", username: "testuser", email: "test@example.com", password: "hash", role: Role.User
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.clearAllMocks();
    });

    test("rejects invalid registration inputs before querying users", async () => {
        await expect(User.createNewUser("ab", "test@example.com", "123456", "Password!123"))
            .rejects.toBeInstanceOf(InvalidUsernameError);
        await expect(User.createNewUser("validuser", "bad-email", "123456", "Password!123"))
            .rejects.toBeInstanceOf(InvalidEmailError);
        await expect(User.createNewUser("validuser", "test@example.com", "123456", "weak"))
            .rejects.toBeInstanceOf(InvalidPasswordError);
        expect(UserRepository.findOneByEmail).not.toHaveBeenCalled();
    });

    test("does not include the rejected password in the registration error", async () => {
        const rejectedPassword = "weak-secret";
        const error = await User.createNewUser("validuser", "test@example.com", "123456", rejectedPassword)
            .catch((caught: unknown) => caught);
        expect(error).toBeInstanceOf(InvalidPasswordError);
        expect((error as Error).message).not.toContain(rejectedPassword);
    });

    describe("password reset with a link token", () => {
        const email = "test@example.com";
        const token = "reset-token";
        const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
        const resetRow = (overrides: Record<string, unknown> = {}) => ({
            id: "reset-id", userId: "user-id", email, tokenHash, createdAt: new Date(),
            expiresAt: new Date(Date.now() + 60_000), ...overrides
        });

        test("looks the token up by its hash and resets the bound user", async () => {
            const user = { id: "user-id", username: "testuser", email, password: bcrypt.hashSync("Old!Password123", 4), role: Role.User };
            vi.mocked(PasswordResetRepository.findOneByTokenHash).mockResolvedValue(resetRow());
            vi.mocked(UserRepository.findOneById).mockResolvedValue(user);
            vi.mocked(UserRepository.updatePasswordAndDeletePasswordResetCode).mockResolvedValue(user);

            await User.resetPassword("New!Password123", token);

            expect(PasswordResetRepository.findOneByTokenHash).toHaveBeenCalledWith(tokenHash);
            expect(UserRepository.updatePasswordAndDeletePasswordResetCode)
                .toHaveBeenCalledWith(user.id, expect.any(String), "reset-id", email);
        });

        test("rejects unknown and empty tokens", async () => {
            vi.mocked(PasswordResetRepository.findOneByTokenHash).mockResolvedValue(null);
            await expect(User.resetPassword("New!Password123", "wrong-token")).rejects.toBeInstanceOf(PasswordResetCodeNotFoundError);
            await expect(User.resetPassword("New!Password123", "")).rejects.toBeInstanceOf(PasswordResetCodeNotFoundError);
            expect(PasswordResetRepository.findOneByTokenHash).toHaveBeenCalledTimes(1);
            expect(UserRepository.updatePasswordAndDeletePasswordResetCode).not.toHaveBeenCalled();
        });

        test("rejects and deletes expired tokens", async () => {
            vi.mocked(PasswordResetRepository.findOneByTokenHash).mockResolvedValue(resetRow({ expiresAt: new Date(Date.now() - 1) }));
            await expect(User.resetPassword("New!Password123", token)).rejects.toBeInstanceOf(InvalidPasswordResetCodeError);
            expect(PasswordResetRepository.deleteById).toHaveBeenCalledWith("reset-id");
            expect(UserRepository.findOneById).not.toHaveBeenCalled();
        });

        test.each(["changed", "missing"])("rejects tokens whose user is %s", async (binding) => {
            vi.mocked(PasswordResetRepository.findOneByTokenHash).mockResolvedValue(resetRow());
            vi.mocked(UserRepository.findOneById).mockResolvedValue(binding === "changed"
                ? { id: "user-id", username: "testuser", email: "changed@example.com", password: "hash", role: Role.User }
                : null);
            await expect(User.resetPassword("New!Password123", token)).rejects.toBeInstanceOf(PasswordResetCodeNotFoundError);
            expect(UserRepository.updatePasswordAndDeletePasswordResetCode).not.toHaveBeenCalled();
        });

        test("rejects an invalid new password before looking up the token", async () => {
            const error = await User.resetPassword("weak-secret", token).catch((caught: unknown) => caught);
            expect(error).toBeInstanceOf(InvalidPasswordError);
            expect((error as Error).message).not.toContain("weak-secret");
            expect(PasswordResetRepository.findOneByTokenHash).not.toHaveBeenCalled();
        });
    });

    test.each([
        ["an object username", { $ne: "" }, "Password!123"],
        ["a number password", "testuser", 12345],
        ["an empty username", "", "Password!123"],
        ["a missing password", "testuser", undefined],
    ])("rejects %s with the generic login error, before querying", async (_label, username, password) => {
        const compare = vi.spyOn(ValidationService, "matchesPassword");
        await expect(User.createUserAuthentication(username as string, password as string)).rejects.toBeInstanceOf(InvalidCredentialsError);
        expect(UserRepository.findOneByUsername).not.toHaveBeenCalled();
        expect(compare).not.toHaveBeenCalled();
    });

    test("runs a bcrypt comparison for an unknown username, so it takes as long as a wrong password", async () => {
        vi.mocked(UserRepository.findOneByUsername).mockResolvedValueOnce(null);
        const compare = vi.spyOn(ValidationService, "matchesPassword");

        await expect(User.createUserAuthentication("nobody", "Some!Password1")).rejects.toBeInstanceOf(InvalidCredentialsError);

        expect(compare).toHaveBeenCalledOnce();
        expect(compare.mock.calls[0]![1]).toMatch(/^\$2[aby]\$04\$/);
        await expect(compare.mock.results[0]!.value).resolves.toBe(false);
    });

    test("rejects invalid pagination and search queries before looking the user up", async () => {
        await expect(User.adminFindUsers("user-id", 0, 0)).rejects.toBeInstanceOf(InvalidOffsetOrLimitError);
        await expect(User.adminSearchUsers("user-id", "  ab  ")).rejects.toBeInstanceOf(InvalidQueryError);
        expect(UserRepository.findOneById).not.toHaveBeenCalled();
    });
});
