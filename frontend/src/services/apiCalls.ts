import axios from "axios";

class ApiCalls {

    static async createEmailVerification(email: string): Promise<{ data: {message: string}, status: number }> {
        try {
            const response = await axios.post('/api/auth/create-verification-email', { email });
            return { data: response.data, status: response.status };
        } catch (error) {
            console.error("Error creating email verification:", error);
            return { data: {message: "Error creating email verification"}, status: 500 };
        }
    }

    static async verifyEmail(email: string, code: string): Promise<{ data: {message: string}, status: number }> {
        try {
            const response = await axios.post("/api/auth/verify-email", { email, code });
            return { data: response.data, status: response.status };
        } catch (error) {
            console.error("Error verifying email:", error);
            return { data: {message: "Error verifying email"}, status: 500 };
        }
    }

    static async register(data: { username: string, email: string, password: string }): Promise<{ data: {message: string}, status: number }> {
        try {
            const response = await axios.post("/api/auth/register", data);
            return { data: response.data, status: response.status };
        } catch (error) {
            console.error("Error registering user:", error);
            return { data: {message: "Error registering user"}, status: 500 };
        }
    }
}

export default ApiCalls;