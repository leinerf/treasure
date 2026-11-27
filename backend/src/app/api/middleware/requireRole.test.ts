import { describe, expect, test, vi, beforeEach } from "vitest";
import type { Request, Response } from "express";
import { requireRole } from "./requireRole.js";
import User from "../../../domain/models/user.js";
import { Role } from "../../../domain/models/entity/User.js";
import { UserNotFoundError } from "../../../domain/errors/UserNotFoundError.js";

vi.mock("../../../domain/models/user.js", () => ({ default: { getUser: vi.fn() } }));

const run = async (locals: Record<string, unknown>) => {
    const res = { locals, status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() };
    const next = vi.fn();
    await requireRole(Role.Admin)({} as Request, res as unknown as Response, next);
    return { res, next };
};
const account = (role: Role) => ({ user: { id: "user-id", username: "alice", email: "a@example.com", password: "hash", role } });

describe("requireRole", () => {
    beforeEach(() => vi.clearAllMocks());

    test("lets an admin through, looking the role up by the verified user id", async () => {
        vi.mocked(User.getUser).mockResolvedValueOnce(account(Role.Admin));
        const { res, next } = await run({ userId: "user-id" });
        expect(User.getUser).toHaveBeenCalledWith("user-id");
        expect(next).toHaveBeenCalledWith();
        expect(res.status).not.toHaveBeenCalled();
    });

    test("answers 403 for a signed-in user without the role", async () => {
        vi.mocked(User.getUser).mockResolvedValueOnce(account(Role.User));
        const { res, next } = await run({ userId: "user-id" });
        expect(res.status).toHaveBeenCalledWith(403);
        expect(next).not.toHaveBeenCalled();
    });

    test("answers 401 when the account no longer exists or no user id was set", async () => {
        vi.mocked(User.getUser).mockRejectedValueOnce(new UserNotFoundError("missing"));
        const gone = await run({ userId: "user-id" });
        expect(gone.res.status).toHaveBeenCalledWith(401);
        const anonymous = await run({});
        expect(anonymous.res.status).toHaveBeenCalledWith(401);
        expect(User.getUser).toHaveBeenCalledOnce();
        expect(gone.next).not.toHaveBeenCalled();
        expect(anonymous.next).not.toHaveBeenCalled();
    });

    test("passes unexpected errors on to the error handler", async () => {
        const failure = new Error("database down");
        vi.mocked(User.getUser).mockRejectedValueOnce(failure);
        const { next } = await run({ userId: "user-id" });
        expect(next).toHaveBeenCalledWith(failure);
    });
});
