import LoginForm from "../components/Forms/LoginForm";
import UserContext from "../contexts/UserAuthContext";
import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { InternalAPI } from "../api/internalAPI/InternalAPI";
import ErrorMessage from "../components/ErrorMessage";
import dogProfile from "../assets/images/dog_profile.jpg"

function Login() {
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();
    const { authenticate, logout } = useContext(UserContext);
    const onSuccess = async  () => {
        // Handle successful login
        const { data, status, error } = await InternalAPI.getUserData()
        const { file } = await InternalAPI.getProfilePicture();
        if(!data || status !== 200) {
            logout()
            setError(error ?? null);
            return;
        }
        authenticate({
            username: data.username,
            email: data.email,
            profile: file ?? dogProfile,
        });
        navigate("/profile");
    };
    const onFailure = (error?: string) => {
        setError(error ?? null);
        logout();
    };
    return (
        <>
            <ErrorMessage message={error} />
            <LoginForm onSuccess={onSuccess} onFailure={onFailure} />
            <p>Don't have an account? <a href="/register" className="text-blue-500">Register here</a></p>
            <p>Forgot your password? <a href="/password-reset" className="text-blue-500">Reset it here</a></p>
        </>
    );
}

export default Login;