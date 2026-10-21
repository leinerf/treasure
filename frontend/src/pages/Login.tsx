import LoginForm from "../components/Forms/LoginForm";
import UserContext from "../contexts/UserAuthContext";
import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import apiCalls from "../util/apiCalls";
function Login() {
    const navigate = useNavigate();
    const { authenticate } = useContext(UserContext);
    const onSuccess = async  () => {
        // Handle successful login
        const { data, status } = await apiCalls.getUserData()
        if(status !== 200) {
            authenticate({username: "", email: "", profileImg: null});
            return;
        }
        authenticate({
            username: data.username,
            email: data.email,
            profileImg: null,
        });
        navigate("/profile");
    };
    const onFailure = () => {
        authenticate({username: "", email: "", profileImg: null});
    };
    return (
        <>
            <LoginForm onSuccess={onSuccess} onFailure={onFailure} />
            <p>Don't have an account? <a href="/register" className="text-blue-500">Register here</a></p>
            <p>Forgot your password? <a href="/password-reset" className="text-blue-500">Reset it here</a></p>
        </>
    );
}

export default Login;