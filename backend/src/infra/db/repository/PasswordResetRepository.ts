import type { PasswordReset as PasswordResetEntity } from "../../../domain/models/entity/PasswordReset.js";
import { PasswordResetRepository as AbstractPasswordResetRepository } from "../../../domain/models/repository/PasswordResetRepository.js";
import { PasswordReset } from "../schema/PasswordReset.js";
import { User } from "../schema/Users.js";
import { db } from "../index.js";
import { and, count, eq, gt, lt, lte } from "drizzle-orm";

export class PasswordResetRepository extends AbstractPasswordResetRepository {
    public static override async findOneByTokenHash(tokenHash: string): Promise<PasswordResetEntity | null> {
        const result = await db.select().from(PasswordReset).where(eq(PasswordReset.tokenHash, tokenHash)).limit(1);
        return result[0] ?? null;
    }

    /**
     * Saves a reset token unless the user already has `limit` tokens created within `windowMs`.
     * Locks the user row so concurrent requests cannot exceed the limit, and clears the
     * user's expired tokens. Returns null when the limit is reached.
     */
    public static override async saveIfUnderLimit(
        entity: Omit<PasswordResetEntity, "id" | "createdAt">, limit: number, windowMs: number
    ): Promise<PasswordResetEntity | null> {
        return db.transaction(async (trx) => {
            const users = await trx.select({ id: User.id }).from(User).where(eq(User.id, entity.userId)).for("update");
            if (users.length === 0) {
                return null;
            }
            const now = new Date();
            await trx.delete(PasswordReset).where(
                and(eq(PasswordReset.userId, entity.userId), lte(PasswordReset.expiresAt, now))
            );
            const [recent] = await trx.select({ total: count() }).from(PasswordReset).where(
                and(eq(PasswordReset.userId, entity.userId), gt(PasswordReset.createdAt, new Date(now.getTime() - windowMs)))
            );
            if ((recent?.total ?? 0) >= limit) {
                return null;
            }
            const result = await trx.insert(PasswordReset).values({ ...entity, createdAt: now }).returning();
            return result[0] ?? null;
        });
    }

    public static override async updateById(id: string, entity: Partial<Omit<PasswordResetEntity, "id">>): Promise<PasswordResetEntity> {
        const result = await db.update(PasswordReset).set(entity).where(eq(PasswordReset.id, id)).returning();
        return result[0]!;
    }

    public static override async deleteById(id: string): Promise<void> {
        await db.delete(PasswordReset).where(eq(PasswordReset.id, id));
    }

    /** Deletes rows past expires_at; returns how many were deleted. */
    public static override async deleteExpired(now: Date): Promise<number> {
        const deleted = await db.delete(PasswordReset).where(lt(PasswordReset.expiresAt, now)).returning({ id: PasswordReset.id });
        return deleted.length;
    }

    public static override async deleteAll(): Promise<void> {
        await db.delete(PasswordReset);
    }
}
