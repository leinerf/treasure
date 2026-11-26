export interface PasswordReset {
    id: string;
    userId: string;
    email: string;
    tokenHash: string;
    createdAt: Date;
    expiresAt: Date;
}
