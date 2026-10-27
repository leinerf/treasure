import {useState} from "react";
import EmailInput from "./Inputs/EmailInput";
import Form from "./Form";
import { regexInputConfig } from "./Inputs/regexInputConfig";
import apiCalls from "../../api/internalAPI/apiCalls";
// Call onSuccess during successful submission
function EmailRegisterForm({onSuccess, onFailure}: {onSuccess?: (message?: string) => void, onFailure?: (error?: string) => void}) {
    const [email, setEmail] = useState(""); 
    const [isEmailValid, setIsEmailValid] = useState(true); 

    const submit = {
        submitFunction: async (e: React.SyntheticEvent) => { 
            e.preventDefault();
            if (!regexInputConfig.email.regex.test(email)) {
                setIsEmailValid(false);
                return;
            }
            // Proceed with email verification logic here
            const { message, status, error } = await apiCalls.createEmailVerification(email);
            // Call the onSuccess callback if provided 
            if(status === 200 && onSuccess) {
                onSuccess(message);
            } else {
                if(onFailure) {
                    onFailure(error);
                }
            }
        },
        buttonText: "Verify Email"
    }
    return (
        <Form submit={submit} formTitle="Email Verification">
            <EmailInput
                label="Email Verification"
                name="email"
                value={email}
                onChange={(e) => {
                    setIsEmailValid(true);
                    setEmail(e.target.value);
                }}
                placeholder="Enter your email"
                id="email"
                validInput={isEmailValid}
                errorMessage={regexInputConfig.email.errorMessage}
            />
        </Form>
    );
}

export default EmailRegisterForm;