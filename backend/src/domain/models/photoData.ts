import { Trait, type PhotoMetadata, type Trait as TraitType } from "./entity/PhotoMetadata.js";
import { UserRepository } from "../../infra/db/repository/UserRepository.js";
import { PhotoMetadataRepository } from "../../infra/db/repository/PhotoMetadataRepository.js";
import { UserNotFoundError } from "../errors/UserNotFoundError.js";
import { UserError } from "../errors/UserError.js";
import { PhotoMetadataNotFoundError } from "../errors/PhotoMetadataNotFoundError.js";

export class PhotoData {
    public static async savePhotoMetadata(filename: string, size: number, trait: TraitType, path: string, userId: string): Promise<{ photoMetadata: PhotoMetadata }> {
        const existingUser = await UserRepository.findOneById(userId);
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

    public static async saveProfilePhotoMetadata(filename: string, size: number, path: string, userId: string): Promise<{ photoMetadata: PhotoMetadata }> {
        return PhotoData.savePhotoMetadata(filename, size, Trait.PROFILE, path, userId);
    }

    public static async getProfilePhotoMetadata(userId: string): Promise<{ photoMetadata: PhotoMetadata }> {
        const existingUser = await UserRepository.findOneById(userId);
        if(!existingUser){
            throw new UserNotFoundError("User not found with id: " + userId);
        }

        const photoMetadata = await PhotoMetadataRepository.findProfilePhoto(existingUser.id);
        if(!photoMetadata){
            throw new PhotoMetadataNotFoundError("User does not have profile photo uploaded");
        }
        return { photoMetadata };
    }
}
