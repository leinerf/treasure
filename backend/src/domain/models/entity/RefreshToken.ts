export interface RefreshToken {
    id: string;
    userId: string;
    expiresAt: Date;
    rotatedAt: Date | null;
}
