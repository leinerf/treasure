import LoginForm from "../components/Forms/LoginForm";
import UserContext from "../contexts/UserAuthContext";
import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import apiCalls from "../api/internalAPI/apiCalls";
import ErrorMessage from "../components/ErrorMessage";
function Login() {
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();
    const { authenticate } = useContext(UserContext);
    const onSuccess = async  () => {
        // Handle successful login
        const { data, status, error } = await apiCalls.getUserData()
        if(!data || status !== 200) {
            authenticate({username: "", email: "", profileImg: null});
            setError(error ?? null);
            return;
        }
        authenticate({
            username: data.username,
            email: data.email,
            profileImg: null,
        });
        navigate("/profile");
    };
    const onFailure = (error?: string) => {
        setError(error ?? null);
        authenticate({username: "", email: "", profileImg: null});
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