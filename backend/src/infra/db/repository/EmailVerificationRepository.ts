import type {  EmailVerification as EmailVerificationEntity  } from "../../../domain/models/entity/EmailVerification.js";
import { EmailVerificationRepository as AbstractEmailVerificationRepository } from "../../../domain/models/repository/EmailVerificationRepository.js";
import { EmailVerification } from "../../../infra/db/schema/EmailVerification.js"
import { type Comparison as ComparisonType, Comparison } from "./Comparison.js";
import { db } from "../../../infra/db/index.js";
import { and, eq, not, lt, lte, gt, gte, sql } from "drizzle-orm";

export class EmailVerificationRepository extends AbstractEmailVerificationRepository {
    public static override async findOneByEmail(email: string): Promise<EmailVerificationEntity | null> {
        return EmailVerificationRepository.findOne({ email: [email, Comparison.equal] });
    }
    public static override async findOneByCode(code: string): Promise<EmailVerificationEntity | null> {
        return EmailVerificationRepository.findOne({ code: [code, Comparison.equal] });
    }
    public static override async findOneByCodeAndEmail(code: string, email: string): Promise<EmailVerificationEntity | null> {
        return EmailVerificationRepository.findOne({ code: [code, Comparison.equal], email: [email, Comparison.equal] });
    }
    public static async findOneById(id: string): Promise<EmailVerificationEntity | null> {
        return EmailVerificationRepository.findOne({ id: [id, Comparison.equal] });
    }
    public static async findOne(args: { [key in keyof EmailVerificationEntity]?: [string, ComparisonType] }): Promise<EmailVerificationEntity | null> {
        return EmailVerificationRepository.findMany(args).then(results => results[0] || null);
    }
    public static async findMany(args: { [key in keyof EmailVerificationEntity]?: [string, ComparisonType] }): Promise<EmailVerificationEntity[]> {
        const keys = Object.keys(args) as (keyof EmailVerificationEntity)[];
        const conditions = keys.map(key => {
            const [value, comparison] = args[key]!;
            return EmailVerificationRepository.buildCondition(key, value, comparison);
        });
        const result = await db.select().from(EmailVerification).where(
            and(...conditions.filter(condition => condition !== null))
        );
        return result;
    }
    public static override async save(entity: Omit<EmailVerificationEntity, "id">): Promise<EmailVerificationEntity> {
        const result = await db.insert(EmailVerification).values({
            email: entity.email,
            code: entity.code,
            expiresAt: entity.expiresAt
        }).returning(EmailVerificationRepository.buildReturning());
        return result[0]!;
    }
    public static override async updateById(id: string, entity: EmailVerificationEntity): Promise<EmailVerificationEntity> {
        const result = await db.update(EmailVerification).set({
            email: entity.email,
            code: entity.code,
            expiresAt: entity.expiresAt
        }).where(eq(EmailVerification.id, id)).returning(EmailVerificationRepository.buildReturning());
        return result[0]!;
    }
    public static override async deleteById(id: string): Promise<void> {
        await db.delete(EmailVerification).where(eq(EmailVerification.id, id));
    }
    /** Deletes rows past expires_at; returns how many were deleted. */
    /**
     * Deletes expired codes whose send window has also ended. A row inside its window is kept even
     * after its code expires, so cleanup can't reset how many emails the address has been sent.
     */
    public static override async deleteExpired(now: Date, sendWindowMs: number = 0): Promise<number> {
        const deleted = await db.delete(EmailVerification).where(and(
            lt(EmailVerification.expiresAt, now),
            lt(EmailVerification.sendWindowStartedAt, new Date(now.getTime() - sendWindowMs))
        )).returning({ id: EmailVerification.id });
        return deleted.length;
    }

    /**
     * One statement, so simultaneous requests can't both get under the limit: inserts the code, or
     * on an existing row replaces the code, resets attempts and counts the send, but only while the
     * address is under `limit` sends in the current window. A window older than `windowMs` restarts.
     */
    public static override async issueCodeIfUnderLimit(
        entity: Pick<EmailVerificationEntity, "email" | "code" | "expiresAt">, limit: number, windowMs: number
    ): Promise<EmailVerificationEntity | null> {
        const now = new Date();
        // Timestamps go through the column's encoder, the same way drizzle stores them, so comparisons
        // in raw SQL aren't shifted by the database session's time zone.
        const windowStart = sql.param(new Date(now.getTime() - windowMs), EmailVerification.sendWindowStartedAt);
        const nowParam = sql.param(now, EmailVerification.sendWindowStartedAt);
        const windowIsCurrent = sql`${EmailVerification.sendWindowStartedAt} > ${windowStart}`;
        const result = await db.insert(EmailVerification)
            .values({ ...entity, attempts: 0, sendCount: 1, sendWindowStartedAt: now })
            .onConflictDoUpdate({
                target: EmailVerification.email,
                set: {
                    code: entity.code,
                    expiresAt: entity.expiresAt,
                    attempts: 0,
                    sendCount: sql`CASE WHEN ${windowIsCurrent} THEN ${EmailVerification.sendCount} + 1 ELSE 1 END`,
                    sendWindowStartedAt: sql`CASE WHEN ${windowIsCurrent} THEN ${EmailVerification.sendWindowStartedAt} ELSE ${nowParam} END`,
                },
                setWhere: sql`NOT (${windowIsCurrent}) OR ${EmailVerification.sendCount} < ${limit}`,
            })
            .returning(EmailVerificationRepository.buildReturning());
        return result[0] ?? null;
    }

    public static override async recordAttempt(email: string): Promise<{ verification: EmailVerificationEntity; attempts: number } | null> {
        const result = await db.update(EmailVerification)
            .set({ attempts: sql`${EmailVerification.attempts} + 1` })
            .where(eq(EmailVerification.email, email))
            .returning({ ...EmailVerificationRepository.buildReturning(), attempts: EmailVerification.attempts });
        const row = result[0];
        if (!row) {
            return null;
        }
        const { attempts, ...verification } = row;
        return { verification: verification as EmailVerificationEntity, attempts: attempts as number };
    }

    public static override async deleteAll(): Promise<void> {
        await db.delete(EmailVerification);
    }

    private static buildCondition(key: keyof EmailVerificationEntity, value: string, comparison: ComparisonType) {
        switch (comparison) {
            case Comparison.equal:
                return eq(EmailVerification[key], value);
            case Comparison.notEqual:
                return not(eq(EmailVerification[key], value));
            case Comparison.lessThan:
                return lt(EmailVerification[key], value);
            case Comparison.lessThanOrEqual:
                return lte(EmailVerification[key], value);
            case Comparison.greaterThan:
                return gt(EmailVerification[key], value);
            case Comparison.greaterThanOrEqual:
                return gte(EmailVerification[key], value);
            default:
                throw new Error(`Unsupported comparison type: ${comparison}`);
        }
    }

    private static buildReturning(): { [key in keyof EmailVerificationEntity]: any } {
        return {
            id: EmailVerification.id,
            email: EmailVerification.email,
            code: EmailVerification.code,
            expiresAt: EmailVerification.expiresAt
        };
    }
}