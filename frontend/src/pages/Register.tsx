import { useState } from "react";
import { useNavigate } from "react-router-dom";
import EmailRegisterForm from "../components/Forms/EmailRegisterForm";
import UserRegisterForm from "../components/Forms/UserRegisterForm";
function Register() {
    const [showUserForm, setShowUserForm] = useState(false);
    const [showEmailForm, setShowEmailForm] = useState(true);
    const navigate = useNavigate();

    const handleEmailVerificationSuccess = () => {
        setShowEmailForm(false);
        setShowUserForm(true);
    }
    
    const handleUserRegistrationSuccess = () => {
        navigate("/login");
    }

    return (
        <div className="p-4 w-full flex flex-col items-center">
            <h1 className="text-2xl font-bold">Register Page</h1>
            {showEmailForm && <EmailRegisterForm onSuccess={handleEmailVerificationSuccess}  />}
            {showUserForm && <UserRegisterForm onSuccess={handleUserRegistrationSuccess}  />}
            <p>Already have an account? <a href="/login" className="text-blue-500">Login here</a></p>
            <p>Forgot your password? <a href="/password-reset" className="text-blue-500">Reset it here</a></p>
        </div>
    );
}

export default Register;