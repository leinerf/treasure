import type { BaseResponse } from "./BaseResponse";

export type Role = "admin" | "user";

export interface User {
    id: string;
    email: string;
    username: string;
    role: Role;
}

export interface UserResponse extends BaseResponse {
    data?: User;
}

export interface UsersResponse extends BaseResponse {
    data?: Pick<User, "id" | "email" | "username">[];
}