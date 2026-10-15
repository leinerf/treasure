import LoginForm from "../components/Forms/LoginForm";
import UserContext from "../contexts/UserAuthContext";
import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
function Login() {
    const navigate = useNavigate();
    const [failedLogin, setFailedLogin] = useState(false);
    const { authenticate } = useContext(UserContext);

    const onSuccess = () => {
        // Handle successful login
        authenticate({
            username: "exampleUsername",
            email: "example@example.com",
            profileImg: null
        });
        navigate("/profile");
    };
    const onFailure = () => {
        // Handle failed login
        setFailedLogin(true);
    };
    return (
        <>
            {failedLogin && <span className="border border-red-500 text-red-500 bg-red-100 p-2 rounded">Login failed. Please try again.</span>}        
            <LoginForm onSuccess={onSuccess} onFailure={onFailure} />
            <p>Don't have an account? <a href="/register" className="text-blue-500">Register here</a></p>
            <p>Forgot your password? <a href="/password-reset" className="text-blue-500">Reset it here</a></p>
        </>
    );
}

export default Login;