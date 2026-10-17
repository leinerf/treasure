import { Entity, Column, PrimaryColumn, EntityManager } from "typeorm";
import { User as UserEntity } from "./entity/user.js";
import userRepository from "./repository/userRepository.js";
import emailVerificationRepository from "./repository/emailVerificationRepository.js";
import passwordResetCodeRepository from "./repository/passwordResetCodeRepository.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { EmailVerificationCode } from "./entity/emailVerificationCode.js";
import { PasswordResetCode } from "./entity/passwordResetCode.js";
import { JWT_SECRET_KEY, SALT_ROUNDS } from "../../config.js";
import crypto from "crypto";
import { regexConfig } from "../services/regexConfig.js";
import dataSource from "../../infra/dataSource.js";

function generateRandomCode(length: number = 6): string {
    return crypto.randomInt(Math.pow(10, length - 1), Math.pow(10, length)).toString();
}

function expireAt(minutes: number = 10): Date {
    const now = new Date();
    now.setMinutes(now.getMinutes() + minutes);
    return now;
}

class User {
    public static async createEmailVerificationCode(email: string): Promise<{ emailCode?: EmailVerificationCode, success: boolean, error?: string }> {
        try {
            if(!User.validateEmail(email)){
                console.error("Invalid email format: " + email);
                return { success: false, error: "Invalid email format: " + email }
            }
            const existingEmailCode: EmailVerificationCode | null = await emailVerificationRepository.findOne({ where: { email } });
            if(existingEmailCode){
                await emailVerificationRepository.remove(existingEmailCode);
            }
            const emailCode: EmailVerificationCode = await emailVerificationRepository.save({
                email,
                code: generateRandomCode(),
                expireAt: expireAt()
            });
            return { emailCode, success: true }
        } catch (error) {
            console.error("Error creating email verification code:", error);
            return { success: false, error: "Error creating email verification code" }
        }
    }

    public static async createNewUser(username: string, email: string, emailVerificationCode: string, password: string): Promise<{ newUser?: UserEntity, success: boolean, error?: string }> {
        try {
            if(!User.validateUsername(username)){
                console.error("could not validate username:  " + username);
                return { success: false, error: "could not validate username:  " + username }
            }
            
            if(!User.validateEmail(email)){
                console.error("could not validate email: " + email);
                return { success: false, error: "could not validate email: " + email }
            }

            if(!User.validatePassword(password)){
                console.error("could not validate password: " + password);
                return { success: false, error: "could not validate password: " + password }
            }

            const existingEmailCode: EmailVerificationCode | null = await emailVerificationRepository.findOne({ where: { email, code: emailVerificationCode } });
            if(!existingEmailCode){
                console.error("Email is not yet verified: " + email);
                return { success: false, error: "Email is not yet verified: " + email }
            }
            
            if(existingEmailCode.expireAt < new Date()){
                console.error("Email verification code has expired for email: " + email + " at " + existingEmailCode.expireAt);
                return { success: false, error: "Email verification code has expired for email: " + email + " at " + existingEmailCode.expireAt + ". Request a new verification code." }
            }

            const hashedPassword = User.hash(password);
    
            const existingUser: UserEntity | null = await userRepository.findOne({ where: { email } });
            if(existingUser){
                console.error("User with this email already exists: " + email);
                return { success: false, error: "User with this email already exists: " + email }
            }

            // Save the new user and remove the used email verification code atomically
            await dataSource.manager.transaction(async (transactionalEntityManager: EntityManager) => {
                await transactionalEntityManager.save(UserEntity, {
                    username,
                    email,
                    password: hashedPassword,
                })
                await transactionalEntityManager.remove(EmailVerificationCode, existingEmailCode);
            })

            const newUser: UserEntity | null = await userRepository.findOne({ where: { username, email } });
            if(!newUser){
                console.error("Failed to retrieve the newly created user with username: " + username + " and email: " + email);
                return { success: false, error: "Failed to retrieve the newly created user with username: " + username + " and email: " + email }
            }
            return { newUser: newUser, success: true }

        } catch (error) {
            console.error("Error creating new user:", error);
            return { success: false, error: "Error creating new user" }
        }
    }
    
    public static async getUser(jwt: string): Promise<{ user?: UserEntity, success: boolean, error?: string }> {
        const userId = User.jwtDecrypt(jwt);
        try {
            const existingUser: UserEntity | null = await userRepository.findOne({ where: { id: userId } });
            if(!existingUser){
                console.error("User not found with id: " + userId);
                return { success: false, error: "User not found with id: " + userId }
            }
            return { user: existingUser, success: true }
        } catch (error) {
            console.error("Error retrieving user:", error);
            return { success: false, error: "Error retrieving user" }
        }
    }

    public static async updateUsername(newUsername: string, jwt: string): Promise<{ newUser?: UserEntity, success: boolean, error?: string }> {
        try {
            if(!User.validateUsername(newUsername)){
                console.error("could not validate username: " + newUsername);
                return { success: false, error: "could not validate username: " + newUsername }
            }
            const userId = User.jwtDecrypt(jwt);
            const existingUser: UserEntity | null = await userRepository.findOne({ where: { id: userId } });
            if(!existingUser){
                console.error("User not found with id: " + userId);
                return { success: false, error: "User not found with id: " + userId }
            }
            
            if(existingUser.username === newUsername){
                console.error("New username is the same as the current username");
                return { success: false, error: "New username is the same as the current username" }
            }

            existingUser.username = newUsername;
            await userRepository.save(existingUser);
            return { newUser: existingUser, success: true }
        }
        catch (error) {
            console.error("Error updating username:", error);
            return { success: false, error: "Error updating username" }
        }
    }

    public static async updatePassword(oldPassword: string, newPassword: string, jwt: string): Promise<{ success: boolean, error?: string }> {
        try {
            if(!User.validatePassword(newPassword)){
                console.error("could not validate password: " + newPassword);
                return { success: false, error: "could not validate password: " + newPassword }
            }
            const userId = User.jwtDecrypt(jwt);
            const existingUser: UserEntity | null = await userRepository.findOne({ where: { id: userId } });

            if(!existingUser){
                console.error("User not found with id: " + userId);
                return { success: false, error: "User not found with id: " + userId }
            }

            if(!User.validateHash(oldPassword, existingUser.password)){
                console.error("Old password is incorrect");
                return { success: false, error: "Old password is incorrect" }
            }
            if(User.validateHash(newPassword, existingUser.password)){
                console.error("New password is the same as the old password");
                return { success: false, error: "New password is the same as the old password" }
            }
            existingUser.password = User.hash(newPassword);
            await userRepository.save(existingUser);
            return { success: true }
        } catch (error) {
            console.error("Error updating password:", error);
            return { success: false, error: "Error updating password" }
        }
    }

    public static async createPasswordResetCode(email: string): Promise<{ passwordResetCode?: PasswordResetCode, success: boolean, error?: string }> {
        try {
            const existingPasswordResetCode = await passwordResetCodeRepository.findOne({ where: { email } });
            if(existingPasswordResetCode){
                await passwordResetCodeRepository.remove(existingPasswordResetCode);
            }
            const resetCode = generateRandomCode();
            const passwordResetCode = await passwordResetCodeRepository.save({
                code: resetCode,
                email: email,
                expirationDate: expireAt()
            });

            if(!passwordResetCode){
                console.error("Failed to create password reset code");
                return { success: false, error: "Failed to create password reset code" }
            }

            return { passwordResetCode, success: true }
        } catch (error) {
            console.error("Error creating password reset code:", error);
            return { success: false, error: "Error creating password reset code" }
        }
    }

    public static async resetPassword(newPassword: string, code: string): Promise<{ success: boolean, error?: string }> {
        try {
            const passwordResetCode = await passwordResetCodeRepository.findOne({ where: { code } });
            if(!passwordResetCode){
                console.error("Password reset code not found: " + code);
                return { success: false, error: "Password reset code not found: " + code }
            }

            if(passwordResetCode.expirationDate < new Date()){
                console.error("Password reset code has expired: " + code);
                return { success: false, error: "Password reset code has expired: " + code  + ". Request a new password reset code." }
            }
            const user: UserEntity | null = await userRepository.findOne({ where: { email: passwordResetCode.email } });
            if(!user){
                console.error("User not found with email: " + passwordResetCode.email);
                return { success: false, error: "User not found with email: " + passwordResetCode.email }
            }
            if(!User.validatePassword(newPassword)){
                console.error("Invalid new password: " + newPassword);
                return { success: false, error: "Invalid new password: " + newPassword }
            }
            user.password = User.hash(newPassword);

            await dataSource.manager.transaction(async (transactionalEntityManager: EntityManager) => {
                await transactionalEntityManager.save(user);
                await transactionalEntityManager.remove(passwordResetCode);
            })

            return { success: true }
        } catch (error) {
            console.error("Error resetting password:", error);
            return { success: false, error: "Error resetting password" }
        }
    }
    
    public static async updateEmail(newEmail: string, emailVerificationCode: string, jwt: string): Promise<{ newUser?: UserEntity, success: boolean, error?: string }> {
        try {
            const userId = User.jwtDecrypt(jwt);
            const existingUser: UserEntity | null = await userRepository.findOne({ where: { id: userId } });
            if(!existingUser){
                console.error("User not found with id: " + userId);
                return { success: false, error: "User not found with id: " + userId }
            }

            const emailCode: EmailVerificationCode | null = await emailVerificationRepository.findOne({ where: { email: newEmail, code: emailVerificationCode } });
            if(!emailCode) {
                console.error("Email verification code not found for email: " + newEmail);
                return { success: false, error: "Email verification code not found for email: " + newEmail }
            }
            existingUser.email = newEmail;
            await dataSource.manager.transaction(async (transactionalEntityManager: EntityManager) => {
                await transactionalEntityManager.save(existingUser);
                await transactionalEntityManager.remove(emailCode);
            })

            return { newUser: existingUser, success: true }
        } catch (error) {
            console.error("Error updating email:", error);
            return { success: false, error: "Error updating email" }
        }
    }

    public static async deleteUser(jwt: string): Promise<{ deleted?: UserEntity, success: boolean, error?: string }> {
        try {
            const userId = User.jwtDecrypt(jwt);
            const existingUser: UserEntity | null = await userRepository.findOne({ where: { id: userId } });
            if(!existingUser){
                console.error("User not found with id: " + userId);
                return { success: false, error: "User not found with id: " + userId }
            }
            await userRepository.remove(existingUser);
            return { deleted: existingUser, success: true }
        } catch (error) {
            console.error("Error deleting user:", error);
            return { success: false, error: "Error deleting user" }
        }
    }

    public static async createUserAuthentication(username: string, password: string): Promise<{ jwt: string, success: boolean, error?: string }> {
        try {
            const existingUser: UserEntity | null = await userRepository.findOne({ where: { username } });
            if(!existingUser){
                console.error("User does not exist with username: " + username);
                return { jwt: "" , success: false, error: "User does not exist with username: " + username };
            }

            if(!User.validateHash(password, existingUser.password)){
                console.error("Invalid password");
                return { jwt: "" , success: false, error: "Invalid password" };
            }
            return { jwt: User.jwtEncrypt(existingUser.id.toString()), success: true };
        } catch (error) {
            console.error("Error creating user authentication:", error);
            return { jwt: "", success: false, error: "Error creating user authentication" };
        }
    }

    private static jwtEncrypt(token: string): string {
        if(!JWT_SECRET_KEY){
            console.error("JWT_SECRET_KEY is not defined");
            return "";
        }
        return jwt.sign({ id: token }, JWT_SECRET_KEY, { expiresIn: "1h" });
    }

    private static jwtDecrypt(token: string): string {
        if(!JWT_SECRET_KEY){
            console.error("JWT_SECRET_KEY is not defined");
            return "";
        }
        const decoded = jwt.verify(token, JWT_SECRET_KEY) as { id: string };
        return decoded.id;
    }

    private static hash(token: string):  string {
        if(!SALT_ROUNDS){
            console.error("SALT_ROUNDS is not defined");
            return "";
        }
        const salt = bcrypt.genSaltSync(Number(SALT_ROUNDS));
        return bcrypt.hashSync(token, salt);
    }

    private static validateHash(token: string, hashed: string): boolean {
        return bcrypt.compareSync(token, hashed);
    }

    private static validateUsername(token: string): boolean {
        if(!regexConfig.username.regex.test(token)){
            return false;
        }
        return true;
    }
    
    private static validateEmail(token: string): boolean {
        if(!regexConfig.email.regex.test(token)){
            return false;
        }
        return true;
    }

    private static validatePassword(token: string): boolean {
        if(!regexConfig.password.regex.test(token)){
            return false;
        }
        return true;
    }
}
export default User;