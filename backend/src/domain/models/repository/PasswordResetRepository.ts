import { type PasswordReset } from "../entity/PasswordReset.js";

export class PasswordResetRepository {
    public static async findOneByEmail(email: string): Promise<PasswordReset | null> {
        throw new Error("Method not implemented.");
    }
    public static async findOneByCode(code: string): Promise<PasswordReset | null> {
        throw new Error("Method not implemented.");
    }
    public static async findOneByCodeAndEmail(code: string, email: string): Promise<PasswordReset | null> {
        throw new Error("Method not implemented.");
    }
    public static async save(entity: Omit<PasswordReset, "id">): Promise<PasswordReset> {
        throw new Error("Method not implemented.");
    }
    public static async updateById(id: string, entity: Partial<Omit<PasswordReset, "id">>): Promise<PasswordReset> {
        throw new Error("Method not implemented.");
    }
    public static async deleteById(id: string): Promise<void> {
        throw new Error("Method not implemented.");
    }
    public static async deleteAll(): Promise<void> {
        throw new Error("Method not implemented.");
    }
}