import { describe, test, expect, vi } from "vitest";
import type { Request, Response } from "express";
import { auth } from "./auth.js";
import { TokenService } from "../../../domain/services/tokenService.js";

vi.mock("../../../config.js", () => ({
    config: { jwt_secret_key: "unit-test-secret" }
}));

describe("Auth middleware", () => {
    test.each([
        ["missing", undefined],
        ["malformed", "Bearer"],
        ["invalid", "Bearer invalid"]
    ])("rejects a %s access token", (_label, authorization) => {
        const req = { headers: { authorization } } as Request;
        const res = { status: vi.fn().mockReturnThis(), json: vi.fn(), locals: {} } as unknown as Response;
        const next = vi.fn();

        auth(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    test("rejects a refresh token as an access token", () => {
        const token = TokenService.createRefreshToken("user-id", "token-id");
        const req = { headers: { authorization: `Bearer ${token}` } } as Request;
        const res = { status: vi.fn().mockReturnThis(), json: vi.fn(), locals: {} } as unknown as Response;
        const next = vi.fn();

        auth(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    test("accepts a valid bearer token and gives controllers the verified user id, not the token", () => {
        const token = TokenService.createAccessToken("user-id");
        const req = { headers: { authorization: `Bearer ${token}` } } as Request;
        const res = { status: vi.fn().mockReturnThis(), json: vi.fn(), locals: {} } as unknown as Response;
        const next = vi.fn();

        auth(req, res, next);

        expect(res.locals.userId).toBe("user-id");
        expect(res.locals.accessToken).toBeUndefined();
        expect(next).toHaveBeenCalledOnce();
    });
});
