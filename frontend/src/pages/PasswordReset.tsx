import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PasswordResetForm from "../components/Forms/PasswordResetForm";
import NewPasswordForm from "../components/Forms/NewPasswordForm";
import ErrorMessage from "../components/ErrorMessage";

function PasswordReset() {
    const navigate = useNavigate();
    const [showPasswordResetForm, setShowPasswordResetForm] = useState(true);
    const [showNewPasswordForm, setShowNewPasswordForm] = useState(false);
    const [error, setError] = useState<string| null>(null);

    const handlePasswordResetSuccess = () => {
        setShowPasswordResetForm(false);
        setShowNewPasswordForm(true);
    };

    const handleNewPasswordSuccess = () => {
        navigate("/login");
    };
    const handleFailure = (error?: string) => {
        setError(error ?? null);
    };
    
    return (
        <>
            <ErrorMessage message={error} />
            <p>Enter your email to reset your password.</p>
            <p>We will send you an email with instructions to reset your password.</p>
            {showPasswordResetForm && <PasswordResetForm onSuccess={handlePasswordResetSuccess} onFailure={handleFailure} />}
            {showNewPasswordForm && <NewPasswordForm onSuccess={handleNewPasswordSuccess} onFailure={handleFailure} />}
            <p>Don't have an account? <a href="/register" className="text-blue-500">Register here</a></p>
        </>
    );
}

export default PasswordReset;