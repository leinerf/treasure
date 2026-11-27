import { type RefreshToken } from "../entity/RefreshToken.js";

export class RefreshTokenRepository {
    /* eslint-disable no-unused-vars */
    public static async findOneById(id: string): Promise<RefreshToken | null> {
        throw new Error("Method not implemented.");
    }
    /* eslint-disable no-unused-vars */
    public static async save(entity: Omit<RefreshToken, "id">): Promise<RefreshToken> {
        throw new Error("Method not implemented.");
    }
    /* eslint-disable no-unused-vars */
    public static async markRotated(id: string, rotatedAt: Date): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
    /* eslint-disable no-unused-vars */
    public static async deleteById(id: string): Promise<void> {
        throw new Error("Method not implemented.");
    }
    /* eslint-disable no-unused-vars */
    public static async deleteByUserId(userId: string): Promise<void> {
        throw new Error("Method not implemented.");
    }
    /* eslint-disable no-unused-vars */
    public static async deleteExpiredByUserId(userId: string, now: Date): Promise<void> {
        throw new Error("Method not implemented.");
    }
    /* eslint-disable no-unused-vars */
    public static async deleteAll(): Promise<void> {
        throw new Error("Method not implemented.");
    }
    /* eslint-disable no-unused-vars */
    /** Deletes rows whose expires_at is before `now`; returns how many were deleted. */
    public static async deleteExpired(now: Date): Promise<number> {
        throw new Error("Method not implemented.");
    }
}
