import { type Request, type Response } from "express";  
import User from "../../../domain/models/user.js";
import EmailService from "../../../domain/services/emailService.js";

class AuthController {
    public static async createVerificationEmail(req: Request, res: Response): Promise<Response> {
        try {
            const { email } = req.body;
            const {emailCode, success } = await User.createEmailVerificationCode(email);
            if(!success || !emailCode || !emailCode.code){
                return res.status(500).json({ message: "Failed to create email verification code" });
            }        
            const emailSentSuccessfully = await EmailService.sendVerificationEmail(email, emailCode.code);
            if(!emailSentSuccessfully){
                return res.status(500).json({ message: "Failed to send verification email" });
            }
            return res.status(200).json({ message: "Verification email sent successfully" });
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ message: "An error occurred", error });
        }
    }

    public static async register(req: Request, res: Response): Promise<Response> {
        try {
            const { username, email, emailVerificationCode, password } = req.body;
            const { success } = await User.createNewUser(username, email, emailVerificationCode, password);
            if(!success){
                return res.status(400).json({ message: "Failed to register user" });
            }
            return res.status(200).json({ message: "User registered successfully" });
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ message: "An error occurred", error });
        }
    }

    public static async login(req: Request, res: Response): Promise<Response> {
        try {
            const { username, password } = req.body;
            const { jwt, success, error } = await User.createUserAuthentication(username, password);
            if(!success || !jwt){
                return res.status(400).json({ message:  error || "Failed to authenticate" });
            }
            return res.status(200).cookie("jwt", jwt, { httpOnly: true }).json({ message: "Authentication successful" });
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ message: "An error occurred", error });
        }
    }

    public static async logout(req: Request, res: Response): Promise<Response> {
        try {
            res.clearCookie("jwt");
            return res.status(200).json({ message: "Authentication cleared successfully" });
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ message: "An error occurred", error });
        }
    }

    public static async createPasswordReset(req: Request, res: Response): Promise<Response> {
        try {
            const { email } = req.body;
            const { passwordResetCode, success } = await User.createPasswordResetCode(email);
            if(!success || !passwordResetCode || !passwordResetCode.code){
                return res.status(400).json({ message: "Failed to create password reset code" });
            }
            const emailSent = await EmailService.sendPasswordResetEmail(email, passwordResetCode.code);
            if(!emailSent){
                return res.status(500).json({ message: "Failed to send password reset email" });
            }
            return res.status(200).json({ message: "Password reset code created successfully", passwordResetCode });
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ message: "An error occurred", error });
        }
    }

    public static async resetPassword(req: Request, res: Response): Promise<Response> {
        try {
            const { newPassword } = req.body;
            const code  = req.params.id
            if(typeof code !== "string" || code.trim() === ""  ){
                return res.status(400).json({ message: "Password reset code is required" });
            }
            const { success } = await User.resetPassword(newPassword, code);
            if(!success){
                return res.status(400).json({ message: "Failed to reset password" });
            }
            return res.status(200).json({ message: "Password reset successfully" });
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ message: "An error occurred", error });
        }
    }
}

export default AuthController;