
import { type User as UserEntity } from "./entity/User.js";
import { UserRepository } from "../../infra/db/repository/UserRepository.js";
import { EmailVerificationRepository } from "../../infra/db/repository/EmailVerificationRepository.js";
import { PasswordResetRepository } from "../../infra/db/repository/PasswordResetRepository.js";
import { PhotoMetadataRepository } from "../../infra/db/repository/PhotoMetadataRepository.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { type EmailVerification as EmailVerification } from "./entity/EmailVerification.js";
import { type PasswordReset } from "./entity/PasswordReset.js";
import { Trait, type PhotoMetadata } from "./entity/PhotoMetadata.js";
import { type Trait as TraitType } from "./entity/PhotoMetadata.js";
import { config } from "../../config.js";
import crypto from "node:crypto";
import { regexConfig } from "../services/regexConfig.js";
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
import { PhotoMetadataNotFoundError } from "../errors/PhotoMetadataNotFoundError.js";

class User {
    public static async createEmailVerificationCode(email: string): Promise<{ emailCode: EmailVerification }> {
        if(!User.validateEmail(email)){
            throw new InvalidEmailError("Invalid email format: " + email);
        }
        const existingEmailCode: EmailVerification | null = await EmailVerificationRepository.findOneByEmail(email);
        if(existingEmailCode){
            await EmailVerificationRepository.deleteById(existingEmailCode.id);
        }
        const emailCode: EmailVerification = await EmailVerificationRepository.save({
            email,
            code: User.generateRandomCode(),
            expiresAt: User.expireAt()
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

        const existingUserWithEmail: UserEntity | null = await UserRepository.findOneByEmail(email);
        if(existingUserWithEmail){
            throw new UserExistsError("User with this email already exists: " + email);
        }

        const existingUserWithUsername: UserEntity | null = await UserRepository.findOneByUsername(username);            
        if(existingUserWithUsername){
            throw new UserExistsError("User with this username already exists: " + username);
        }

        const existingEmailCode: EmailVerification | null = await EmailVerificationRepository.findOneByCodeAndEmail(emailVerificationCode, email);
        if(!existingEmailCode){
            throw new EmailVerificationNotFoundError(email);
        }
        
        if(existingEmailCode.expiresAt < new Date()){
            throw new InvalidEmailVerificationError("Email verification code has expired for email: " + email + " at " + existingEmailCode.expiresAt + ". Request a new verification code.");
        }
        
        const hashedPassword = User.hash(password);
        if(!hashedPassword){
            throw new UserError("Failed to hash password");
        }
        await UserRepository.saveUserAndDeleteEmailVerification({ username, email, password: hashedPassword }, existingEmailCode.id);
        const newUser: UserEntity | null = await UserRepository.findOneByUsernameAndEmail(username, email);
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
        const existingUser: UserEntity | null = await UserRepository.findOneById(userId);
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
        const existingUser: UserEntity | null = await UserRepository.findOneById(userId);
        if(!existingUser){
            throw new UserNotFoundError("User not found with id: " + userId);
        }
        
        if(existingUser.username === newUsername){
            throw new InvalidUsernameError("New username is the same as the current username");
        }

        const updatedUser = await UserRepository.updateById(userId, { username: newUsername });
        if(!updatedUser){
            throw new UserError("Failed to update user with id: " + userId);
        }
        return { user: updatedUser }
    }

    public static async updatePassword(oldPassword: string, newPassword: string, jwt: string): Promise<{ user: UserEntity }> {
        const userId = User.jwtDecrypt(jwt);
        if(!userId){
            throw new InvalidJWTError("Invalid JWT");
        }
        if(!User.validatePassword(newPassword)){
            throw new InvalidPasswordError("could not validate password: " + newPassword);
        }
        
        const existingUser: UserEntity | null = await UserRepository.findOneById(userId);

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
            
        const updatedUser = await UserRepository.updateById(userId, { password: hashedPassword });
        if(!updatedUser){
            throw new UserError("Failed to retrieve updated user with id: " + userId);
        }
        return { user: updatedUser }
    }

    public static async createPasswordResetCode(email: string): Promise<{ passwordResetCode: PasswordReset }> {
        if(!User.validateEmail(email)){
            throw new InvalidEmailError("Invalid email: " + email);
        }
        const existingUser = await UserRepository.findOneByEmail(email);
        if(!existingUser){
            throw new UserNotFoundError("User not found with email: " + email);
        }
        
        const existingPasswordResetCode: PasswordReset | null = await PasswordResetRepository.findOneByEmail(email);
        if(existingPasswordResetCode){
            await PasswordResetRepository.deleteById(existingPasswordResetCode.id);
        }

        const passwordResetCode: PasswordReset | null = await PasswordResetRepository.save({
            code: User.generateRandomCode(),
            email: email,
            expiresAt: User.expireAt()
        });

        if(!passwordResetCode){
            throw new PasswordResetCodeNotFoundError("Failed to create password reset code");
        }
        return { passwordResetCode }
    }

    public static async resetPassword(newPassword: string, code: string): Promise<{ user: UserEntity }> {
        const passwordResetCode: PasswordReset | null = await PasswordResetRepository.findOneByCode(code);
        if(!passwordResetCode){
            throw new PasswordResetCodeNotFoundError("Password reset code not found: " + code);
        }

        if(passwordResetCode.expiresAt < new Date()){
            throw new InvalidPasswordResetCodeError("Password reset code has expired: " + code  + ". Request a new password reset code.");
        }
        const user: UserEntity | null = await UserRepository.findOneByEmail(passwordResetCode.email);
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
        
        const updatedUser = await UserRepository.updatePasswordAndDeletePasswordResetCode(user.id, hashedPassword, passwordResetCode.id);
        if(!updatedUser){
            throw new UserError("Failed to update user password");
        }
        return { user: updatedUser  }
    }
    
    public static async updateEmail(newEmail: string, emailVerificationCode: string, jwt: string): Promise<{ user: UserEntity }> {
        const userId = User.jwtDecrypt(jwt);
        if(!userId){
            throw new InvalidJWTError("Invalid JWT");
        }
        const existingUser: UserEntity | null = await UserRepository.findOneById(userId);
        if(!existingUser){
            throw new UserNotFoundError("User not found with id: " + userId);
        }

        const emailCode: EmailVerification | null = await EmailVerificationRepository.findOneByCodeAndEmail(emailVerificationCode, newEmail);
        if(!emailCode) {
            throw new EmailVerificationNotFoundError(newEmail);
        }
        const updatedUser = await UserRepository.updateEmailAndDeleteEmailVerification(existingUser.id, newEmail, emailCode.id);
        if(!updatedUser){
            throw new UserError("Failed to update user email");
        }
        existingUser.email = updatedUser.email;

        return { user: existingUser }
    }

    public static async deleteUser(jwt: string): Promise<{ user: UserEntity }> {
        const userId = User.jwtDecrypt(jwt);
        if(!userId){
            throw new InvalidJWTError("Invalid JWT");
        }
        const existingUser: UserEntity | null = await UserRepository.findOneById(userId);
        if(!existingUser){
            throw new UserNotFoundError("User not found with id: " + userId);
        }
        await UserRepository.deleteById(existingUser.id);
        return { user: existingUser }
    }
    
    public static async savePhotoMetadata(filename: string, size: number, trait: TraitType, path: string, jwt: string): Promise<{ photoMetadata: PhotoMetadata }> {
        const userId = User.jwtDecrypt(jwt);
        if(!userId){
            throw new InvalidJWTError("Invalid JWT");
        }
        const existingUser: UserEntity | null = await UserRepository.findOneById(userId);
        if(!existingUser){
            throw new UserNotFoundError("User not found with id: " + userId);
        }

        const photoMetadata = await PhotoMetadataRepository.updateProfilePhoto({
            filename,
            path,
            size,
            trait,
            userId: existingUser.id
        });
        if(!photoMetadata){
            throw new UserError("Failed to save photo metadata");
        }

        return { photoMetadata };
    }

    public static async saveProfilePhotoMetadata(filename: string, size: number, path: string, jwt: string): Promise<{ photoMetadata: PhotoMetadata }> {
        return User.savePhotoMetadata(filename, size, Trait.PROFILE, path, jwt);
    }

    public static async getProfilePhotoMetadata(jwt: string): Promise<{ photoMetadata: PhotoMetadata }> {
        const userId = User.jwtDecrypt(jwt);
        if(!userId){
            throw new InvalidJWTError("Invalid JWT");
        }
        const existingUser: UserEntity | null = await UserRepository.findOneById(userId);
        if(!existingUser){
            throw new UserNotFoundError("User not found with id: " + userId);
        }

        const photoMetadata = await PhotoMetadataRepository.findProfilePhoto(existingUser.id);
        if(!photoMetadata){
            throw new PhotoMetadataNotFoundError("User does not have profile photo uploaded");
        }
        return { photoMetadata };
    }

    public static async createUserAuthentication(username: string, password: string): Promise<{ jwt: string }> {
        const existingUser: UserEntity | null = await UserRepository.findOneByUsername(username);
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
            if(!config.jwt_secret_key ){
                return null;
            }
        return jwt.sign({ id: token }, config.jwt_secret_key, { expiresIn: "1h" });
        } catch (error) {
            console.error(error);
            return null;
        }
    }

    public static jwtDecrypt(token: string): string | null {
        try{
            if(!config.jwt_secret_key){
                return null;
            }
            const decoded = jwt.verify(token, config.jwt_secret_key) as { id: string };
            return decoded.id;
        } catch (error) {
            console.error(error);
            return null;
        }
    }

    private static hash(token: string):  string | null {
        try {
            if(!config.salt_rounds){
                return null;
            }
            const salt = bcrypt.genSaltSync(Number(config.salt_rounds));
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