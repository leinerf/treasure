import { type Request, type Response, type NextFunction } from "express";
import { TokenService } from "../../../domain/services/tokenService.js";

const auth = (req: Request, res: Response, next: NextFunction): Response | void => {
    const match = /^Bearer (\S+)$/i.exec(req.headers.authorization ?? "");
    if (!match?.[1]) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    try {
        TokenService.verifyAccessToken(match[1]);
    } catch {
        return res.status(401).json({ error: "Unauthorized" });
    }
    res.locals.accessToken = match[1];
    next();
}

export { auth };