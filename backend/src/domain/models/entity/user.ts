export enum Role {
    Admin = "admin",
    User = "user"
}

export interface User {
    id: string;
    username: string;
    email: string;
    password: string;
    role?: Role;
}