import { createContext } from "react";

const localUser = JSON.parse(localStorage.getItem("user") || JSON.stringify({isAuthenticated: false, username: "", email: ""}));
const UserAuthContext = createContext<{user: {isAuthenticated: boolean, username: string, email: string}, login: (username: string) => void}>({
    user: localUser,
    login: () => {}
});

export default UserAuthContext;