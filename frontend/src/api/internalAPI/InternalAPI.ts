import axios from "axios";
import config from "../../util/config";
import type { SimpleResponse } from "./interfaces/SimpleResponse";
import type { UserResponse } from "./interfaces/UserResponse";

export class InternalAPI {
    private static api = axios.create({
        baseURL: "/api",
        validateStatus: function (status) {
            return status >= 200;
        }
    });
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
            return { message, status, error };
        } catch (error) {
            console.error("Error logging in user:", error);
            return { error: "Error logging in user", status: 500 };
        }
    }
    static async logout(): Promise<SimpleResponse> {
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
    static async updateEmail(newEmail: string, emailVerificationCode: string): Promise<UserResponse> {
        try {
            const response = await InternalAPI.api.put("/user/email", { newEmail, emailVerificationCode });
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
            const url = config.BASE_URL;
            const response = await InternalAPI.api.post("/auth/create-password-reset", { email, url });
            const { message, error } = response.data;
            const status = response.status;
            return { message, status, error };
        } catch (error) {
            console.error("Error creating password reset:", error);
            return { error: "Error creating password reset", status: 500 };
        }
    }

    static async resetPassword(id: string, newPassword: string): Promise<SimpleResponse> {
        try {
            const response = await InternalAPI.api.post(`/auth/reset-password/${id}`, { newPassword });
            const { message, error } = response.data;
            const status = response.status;
            return { message, status, error };
        } catch (error) {
            console.error("Error resetting password:", error);
            return { error: "Error resetting password", status: 500 };
        }
    }
}