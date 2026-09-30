import { type Request, type Response } from "express";  
import User from "../models/user.js";

class UserController {
    public static async getUser(req: Request, res: Response): Promise<Response> {
        try {
            const jwt = req.cookies.jwt;
            // Replace the following line with your actual user retrieval logic
            const { user, success } = await User.getUser(jwt);
            if(!success){
                return res.status(404).json({ message: "User not found" });
            }
            return res.status(200).json({ user });
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ message: "An error occurred", error });
        }
    }

    public static async updateUsername(req: Request, res: Response): Promise<Response> {
        try {
            const jwt = req.cookies.jwt;
            const { newUsername } = req.body;
            const { newUser, success } = await User.updateUsername(newUsername, jwt);
            if(!success){
                return res.status(400).json({ message: "Failed to update username" });
            }
            return res.status(200).json({ newUser, message: "Username updated successfully" });
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ message: "An error occurred", error });
        }
    }
    
    public static async updatePassword(req: Request, res: Response): Promise<Response> {
        try {
            const jwt = req.cookies.jwt;
            if (!jwt) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            const { oldPassword, newPassword } = req.body;
            const { success } = await User.updatePassword(oldPassword, newPassword, jwt);
            if(!success){
                return res.status(400).json({ message: "Failed to update password" });
            }
            return res.status(200).json({ message: "Password updated successfully" });
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ message: "An error occurred", error });
        }
    }
    
    public static async updateEmail(req: Request, res: Response): Promise<Response> {
        try {
            const jwt = req.cookies.jwt;
            if (!jwt) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            const { newEmail } = req.body;
            const { newUser, success } = await User.updateEmail(newEmail, jwt);
            if(!success){
                return res.status(400).json({ message: "Failed to update email" });
            }
            return res.status(200).json({ newUser });
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ message: "An error occurred", error });
        }
    }
}

export default UserController;