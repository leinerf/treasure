import { type Request, type Response } from "express";  
import User from "../../../../domain/models/user.js";
import { PhotoData } from "../../../../domain/models/photoData.js";
import type { User as UserEntity } from "../../../../domain/models/entity/User.js";
import type { PhotoMetadata } from "../../../../domain/models/entity/PhotoMetadata.js"; 
import fs from "fs";
import { InvalidOffsetOrLimitError } from "../../../../domain/errors/InvalidOffsetOrLimitError.js";
import LoggingService from "../../../../domain/services/loggingService.js";
import EmailService from "../../../../domain/services/emailService.js";
import { FileService } from "../../../../domain/services/fileService.js";
import { ValidationService } from "../../../../domain/services/validationService.js";
import { config } from "../../../../config.js";
import { Session } from "../../../../domain/models/session.js";
import { setRefreshCookie } from "../auth/refreshCookie.js";

class UserController {
    public static async getUser(req: Request, res: Response): Promise<Response> {
        const userId: string = res.locals.userId;
        const { user } = await User.getUser(userId);

        return res.status(200).json({ user: UserController.filterUser(user), message: "User retrieved successfully" });
    }

    public static async updateUsername(req: Request, res: Response): Promise<Response> {
        const userId: string = res.locals.userId;
        const { newUsername } = req.body;
        const { user } = await User.updateUsername(newUsername, userId);
        
        LoggingService.info(`Username updated successfully for user with id: ${user.id}`);
        return res.status(200).json({ user: UserController.filterUser(user), message: "Username updated successfully" });
    }
    
    public static async updatePassword(req: Request, res: Response): Promise<Response> {
        const userId: string = res.locals.userId;
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const { oldPassword, newPassword } = req.body;
        const {user } = await User.updatePassword(oldPassword, newPassword, userId);
        // Sign out every other session, then give this browser a fresh refresh token.
        await Session.revokeAll(user.id);
        const { refreshToken } = await Session.create(user.id);
        setRefreshCookie(res, refreshToken);
        EmailService.sendInBackground(EmailService.sendPasswordChangedEmail(user.email), `password changed notice for user ${user.id}`);

        LoggingService.info(`Password updated successfully for user with id: ${user.id}`);
        return res.status(200).json({ user: UserController.filterUser(user), message: "Password updated successfully" });
    }
    
    public static async updateEmail(req: Request, res: Response): Promise<Response> {
        const userId: string = res.locals.userId;
        const { newEmail, emailVerificationCode, currentPassword } = req.body ?? {};
        const { user, previousEmail } = await User.updateEmail(newEmail, emailVerificationCode, currentPassword, userId);
        // Like a password change: sign out every other session, then give this browser a fresh
        // refresh token, so a session someone else holds doesn't survive the change.
        await Session.revokeAll(user.id);
        const { refreshToken } = await Session.create(user.id);
        setRefreshCookie(res, refreshToken);
        // Tell the old address, which is the real owner's way to notice a change they didn't make.
        if (previousEmail !== user.email) {
            EmailService.sendInBackground(EmailService.sendEmailChangedEmail(previousEmail, user.email), `email changed notice for user ${user.id}`);
        }

        LoggingService.info(`Email updated successfully for user with id: ${user.id}`);
        return res.status(200).json({ user: UserController.filterUser(user), message: "Email updated successfully" });
    }

    public static async uploadProfilePicture(req: Request, res: Response): Promise<Response> {
        const userId: string = res.locals.userId;
        
        if (!req.file) {
            return res.status(400).json({ error: "Upload a JPEG, PNG, WebP or GIF image" });
        }
        const { size, filename, path } = req.file;
        const { photoMetadata } = await PhotoData.saveProfilePhotoMetadata(filename, size, path, userId);
        const photoBlob = new Blob([await fs.promises.readFile(path)]);
        
        return res.status(200).json({ photoMetadata: UserController.filterPhotoMetadata(photoMetadata), message: "Profile picture updated successfully", photoBlob });
    }

    public static async uploadProfilePictureToAWS(req: Request, res: Response): Promise<Response> {
        const userId: string = res.locals.userId;
        
        if(!req.file || !req.file.buffer ){
            throw new Error("No file uploaded or file buffer is empty");
        }
        const { size } = req.file;
        
        const key = await FileService.uploadToAWS(req.file.originalname, req.file.buffer);
        const { photoMetadata } = await PhotoData.saveProfilePhotoMetadata(key, size, config.aws_s3_bucket_name,  userId);
        return res.status(200).json({ message: "Profile picture uploaded to AWS successfully", photoMetadata: UserController.filterPhotoMetadata(photoMetadata) });
    }

    public static async getProfilePictureFromAWS(req: Request, res: Response): Promise<Response | void> {
        const userId: string = res.locals.userId;
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const { photoMetadata } = await PhotoData.getProfilePhotoMetadata(userId);
        const { filename: key } = photoMetadata;
        const url = await FileService.getPhotoUrlFromAWS(key);
        return res.status(200).json({ url });
    }
    
    public static async getProfilePicture(req: Request, res: Response): Promise<Response | void> {
        const userId: string = res.locals.userId;
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const { photoMetadata } = await PhotoData.getProfilePhotoMetadata(userId);
        return res.status(200).sendFile(photoMetadata.path);
    }
    
    public static async getUsers(req: Request, res: Response): Promise<Response> {
        const userId: string = res.locals.userId;
        const offset = Number.parseInt(String(req.query.offset));
        const limit = Number.parseInt(String(req.query.limit));
        if(!ValidationService.isValidOffsetAndLimit(offset, limit)) {
            throw new InvalidOffsetOrLimitError("Invalid offset or limit");
        }
        
        const {users, count } = await User.adminFindUsers(userId, offset, limit);
        return res.status(200).json({ users: users.map(UserController.filterUser), count, message: "Users retrieved successfully" });
    }

    public static async searchUsers(req: Request, res: Response): Promise<Response> {
        const userId: string = res.locals.userId;
        const query = String(req.query.query);
        const { users } = await User.adminSearchUsers(userId, query);

        return res.status(200).json({ users: users.map(UserController.filterUser), message: "Search results retrieved successfully" });
    }

    public static async deleteUser(req: Request, res: Response): Promise<Response> {
        const adminUserId: string = res.locals.userId;
        const userIdToDelete = req.params.userId as string;
        const { user }  = await User.adminDeleteUser(adminUserId, userIdToDelete);
        if (user) {
            await Session.revokeAll(user.id);
        }

        LoggingService.info(`User with id: ${userIdToDelete} deleted by admin with id: ${adminUserId}`);
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