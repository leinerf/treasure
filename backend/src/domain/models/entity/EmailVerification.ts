export interface EmailVerification {
    id: string;
    email: string;
    code: string;
    expiresAt: Date;
}