import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PasswordResetForm from "../components/Forms/PasswordResetForm";
import NewPasswordForm from "../components/Forms/NewPasswordForm";
import ErrorMessage from "../components/ErrorMessage";
import SuccessMessage from "../components/SuccessMessage";

// Reset emails link to /password-reset#token=<token>. The token is in the URL fragment,
// which the browser never sends to a server.
function readTokenFromHash(): string | null {
    const token = new URLSearchParams(window.location.hash.slice(1)).get("token");
    return token ? token : null;
}

function PasswordReset() {
    const navigate = useNavigate();
    const [token] = useState(readTokenFromHash);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    useEffect(() => {
        // Keep the token out of the address bar and browser history once it has been read.
        if (window.location.hash) {
            window.history.replaceState(window.history.state, "", window.location.pathname + window.location.search);
        }
    }, []);

    const handleResetRequested = (message?: string) => {
        setError(null);
        setMessage(message ?? "If an account uses that email, a password reset link has been sent.");
    };

    const handleNewPasswordSuccess = () => {
        navigate("/login");
    };
    const handleFailure = (error?: string) => {
        setMessage(null);
        setError(error ?? null);
    };

    if (token) {
        return (
            <>
                <ErrorMessage message={error} />
                <p>Choose a new password for your account.</p>
                <NewPasswordForm token={token} onSuccess={handleNewPasswordSuccess} onFailure={handleFailure} />
                <p>Link not working? <a href="/password-reset" className="text-blue-500">Request a new one</a></p>
            </>
        );
    }

    return (
        <>
            <ErrorMessage message={error} />
            <SuccessMessage message={message} />
            <p>Enter your email to reset your password.</p>
            <p>We will email you a link to reset your password. The link expires in 30 minutes.</p>
            {!message && <PasswordResetForm onSuccess={handleResetRequested} onFailure={handleFailure} />}
            <p>Don't have an account? <a href="/register" className="text-blue-500">Register here</a></p>
        </>
    );
}

export default PasswordReset;
