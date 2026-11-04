
/**
* Repository class for managing email verification codes in the domain layer.
 * Provides static methods to find, insert, update, and delete email verification codes.
 * Each method throws an error indicating it is not implemented.
 * This class serves as a blueprint for email verification repository implementations in the domain layer.
 */
import { type  EmailVerification } from "../entity/EmailVerification.js"

export class EmailVerificationRepository {
    public static async findOneByEmail(email: string): Promise<EmailVerification | null> {
        throw new Error("Method not implemented.");
    }
    public static async findOneByCode(code: string): Promise<EmailVerification | null> {
        throw new Error("Method not implemented.");
    }
    public static async findOneByCodeAndEmail(code: string, email: string): Promise<EmailVerification | null> {
        throw new Error("Method not implemented.");
    }
    public static async save(entity: Omit<EmailVerification, "id">): Promise<EmailVerification> {
        throw new Error("Method not implemented.");
    }
    public static async updateById(id: string, entity: EmailVerification): Promise<EmailVerification> {
        throw new Error("Method not implemented.");
    }
    public static async deleteById(id: string): Promise<void> {
        throw new Error("Method not implemented.");
    }
    public static async deleteAll(): Promise<void> {
        throw new Error("Method not implemented.");
    }
}