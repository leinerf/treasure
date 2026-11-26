import { describe, expect, test, vi } from "vitest";
import jwt from "jsonwebtoken";
import { TokenService } from "./tokenService.js";
import { InvalidJWTError } from "../errors/InvalidJWTError.js";

vi.mock("../../config.js", () => ({
    config: { jwt_secret_key: "unit-test-secret" }
}));

describe("TokenService", () => {
    test("creates purpose-specific access and refresh tokens", () => {
        const access = TokenService.createAccessToken("user-id");
        const refresh = TokenService.createRefreshToken("user-id", "token-id");
        expect(TokenService.verifyAccessToken(access)).toBe("user-id");
        expect(TokenService.verifyRefreshToken(refresh)).toEqual({ userId: "user-id", tokenId: "token-id" });
        const accessClaims = jwt.decode(access);
        const refreshClaims = jwt.decode(refresh);
        expect(accessClaims).toMatchObject({ type: "access" });
        expect(refreshClaims).toMatchObject({ type: "refresh", jti: "token-id" });
        if (typeof accessClaims !== "object" || !accessClaims?.exp || !accessClaims.iat ||
            typeof refreshClaims !== "object" || !refreshClaims?.exp || !refreshClaims.iat) {
            throw new Error("Missing token expiration claims");
        }
        expect(accessClaims.exp - accessClaims.iat).toBe(15 * 60);
        expect(refreshClaims.exp - refreshClaims.iat).toBe(7 * 24 * 60 * 60);
        expect(() => TokenService.verifyAccessToken(refresh)).toThrow();
        expect(() => TokenService.verifyRefreshToken(access)).toThrow();
    });

    test("access tokens expire after 15 minutes", () => {
        vi.useFakeTimers();
        try {
            const access = TokenService.createAccessToken("user-id");
            vi.advanceTimersByTime(15 * 60 * 1000 - 1000);
            expect(TokenService.verifyAccessToken(access)).toBe("user-id");
            vi.advanceTimersByTime(1000);
            expect(() => TokenService.verifyAccessToken(access)).toThrow();
        } finally {
            vi.useRealTimers();
        }
    });

    test("rejects expired, malformed and invalid-payload tokens", () => {
        const expired = jwt.sign({ id: "user-id", type: "refresh" }, "unit-test-secret", { expiresIn: -1, jwtid: "token-id" });
        const invalidPayload = jwt.sign({ id: "", type: "refresh" }, "unit-test-secret", { jwtid: "token-id" });
        const missingTokenId = jwt.sign({ id: "user-id", type: "refresh" }, "unit-test-secret");
        const otherSecret = jwt.sign({ id: "user-id", type: "refresh" }, "other-secret", { jwtid: "token-id" });
        expect(() => TokenService.verifyRefreshToken(expired)).toThrow();
        expect(() => TokenService.verifyRefreshToken("not-a-token")).toThrow();
        expect(() => TokenService.verifyRefreshToken(invalidPayload)).toThrow();
        expect(() => TokenService.verifyRefreshToken(missingTokenId)).toThrow();
        expect(() => TokenService.verifyRefreshToken(otherSecret)).toThrow();
    });

    test("userIdFromAccessToken returns the id of a valid access token", () => {
        expect(TokenService.userIdFromAccessToken(TokenService.createAccessToken("user-id"))).toBe("user-id");
    });

    test("userIdFromAccessToken throws InvalidJWTError for anything else", () => {
        const expired = jwt.sign({ id: "user-id", type: "access" }, "unit-test-secret", { algorithm: "HS256", expiresIn: -1 });
        const wrongSecret = jwt.sign({ id: "user-id", type: "access" }, "other-secret", { algorithm: "HS256" });
        for (const token of [undefined, "", "not-a-jwt", expired, wrongSecret, TokenService.createRefreshToken("user-id", "token-id")]) {
            expect(() => TokenService.userIdFromAccessToken(token)).toThrow(InvalidJWTError);
        }
    });
});
