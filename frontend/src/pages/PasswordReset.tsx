import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PasswordResetForm from "../components/Forms/PasswordResetForm";
import NewPasswordForm from "../components/Forms/NewPasswordForm";
function PasswordReset() {
    const navigate = useNavigate();
    const [showPasswordResetForm, setShowPasswordResetForm] = useState(true);
    const [showNewPasswordForm, setShowNewPasswordForm] = useState(false);
    return (
        <>
            <p>Enter your email to reset your password.</p>
            <p>We will send you an email with instructions to reset your password.</p>
            {showPasswordResetForm && <PasswordResetForm onSuccess={() => {
                setShowPasswordResetForm(false);
                setShowNewPasswordForm(true);
            }} />}
            {showNewPasswordForm && <NewPasswordForm onSuccess={() => {
                navigate("/login");
            }} />}
            <p>Don't have an account? <a href="/register" className="text-blue-500">Register here</a></p>
        </>
    );
}

export default PasswordReset;