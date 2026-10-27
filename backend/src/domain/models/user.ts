
import { type EntityManager } from "typeorm";
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
import { InvalidEmailError } from "../errors/InvalidEmailError.js";
import { InvalidUsernameError } from "../errors/InvalidUsernameError.js";
import { InvalidPasswordError } from "../errors/InvalidPasswordError.js";
import { InvalidJWTError } from "../errors/InvalidJWTError.js";
import { InvalidPasswordResetCodeError } from "../errors/InvalidPasswordResetCode.js";
import { InvalidEmailVerificationError } from "../errors/InvalidEmailVerification.js";
import { UserExistsError } from "../errors/UserExistsError.js";
import { UserError } from "../errors/UserError.js";
import { UserNotFoundError } from "../errors/UserNotFoundError.js";
import { EmailVerificationNotFoundError } from "../errors/EmailVerificationNotFound.js";
import { PasswordResetCodeNotFoundError } from "../errors/PasswordResetCodeNotFound.js";

class User {
    public static async createEmailVerificationCode(email: string): Promise<{ emailCode: EmailVerificationCode }> {
        if(!User.validateEmail(email)){
            throw new InvalidEmailError("Invalid email format: " + email);
        }
        const existingEmailCode: EmailVerificationCode | null = await emailVerificationRepository.findOne({ where: { email } });
        if(existingEmailCode){
            await emailVerificationRepository.remove(existingEmailCode);
        }
        const emailCode: EmailVerificationCode = await emailVerificationRepository.save({
            email,
            code: User.generateRandomCode(),
            expireAt: User.expireAt()
        });
        return { emailCode }
    }

    public static async createNewUser(username: string, email: string, emailVerificationCode: string, password: string): Promise<{ user: UserEntity }> {
        if(!User.validateUsername(username)){
            throw new InvalidUsernameError("Invalid username format: " + username);
        }
        
        if(!User.validateEmail(email)){
            throw new InvalidEmailError("Invalid email format: " + email);
        }

        if(!User.validatePassword(password)){
            throw new InvalidPasswordError("Invalid password format: " + password);
        }

        const existingUserWithEmail: UserEntity | null = await userRepository.findOne({ where: { email } });
        if(existingUserWithEmail){
            throw new UserExistsError("User with this email already exists: " + email);
        }

        const existingUserWithUsername: UserEntity | null = await userRepository.findOne({ where: { username } });            
        if(existingUserWithUsername){
            throw new UserExistsError("User with this username already exists: " + username);
        }

        const existingEmailCode: EmailVerificationCode | null = await emailVerificationRepository.findOne({ where: { email, code: emailVerificationCode } });
        if(!existingEmailCode){
            throw new EmailVerificationNotFoundError(email);
        }
        
        if(existingEmailCode.expireAt < new Date()){
            throw new InvalidEmailVerificationError("Email verification code has expired for email: " + email + " at " + existingEmailCode.expireAt + ". Request a new verification code.");
        }
        
        const hashedPassword = User.hash(password);
        if(!hashedPassword){
            throw new UserError("Failed to hash password");
        }
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
            throw new UserNotFoundError("Failed to retrieve the newly created user with username: " + username + " and email: " + email)
        }
        return { user: newUser }
    }
    
    public static async getUser(jwt: string): Promise<{ user: UserEntity }> {
        const userId = User.jwtDecrypt(jwt);
        if(!userId){
            throw new InvalidJWTError("Invalid JWT");
        }
        const existingUser: UserEntity | null = await userRepository.findOne({ where: { id: userId } });
        if(!existingUser){
            throw new UserNotFoundError("User not found with id: " + userId);
        }
        return { user: existingUser }
    }

    public static async updateUsername(newUsername: string, jwt: string): Promise<{ user: UserEntity }> {
        const userId = User.jwtDecrypt(jwt);
        if(!userId){
            throw new InvalidJWTError("Invalid JWT");
        }
        if(!User.validateUsername(newUsername)){
            throw new InvalidUsernameError("could not validate username: " + newUsername);
        }
        const existingUser: UserEntity | null = await userRepository.findOne({ where: { id: userId } });
        if(!existingUser){
            throw new UserNotFoundError("User not found with id: " + userId);
        }
        
        if(existingUser.username === newUsername){
            throw new InvalidUsernameError("New username is the same as the current username");
        }

        existingUser.username = newUsername;
        await userRepository.save(existingUser);
        return { user: existingUser }
    }

    public static async updatePassword(oldPassword: string, newPassword: string, jwt: string): Promise<{ user: UserEntity }> {
        const userId = User.jwtDecrypt(jwt);
        if(!userId){
            throw new InvalidJWTError("Invalid JWT");
        }
        if(!User.validatePassword(newPassword)){
            throw new InvalidPasswordError("could not validate password: " + newPassword);
        }
        
        const existingUser: UserEntity | null = await userRepository.findOne({ where: { id: userId } });

        if(!existingUser){
            throw new UserNotFoundError("User not found with id: " + userId);
        }

        if(!User.validateHash(oldPassword, existingUser.password)){
            throw new InvalidPasswordError("Old password is incorrect");
        }
        if(User.validateHash(newPassword, existingUser.password)){
            throw new InvalidPasswordError("New password cannot be the same as the old password");
        }
        
        const hashedPassword = User.hash(newPassword);
        if(!hashedPassword){
            throw new UserError("Failed to hash new password");
        }
            
        existingUser.password = hashedPassword;
        await userRepository.save(existingUser);
        return { user: existingUser }
    }

    public static async createPasswordResetCode(email: string): Promise<{ passwordResetCode: PasswordResetCode }> {
        if(!User.validateEmail(email)){
            throw new InvalidEmailError("Invalid email: " + email);
        }
        const existingUser = await userRepository.findOne({ where: { email } });
        if(!existingUser){
            throw new UserNotFoundError("User not found with email: " + email);
        }
        
        const existingPasswordResetCode = await passwordResetCodeRepository.findOne({ where: { email } });
        if(existingPasswordResetCode){
            await passwordResetCodeRepository.remove(existingPasswordResetCode);
        }

        const passwordResetCode = await passwordResetCodeRepository.save({
            code: User.generateRandomCode(),
            email: email,
            expireAt: User.expireAt()
        });

        if(!passwordResetCode){
            throw new PasswordResetCodeNotFoundError("Failed to create password reset code");
        }

        return { passwordResetCode }
    }

    public static async resetPassword(newPassword: string, code: string): Promise<{ user: UserEntity }> {
        const passwordResetCode = await passwordResetCodeRepository.findOne({ where: { code } });
        if(!passwordResetCode){
            throw new PasswordResetCodeNotFoundError("Password reset code not found: " + code);
        }

        if(passwordResetCode.expireAt < new Date()){
            throw new InvalidPasswordResetCodeError("Password reset code has expired: " + code  + ". Request a new password reset code.");
        }
        const user: UserEntity | null = await userRepository.findOne({ where: { email: passwordResetCode.email } });
        if(!user){
            throw new UserNotFoundError("User not found with email: " + passwordResetCode.email);
        }
        if(User.validateHash(newPassword, user.password)){
            throw new InvalidPasswordError("New password cannot be the same as the old password");
        }
        if(!User.validatePassword(newPassword)){
            throw new InvalidPasswordError("Invalid new password: " + newPassword);
        }
        const hashedPassword = User.hash(newPassword);
        if(!hashedPassword){
            throw new UserError("Failed to hash new password");
        }
        user.password = hashedPassword;

        await dataSource.manager.transaction(async (transactionalEntityManager: EntityManager) => {
            await transactionalEntityManager.save(user);
            await transactionalEntityManager.remove(passwordResetCode);
        })

        return { user }
    }
    
    public static async updateEmail(newEmail: string, emailVerificationCode: string, jwt: string): Promise<{ user: UserEntity }> {
        const userId = User.jwtDecrypt(jwt);
        if(!userId){
            throw new InvalidJWTError("Invalid JWT");
        }
        const existingUser: UserEntity | null = await userRepository.findOne({ where: { id: userId } });
        if(!existingUser){
            throw new UserNotFoundError("User not found with id: " + userId);
        }

        const emailCode: EmailVerificationCode | null = await emailVerificationRepository.findOne({ where: { email: newEmail, code: emailVerificationCode } });
        if(!emailCode) {
            throw new EmailVerificationNotFoundError(newEmail);
        }
        existingUser.email = newEmail;
        await dataSource.manager.transaction(async (transactionalEntityManager: EntityManager) => {
            await transactionalEntityManager.save(existingUser);
            await transactionalEntityManager.remove(emailCode);
        })

        return { user: existingUser }
    }

    public static async deleteUser(jwt: string): Promise<{ user: UserEntity }> {
        const userId = User.jwtDecrypt(jwt);
        if(!userId){
            throw new InvalidJWTError("Invalid JWT");
        }
        const existingUser: UserEntity | null = await userRepository.findOne({ where: { id: userId } });
        if(!existingUser){
            throw new UserNotFoundError("User not found with id: " + userId);
        }
        await userRepository.remove(existingUser);
        return { user: existingUser }
    }

    public static async createUserAuthentication(username: string, password: string): Promise<{ jwt: string }> {
        const existingUser: UserEntity | null = await userRepository.findOne({ where: { username } });
        if(!existingUser){
            throw new UserNotFoundError("User does not exist with username: " + username);
        }

        if(!User.validateHash(password, existingUser.password)){
            throw new InvalidPasswordError("Invalid password");
        }
        const jwt = User.jwtEncrypt(existingUser.id.toString());
        if(!jwt){
            throw new UserError("Error creating JWT");
        }
        return { jwt };
    }

    private static jwtEncrypt(token: string): string | null {
        try {
            if(!JWT_SECRET_KEY){
                return null;
            }
        return jwt.sign({ id: token }, JWT_SECRET_KEY, { expiresIn: "1h" });
        } catch (error) {
            console.error(error);
            return null;
        }
    }

    private static jwtDecrypt(token: string): string | null {
        try{
            if(!JWT_SECRET_KEY){
                return null;
            }
            const decoded = jwt.verify(token, JWT_SECRET_KEY) as { id: string };
            return decoded.id;
        } catch (error) {
            console.error(error);
            return null;
        }
    }

    private static hash(token: string):  string | null {
        try {
            if(!SALT_ROUNDS){
                return null;
            }
            const salt = bcrypt.genSaltSync(Number(SALT_ROUNDS));
            return bcrypt.hashSync(token, salt);
        } catch (error) {
            console.error(error);
            return null;
        }
    }

    private static validateHash(token: string, hashed: string): boolean {
        return bcrypt.compareSync(token, hashed);
    }

    private static validateUsername(token: string): boolean {
        if(!token){
            return false;
        } else if(!regexConfig.username.regex.test(token)){
            return false;
        }
        return true;
    }
    
    private static validateEmail(token: string): boolean {
        if(!token){
            return false;
        } else if(!regexConfig.email.regex.test(token)){
            return false;
        }
        return true;
    }

    private static validatePassword(token: string): boolean {
        if(!token){
            return false;
        } else if(!regexConfig.password.regex.test(token)){
            return false;
        }
        return true;
    }

    private static generateRandomCode(length: number = 6): string {
        return crypto.randomInt(Math.pow(10, length - 1), Math.pow(10, length)).toString();
    }

    private static expireAt(minutes: number = 10): Date {
        const now = new Date();
        now.setMinutes(now.getMinutes() + minutes);
        return now;
    }
}
export default User;