import { type Request, type Response } from "express";  
import User from "../models/user.js";
import EmailService from "../services/emailService.js";

class UserController {
    // Define controller methods here
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
            return res.status(500).json({ message: "An error occurred", error });
        }
    }

    public static async verifyEmail(req: Request, res: Response): Promise<Response> {
        try {
            const { email, code } = req.body;
            const { success } = await User.verifyEmail(email, code);
            if(!success){
                return res.status(400).json({ message: "Invalid or expired verification code" });
            }
            return res.status(200).json({ message: "Email verified successfully" });
        }
        catch (error) {
            return res.status(500).json({ message: "An error occurred", error });
        }
    }

    public static async register(req: Request, res: Response): Promise<Response> {
        try {
            const { username, email, password } = req.body;
            const { success } = await User.createNewUser(username,email, password);
            if(!success){
                return res.status(400).json({ message: "Failed to register user" });
            }
            return res.status(200).json({ message: "User registered successfully" });
        }
        catch (error) {
            return res.status(500).json({ message: "An error occurred", error });
        }
    }

    public static async login(req: Request, res: Response): Promise<Response> {
        try {
            const { email, password } = req.body;
            const { jwt, success } = await User.createUserAuthentication(email, password);
            if(!success || !jwt){
                return res.status(400).json({ message: "Failed to login" });
            }
            return res.status(200).cookie("jwt", jwt, { httpOnly: true }).json({ message: "Login successful" });
        }
        catch (error) {
            return res.status(500).json({ message: "An error occurred", error });
        }
    }

    public static async logout(req: Request, res: Response): Promise<Response> {
        try {
            res.clearCookie("jwt");
            return res.status(200).json({ message: "Logout successful" });
        }
        catch (error) {
            return res.status(500).json({ message: "An error occurred", error });
        }
    }
}

export default UserController;