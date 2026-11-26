import { beforeEach, describe, expect, test, vi } from "vitest";
import { PhotoData } from "./photoData.js";
import User from "./user.js";
import { Role, type User as UserEntity } from "./entity/User.js";
import { Trait, type PhotoMetadata } from "./entity/PhotoMetadata.js";
import { UserRepository } from "../../infra/db/repository/UserRepository.js";
import { PhotoMetadataRepository } from "../../infra/db/repository/PhotoMetadataRepository.js";
import { InvalidJWTError } from "../errors/InvalidJWTError.js";
import { UserNotFoundError } from "../errors/UserNotFoundError.js";
import { UserError } from "../errors/UserError.js";
import { PhotoMetadataNotFoundError } from "../errors/PhotoMetadataNotFoundError.js";

vi.mock("./user.js", () => ({
    default: { jwtDecrypt: vi.fn() }
}));
vi.mock("../../infra/db/repository/UserRepository.js", () => ({
    UserRepository: { findOneById: vi.fn() }
}));
vi.mock("../../infra/db/repository/PhotoMetadataRepository.js", () => ({
    PhotoMetadataRepository: { updateProfilePhoto: vi.fn(), findProfilePhoto: vi.fn() }
}));

describe("PhotoData", () => {
    const user: UserEntity = {
        id: "user-id",
        username: "testuser",
        email: "test@example.com",
        password: "hash",
        role: Role.User
    };
    const photoMetadata: PhotoMetadata = {
        id: "photo-id",
        userId: user.id,
        filename: "profile.jpg",
        size: 1024,
        path: "/photos/profile.jpg",
        trait: Trait.PROFILE
    };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(User.jwtDecrypt).mockReturnValue(user.id);
        vi.mocked(UserRepository.findOneById).mockResolvedValue(user);
        vi.mocked(PhotoMetadataRepository.updateProfilePhoto).mockResolvedValue(photoMetadata);
        vi.mocked(PhotoMetadataRepository.findProfilePhoto).mockResolvedValue(photoMetadata);
    });

    test("saves profile metadata for the authenticated user", async () => {
        await expect(PhotoData.saveProfilePhotoMetadata("profile.jpg", 1024, "/photos/profile.jpg", "access-token"))
            .resolves.toEqual({ photoMetadata });
        expect(User.jwtDecrypt).toHaveBeenCalledWith("access-token");
        expect(PhotoMetadataRepository.updateProfilePhoto).toHaveBeenCalledWith({
            filename: "profile.jpg", size: 1024, path: "/photos/profile.jpg", trait: Trait.PROFILE, userId: user.id
        });
    });

    test("forwards the requested trait when saving metadata", async () => {
        await PhotoData.savePhotoMetadata("photo.jpg", 10, Trait.BASIC, "/photo.jpg", "access-token");
        expect(PhotoMetadataRepository.updateProfilePhoto).toHaveBeenCalledWith({
            filename: "photo.jpg", size: 10, path: "/photo.jpg", trait: Trait.BASIC, userId: user.id
        });
    });

    test("gets the authenticated user's profile metadata", async () => {
        await expect(PhotoData.getProfilePhotoMetadata("access-token")).resolves.toEqual({ photoMetadata });
        expect(PhotoMetadataRepository.findProfilePhoto).toHaveBeenCalledWith(user.id);
    });

    test("rejects invalid tokens and missing users without touching photo metadata", async () => {
        vi.mocked(User.jwtDecrypt).mockReturnValueOnce(null);
        await expect(PhotoData.getProfilePhotoMetadata("invalid")).rejects.toBeInstanceOf(InvalidJWTError);
        vi.mocked(UserRepository.findOneById).mockResolvedValueOnce(null);
        await expect(PhotoData.saveProfilePhotoMetadata("profile.jpg", 1024, "/photo.jpg", "access-token"))
            .rejects.toBeInstanceOf(UserNotFoundError);
        expect(PhotoMetadataRepository.findProfilePhoto).not.toHaveBeenCalled();
        expect(PhotoMetadataRepository.updateProfilePhoto).not.toHaveBeenCalled();
    });

    test("reports missing metadata and failed saves", async () => {
        vi.mocked(PhotoMetadataRepository.findProfilePhoto).mockResolvedValueOnce(null);
        await expect(PhotoData.getProfilePhotoMetadata("access-token"))
            .rejects.toBeInstanceOf(PhotoMetadataNotFoundError);
        vi.mocked(PhotoMetadataRepository.updateProfilePhoto).mockResolvedValueOnce(null);
        await expect(PhotoData.saveProfilePhotoMetadata("profile.jpg", 1024, "/photo.jpg", "access-token"))
            .rejects.toBeInstanceOf(UserError);
    });
});
