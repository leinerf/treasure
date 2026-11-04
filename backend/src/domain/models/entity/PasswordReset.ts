export interface PasswordReset {
    id: string;
    email: string;
    code: string;
    expiresAt: Date;
}