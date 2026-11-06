import { createContext } from "react";

export type userInterface = {
    username: string,
    email: string,
    profileImg: File | string,
    exp: Date 
}

const localUser: userInterface | null = JSON.parse(localStorage.getItem("user") || "null");
const UserAuthContext = createContext<{ user: userInterface | null, authenticate: (user: { [key in keyof userInterface]?: userInterface[key] }) => void, logout: () => void}>({
    user: localUser,
    authenticate: () => {},
    logout: () => {}
});

export default UserAuthContext;