import { RefreshTokenRepository } from "../../infra/db/repository/RefreshTokenRepository.js";
import { REFRESH_TOKEN_SECONDS, TokenService } from "../services/tokenService.js";
import { ValidationService } from "../services/validationService.js";
import { InvalidRefreshTokenError } from "../errors/InvalidRefreshTokenError.js";

/**
 * How long a refresh token stays usable after it has been rotated (replaced by a new refresh
 * token). Only refresh tokens are rotated; access tokens are never rotated or tracked, a new
 * one is issued on each refresh and the old one simply expires. Several tabs share the refresh
 * cookie, so two of them can refresh at the same moment; the slower one presents a refresh
 * token that was rotated a moment ago. Inside this window it gets an access token (without a
 * new refresh token, because the browser already holds the newer one). Outside it, the rotated
 * refresh token is treated as stolen and every session for the user is revoked.
 */
export const ROTATION_GRACE_MS = 30 * 1000;

export class Session {
    public static async create(userId: string): Promise<{ refreshToken: string }> {
        const now = new Date();
        await RefreshTokenRepository.deleteExpiredByUserId(userId, now);
        const record = await RefreshTokenRepository.save({
            userId,
            expiresAt: new Date(now.getTime() + REFRESH_TOKEN_SECONDS * 1000),
            rotatedAt: null
        });
        return { refreshToken: TokenService.createRefreshToken(userId, record.id) };
    }

    /**
     * Exchanges a refresh token for a new access token. Rotates the refresh token, so the
     * result includes a replacement refresh token unless this refresh token was rotated moments
     * ago by a concurrent request.
     */
    public static async refresh(refreshToken: string): Promise<{ userId: string; accessToken: string; refreshToken?: string }> {
        let userId: string;
        let tokenId: string;
        try {
            ({ userId, tokenId } = TokenService.verifyRefreshToken(refreshToken));
        } catch {
            throw new InvalidRefreshTokenError("Invalid refresh token");
        }

        const record = await RefreshTokenRepository.findOneById(tokenId);
        if (!record || record.userId !== userId || ValidationService.isExpired(record.expiresAt)) {
            throw new InvalidRefreshTokenError("Refresh token is revoked or expired");
        }

        const accessToken = TokenService.createAccessToken(userId);
        const now = new Date();
        if (!record.rotatedAt) {
            if (await RefreshTokenRepository.markRotated(tokenId, now)) {
                const { refreshToken: next } = await Session.create(userId);
                return { userId, accessToken, refreshToken: next };
            }
            // Another request rotated this refresh token between our read and our update.
            return { userId, accessToken };
        }

        if (now.getTime() - record.rotatedAt.getTime() <= ROTATION_GRACE_MS) {
            return { userId, accessToken };
        }

        await RefreshTokenRepository.deleteByUserId(userId);
        throw new InvalidRefreshTokenError("Refresh token reuse detected; all sessions revoked");
    }

    /**
     * Whether a refresh with this refresh token would succeed right now. Read-only: unlike
     * refresh(), it never rotates the refresh token or revokes sessions, so it is safe for status checks.
     */
    public static async isActive(refreshToken: string): Promise<boolean> {
        let userId: string;
        let tokenId: string;
        try {
            ({ userId, tokenId } = TokenService.verifyRefreshToken(refreshToken));
        } catch {
            return false;
        }
        const record = await RefreshTokenRepository.findOneById(tokenId);
        if (!record || record.userId !== userId || ValidationService.isExpired(record.expiresAt)) {
            return false;
        }
        return !record.rotatedAt || Date.now() - record.rotatedAt.getTime() <= ROTATION_GRACE_MS;
    }

    /** Revokes the session a refresh token belongs to. Invalid tokens are ignored. */
    public static async revoke(refreshToken: string | undefined): Promise<void> {
        if (!refreshToken) {
            return;
        }
        let tokenId: string;
        try {
            ({ tokenId } = TokenService.verifyRefreshToken(refreshToken));
        } catch {
            return;
        }
        await RefreshTokenRepository.deleteById(tokenId);
    }

    public static async revokeAll(userId: string): Promise<void> {
        await RefreshTokenRepository.deleteByUserId(userId);
    }
}
