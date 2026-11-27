import { type Request, type Response, type NextFunction, type RequestHandler } from "express";
import User from "../../../domain/models/user.js";
import { type Role } from "../../../domain/models/entity/User.js";
import { UserNotFoundError } from "../../../domain/errors/UserNotFoundError.js";

/**
 * Lets the request through only if the signed-in user has `role`. Use after `auth`, which sets
 * res.locals.userId: `middlewares: [auth, requireRole(Role.Admin)]`. The role is read from the
 * database on every request rather than from the token, so a role change takes effect at once.
 * Answers 401 if the account no longer exists and 403 if it lacks the role.
 */
export const requireRole = (role: Role): RequestHandler => async (_req: Request, res: Response, next: NextFunction) => {
    const userId: unknown = res.locals.userId;
    if (typeof userId !== "string" || !userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }
    try {
        const { user } = await User.getUser(userId);
        if (user.role !== role) {
            res.status(403).json({ error: "Forbidden" });
            return;
        }
    } catch (error) {
        if (error instanceof UserNotFoundError) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        next(error);
        return;
    }
    next();
};
