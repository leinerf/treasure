import { db } from "../../../infra/db/index.js"
import { User } from "../../../infra/db/schema/Users.js"
import { and, eq, not, lt, lte, gt, gte } from "drizzle-orm";
import { type User as UserEntity } from "../../../domain/models/entity/User.js"
import { Comparison } from "./Comparison.js"
import type { Comparison as ComparisonType } from "./Comparison.js"
import { EmailVerification } from "../../../infra/db/schema/EmailVerification.js"
import { UserRepository as AbstractUserRepository } from "../../../domain/models/repository/UserRepository.js";
import { PasswordReset } from "../schema/PasswordReset.js";

/**
 * Repository class for managing users in the database.
 * Allows separation between database logic and domain logic.
 * Encapsulates all necessary database operations related to users.
 * Provides methods to find, insert, and delete users.
 */

export class UserRepository extends AbstractUserRepository {
    public static override async findOneByEmail(email: string): Promise<UserEntity | null> {
        return UserRepository.findOne({ email: [email, Comparison.equal] });
    }
    public static override async findOneByUsername(username: string): Promise<UserEntity | null> {
        return UserRepository.findOne({ username: [username, Comparison.equal] });
    }
    public static override async findOneByUsernameAndEmail(username: string, email: string): Promise<UserEntity | null> {
        return UserRepository.findOne({ username: [username, Comparison.equal], email: [email, Comparison.equal] });
    }
    public static override async findOneById(id: string): Promise<UserEntity | null> {
        return UserRepository.findOne({ id: [id, Comparison.equal] });
    }

    public static async findOne(args: { [key in keyof UserEntity]?: [string, ComparisonType] }): Promise<UserEntity | null> {
        return UserRepository.findMany(args).then(users => users[0] || null);
    }

    public static async findMany(args: { [key in keyof UserEntity]?: [string, ComparisonType] }): Promise<UserEntity[]> {
        const keys = Object.keys(args) as (keyof UserEntity)[];
        const conditions = keys.map(key => {
            const [value, compare] = args[key]!;
            return UserRepository.buildCondition(key as keyof UserEntity, value, compare);
        });
        const users = await db.select(UserRepository.buildReturning()).from(User).where(
            and(...conditions.filter(condition => condition !== null))
        );
        return users;
    }

    public static override async findUsers(offset: number, limit: number): Promise<UserEntity[]> {
        return db.select(UserRepository.buildReturning()).from(User).offset(offset).limit(limit);
    }
    
    public static override async save(user: Omit<UserEntity, "id">): Promise<UserEntity| null> {
        const result = await db.insert(User).values({
            username: user.username,
            email: user.email,
            password: user.password,
            role: user.role
        }).returning(UserRepository.buildReturning());
        return result[0] || null;
    }

    public static override async saveUserAndDeleteEmailVerification(user: Omit<UserEntity, "id">, emailVerificationId: string): Promise<UserEntity| null> {
        const result = await db.transaction(async (trx) => {
            const deletedEmailVerification = await trx.delete(EmailVerification).where(
                eq(EmailVerification.id, emailVerificationId)
            ).returning({ id: EmailVerification.id });
            if (deletedEmailVerification.length === 0) {
                throw new Error(`Email verification with id ${emailVerificationId} not found`);
            }
            const insertedUser = await trx.insert(User).values({
                username: user.username,
                email: user.email,
                password: user.password,
                role: user.role
            }).returning(UserRepository.buildReturning());
            return insertedUser
        });
        return result[0] || null;
    }
    public static override async updateById(id: string, user: Partial<Omit<UserEntity, "id">>): Promise<UserEntity | null> {
        const result = await db.update(User).set(user).where(
            eq(User.id, id)
        ).returning(UserRepository.buildReturning());
        return result[0] || null;
    }
    public static override async updateEmailAndDeleteEmailVerification(id: string, newEmail: string, emailVerificationId: string): Promise<UserEntity | null> {
        const result = await db.transaction(async (trx) => {
            const deletedEmailVerification = await trx.delete(EmailVerification).where(
                eq(EmailVerification.id, emailVerificationId)
            ).returning({ id: EmailVerification.id });
            if (deletedEmailVerification.length === 0) {
                throw new Error(`Email verification with id ${emailVerificationId} not found`);
            }
            const updatedUser = await trx.update(User).set({ email: newEmail }).where(
                eq(User.id, id)
            ).returning(UserRepository.buildReturning());
            return updatedUser;
        });
        return result[0] || null;
    }
    public static override async updatePasswordAndDeletePasswordResetCode(id: string, newPassword: string, passwordResetCodeId: string): Promise<UserEntity | null> {
        const result = await db.transaction(async (trx) => {
            const deletedPasswordResetCode = await trx.delete(PasswordReset).where(
                eq(PasswordReset.id, passwordResetCodeId)
            ).returning({ id: PasswordReset.id });
            if (deletedPasswordResetCode.length === 0) {
                throw new Error(`Password reset code with id ${passwordResetCodeId} not found`);
            }
            const updatedUser = await trx.update(User).set({ password: newPassword }).where(
                eq(User.id, id)
            ).returning(UserRepository.buildReturning());
            return updatedUser;
        });
        return result[0] || null;
    }
    public static override async deleteById(id: string): Promise<void> {
        await db.delete(User).where(
            eq(User.id, id)
        );
    }
    public static async delete(args: { [key in keyof UserEntity]?: [string, ComparisonType] }): Promise<void> {
        await db.delete(User).where(
            UserRepository.buildCondition("id", args.id![0], args.id![1])
        );
    }

    public static async deleteAll(): Promise<void> {
        await db.delete(User);
    }

    private static buildCondition(key: keyof UserEntity, value: string, compare: ComparisonType) {
        switch(compare) {
            case Comparison.equal:
                return eq(User[key], value);
            // Add other cases for different comparisons if needed
            case Comparison.notEqual:
                return not(eq(User[key], value));
            case Comparison.lessThan:
                return lt(User[key], value);
            case Comparison.lessThanOrEqual:
                return lte(User[key], value);
            case Comparison.greaterThan:
                return gt(User[key], value);
            case Comparison.greaterThanOrEqual:
                return gte(User[key], value);
            default:
                throw new Error(`Unsupported comparison: ${compare}`);
        }
    }

    private static buildReturning(): { [key in keyof UserEntity]: any } {
        return {
            id: User.id,
            username: User.username,
            email: User.email,
            password: User.password,
            role: User.role
        };
    }
}