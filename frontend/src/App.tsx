import { useState, useContext } from "react";
import { BrowserRouter, Routes, Route } from "react-router";
import Dropdown from "./components/Dropdown";
import Container from "./components/Container";
import PasswordReset from './PasswordReset';
import CreatePasswordReset from './CreatePasswordReset';
import './assets/styles/index.css'
import Home from './Home'
import Root from './Root'
import Navbar from './components/Navbar'
import Profile from './Profile';
import Login from './Login';
import Register from './Register';
import Logout from './Logout';
import AccountSetting from './AccountSetting';
import UserAuthContext from "./contexts/UserAuthContext";
import UserRegisterForm from "./components/UserRegisterForm";
import EmailRegisterForm from "./components/EmailRegisterForm";
function App() {
    const { user: contextUser } = useContext(UserAuthContext);
    const [user, setUser] = useState(contextUser);

    const login = (username: string) => {
        if(!username || username.trim() === ""){
            localStorage.setItem("user", JSON.stringify({isAuthenticated: false, username: ""}));
            setUser({isAuthenticated: false, username: ""});
        } else {
            localStorage.setItem("user", JSON.stringify({isAuthenticated: true, username}));
            setUser({isAuthenticated: true, username})
        }
    }

    return (
        <UserAuthContext value={{user, login}}>
        <BrowserRouter>
        <Navbar />
        <div className="justify-center items-center flex flex-col mt-8">
        <Routes>
            <Route path="/" element={<Root/>}>
                <Route index element={<Home />} />
                <Route path="profile" element={
                    <Profile />
                } />
                <Route path="logout" element={<Logout />} />
                <Route path="account-settings" element={<AccountSetting />} />
                <Route path="store" element={<div>Store</div>} />
            </Route>
            
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/create-password-reset" element={<CreatePasswordReset />} />
            <Route path="/reset-password/:id" element={<PasswordReset />} />
            <Route path="/test" element={<UserRegisterForm/>} />
            <Route path="/test-email" element={<EmailRegisterForm/>} />
            <Route path="/test-container" element={<Container><Dropdown title="Test Dropdown" items={[{name: "Item 1", link: "/item1"}, {name: "Item 2", link: "/item2"}, {name: "Item 3", link: "/item3"}]} /></Container>} />
            <Route path="*" element={<div>404 Not Found</div>} />
        </Routes>
        </div>
        </BrowserRouter>
        </UserAuthContext>
    );
}

export default App;