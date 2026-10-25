import { type Request, type Response } from "express";  
import User from "../../../../domain/models/user.js";
import type { User as UserEntity } from "../../../../domain/models/entity/user.js";
class UserController {
    public static async getUser(req: Request, res: Response): Promise<Response> {
        const jwt = req.cookies.jwt;
        const { user } = await User.getUser(jwt);

        return res.status(200).json({ user: UserController.filterUser(user), message: "User retrieved successfully" });
    }

    public static async updateUsername(req: Request, res: Response): Promise<Response> {
        const jwt = req.cookies.jwt;
        const { newUsername } = req.body;
        const { user } = await User.updateUsername(newUsername, jwt);
        
        return res.status(200).json({ user: UserController.filterUser(user), message: "Username updated successfully" });
    }
    
    public static async updatePassword(req: Request, res: Response): Promise<Response> {
        const jwt = req.cookies.jwt;
        if (!jwt) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const { oldPassword, newPassword } = req.body;
        const {user } = await User.updatePassword(oldPassword, newPassword, jwt);
        
        return res.status(200).json({ user: UserController.filterUser(user), message: "Password updated successfully" });
    }
    
    public static async updateEmail(req: Request, res: Response): Promise<Response> {
        const jwt = req.cookies.jwt;
        if (!jwt) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const { newEmail, emailVerificationCode } = req.body;
        const { user } = await User.updateEmail(newEmail, emailVerificationCode, jwt);
        return res.status(200).json({ user: UserController.filterUser(user), message: "Email updated successfully" });
    }

    private static filterUser(user: UserEntity) {
        return {
            id: user.id,
            username: user.username,
            email: user.email
        };
    }
}

export default UserController;