import { useState, useContext } from "react";
import { BrowserRouter, Routes, Route } from "react-router";
import './assets/styles/index.css'
import AuthMiddleware from './components/middleware/AuthMiddleware'
import Navbar from './components/Navbar'
import UserAuthContext from "./contexts/UserAuthContext";
import Profile from './pages/Profile';
import Login from './pages/Login';
import Register from './pages/Register';
import Logout from './pages/Logout';
import PasswordReset from "./pages/PasswordReset";

function App() {
    const { user: contextUser } = useContext(UserAuthContext);
    const [user, setUser] = useState(contextUser);

    const authenticate = ({username, email, profileImg}: {username?: string, email?: string, profileImg?: File | null}) => {
        if(!username || username.trim() === "" || !email || email.trim() === ""){
            localStorage.setItem("user", JSON.stringify({isAuthenticated: false, username: "", email: ""}));
            setUser({isAuthenticated: false, username: "", email: "", profileImg: null });
        } else {
            // dont save image in localStorage
            localStorage.setItem("user", JSON.stringify({isAuthenticated: true, username, email, profileImg: null}));
            setUser({isAuthenticated: true, username, email, profileImg: profileImg || null})
        }
    }

    return (
        <UserAuthContext value={{user, authenticate}}>
        <BrowserRouter>
        <Navbar />
        <div className="justify-center items-center flex flex-col mt-8">
        <Routes>
            <Route path="/" element={<AuthMiddleware/>}>
                <Route path="profile" element={
                    <Profile />
                } />
                <Route path="logout" element={<Logout />} />
            </Route>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/password-reset" element={<PasswordReset />} />
            <Route path="*" element={<div>404 Not Found</div>} />
        </Routes>
        </div>
        </BrowserRouter>
        </UserAuthContext>
    );
}

export default App;