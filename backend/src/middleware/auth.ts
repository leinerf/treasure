import { type Request, type Response, type NextFunction } from "express";

const auth = (req: Request, res: Response, next: NextFunction): Response | void => {
    const jwt = req.cookies.jwt;
    if (!jwt) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    next();
}

export { auth };