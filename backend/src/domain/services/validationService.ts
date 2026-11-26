import bcrypt from "bcrypt";
import { regexConfig } from "./regexConfig.js";

export class ValidationService {
    public static isValidUsername(username: string): boolean {
        return !!username && regexConfig.username.regex.test(username);
    }

    public static isValidEmail(email: string): boolean {
        return !!email && regexConfig.email.regex.test(email);
    }

    public static isValidPassword(password: string): boolean {
        return !!password && regexConfig.password.regex.test(password);
    }

    public static async matchesPassword(password: string, hash: string): Promise<boolean> {
        return bcrypt.compare(password, hash);
    }

    public static isValidOffsetAndLimit(offset: number, limit: number): boolean {
        return Number.isInteger(offset) && Number.isInteger(limit) && offset >= 0 && limit >= 1 && limit <= 100;
    }

    public static isValidSearchQuery(query: string): boolean {
        return !!query && query.trim().length >= 3;
    }

    public static isExpired(expiresAt: Date): boolean {
        return expiresAt < new Date();
    }
}
