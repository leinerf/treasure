import type {  EmailVerification as EmailVerificationEntity  } from "../../../domain/models/entity/EmailVerification.js";
import { EmailVerificationRepository as AbstractEmailVerificationRepository } from "../../../domain/models/repository/EmailVerificationRepository.js";
import { EmailVerification } from "../../../infra/db/schema/EmailVerification.js"
import { type Comparison as ComparisonType, Comparison } from "../../../domain/models/entity/Comparison.js";
import { db } from "../../../infra/db/index.js";
import { and, eq, not, lt, lte, gt, gte } from "drizzle-orm";

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