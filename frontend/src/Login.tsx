import { useState } from "react";
import Form from "./Form";
import {useLocation, useNavigate} from "react-router-dom";
import ApiCalls from "./services/apiCalls";

function Login() {
    const [formData, setFormData] = useState<Record<string, string[]>>({
        username:["Username", "text", "john_doe", ""],
        password:["Password", "password", "secret123", ""]
    });

    const navigate = useNavigate();
    const location = useLocation();
    const registerComplete = location.state?.registerComplete;

    const successfulRegistrationMessage = () => {
        return (            
            <div className="bg-green-100 rounded-lg border-2 border-solid  border-green-500 text-green-700 px-4 py-3 m-4" role="alert">
                <p className="font-bold">Successful Registration</p>
                <p className="text-sm">You have successfully registered. You can now log in.</p>
            </div>
        );
    }

    const submitHandler = async () => {
        const username = formData.username[3];
        const password = formData.password[3];
        const { data, status } = await ApiCalls.login({ username, password });
        if(status === 200) {
            localStorage.setItem("authenticated", "true");
            navigate("/profile")
        } else {
            console.error("Login failed:", data.message);
        }
    }

    return (
        <>
        {registerComplete && successfulRegistrationMessage()}
            <Form title="Login" data={formData} setData={setFormData} handleSubmit={submitHandler} />
        </>
    );
}

export default Login;