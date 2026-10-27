import type { BaseResponse } from "./BaseResponse";

export interface User {
    id: string;
    email: string;
    username: string;
}

export interface UserResponse extends BaseResponse {
    data?: User;
}