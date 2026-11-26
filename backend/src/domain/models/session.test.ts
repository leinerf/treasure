import { beforeEach, describe, expect, test, vi } from "vitest";
import { Session, ROTATION_GRACE_MS } from "./session.js";
import { RefreshTokenRepository } from "../../infra/db/repository/RefreshTokenRepository.js";
import { TokenService } from "../services/tokenService.js";
import { InvalidRefreshTokenError } from "../errors/InvalidRefreshTokenError.js";

vi.mock("../../config.js", () => ({ config: { jwt_secret_key: "unit-test-secret" } }));
vi.mock("../../infra/db/repository/RefreshTokenRepository.js", () => ({
    RefreshTokenRepository: {
        findOneById: vi.fn(),
        save: vi.fn(),
        markRotated: vi.fn(),
        deleteById: vi.fn(),
        deleteByUserId: vi.fn(),
        deleteExpiredByUserId: vi.fn()
    }
}));

const inOneDay = () => new Date(Date.now() + 24 * 60 * 60 * 1000);
const record = (overrides: Partial<{ id: string; userId: string; expiresAt: Date; rotatedAt: Date | null }> = {}) => ({
    id: "token-id", userId: "user-id", expiresAt: inOneDay(), rotatedAt: null, ...overrides
});

describe("Session", () => {
    beforeEach(() => {
        vi.resetAllMocks();
        vi.mocked(RefreshTokenRepository.save).mockImplementation(async (entity) => ({ id: "next-token-id", ...entity }));
    });

    test("creates a stored session whose refresh token carries the record id", async () => {
        const { refreshToken } = await Session.create("user-id");

        expect(RefreshTokenRepository.deleteExpiredByUserId).toHaveBeenCalledWith("user-id", expect.any(Date));
        const saved = vi.mocked(RefreshTokenRepository.save).mock.calls[0]![0];
        expect(saved).toMatchObject({ userId: "user-id", rotatedAt: null });
        expect(saved.expiresAt.getTime() - Date.now()).toBeGreaterThan(6 * 24 * 60 * 60 * 1000);
        expect(TokenService.verifyRefreshToken(refreshToken)).toEqual({ userId: "user-id", tokenId: "next-token-id" });
    });

    test("rotates a valid refresh token", async () => {
        vi.mocked(RefreshTokenRepository.findOneById).mockResolvedValue(record());
        vi.mocked(RefreshTokenRepository.markRotated).mockResolvedValue(true);

        const result = await Session.refresh(TokenService.createRefreshToken("user-id", "token-id"));

        expect(RefreshTokenRepository.markRotated).toHaveBeenCalledWith("token-id", expect.any(Date));
        expect(TokenService.verifyAccessToken(result.accessToken)).toBe("user-id");
        expect(TokenService.verifyRefreshToken(result.refreshToken!)).toEqual({ userId: "user-id", tokenId: "next-token-id" });
    });

    test("returns only an access token when a concurrent request wins the rotation", async () => {
        vi.mocked(RefreshTokenRepository.findOneById).mockResolvedValue(record());
        vi.mocked(RefreshTokenRepository.markRotated).mockResolvedValue(false);

        const result = await Session.refresh(TokenService.createRefreshToken("user-id", "token-id"));

        expect(result.refreshToken).toBeUndefined();
        expect(TokenService.verifyAccessToken(result.accessToken)).toBe("user-id");
        expect(RefreshTokenRepository.save).not.toHaveBeenCalled();
    });

    test("accepts a just-rotated token within the grace period without rotating again", async () => {
        vi.mocked(RefreshTokenRepository.findOneById).mockResolvedValue(record({ rotatedAt: new Date(Date.now() - 1000) }));

        const result = await Session.refresh(TokenService.createRefreshToken("user-id", "token-id"));

        expect(result.refreshToken).toBeUndefined();
        expect(RefreshTokenRepository.markRotated).not.toHaveBeenCalled();
        expect(RefreshTokenRepository.deleteByUserId).not.toHaveBeenCalled();
    });

    test("revokes every session when a rotated token is reused after the grace period", async () => {
        vi.mocked(RefreshTokenRepository.findOneById).mockResolvedValue(
            record({ rotatedAt: new Date(Date.now() - ROTATION_GRACE_MS - 1000) })
        );

        await expect(Session.refresh(TokenService.createRefreshToken("user-id", "token-id")))
            .rejects.toThrow(InvalidRefreshTokenError);
        expect(RefreshTokenRepository.deleteByUserId).toHaveBeenCalledWith("user-id");
    });

    test.each([
        ["revoked", null],
        ["expired", record({ expiresAt: new Date(Date.now() - 1000) })],
        ["owned by another user", record({ userId: "other-user" })]
    ])("rejects a %s refresh token", async (_label, stored) => {
        vi.mocked(RefreshTokenRepository.findOneById).mockResolvedValue(stored);

        await expect(Session.refresh(TokenService.createRefreshToken("user-id", "token-id")))
            .rejects.toThrow(InvalidRefreshTokenError);
        expect(RefreshTokenRepository.markRotated).not.toHaveBeenCalled();
    });

    test.each(["not-a-token", TokenService.createAccessToken("user-id")])(
        "rejects a malformed or non-refresh token before reading the database",
        async (token) => {
            await expect(Session.refresh(token)).rejects.toThrow(InvalidRefreshTokenError);
            expect(RefreshTokenRepository.findOneById).not.toHaveBeenCalled();
        }
    );

    test("revokes a single session and ignores missing or invalid tokens", async () => {
        await Session.revoke(TokenService.createRefreshToken("user-id", "token-id"));
        await Session.revoke(undefined);
        await Session.revoke("not-a-token");

        expect(RefreshTokenRepository.deleteById).toHaveBeenCalledOnce();
        expect(RefreshTokenRepository.deleteById).toHaveBeenCalledWith("token-id");
    });

    describe("isActive", () => {
        const token = () => TokenService.createRefreshToken("user-id", "token-id");
        const expectNoSideEffects = () => {
            expect(RefreshTokenRepository.markRotated).not.toHaveBeenCalled();
            expect(RefreshTokenRepository.deleteByUserId).not.toHaveBeenCalled();
            expect(RefreshTokenRepository.save).not.toHaveBeenCalled();
        };

        test("is true for a stored, unexpired, unrotated token, without rotating it", async () => {
            vi.mocked(RefreshTokenRepository.findOneById).mockResolvedValue(record());
            await expect(Session.isActive(token())).resolves.toBe(true);
            expectNoSideEffects();
        });

        test("is true for a token rotated within the grace period", async () => {
            vi.mocked(RefreshTokenRepository.findOneById).mockResolvedValue(record({ rotatedAt: new Date(Date.now() - 1000) }));
            await expect(Session.isActive(token())).resolves.toBe(true);
        });

        test("is false for a reused rotated token, without revoking sessions", async () => {
            vi.mocked(RefreshTokenRepository.findOneById).mockResolvedValue(
                record({ rotatedAt: new Date(Date.now() - ROTATION_GRACE_MS - 1000) })
            );
            await expect(Session.isActive(token())).resolves.toBe(false);
            expectNoSideEffects();
        });

        test("is false for revoked, expired, mismatched or malformed tokens", async () => {
            vi.mocked(RefreshTokenRepository.findOneById).mockResolvedValueOnce(null);
            await expect(Session.isActive(token())).resolves.toBe(false);
            vi.mocked(RefreshTokenRepository.findOneById).mockResolvedValueOnce(record({ expiresAt: new Date(Date.now() - 1) }));
            await expect(Session.isActive(token())).resolves.toBe(false);
            vi.mocked(RefreshTokenRepository.findOneById).mockResolvedValueOnce(record({ userId: "other-user" }));
            await expect(Session.isActive(token())).resolves.toBe(false);
            await expect(Session.isActive("not-a-jwt")).resolves.toBe(false);
            await expect(Session.isActive(TokenService.createAccessToken("user-id"))).resolves.toBe(false);
        });
    });

    test("revokes all of a user's sessions", async () => {
        await Session.revokeAll("user-id");
        expect(RefreshTokenRepository.deleteByUserId).toHaveBeenCalledWith("user-id");
    });
});
