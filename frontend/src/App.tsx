import { useState, useContext, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import './assets/styles/index.css'
import Navbar from './components/Navbar'
import UserAuthContext from "./contexts/UserAuthContext";
import Profile from './pages/Profile';
import { Admin } from './pages/Admin';
import Login from './pages/Login';
import Register from './pages/Register';
import Logout from './pages/Logout';
import PasswordReset from "./pages/PasswordReset";
import type { Role } from "./api/internalAPI/interfaces/UserResponse";
import type { UserAuth } from "./contexts/UserAuthContext";
import { InternalAPI } from "./api/internalAPI/InternalAPI";
import DogProfile from "./assets/images/dog_profile.jpg"
function App() {
    const { user: contextUser } = useContext(UserAuthContext);
    const [user, setUser] = useState<(UserAuth | null)>(contextUser);

    const authenticate = ({username, email, role, profile}: {username?: string, email?: string, role?: Role, profile?: File | string}) => {
        setUser({ 
            username: username || user?.username || "", 
            email: email || user?.email || "", 
            role: role || user?.role || "user",
            profile: profile || user?.profile || DogProfile
        })
    }

    const logout = () => {
        setUser(null);
    }

    useEffect(() => {
        const getUser = async () => {
            const { data, status } = await InternalAPI.getUserData();
            if (status !== 200) {
                logout();
                return;
            }
            const { file, status: fileStatus } = await InternalAPI.getProfilePicture()
            const profile = fileStatus === 200 ? file : DogProfile
            authenticate({username: data?.username, email: data?.email, role: data?.role, profile})
        }
        getUser();
    }, [contextUser]);
    
    return (
        <UserAuthContext value={{user, authenticate, logout}}>
            <BrowserRouter>
                <Navbar />
                <div className="justify-center items-center flex flex-col mt-8">
                    <Routes>
                        {user && (<>
                            <Route path="profile" element={<Profile /> } />
                            <Route path="logout" element={<Logout />} />    
                            {user.role === "admin" &&
                            <Route path="admin" element={<Admin />} />
                            }
                            <Route path="*" element={<Navigate to="/profile" />} />
                        </>)}

                        {!user && (
                            <>
                                <Route path="/login" element={<Login />} />
                                <Route path="/register" element={<Register />} />
                                <Route path="/password-reset" element={<PasswordReset />} />
                                <Route path="*" element={<Navigate to="/login" />} />
                            </>
                        )}
                        
                    </Routes>
                </div>
            </BrowserRouter>
        </UserAuthContext>
)}

export default App;