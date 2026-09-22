import { User as UserEntity } from "./entity/user.js";
import userRepository from "./repository/userRepository.js";
import emailVerificationRepository from "./repository/emailVerificationRepository.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import type { EmailVerificationCode } from "./entity/emailVerificationCode.js";
import { JWT_SECRET_KEY } from "../config.js";

class User {
    public viewProducts(): Array<Record<string, string>> {
        return []
    }

    public addProduct(product: Record<string, string>, jwt: string): void {}

    public viewProduct(id: string): Record<string, string> { return {
        id: "productId",
        OwnerId: "ownerId",
    }}

    public updateProduct(id: string, newProduct: Record<string, string>, jwt: string): void {}

    public deleteProduct(id: string, jwt: string): void {}

    public createCoupon(coupon: Record<string, string>, jwt: string): void {}

    public deleteCoupon(coupon: Record<string, string>, jwt: string): void {}

    public viewOrders(jwt: string): Array<Record<string, string>> {
        return []
    }
    
    public createOrder(order: Record<string, string>, jwt: string): void {}

    public viewOrder(id: string, jwt: string): Record<string, string> { 
        return {}
    }

    public updateOrder(id: string, newOrder: Record<string, string>, jwt: string): void {}

    public deleteOrder(id: string, jwt: string): void {}

    public static async createEmailVerificationCode(email: string): Promise<{ emailCode?: EmailVerificationCode, success: boolean }> {
        // create email verification code logic here
        try {
            const emailCode: EmailVerificationCode = await emailVerificationRepository.save({
                email,
                code: String(Math.floor(100000 + Math.random() * 900000))
            });
            return { emailCode, success: true }
        } catch (error) {
            console.error("Error creating email verification code:", error);
            return { success: false }
        }
    }

    public static async updateEmailVerificationCode(email: string): Promise<{ emailCode?: EmailVerificationCode, success: boolean }> {
        try {
            const emailCode: EmailVerificationCode | null = await emailVerificationRepository.findOne({ where: { email } });
            if(!emailCode){
                console.error("Email verification code not found for email: " + email);
                return { success: false }
            }
            emailCode.code = String(Math.floor(100000 + Math.random() * 900000));
            emailCode.verified = false;
            await emailVerificationRepository.save(emailCode);
            return { emailCode, success: true }
        } catch (error) {
            console.error("Error updating email verification code:", error);
            return { success: false }
        }
    }
    
    public static async verifyEmail(email: string, code: string): Promise<{ success: boolean }> {
        try {
            const emailCode: EmailVerificationCode | null = await emailVerificationRepository.findOne({ where: { email, code } });
            if(!emailCode){
                console.error("Email verification code not found for email: " + email);
                return { success: false }
            }
            emailCode.verified = true;
            await emailVerificationRepository.save(emailCode);
            return { success: true }
        } catch (error) {
            console.error("Error verifying email:", error);
            return { success: false }
        }
    }

    public static async createNewUser(username: string, email: string, password: string): Promise<{ newUser?: UserEntity, success: boolean }> {
        // validate username
        if(!User.validateUsername(username)){
            console.error("could not validate username:  " + username);
            return { success: false }
        }
        
        if(!User.validateEmail(email)){
            console.error("could not validate email: " + email);
            return { success: false }
        }

        if(!User.validatePassword(password)){
            console.error("could not validate password: " + password);
            return { success: false }
        }

        // check if email is already verified
        const existingEmailCode: EmailVerificationCode | null = await emailVerificationRepository.findOne({ where: { email } });
        if(!existingEmailCode || !existingEmailCode.verified){
            console.error("Email is not yet verified: " + email);
            return { success: false }
        }

        const hashedPassword = User.hash(password);
        
        try {
            const existingUser: UserEntity | null = await userRepository.findOne({ where: { email } });
            if(existingUser){
                console.error("User with this email already exists: " + email);
                return { success: false }
            }
            const newUser: UserEntity = await userRepository.save({
                username,
                email,
                password: hashedPassword,
            });
            return { newUser: newUser,   success: true }
        } catch (error) {
            console.error("Error creating new user:", error);
            return { success: false }
        }
    }

    public static async updateUsername(newUsername: string, jwt: string): Promise<{ newUser?: UserEntity, success: boolean }> {
        if(!User.validateUsername(newUsername)){
            console.error("could not validate username: " + newUsername);
            return { success: false }
        }
        const userId = User.jwtDecrypt(jwt);
        const existingUser: UserEntity | null = await userRepository.findOne({ where: { id: userId } });
        if(!existingUser){
            console.error("User not found with id: " + userId);
            return { success: false }
        }
        
        if(existingUser.username === newUsername){
            console.error("New username is the same as the current username");
            return { success: false }
        }
        // update username logic here
        existingUser.username = newUsername;
        await userRepository.save(existingUser);
        return { newUser: existingUser, success: true }
    }

    public static async updatePassword(newPassword: string, jwt: string): Promise<{ success: boolean }> {
        if(!User.validatePassword(newPassword)){
            console.error("could not validate password: " + newPassword);
            return { success: false }
        }
        const userId = User.jwtDecrypt(jwt);
        const existingUser: UserEntity | null = await userRepository.findOne({ where: { id: userId } });
        if(!existingUser){
            console.error("User not found with id: " + userId);
            return { success: false }
        }
        // update password logic here
        if(User.validateHash(newPassword, existingUser.password)){
            console.error("New password is the same as the old password");
            return { success: false }
        }
        existingUser.password = User.hash(newPassword);
        await userRepository.save(existingUser);
        return { success: true }
    }
    
    public static async updateEmail(newEmail: string, jwt: string): Promise<{ newUser?: UserEntity, success: boolean }> {
        const userId = User.jwtDecrypt(jwt);
        const existingUser: UserEntity | null = await userRepository.findOne({ where: { id: userId } });
        if(!existingUser){
            console.error("User not found with id: " + userId);
            return { success: false }
        }
        // update email logic here
        const emailCode: EmailVerificationCode | null = await emailVerificationRepository.findOne({ where: { email: newEmail } });
        
        if(!emailCode) {
            console.error("Email verification code not found for email: " + newEmail);
            return { success: false }
        }

        if(!emailCode.verified){
            console.error("Email verification code not verified for email: " + newEmail);
            return { success: false }
        }
        existingUser.email = newEmail;
        await userRepository.save(existingUser);
        return { newUser: existingUser, success: true }
    }

    public async updateAddress(newAddress: Record<string, string>, jwt: string): Promise<{ success: boolean }> {
        return { success: true }
    }

    public static async deleteUser(jwt: string): Promise<{ deleted?: UserEntity, success: boolean }> {
        const userId = User.jwtDecrypt(jwt);
        try {
            const existingUser: UserEntity | null = await userRepository.findOne({ where: { id: userId } });
            if(!existingUser){
                console.error("User not found with id: " + userId);
                return { success: false }
            }
            await userRepository.remove(existingUser);
            return { deleted: existingUser, success: true }
        } catch (error) {
            console.error("Error deleting user:", error);
            return { success: false }
        }
    }

    public static async createUserAuthentication(username: string, password: string): Promise<{ jwt: string, success: boolean }> {
        // find user by username and password
        const existingUser: UserEntity | null = await userRepository.findOne({ where: { username } });
        if(!existingUser){
            console.error("User does not exist with username: " + username);
            return { jwt: "" , success: false };
        }

        if(!User.validateHash(password, existingUser.password)){
            console.error("Invalid password");
            return { jwt: "" , success: false };
        }
        return { jwt: User.jwtEncrypt(existingUser.id.toString()), success: true };
    }

    private static jwtEncrypt(token: string): string {
        if(!JWT_SECRET_KEY){
            throw new Error("JWT_SECRET_KEY is not defined");
        }
        return jwt.sign({ id: token }, JWT_SECRET_KEY, { expiresIn: "1h" });
    }

    private static jwtDecrypt(token: string): string {
        if(!JWT_SECRET_KEY){
            throw new Error("JWT_SECRET_KEY is not defined");
        }
        try {
            const decoded = jwt.verify(token, JWT_SECRET_KEY) as { id: string };
            return decoded.id;
        } catch (error) {
            console.error("Error decrypting JWT:", error);
            return "";
        }
    }

    private static hash(token: string):  string {
        const salt = bcrypt.genSaltSync(10);
        return bcrypt.hashSync(token, salt);
    }

    private static validateHash(token: string, hashed: string): boolean {
        return bcrypt.compareSync(token, hashed);
    }

    private static validateUsername(token: string): boolean {
        // check if the username meets the required pattern and length
        const regex: RegExp = new RegExp(/^[A-Za-z]*[A-Za-z][A-Za-z0-9-. _]{5,20}$/);
        if(!regex.test(token)){
            console.error("username validation failed regex: " + token)
            // <TODO: create exception for invalid username>
            return false;
        }
        return true;
    }
    
    private static validateEmail(token: string): boolean {
        // check if the email meets the required pattern
        const regex: RegExp = new RegExp(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
        if(!regex.test(token)){
            console.error("email validation failed regex: " + token)
            // <TODO: create exception for invalid email>
            return false;
        }
        return true;
    }

    private static validatePassword(token: string): boolean {
        // check if the password meets the required pattern and length
        const regex: RegExp = new RegExp(/^(?=.*[A-Za-z])(?=.*[!@#$%^&*])(?=.*\d)[A-Za-z\d!@#$%^&*]{8,}$/);
        if(!regex.test(token)){
            console.error("password validation failed regex: " + token)
            // <TODO: create exception for invalid password>
            return false;
        }
        return true;
    }
}
export default User;