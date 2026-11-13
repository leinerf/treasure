import { type Request, type Response } from "express";  
import User from "../../../../domain/models/user.js";
import type { User as UserEntity } from "../../../../domain/models/entity/User.js";
import type { PhotoMetadata } from "../../../../domain/models/entity/PhotoMetadata.js"; 
import fs from "fs";
import { InvalidOffsetOrLimitError } from "../../../../domain/errors/InvalidOffsetOrLimitError.js";
import LoggingService from "../../../../domain/services/loggingService.js";
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
        
        LoggingService.info(`Username updated successfully for user with id: ${user.id}, email: ${user.email}, username: ${user.username}`);
        return res.status(200).json({ user: UserController.filterUser(user), message: "Username updated successfully" });
    }
    
    public static async updatePassword(req: Request, res: Response): Promise<Response> {
        const jwt = req.cookies.jwt;
        if (!jwt) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const { oldPassword, newPassword } = req.body;
        const {user } = await User.updatePassword(oldPassword, newPassword, jwt);
        
        LoggingService.info(`Password updated successfully for user with id: ${user.id}`);
        return res.status(200).json({ user: UserController.filterUser(user), message: "Password updated successfully" });
    }
    
    public static async updateEmail(req: Request, res: Response): Promise<Response> {
        const jwt = req.cookies.jwt;
        const { newEmail, emailVerificationCode } = req.body;
        const { user } = await User.updateEmail(newEmail, emailVerificationCode, jwt);
        
        LoggingService.info(`Email updated successfully for user with id: ${user.id}, username: ${user.username}, email: ${user.email} to ${newEmail}`);
        return res.status(200).json({ user: UserController.filterUser(user), message: "Email updated successfully" });
    }

    public static async uploadProfilePicture(req: Request, res: Response): Promise<Response> {
        const jwt = req.cookies.jwt;
        
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }
        const { size, filename, path } = req.file;
        const { photoMetadata } = await User.saveProfilePhotoMetadata(filename, size, path, jwt);
        const photoBlob = new Blob([await fs.promises.readFile(path)]);
        
        return res.status(200).json({ photoMetadata: UserController.filterPhotoMetadata(photoMetadata), message: "Profile picture updated successfully", photoBlob });
    }

    public static async getProfilePicture(req: Request, res: Response): Promise<Response | void> {
        const jwt = req.cookies.jwt;
        if (!jwt) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const { photoMetadata } = await User.getProfilePhotoMetadata(jwt);
        return res.status(200).sendFile(photoMetadata.path);
    }
    
    public static async getUsers(req: Request, res: Response): Promise<Response> {
        const jwt = req.cookies.jwt;
        const offset = Number.parseInt(String(req.query.offset));
        const limit = Number.parseInt(String(req.query.limit));
        if(isNaN(offset) || isNaN(limit) || offset < 0 || limit < 0) {
            throw new InvalidOffsetOrLimitError("Invalid offset or limit");
        }
        
        const {users, count } = await User.adminFindUsers(jwt, offset, limit);
        return res.status(200).json({ users: users.map(UserController.filterUser), count, message: "Users retrieved successfully" });
    }

    public static async searchUsers(req: Request, res: Response): Promise<Response> {
        const jwt = req.cookies.jwt;
        const query = String(req.query.query);
        const { users } = await User.adminSearchUsers(jwt, query);

        return res.status(200).json({ users: users.map(UserController.filterUser), message: "Search results retrieved successfully" });
    }

    public static async deleteUser(req: Request, res: Response): Promise<Response> {
        const jwt = req.cookies.jwt;
        const userId  = req.params.userId as string;
        const { user }  = await User.adminDeleteUser(jwt, userId);

        LoggingService.info(`User deleted successfully with id: ${user?.id}, username: ${user?.username}, email: ${user?.email}`);
        return res.status(200).json({ message: "User deleted successfully" });
        
    }

    private static filterUser(user: UserEntity) {
        return {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role
        };
    }

    private static filterPhotoMetadata(photoMetadata: PhotoMetadata) {
        return {
            id: photoMetadata.id,
            filename: photoMetadata.filename,
            path: photoMetadata.path,
            size: photoMetadata.size,
            trait: photoMetadata.trait,
            userId: photoMetadata.userId
        };
    }
}

export default UserController;