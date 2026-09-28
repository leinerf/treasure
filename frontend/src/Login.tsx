import { useState } from "react";
import Form from "./Form";
import {useLocation} from "react-router-dom";

function Login() {
    const [formData, setFormData] = useState<Record<string, string[]>>({
        username:["Username", "text", "john_doe", ""],
        email:["Email", "email", "john@example.com", ""],
        password:["Password", "password", "secret123", ""]
    });

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
    return (
        <>
        {registerComplete && successfulRegistrationMessage()}
            <Form title="Login" data={formData} setData={setFormData} handleSubmit={() => {
                console.log("Form submitted with data:", formData);
            }} />
        </>
    );
}

export default Login;