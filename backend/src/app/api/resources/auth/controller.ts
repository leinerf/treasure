import { type Request, type Response } from "express";  
import User from "../../../../domain/models/user.js";
import EmailService from "../../../../domain/services/emailService.js";

class AuthController {
    public static async createVerificationEmail(req: Request, res: Response): Promise<Response> {
        const { email } = req.body;
        const { emailCode } = await User.createEmailVerificationCode(email);
        const emailSentSuccessfully = await EmailService.sendVerificationEmail(email, emailCode.code);    
        if(!emailSentSuccessfully){
            return res.status(500).json({ message: "Failed to send verification email" });
        }
        return res.status(200).json({ message: "Verification email sent successfully" });
    }

    public static async register(req: Request, res: Response): Promise<Response> {
        const { username, email, emailVerificationCode, password } = req.body;
        await User.createNewUser(username, email, emailVerificationCode, password);

        return res.status(200).json({ message: "User registered successfully" });
    }

    public static async login(req: Request, res: Response): Promise<Response> {
        const { username, password } = req.body;
        const { jwt } = await User.createUserAuthentication(username, password);
        
        return res.status(200).cookie("jwt", jwt, { httpOnly: true }).json({ message: "Authentication successful" });
    }

    public static async logout(req: Request, res: Response): Promise<Response> {
        res.clearCookie("jwt");
        return res.status(200).json({ message: "Authentication cleared successfully" });
    }

    public static async createPasswordReset(req: Request, res: Response): Promise<Response> {
        const { email } = req.body;
        const { passwordResetCode } = await User.createPasswordResetCode(email);
        
        const emailSent = await EmailService.sendPasswordResetEmail(email, passwordResetCode.code);
        if(!emailSent){
            return res.status(500).json({ message: "Failed to send password reset email" });
        }
        return res.status(200).json({ message: "Password reset code created successfully" });
    }

    public static async resetPassword(req: Request, res: Response): Promise<Response> {
        const { newPassword } = req.body;
        const code = req.params.id;
        if (typeof code !== "string") {
            return res.status(400).json({ message: "Invalid password reset code" });
        }
        await User.resetPassword(newPassword, code);

        return res.status(200).json({ message: "Password reset successfully" });
    }
}

export default AuthController;