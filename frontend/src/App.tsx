import { useState, useContext } from "react";
import { BrowserRouter, Routes, Route } from "react-router";
import './assets/styles/index.css'
import Navbar from './components/Navbar'
import UserAuthContext from "./contexts/UserAuthContext";
import Profile from './pages/Profile';
import Login from './pages/Login';
import Register from './pages/Register';
import Logout from './pages/Logout';
import PasswordReset from "./pages/PasswordReset";
import dogProfile from "./assets/images/dog_profile.jpg"
import type { userInterface } from "./contexts/UserAuthContext";

function App() {
    const { user: contextUser } = useContext(UserAuthContext);
    const [user, setUser] = useState<userInterface | null>(contextUser);

    const authenticate = ({username, email, profileImg}: {username?: string, email?: string, profileImg?: File | string}) => {
        localStorage.setItem("user", JSON.stringify({ 
            username: username || user?.username || "", 
            email: email || user?.email || "", 
            profileImg: profileImg || dogProfile, 
            exp: user?.exp || new Date(Date.now() + 1000 * 60 * 60 * 3)
        }));

        setUser({ 
            username: username || user?.username || "", 
            email: email || user?.email || "", 
            profileImg: profileImg || user?.profileImg || dogProfile, 
            exp: user?.exp || new Date(Date.now() + 1000 * 60 * 60 * 3) 
        })
    }

    const logout = () => {
        localStorage.setItem("user", JSON.stringify(null));
        setUser(null);
    }
    
    if(user && new Date(user.exp) < new Date()){    
        logout();
    }

    return (
        <UserAuthContext value={{user, authenticate, logout}}>
            <BrowserRouter>
                <Navbar />
                <div className="justify-center items-center flex flex-col mt-8">
                    <Routes>
                        {user && (<>
                            <Route path="/" element={<Profile /> } />
                            <Route path="profile" element={<Profile /> } />
                            <Route path="logout" element={<Logout />} />    
                        </>)}
                        {!user && (
                            <>
                                <Route path="/" element={<Login />} />
                                <Route path="/login" element={<Login />} />
                                <Route path="/register" element={<Register />} />
                                <Route path="/password-reset" element={<PasswordReset />} />
                            </>
                        )}
                        <Route path="*" element={<div>404 Not Found</div>} />
                    </Routes>
                </div>
            </BrowserRouter>
        </UserAuthContext>
)}

export default App;