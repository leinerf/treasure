import { Role, type User as UserEntity } from "./entity/User.js";
import { UserRepository } from "../../infra/db/repository/UserRepository.js";
import { EmailVerificationRepository } from "../../infra/db/repository/EmailVerificationRepository.js";
import { PasswordResetRepository } from "../../infra/db/repository/PasswordResetRepository.js";
import { Verification } from "./Verification.js";
import bcrypt from "bcrypt";
import { type EmailVerification } from "./entity/EmailVerification.js";
import { type PasswordReset } from "./entity/PasswordReset.js";
import { config } from "../../config.js";
import { ValidationService } from "../services/validationService.js";
import { TokenService } from "../services/tokenService.js";
import { InvalidEmailError } from "../errors/InvalidEmailError.js";
import { InvalidUsernameError } from "../errors/InvalidUsernameError.js";
import { InvalidPasswordError } from "../errors/InvalidPasswordError.js";
import { InvalidPasswordResetCodeError } from "../errors/InvalidPasswordResetCode.js";
import { InvalidEmailVerificationError } from "../errors/InvalidEmailVerification.js";
import { UserExistsError } from "../errors/UserExistsError.js";
import { UserError } from "../errors/UserError.js";
import { UserNotFoundError } from "../errors/UserNotFoundError.js";
import { EmailVerificationNotFoundError } from "../errors/EmailVerificationNotFound.js";
import { PasswordResetCodeNotFoundError } from "../errors/PasswordResetCodeNotFound.js";
import { InvalidRoleError } from "../errors/InvalidRoleError.js";
import { InvalidOffsetOrLimitError } from "../errors/InvalidOffsetOrLimitError.js";
import { InvalidQueryError } from "../errors/InvalidQueryError.js";

class User {
    public static async createNewUser(username: string, email: string, emailVerificationCode: string, password: string): Promise<{ user: UserEntity }> {
        email = ValidationService.normalizeEmail(email);
        if(!ValidationService.isValidUsername(username)){
            throw new InvalidUsernameError("Invalid username format: " + username);
        }
        
        if(!ValidationService.isValidEmail(email)){
            throw new InvalidEmailError("Invalid email format: " + email);
        }

        if(!ValidationService.isValidPassword(password)){
            throw new InvalidPasswordError("Invalid password format");
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
        
        if(ValidationService.isExpired(existingEmailCode.expiresAt)){
            throw new InvalidEmailVerificationError("Email verification code has expired for email: " + email + " at " + existingEmailCode.expiresAt + ". Request a new verification code.");
        }
        
        const hashedPassword = await User.hash(password);
        if(!hashedPassword){
            throw new UserError("Failed to hash password");
        }
        await UserRepository.saveUserAndDeleteEmailVerification({ username, email, password: hashedPassword, role: Role.User }, existingEmailCode.id);
        const newUser: UserEntity | null = await UserRepository.findOneByUsernameAndEmail(username, email);
        if(!newUser){
            throw new UserNotFoundError("Failed to retrieve the newly created user with username: " + username + " and email: " + email)
        }
        return { user: newUser }
    }
    
    public static async getUser(jwt: string): Promise<{ user: UserEntity }> {
        const userId = TokenService.userIdFromAccessToken(jwt);
        const existingUser: UserEntity | null = await UserRepository.findOneById(userId);
        if(!existingUser){
            throw new UserNotFoundError("User not found with id: " + userId);
        }
        return { user: existingUser }
    }

    public static async updateUsername(newUsername: string, jwt: string): Promise<{ user: UserEntity }> {
        const userId = TokenService.userIdFromAccessToken(jwt);
        if(!ValidationService.isValidUsername(newUsername)){
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
        const userId = TokenService.userIdFromAccessToken(jwt);
        if(!ValidationService.isValidPassword(newPassword)){
            throw new InvalidPasswordError("Invalid new password format");
        }
        
        const existingUser: UserEntity | null = await UserRepository.findOneById(userId);

        if(!existingUser){
            throw new UserNotFoundError("User not found with id: " + userId);
        }

        if(!await ValidationService.matchesPassword(oldPassword, existingUser.password)){
            throw new InvalidPasswordError("Old password is incorrect");
        }
        if(await ValidationService.matchesPassword(newPassword, existingUser.password)){
            throw new InvalidPasswordError("New password cannot be the same as the old password");
        }
        
        const hashedPassword = await User.hash(newPassword);
        if(!hashedPassword){
            throw new UserError("Failed to hash new password");
        }
            
        const updatedUser = await UserRepository.updateById(userId, { password: hashedPassword });
        if(!updatedUser){
            throw new UserError("Failed to retrieve updated user with id: " + userId);
        }
        return { user: updatedUser }
    }

    public static async resetPassword(newPassword: string, token: string): Promise<{ user: UserEntity }> {
        if(!ValidationService.isValidPassword(newPassword)){
            throw new InvalidPasswordError("Invalid new password");
        }
        const passwordReset: PasswordReset | null = token
            ? await PasswordResetRepository.findOneByTokenHash(Verification.hashPasswordResetToken(token))
            : null;
        if(!passwordReset){
            throw new PasswordResetCodeNotFoundError("Invalid or expired password reset link");
        }
        if(ValidationService.isExpired(passwordReset.expiresAt)){
            await PasswordResetRepository.deleteById(passwordReset.id);
            throw new InvalidPasswordResetCodeError("Password reset link has expired. Request a new password reset link.");
        }
        // The link is only valid while the account still has the email it was sent to.
        const user = await UserRepository.findOneById(passwordReset.userId);
        if(!user || user.email !== passwordReset.email){
            throw new PasswordResetCodeNotFoundError("Invalid or expired password reset link");
        }
        if(await ValidationService.matchesPassword(newPassword, user.password)){
            throw new InvalidPasswordError("New password cannot be the same as the old password");
        }
        const hashedPassword = await User.hash(newPassword);
        if(!hashedPassword){
            throw new UserError("Failed to hash new password");
        }

        const updatedUser = await UserRepository.updatePasswordAndDeletePasswordResetCode(user.id, hashedPassword, passwordReset.id, passwordReset.email);
        if(!updatedUser){
            throw new UserError("Failed to update user password");
        }
        return { user: updatedUser  }
    }
    
    public static async updateEmail(newEmail: string, emailVerificationCode: string, currentPassword: string, jwt: string): Promise<{ user: UserEntity }> {
        newEmail = ValidationService.normalizeEmail(newEmail);
        const userId = TokenService.userIdFromAccessToken(jwt);
        const existingUser: UserEntity | null = await UserRepository.findOneById(userId);
        if(!existingUser){
            throw new UserNotFoundError("User not found with id: " + userId);
        }
        // Re-authenticate: a stolen access token alone must not be able to move the account to another email.
        if(typeof currentPassword !== "string" || !currentPassword
            || !await ValidationService.matchesPassword(currentPassword, existingUser.password)){
            throw new InvalidPasswordError("Current password is incorrect");
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
        const userId = TokenService.userIdFromAccessToken(jwt);
        const existingUser: UserEntity | null = await UserRepository.findOneById(userId);
        if(!existingUser){
            throw new UserNotFoundError("User not found with id: " + userId);
        }
        await UserRepository.deleteById(existingUser.id);
        return { user: existingUser }
    }
    
    public static async createUserAuthentication(username: string, password: string): Promise<{ jwt: string }> {
        const existingUser: UserEntity | null = await UserRepository.findOneByUsername(username);
        if(!existingUser){
            throw new UserNotFoundError("User does not exist with username: " + username);
        }

        if(!await ValidationService.matchesPassword(password, existingUser.password)){
            throw new InvalidPasswordError("Invalid password");
        }
        const jwt = TokenService.createAccessToken(existingUser.id);
        return { jwt };
    }

    public static async adminFindUsers(jwt: string, offset: number, limit: number): Promise<{users: UserEntity[], count: number }> {
        const userId = TokenService.userIdFromAccessToken(jwt);

        if(!ValidationService.isValidOffsetAndLimit(offset, limit)){
            throw new InvalidOffsetOrLimitError("Invalid offset or limit");
        }
        
        const existingUser: UserEntity | null = await UserRepository.findOneById(userId);
        if(!existingUser){
            throw new UserNotFoundError("User not found with id: " + userId);
        }
        if(existingUser.role !== Role.Admin){
            throw new InvalidRoleError("User is not authorized to view all users");
        }
        const users = await UserRepository.findUsers(offset, limit);
        const count = await UserRepository.count();
        
        return { users, count };
    }

    public static async adminSearchUsers(jwt: string, query: string): Promise<{ users: UserEntity[] }> {
        const userId = TokenService.userIdFromAccessToken(jwt);
        if(!ValidationService.isValidSearchQuery(query)){
            throw new InvalidQueryError("Query must be at least 3 characters long");
        }
        const existingUser: UserEntity | null = await UserRepository.findOneById(userId);
        if(!existingUser){
            throw new UserNotFoundError("User not found with id: " + userId);
        }
        if(existingUser.role !== Role.Admin){
            throw new InvalidRoleError("User is not authorized to search users");
        }
        const users = await UserRepository.searchUsers(query, "username");
        return { users };
    }

    public static async adminDeleteUser(jwt: string, userIdToDelete: string): Promise<{ user: UserEntity | null }> {
        const userId = TokenService.userIdFromAccessToken(jwt);
        const existingUser: UserEntity | null = await UserRepository.findOneById(userId);
        if(!existingUser){
            throw new UserNotFoundError("User not found with id: " + userId);
        }
        if(existingUser.role !== Role.Admin){
            throw new InvalidRoleError("User is not authorized to delete users");
        }
        const user = await UserRepository.deleteById(userIdToDelete);
        return { user };
    }
    

    private static async hash(token: string): Promise<string | null> {
        try {
            if(!config.salt_rounds){
                return null;
            }
            return await bcrypt.hash(token, Number(config.salt_rounds));
        } catch (error) {
            console.error(error);
            return null;
        }
    }

}
export default User;