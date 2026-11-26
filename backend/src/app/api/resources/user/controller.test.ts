import { describe, expect, test, vi } from "vitest";
import type { Request, Response } from "express";
import UserController from "./controller.js";
import { PhotoData } from "../../../../domain/models/photoData.js";
import { FileService } from "../../../../domain/services/fileService.js";
import { Trait } from "../../../../domain/models/entity/PhotoMetadata.js";
import User from "../../../../domain/models/user.js";
import { Session } from "../../../../domain/models/session.js";
import { Role } from "../../../../domain/models/entity/User.js";
import { InvalidOffsetOrLimitError } from "../../../../domain/errors/InvalidOffsetOrLimitError.js";

vi.mock("../../../../domain/models/user.js", () => ({
    default: { updatePassword: vi.fn(), updateEmail: vi.fn(), adminDeleteUser: vi.fn(), adminFindUsers: vi.fn() }
}));
vi.mock("../../../../domain/models/photoData.js", () => ({
    PhotoData: { saveProfilePhotoMetadata: vi.fn(), getProfilePhotoMetadata: vi.fn() }
}));
vi.mock("../../../../domain/services/fileService.js", () => ({
    FileService: { uploadToAWS: vi.fn(), getPhotoUrlFromAWS: vi.fn() }
}));
vi.mock("../../../../domain/services/loggingService.js", () => ({ default: { info: vi.fn() } }));
vi.mock("../../../../domain/models/session.js", () => ({
    Session: { create: vi.fn(), revokeAll: vi.fn() }
}));
vi.mock("../../../../config.js", () => ({ config: { aws_s3_bucket_name: "test-bucket" } }));

describe("UserController pagination", () => {
    test("accepts a limit of 100 and rejects larger limits before querying users", async () => {
        vi.mocked(User.adminFindUsers).mockReset().mockResolvedValue({ users: [], count: 0 });
        const res = {
            locals: { accessToken: "access-token" },
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis()
        };
        const validRequest: Partial<Request> = { query: { offset: "0", limit: "100" } };
        const oversizedRequest: Partial<Request> = { query: { offset: "0", limit: "101" } };

        await UserController.getUsers(validRequest as Request, res as unknown as Response);
        expect(User.adminFindUsers).toHaveBeenCalledWith("access-token", 0, 100);

        await expect(UserController.getUsers(oversizedRequest as Request, res as unknown as Response))
            .rejects.toBeInstanceOf(InvalidOffsetOrLimitError);
        expect(User.adminFindUsers).toHaveBeenCalledOnce();
    });
});

describe("UserController email change", () => {
    test("passes the current password through for re-authentication", async () => {
        const user = { id: "user-id", username: "alice", email: "new@example.com", password: "hash", role: Role.User };
        vi.mocked(User.updateEmail).mockResolvedValueOnce({ user });
        const res = { locals: { accessToken: "access-token" }, status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() };
        const req: Partial<Request> = {
            body: { newEmail: "new@example.com", emailVerificationCode: "123456", currentPassword: "Current!123" }
        };

        await UserController.updateEmail(req as Request, res as unknown as Response);

        expect(User.updateEmail).toHaveBeenCalledWith("new@example.com", "123456", "Current!123", "access-token");
        expect(res.status).toHaveBeenCalledWith(200);
        expect(JSON.stringify(res.json.mock.calls)).not.toContain("hash");
    });
});

describe("UserController profile photos", () => {
    test("uses PhotoData when uploading and retrieving an AWS profile photo", async () => {
        const photoMetadata = {
            id: "photo-id", userId: "user-id", filename: "key", size: 3, path: "test-bucket", trait: Trait.PROFILE
        };
        vi.mocked(FileService.uploadToAWS).mockResolvedValue("key");
        vi.mocked(FileService.getPhotoUrlFromAWS).mockResolvedValue("https://example.com/photo");
        vi.mocked(PhotoData.saveProfilePhotoMetadata).mockResolvedValue({ photoMetadata });
        vi.mocked(PhotoData.getProfilePhotoMetadata).mockResolvedValue({ photoMetadata });
        const file = { originalname: "profile.jpg", size: 3, buffer: Buffer.from("abc") } as Express.Multer.File;
        const req: Partial<Request> = { file };
        const res = {
            locals: { accessToken: "access-token" },
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis()
        };

        await UserController.uploadProfilePictureToAWS(req as Request, res as unknown as Response);
        await UserController.getProfilePictureFromAWS(req as Request, res as unknown as Response);

        expect(PhotoData.saveProfilePhotoMetadata).toHaveBeenCalledWith("key", 3, "test-bucket", "access-token");
        expect(PhotoData.getProfilePhotoMetadata).toHaveBeenCalledWith("access-token");
        expect(res.json).toHaveBeenLastCalledWith({ url: "https://example.com/photo" });
    });
});

describe("UserController sessions", () => {
    const user = { id: "user-id", username: "alice", email: "alice@example.com", password: "hash", role: Role.User };
    const response = () => ({
        locals: { accessToken: "access-token" },
        status: vi.fn().mockReturnThis(),
        cookie: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis()
    });

    test("revokes other sessions and issues a new refresh cookie after a password change", async () => {
        vi.mocked(User.updatePassword).mockResolvedValue({ user });
        vi.mocked(Session.create).mockResolvedValue({ refreshToken: "new-refresh-token" });
        const req: Partial<Request> = { body: { oldPassword: "Old!12345", newPassword: "New!12345" } };
        const res = response();

        await UserController.updatePassword(req as Request, res as unknown as Response);

        expect(Session.revokeAll).toHaveBeenCalledWith("user-id");
        expect(vi.mocked(Session.revokeAll).mock.invocationCallOrder[0])
            .toBeLessThan(vi.mocked(Session.create).mock.invocationCallOrder[0]!);
        expect(res.cookie).toHaveBeenCalledWith("refreshToken", "new-refresh-token",
            expect.objectContaining({ httpOnly: true, path: "/api/auth" }));
        expect(res.status).toHaveBeenCalledWith(200);
    });

    test("revokes the sessions of a user an admin deletes", async () => {
        vi.mocked(User.adminDeleteUser).mockResolvedValue({ user });
        const req: Partial<Request> = { params: { userId: "user-id" } };
        const res = response();

        await UserController.deleteUser(req as Request, res as unknown as Response);

        expect(Session.revokeAll).toHaveBeenCalledWith("user-id");
    });
});
