export type Role = "admin" | "user";

export type userInterface = {
    username: string,
    email: string,
    profileImg: File | string,
    exp: Date ,
    role: Role
}
