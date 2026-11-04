import type {  PasswordReset as PasswordResetEntity  } from "../../../domain/models/entity/PasswordReset.js";
import { PasswordResetRepository as AbstractPasswordResetRepository } from "../../../domain/models/repository/PasswordResetRepository.js";
import { PasswordReset } from "../../../infra/db/schema/PasswordReset.js"
import { type Comparison as ComparisonType, Comparison } from "../../../domain/models/entity/Comparison.js";
import { db } from "../../../infra/db/index.js";
import { and, eq, not, lt, lte, gt, gte } from "drizzle-orm";

export class PasswordResetRepository extends AbstractPasswordResetRepository {
    public static override async findOneByEmail(email: string): Promise<PasswordResetEntity | null> {
        return PasswordResetRepository.findOne({ email: [email, Comparison.equal] });
    }
    public static override async findOneByCode(code: string): Promise<PasswordResetEntity | null> {
        return PasswordResetRepository.findOne({ code: [code, Comparison.equal] });
    }
    public static override async findOneByCodeAndEmail(code: string, email: string): Promise<PasswordResetEntity | null> {
        return PasswordResetRepository.findOne({ code: [code, Comparison.equal], email: [email, Comparison.equal] });
    }
    public static async findOneById(id: string): Promise<PasswordResetEntity | null> {
        return PasswordResetRepository.findOne({ id: [id, Comparison.equal] });
    }
    public static async findOne(args: { [key in keyof PasswordResetEntity]?: [string, ComparisonType] }): Promise<PasswordResetEntity | null> {
        return PasswordResetRepository.findMany(args).then(results => results[0] || null);
    }
    public static async findMany(args: { [key in keyof PasswordResetEntity]?: [string, ComparisonType] }): Promise<PasswordResetEntity[]> {
        const keys = Object.keys(args) as (keyof PasswordResetEntity)[];
        const conditions = keys.map(key => {
            const [value, comparison] = args[key]!;
            return PasswordResetRepository.buildCondition(key, value, comparison);
        });
        const result = await db.select().from(PasswordReset).where(
            and(...conditions.filter(condition => condition !== null))
        );
        return result;
        
    }
    public static override async save(entity: Omit<PasswordResetEntity, "id">): Promise<PasswordResetEntity> {
        const result = await db.insert(PasswordReset).values({
            email: entity.email,
            code: entity.code,
            expiresAt: entity.expiresAt
        }).returning(PasswordResetRepository.buildReturning());
        return result[0]!;
    }
    public static override async updateById(id: string, entity: PasswordResetEntity): Promise<PasswordResetEntity> {
        const result = await db.update(PasswordReset).set({
            email: entity.email,
            code: entity.code,
            expiresAt: entity.expiresAt
        }).where(eq(PasswordReset.id, id)).returning(PasswordResetRepository.buildReturning());
        return result[0]!;
    }
    public static override async deleteById(id: string): Promise<void> {
        await db.delete(PasswordReset).where(eq(PasswordReset.id, id));
    }
    public static override async deleteAll(): Promise<void> {
        await db.delete(PasswordReset);
    }

    private static buildCondition(key: keyof PasswordResetEntity, value: string, comparison: ComparisonType) {
        switch (comparison) {
            case Comparison.equal:
                return eq(PasswordReset[key], value);
            case Comparison.notEqual:
                return not(eq(PasswordReset[key], value));
            case Comparison.lessThan:
                return lt(PasswordReset[key], value);
            case Comparison.lessThanOrEqual:
                return lte(PasswordReset[key], value);
            case Comparison.greaterThan:
                return gt(PasswordReset[key], value);
            case Comparison.greaterThanOrEqual:
                return gte(PasswordReset[key], value);
            default:
                throw new Error(`Unsupported comparison type: ${comparison}`);
        }
    }

    private static buildReturning(): { [key in keyof PasswordResetEntity]: any } {
        return {
            id: PasswordReset.id,
            email: PasswordReset.email,
            code: PasswordReset.code,
            expiresAt: PasswordReset.expiresAt
        };
    }
}