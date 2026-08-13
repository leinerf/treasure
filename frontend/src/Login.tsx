import { useState } from "react";
import Form from "./Form";

function Login() {
    const [formData, setFormData] = useState<Record<string, string[]>>({
        username:["Username", "text", "john_doe", ""],
        email:["Email", "email", "john@example.com", ""],
        password:["Password", "password", "secret123", ""]
    });
    return (
        <Form title="Login" data={formData} setData={setFormData} handleSubmit={() => {
            console.log("Form submitted with data:", formData);
        }} />
    );
}

export default Login;