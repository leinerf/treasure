import PasswordResetForm from "../components/Forms/PasswordResetForm";

function PasswordReset() {
    return (
        <>
            <p>Enter your email to reset your password.</p>
            <p>We will send you an email with instructions to reset your password.</p>
            <PasswordResetForm />
            <p>Don't have an account? <a href="/register" className="text-blue-500">Register here</a></p>
        </>
    );
}

export default PasswordReset;