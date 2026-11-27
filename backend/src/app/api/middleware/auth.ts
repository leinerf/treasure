import { type Request, type Response, type NextFunction } from "express";
import { TokenService } from "../../../domain/services/tokenService.js";

const auth = (req: Request, res: Response, next: NextFunction): Response | void => {
    const match = /^Bearer (\S+)$/i.exec(req.headers.authorization ?? "");
    if (!match?.[1]) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    let userId: string;
    try {
        userId = TokenService.verifyAccessToken(match[1]);
    } catch {
        return res.status(401).json({ error: "Unauthorized" });
    }
    // The only place access tokens are checked for user routes: everything after this works
    // with the verified user id, never the token itself.
    res.locals.userId = userId;
    next();
}

export { auth };