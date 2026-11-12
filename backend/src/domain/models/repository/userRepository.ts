import type { User as UserEntity } from "../entity/User.js";

/**
 * Repository class for managing users in the domain layer.
 * Provides static methods to find, insert, update, and delete users.
 * Each method throws an error indicating it is not implemented.
 * This class serves as a blueprint for user repository implementations in the domain layer.
 * userRepository.findOne({ where: { email } });
 * 
 */

export class UserRepository {
    /* eslint-disable no-unused-vars */
    public static async findOne(query: any): Promise<UserEntity | null>{
        throw new Error("Method not implemented.");
    }
    /* eslint-disable no-unused-vars */
    public static async findOneByEmail(email: string): Promise<UserEntity | null>{
        throw new Error("Method not implemented.");
    }
    /* eslint-disable no-unused-vars */
    public static async findOneByUsername(username: string): Promise<UserEntity | null>{
        throw new Error("Method not implemented.");
    }
    /* eslint-disable no-unused-vars */
    public static async findOneByUsernameAndEmail(username: string, email: string): Promise<UserEntity | null>{
        throw new Error("Method not implemented.");
    }
    /* eslint-disable no-unused-vars */
    public static async findOneById(id: string): Promise<UserEntity | null>{
        throw new Error("Method not implemented.");
    }
    /* eslint-disable no-unused-vars */
    public static async findUsers(offset: number, limit: number): Promise<UserEntity[]>{
        throw new Error("Method not implemented.");
    }
    /* eslint-disable no-unused-vars */
    public static async count(): Promise<number> {
        throw new Error("Method not implemented.");
    }
    /* eslint-disable no-unused-vars */
    public static async save(user: Omit<UserEntity, "id">): Promise<UserEntity| null>{
        throw new Error("Method not implemented.");
    }
    /* eslint-disable no-unused-vars */
    public static async saveUserAndDeleteEmailVerification(user: Omit<UserEntity, "id">, emailVerificationId: string): Promise<UserEntity| null>{
        throw new Error("Method not implemented.");
    }
    /* eslint-disable no-unused-vars */
    public static async updateById(id: string, user: Partial<Omit<UserEntity, "id">>): Promise<UserEntity | null>{
        throw new Error("Method not implemented.");
    }
    /* eslint-disable no-unused-vars */
    public static async updateEmailAndDeleteEmailVerification(id: string, newEmail: string, emailVerificationId: string): Promise<UserEntity | null>{
        throw new Error("Method not implemented.");
    }
    /* eslint-disable no-unused-vars */
    public static async updatePasswordAndDeletePasswordResetCode(id: string, newPassword: string, passwordResetCodeId: string): Promise<UserEntity | null>{
        throw new Error("Method not implemented.");
    }
    /* eslint-disable no-unused-vars */
    public static async deleteById(id: string): Promise<void>{
        throw new Error("Method not implemented.");
    }
    /* eslint-disable no-unused-vars */
    public static async deleteAll(): Promise<void>{
        throw new Error("Method not implemented.");
    }
}