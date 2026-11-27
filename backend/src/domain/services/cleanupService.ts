import { RefreshTokenRepository } from "../../infra/db/repository/RefreshTokenRepository.js";
import { PasswordResetRepository } from "../../infra/db/repository/PasswordResetRepository.js";
import { EmailVerificationRepository } from "../../infra/db/repository/EmailVerificationRepository.js";
import LoggingService from "./loggingService.js";
import { VERIFICATION_EMAIL_WINDOW_MS } from "../models/Verification.js";

export const CLEANUP_INTERVAL_MS = 60 * 60 * 1000;

/**
 * Removes expired auth rows so the tables don't grow forever. Each repository deletes only
 * rows past their expires_at. In particular, rotated refresh tokens are kept until they
 * expire, because refresh token reuse detection depends on finding them.
 */
export class CleanupService {
    public static async removeExpiredRows(now: Date = new Date()): Promise<{ refreshTokens: number; passwordResets: number; emailVerifications: number }> {
        const [refreshTokens, passwordResets, emailVerifications] = await Promise.all([
            RefreshTokenRepository.deleteExpired(now),
            PasswordResetRepository.deleteExpired(now),
            EmailVerificationRepository.deleteExpired(now, VERIFICATION_EMAIL_WINDOW_MS),
        ]);
        return { refreshTokens, passwordResets, emailVerifications };
    }

    /**
     * Runs the cleanup now and then every `intervalMs`. The timer doesn't keep the process
     * alive on its own. Returns a function that stops it.
     */
    public static start(intervalMs: number = CLEANUP_INTERVAL_MS): () => void {
        const run = () => {
            CleanupService.removeExpiredRows()
                .then((removed) => LoggingService.info(`Removed expired rows: ${JSON.stringify(removed)}`))
                .catch((error: unknown) => {
                    const reason = error instanceof Error ? error.message : String(error);
                    LoggingService.error(`Expired row cleanup failed: ${reason}`);
                });
        };
        run();
        const timer = setInterval(run, intervalMs);
        timer.unref();
        return () => clearInterval(timer);
    }
}
