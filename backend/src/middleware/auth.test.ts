import { auth } from "./auth.js";
import { describe, test, expect, vi } from "vitest";
import type { Request, Response, NextFunction } from "express";
describe("Auth Middleware", () => {
    test("should return 401 if no JWT is provided", async () => {
        const req: Partial<Request> = {
            cookies: {}
        };
        const res: Partial<Response> = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn()
        };
        const next = vi.fn();
        auth(req as Request, res as Response, next as NextFunction);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: "Unauthorized" });
    });
    test("should call next if JWT is provided", async () => {
        const req: Partial<Request> = {
            cookies: {
                jwt: "valid-jwt-token"
            }
        };
        const res: Partial<Response> = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn()
        };
        const next = vi.fn();
        auth(req as Request, res as Response, next as NextFunction);
        expect(next).toHaveBeenCalled();
    });
});