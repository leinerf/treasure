import { createContext } from "react";
import type { User} from "../api/internalAPI/interfaces/UserResponse";

export interface UserAuth extends Omit<User, "id"> {
    profile?: File | string
}

const localUser: UserAuth | null = null
const UserAuthContext = createContext<{ user: UserAuth | null, authenticate: (user: Partial<UserAuth>) => void, logout: () => void}>({
    user: localUser,
    authenticate: () => {},
    logout: () => {}
});

export default UserAuthContext; 