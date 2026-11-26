import jwt from "jsonwebtoken";
import { config } from "../../config.js";
import { InvalidJWTError } from "../errors/InvalidJWTError.js";

const ACCESS_TOKEN_SECONDS = 15 * 60;
export const REFRESH_TOKEN_SECONDS = 7 * 24 * 60 * 60;

export class TokenService {
    private static sign(userId: string, type: "access" | "refresh", expiresIn: number, tokenId?: string): string {
        return jwt.sign({ id: userId, type }, config.jwt_secret_key, {
            algorithm: "HS256",
            expiresIn,
            ...(tokenId ? { jwtid: tokenId } : {})
        });
    }

    private static verify(token: string, type: "access" | "refresh"): jwt.JwtPayload & { id: string } {
        const payload = jwt.verify(token, config.jwt_secret_key, { algorithms: ["HS256"] });
        if (typeof payload === "string" || payload.type !== type || typeof payload.id !== "string" || !payload.id) {
            throw new jwt.JsonWebTokenError("Invalid token payload");
        }
        return payload as jwt.JwtPayload & { id: string };
    }

    public static createAccessToken(userId: string): string {
        return this.sign(userId, "access", ACCESS_TOKEN_SECONDS);
    }

    /** tokenId identifies the server-side refresh token record, so the token can be rotated and revoked. */
    public static createRefreshToken(userId: string, tokenId: string): string {
        return this.sign(userId, "refresh", REFRESH_TOKEN_SECONDS, tokenId);
    }

    public static verifyAccessToken(token: string): string {
        return this.verify(token, "access").id;
    }

    /**
     * The user id in a valid access token. Throws InvalidJWTError, which the route error
     * handler answers with 400, for a missing, malformed, expired or wrong-type token.
     */
    public static userIdFromAccessToken(token: unknown): string {
        try {
            return this.verifyAccessToken(token as string);
        } catch {
            throw new InvalidJWTError("Invalid JWT");
        }
    }

    public static verifyRefreshToken(token: string): { userId: string; tokenId: string } {
        const payload = this.verify(token, "refresh");
        if (typeof payload.jti !== "string" || !payload.jti) {
            throw new jwt.JsonWebTokenError("Invalid token payload");
        }
        return { userId: payload.id, tokenId: payload.jti };
    }
}
