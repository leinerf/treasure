
/**
* Repository class for managing email verification codes in the domain layer.
 * Provides static methods to find, insert, update, and delete email verification codes.
 * Each method throws an error indicating it is not implemented.
 * This class serves as a blueprint for email verification repository implementations in the domain layer.
 */
import { type  EmailVerification } from "../entity/EmailVerification.js"

export class EmailVerificationRepository {
    /* eslint-disable no-unused-vars */
    public static async findOneByEmail(email: string): Promise<EmailVerification | null> {
        throw new Error("Method not implemented.");
    }
    /* eslint-disable no-unused-vars */
    public static async findOneByCode(code: string): Promise<EmailVerification | null> {
        throw new Error("Method not implemented.");
    }
    /* eslint-disable no-unused-vars */
    public static async findOneByCodeAndEmail(code: string, email: string): Promise<EmailVerification | null> {
        throw new Error("Method not implemented.");
    }
    /* eslint-disable no-unused-vars */
    public static async save(entity: Omit<EmailVerification, "id">): Promise<EmailVerification> {
        throw new Error("Method not implemented.");
    }
    /* eslint-disable no-unused-vars */
    public static async updateById(id: string, entity: Partial<Omit<EmailVerification, "id">>): Promise<EmailVerification> {
        throw new Error("Method not implemented.");
    }
    /* eslint-disable no-unused-vars */
    public static async deleteById(id: string): Promise<void> {
        throw new Error("Method not implemented.");
    }
    /* eslint-disable no-unused-vars */
    public static async deleteAll(): Promise<void> {
        throw new Error("Method not implemented.");
    }
    /* eslint-disable no-unused-vars */
    /** Deletes rows whose expires_at is before `now`; returns how many were deleted. */
    public static async deleteExpired(now: Date, sendWindowMs?: number): Promise<number> {
        throw new Error("Method not implemented.");
    }
    /* eslint-disable no-unused-vars */
    /**
     * Counts one submission against this email's code and returns the code with the new count,
     * or null if the email has no code. Atomic, so concurrent submissions each get their own count.
     */
    public static async recordAttempt(email: string): Promise<{ verification: EmailVerification; attempts: number } | null> {
        throw new Error("Method not implemented.");
    }
    /* eslint-disable no-unused-vars */
    /**
     * Creates or replaces the code for an email, unless the address already had `limit` codes
     * sent within `windowMs`. Returns null when it's over the limit.
     */
    public static async issueCodeIfUnderLimit(entity: Pick<EmailVerification, "email" | "code" | "expiresAt">, limit: number, windowMs: number): Promise<EmailVerification | null> {
        throw new Error("Method not implemented.");
    }
}