import { type Response } from "express";
import { REFRESH_TOKEN_SECONDS } from "../../../../domain/services/tokenService.js";

export const refreshCookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production" || process.env.NODE_ENV === "prod",
    sameSite: "strict" as const,
    path: "/api/auth"
};

export const setRefreshCookie = (res: Response, refreshToken: string): void => {
    res.cookie("refreshToken", refreshToken, { ...refreshCookieOptions, maxAge: REFRESH_TOKEN_SECONDS * 1000 });
};

export const clearRefreshCookie = (res: Response): void => {
    res.clearCookie("refreshToken", refreshCookieOptions);
};
