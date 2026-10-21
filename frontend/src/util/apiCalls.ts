import axios from "axios";
import config from "./config";

class ApiCalls {
    static async test(): Promise<{ data: {message: string}, status: number }> {
        try {
            const response = await axios.get('/api/test');
            return { data: response.data, status: response.status };
        } catch (error) {
            console.error("Error testing API:", error);
            return { data: {message: "Error testing API"}, status: 500 };
        }
    }
    static async createEmailVerification(email: string): Promise<{ data: {message: string}, status: number }> {
        try {
            const response = await axios.post('/api/auth/create-verification-email', { email });
            return { data: response.data, status: response.status };
        } catch (error) {
            console.error("Error creating email verification:", error);
            return { data: {message: "Error creating email verification"}, status: 500 };
        }
    }
    static async register(data: { username: string, email: string, emailVerificationCode: string, password: string }): Promise<{ data: {message: string}, status: number }> {
        try {
            const response = await axios.post("/api/auth/register", data);
            return { data: response.data, status: response.status };
        } catch (error) {
            console.error("Error registering user:", error);
            return { data: {message: "Error registering user"}, status: 500 };
        }
    }
    static async login(data: {username: string, password: string}): Promise<{ data: {message: string}, status: number }> {
        try {
            const response = await axios.post("/api/auth/login", data, {
                validateStatus: function (status) {
                    return status >= 200;
                }
            });
            return { data: response.data, status: response.status };
        } catch (error) {
            console.error("Error logging in user:", error);
            return { data: {message: "Error logging in user"}, status: 500 };
        }
    }
    static async logout(): Promise<{ data: {message: string}, status: number }> {
        try {
            const response = await axios.post("/api/auth/logout");
            return { data: response.data, status: response.status };
        } catch (error) {
            console.error("Error logging out user:", error);
            return { data: {message: "Error logging out user"}, status: 500 };
        }
    }
    static async getUserData(): Promise<{ data: {username: string, email: string}, status: number }> {
        try {
            const response = await axios.get("/api/user");
            if (!response.data.user) {
                return { data: {username: "", email: ""}, status: 404 };
            }
            const { username, email } = response.data.user
            return { data: { username, email }, status: response.status };
        } catch (error) {
            console.error("Error getting user data:", error);
            return { data: {username: "", email: ""}, status: 500 };
        }
    }

    static async updateUsername(username: string): Promise<{ data: {message: string}, status: number }> {
        try {
            const response = await axios.put("/api/user/username", { newUsername: username });
            return { data: response.data, status: response.status };
        } catch (error) {
            console.error("Error updating username:", error);
            return { data: {message: "Error updating username"}, status: 500 };
        }
    }
    static async updateEmail(email: string): Promise<{ data: {message: string}, status: number }> {
        try {
            const response = await axios.put("/api/user/email", { newEmail: email });
            return { data: response.data, status: response.status };
        } catch (error) {
            console.error("Error updating email:", error);
            return { data: {message: "Error updating email"}, status: 500 };
        }
    }
    static async updatePassword(oldPassword: string, newPassword: string): Promise<{ data: {message: string}, status: number }> {
        try {
            const response = await axios.put("/api/user/password", { oldPassword, newPassword });
            return { data: response.data, status: response.status };
        } catch (error) {
            console.error("Error updating password:", error);
            return { data: {message: "Error updating password"}, status: 500 };
        }
    }

    static async createPasswordReset(email: string): Promise<{ data: {message: string}, status: number }> {
        try {
            const url = config.BASE_URL;
            const response = await axios.post("/api/auth/create-password-reset", { email, url });
            return { data: response.data, status: response.status };
        } catch (error) {
            console.error("Error creating password reset:", error);
            return { data: {message: "Error creating password reset"}, status: 500 };
        }
    }

    static async resetPassword(id: string, newPassword: string): Promise<{ data: {message: string}, status: number }> {
        try {
            const response = await axios.post(`/api/auth/reset-password/${id}`, { newPassword });
            return { data: response.data, status: response.status };
        } catch (error) {
            console.error("Error resetting password:", error);
            return { data: {message: "Error resetting password"}, status: 500 };
        }
    }
}

export default ApiCalls;