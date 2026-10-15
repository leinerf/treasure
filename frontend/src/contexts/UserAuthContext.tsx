import { createContext } from "react";

const localUser = JSON.parse(localStorage.getItem("user") || JSON.stringify({isAuthenticated: false, username: "", email: "", profileImg: null}));
const UserAuthContext = createContext<{user: {isAuthenticated: boolean, username: string, email: string, profileImg: File | null }, authenticate: (user: {username: string, email: string, profileImg: File | null}) => void}>({
    user: localUser,
    authenticate: () => {}
});

export default UserAuthContext;