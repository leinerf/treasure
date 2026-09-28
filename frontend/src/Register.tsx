import { useState, useEffect } from "react";
import Form from "./Form";
import VerificationCode from "./verificationCode";
import ApiCalls from "./services/apiCalls";
import {useNavigate} from "react-router-dom";
function Register() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState<Record<string, string[]>>({
        username:["Username", "text", "john_doe", ""],
        email:["Email", "email", "john@example.com", ""],
        password:["Password", "password", "secret123", ""],
        confirmPassword:["Confirm Password", "password", "secret123", ""]
    });

    const [showVerificationCode, setShowVerificationCode] = useState(false);
    const [verificationComplete, setVerificationComplete] = useState(false);
    
    const registerUser = async () => {
        const { data, status } = await ApiCalls.register({
            username: formData.username[3],
            email: formData.email[3],
            password: formData.password[3]
        });
        if(status !== 200){
            console.error("Error registering user", data.message);
            return;
        }
        navigate("/login", { state: { registerComplete: true } });
    };

    useEffect(() => {
        if(verificationComplete){
            registerUser();
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setVerificationComplete(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [verificationComplete])
    
    const createEmailVerification = async (email: string) => {
        const { data, status } = await ApiCalls.createEmailVerification(email);
        return { data, status };
    }

    const verifyEmail = async ({email, code}: {email: string, code: string}) => {
        const { data, status } = await ApiCalls.verifyEmail(email, code);
        return { data, status };
    }

    const formSubmitHandler = async () => {
            const email = formData.email[3];
            const { data: emailVerificationData, status: emailVerificationStatus } = await createEmailVerification(email);
            if(emailVerificationStatus !== 200){
                console.error("Error creating email verification", emailVerificationData.message)
                return
            }
            setShowVerificationCode(true);
        }

    const verifyHandler = async (code: string) => {
        const email = formData.email[3];
        const { data, status } = await verifyEmail({email, code});
        if(status !== 200){
            console.error("Error verifying email", data.message);
            return;
        }
        setShowVerificationCode(false);
        setVerificationComplete(true);
    }

    const resendHandler = async () => {
        const email = formData.email[3];
        const { data, status } = await createEmailVerification(email);
        if(status !== 200){
            console.error("Error resending email verification", data.message);
        }
    }
    return (
        <>
        <Form title="Register" data={formData} setData={setFormData} handleSubmit={formSubmitHandler} />
        {showVerificationCode && <VerificationCode verifyHandler={verifyHandler} resendHandler={resendHandler} />}
        </>
    );
}

export default Register;