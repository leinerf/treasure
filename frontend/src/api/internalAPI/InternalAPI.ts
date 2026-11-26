import axios, { type InternalAxiosRequestConfig } from "axios";
import type { ProfilePhotoResponse } from "./interfaces/ProfilePhotoResponse";
import type { SimpleResponse } from "./interfaces/SimpleResponse";
import type { UserResponse, UsersResponse } from "./interfaces/UserResponse";

type RetriableRequest = InternalAxiosRequestConfig & { _retried?: boolean; _sessionVersion?: number };

export class InternalAPI {
    private static accessToken: string | null = null;
    private static sessionVersion = 0;
    private static refreshRequest: { version: number; promise: Promise<string | null> } | null = null;
    private static unauthorizedHandler: (() => void) | null = null;
    private static api = axios.create({
        baseURL: "/api",
        validateStatus: function (status) {
            return status >= 200;
        }
    });

    static {
        this.api.interceptors.request.use((request) => {
            const retriable: RetriableRequest = request;
            retriable._sessionVersion ??= this.sessionVersion;
            if (!request.url?.startsWith("/auth/") && this.accessToken) {
                request.headers.set("Authorization", `Bearer ${this.accessToken}`);
            }
            return request;
        });
        this.api.interceptors.response.use(async (response) => {
            const request: RetriableRequest = response.config;
            if (response.status !== 401 || request.url?.startsWith("/auth/") || request._sessionVersion !== this.sessionVersion) {
                return response;
            }
            if (request._retried) {
                if (request.headers.get("Authorization") === `Bearer ${this.accessToken}`) {
                    this.expireSession();
                }
                return response;
            }
            request._retried = true;
            const sentToken = request.headers.get("Authorization");
            const token = this.accessToken && sentToken !== `Bearer ${this.accessToken}`
                ? this.accessToken
                : await this.refreshAccessToken();
            if (!token) {
                return response;
            }
            request.headers.set("Authorization", `Bearer ${token}`);
            return this.api.request(request);
        });
    }

    static setUnauthorizedHandler(handler: (() => void) | null): void {
        this.unauthorizedHandler = handler;
    }

    static clearSession(): void {
        this.sessionVersion++;
        this.accessToken = null;
    }

    private static expireSession(): void {
        this.clearSession();
        this.unauthorizedHandler?.();
    }

    private static refreshAccessToken(): Promise<string | null> {
        const version = this.sessionVersion;
        if (this.refreshRequest?.version === version) {
            return this.refreshRequest.promise;
        }
        const promise = this.api.post("/auth/refresh-token").then((response) => {
            if (version !== this.sessionVersion) {
                return null;
            }
            if (response.status === 401 || response.status === 403) {
                this.expireSession();
                return null;
            }
            if (response.status !== 200 || typeof response.data?.accessToken !== "string" || !response.data.accessToken) {
                throw new Error(`Failed to refresh access token (status ${response.status})`);
            }
            this.accessToken = response.data.accessToken;
            return this.accessToken;
        }).finally(() => {
            if (this.refreshRequest?.promise === promise) {
                this.refreshRequest = null;
            }
        });
        this.refreshRequest = { version, promise };
        return promise;
    }

    static async test(): Promise<SimpleResponse> {
        try {
            const response = await InternalAPI.api.get('/test');
            const { message, error } = response.data;
            const status = response.status;
            return { message, status, error };
        } catch (error) {
            console.error("Error testing API:", error);
            return { error: "Error Requesting Test API", status: 500 };
        }
    }
    static async createEmailVerification(email: string): Promise<SimpleResponse> {
        try {
            const response = await InternalAPI.api.post('/auth/create-verification-email', { email });
            const { message, error } = response.data;
            const status = response.status;
            return { message, status, error };
        } catch (error) {
            console.error("Error creating email verification:", error);
            return { error: "Error Requesting Email Verification", status: 500 };
        }
    }
    static async register(data: { username: string, email: string, emailVerificationCode: string, password: string }): Promise<SimpleResponse> {
        try {
            const response = await InternalAPI.api.post("/auth/register", data);
            const { message, error } = response.data;
            const status = response.status;
            return { message, status, error };
        } catch (error) {
            console.error("Error registering user:", error);
            return { error: "Error registering user", status: 500 };
        }
    }
    static async login(data: {username: string, password: string}): Promise<SimpleResponse> {
        try {
            const response = await InternalAPI.api.post("/auth/login", data, {
                validateStatus: function (status) {
                    return status >= 200;
                }
            });
            const { message, error } = response.data;
            const status = response.status;
            if (status === 200) {
                if (typeof response.data?.accessToken !== "string" || !response.data.accessToken) {
                    console.error("Access token missing from login response");
                    return { error: "Access token missing from login response", status: 500 };
                }
                InternalAPI.sessionVersion++;
                InternalAPI.accessToken = response.data.accessToken;
            }
            return { message, status, error };
        } catch (error) {
            console.error("Error logging in user:", error);
            return { error: "Error logging in user", status: 500 };
        }
    }
    static async logout(): Promise<SimpleResponse> {
        InternalAPI.clearSession();
        try {
            const response = await InternalAPI.api.post("/auth/logout");
            const { message, error } = response.data;
            const status = response.status;
            return { message, status, error };
        } catch (error) {
            console.error("Error logging out user:", error);
            return { error: "Error logging out user", status: 500 };
        }
    }
    static async getUserData(): Promise<UserResponse> {
        try {
            const response = await InternalAPI.api.get("/user");
            const { user, message, error } = response.data;
            const status = response.status;
            return { data: user, message, status, error };
        } catch (error) {
            console.error("Error getting user data:", error);
            return { error: "Error getting user data", status: 500 };
        }
    }
    static async getUsers(offset: number, limit: number): Promise<UsersResponse> {
        try {
            const response = await InternalAPI.api.get("/user/all", { params: { offset, limit } });
            const { users, count, message, error } = response.data;
            const status = response.status;
            return { data: users, count, message, status, error };
        } catch (error) {
            console.error("Error getting users:", error);
            return { error: "Error getting users", status: 500 };
        }
    }

    static async updateUsername(username: string): Promise<UserResponse> {
        try {
            const response = await InternalAPI.api.put("/user/username", { newUsername: username });
            const { user, message, error } = response.data;
            const status = response.status;
            return { data: user, message, status, error };
        } catch (error) {
            console.error("Error updating username:", error);
            return { error: "Error updating username", status: 500 };
        }
    }
    
    static async searchUser(query: string): Promise<UsersResponse> {
        try {
            const response = await InternalAPI.api.get("/user/search", { params: { query } });
            const { users, count, message, error } = response.data;
            const status = response.status;
            return { data: users, count, message, status, error };
        } catch (error) {
            console.error("Error searching users:", error);
            return { error: "Error searching users", status: 500 };
        }
    }
    
    static async deleteUser(userId: string): Promise<SimpleResponse> {
        try {
            const response = await InternalAPI.api.delete(`/user/${userId}`);
            const { message, error } = response.data;
            const status = response.status;
            return { message, status, error };
        } catch (error) {
            console.error("Error deleting user:", error);
            return { error: "Error deleting user", status: 500 };
        }
    }

    static async updateEmail(newEmail: string, emailVerificationCode: string, currentPassword: string): Promise<UserResponse> {
        try {
            const response = await InternalAPI.api.put("/user/email", { newEmail, emailVerificationCode, currentPassword });
            const { user, message, error } = response.data;
            const status = response.status;
            return { data: user, message, status, error };
        } catch (error) {
            console.error("Error updating email:", error);
            return { error: "Error updating email", status: 500 };
        }
    }
    static async updatePassword(oldPassword: string, newPassword: string): Promise<UserResponse> {
        try {
            const response = await InternalAPI.api.put("/user/password", { oldPassword, newPassword });
            const { user, message, error } = response.data;
            const status = response.status;
            return { data: user, message, status, error };
        } catch (error) {
            console.error("Error updating password:", error);
            return { error: "Error updating password", status: 500 };
        }
    }

    static async createPasswordReset(email: string): Promise<SimpleResponse> {
        try {
            const response = await InternalAPI.api.post("/auth/create-password-reset", { email });
            const { message, error } = response.data;
            const status = response.status;
            return { message, status, error };
        } catch (error) {
            console.error("Error creating password reset:", error);
            return { error: "Error creating password reset", status: 500 };
        }
    }

    static async resetPassword(token: string, newPassword: string): Promise<SimpleResponse> {
        try {
            const response = await InternalAPI.api.post("/auth/reset-password", { token, newPassword });
            const { message, error } = response.data;
            const status = response.status;
            return { message, status, error };
        } catch (error) {
            console.error("Error resetting password:", error);
            return { error: "Error resetting password", status: 500 };
        }
    }

    static async uploadProfilePicture(file: File): Promise<ProfilePhotoResponse> {
        try {
            const formData = new FormData();
            formData.append("profile", file);
            const response = await InternalAPI.api.post("/user/profile-picture", formData);
            const { photoMetadata, message, error, photoBlob } = response.data;
            const status = response.status;
            return { photoMetadata: { ...photoMetadata, blob: photoBlob }, message, status, error };
        } catch (error) {
            console.error("Error uploading profile picture:", error);
            return { error: "Error uploading profile picture", status: 500 };
        }
    }

    static async getProfilePicture(): Promise<{ file?: File; status: number; error?: string }> {
        try {
            const response = await InternalAPI.api.get("/user/profile-picture", { responseType: "blob" });
            const file = response.data;
            const status = response.status;
            return {  file: new File([file], "profile-picture"), status };
        } catch (error) {
            console.error("Error getting profile picture:", error);
            return { error: "Error getting profile picture", status: 500 };
        }
    }

    static async uploadProfilePictureToAWS(file: File): Promise<SimpleResponse> {   
        try {
            const formData = new FormData();
            formData.append("profile", file);
            const response = await InternalAPI.api.post("/user/profile-picture/aws", formData);
            const { message, error } = response.data;
            const status = response.status;
            return { message, status, error };
        } catch (error) {
            console.error("Error uploading profile picture to AWS:", error);
            return { error: "Error uploading profile picture to AWS", status: 500 };
        }
    }

    static async getProfilePictureFromAWS(): Promise<{ url?: string; status: number; error?: string }> {
        try {
            const response = await InternalAPI.api.get("/user/profile-picture/aws");
            const { url } = response.data;
            const status = response.status;
            return { url, status };
        } catch (error) {
            console.error("Error getting profile picture from AWS:", error);
            return { error: "Error getting profile picture from AWS", status: 500 };
        }
    }
}