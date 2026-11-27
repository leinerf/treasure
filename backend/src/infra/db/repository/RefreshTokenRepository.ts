import type { RefreshToken as RefreshTokenEntity } from "../../../domain/models/entity/RefreshToken.js";
import { RefreshTokenRepository as AbstractRefreshTokenRepository } from "../../../domain/models/repository/RefreshTokenRepository.js";
import { RefreshToken } from "../schema/RefreshToken.js";
import { db } from "../index.js";
import { and, eq, isNull, lt } from "drizzle-orm";

export class RefreshTokenRepository extends AbstractRefreshTokenRepository {
    public static override async findOneById(id: string): Promise<RefreshTokenEntity | null> {
        const result = await db.select(RefreshTokenRepository.buildReturning()).from(RefreshToken)
            .where(eq(RefreshToken.id, id));
        return result[0] ?? null;
    }

    public static override async save(entity: Omit<RefreshTokenEntity, "id">): Promise<RefreshTokenEntity> {
        const result = await db.insert(RefreshToken).values({
            userId: entity.userId,
            expiresAt: entity.expiresAt,
            rotatedAt: entity.rotatedAt
        }).returning(RefreshTokenRepository.buildReturning());
        return result[0]!;
    }

    /** Marks an unrotated refresh token as rotated. Returns false if another request rotated it first. */
    public static override async markRotated(id: string, rotatedAt: Date): Promise<boolean> {
        const result = await db.update(RefreshToken).set({ rotatedAt })
            .where(and(eq(RefreshToken.id, id), isNull(RefreshToken.rotatedAt)))
            .returning({ id: RefreshToken.id });
        return result.length > 0;
    }

    public static override async deleteById(id: string): Promise<void> {
        await db.delete(RefreshToken).where(eq(RefreshToken.id, id));
    }

    public static override async deleteByUserId(userId: string): Promise<void> {
        await db.delete(RefreshToken).where(eq(RefreshToken.userId, userId));
    }

    public static override async deleteExpiredByUserId(userId: string, now: Date): Promise<void> {
        await db.delete(RefreshToken).where(and(eq(RefreshToken.userId, userId), lt(RefreshToken.expiresAt, now)));
    }

    /** Deletes rows past expires_at; returns how many were deleted. Only expired rows: rotated but unexpired rows are kept, because reuse detection needs them */
    public static override async deleteExpired(now: Date): Promise<number> {
        const deleted = await db.delete(RefreshToken).where(lt(RefreshToken.expiresAt, now)).returning({ id: RefreshToken.id });
        return deleted.length;
    }

    public static override async deleteAll(): Promise<void> {
        await db.delete(RefreshToken);
    }

    private static buildReturning() {
        return {
            id: RefreshToken.id,
            userId: RefreshToken.userId,
            expiresAt: RefreshToken.expiresAt,
            rotatedAt: RefreshToken.rotatedAt
        };
    }
}
