import { useState } from "react";
import { useNavigate } from "react-router-dom";
import EmailRegisterForm from "../components/Forms/EmailRegisterForm";
import UserRegisterForm from "../components/Forms/UserRegisterForm";
import ErrorMessage from "../components/ErrorMessage";

function Register() {
    const [showUserForm, setShowUserForm] = useState(false);
    const [showEmailForm, setShowEmailForm] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleEmailVerificationSuccess = () => {
        setShowEmailForm(false);
        setShowUserForm(true);
        setError(null);
    }
    
    const handleOnFailure = (error?: string) => {
        setError(error ?? null);
    }
    const handleUserRegistrationSuccess = () => {
        navigate("/login");
    }

    return (
        <div className="p-4 w-full flex flex-col items-center">
            <ErrorMessage message={error} />
            <h1 className="text-2xl font-bold">Register Page</h1>
            {showEmailForm && <EmailRegisterForm onSuccess={handleEmailVerificationSuccess} onFailure={handleOnFailure} />}
            {showUserForm && <UserRegisterForm onSuccess={handleUserRegistrationSuccess}  onFailure={handleOnFailure} />}
            <p>Already have an account? <a href="/login" className="text-blue-500">Login here</a></p>
            <p>Forgot your password? <a href="/password-reset" className="text-blue-500">Reset it here</a></p>
        </div>
    );
}

export default Register;