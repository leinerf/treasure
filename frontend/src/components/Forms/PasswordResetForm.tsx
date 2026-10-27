import {useState } from "react";
import Form from "./Form";
import EmailInput from "./Inputs/EmailInput";
import { regexInputConfig } from "./Inputs/regexInputConfig";
import { InternalAPI } from "../../api/internalAPI/InternalAPI"

function PasswordResetForm({onSuccess, onFailure} : {onSuccess?: (message?: string) => void; onFailure?: (error?: string) => void}) {
    const [email, setEmail] = useState(""); 
    const [validInput, setValidInput] = useState(true);

    const submit = {
        submitFunction: async (e: React.SyntheticEvent) => {
            e.preventDefault();
            // Handle password reset submission
            if(!regexInputConfig.email.regex.test(email)) {
                setValidInput(false);
                return;
            }

            const { message, status, error } = await InternalAPI.createPasswordReset(email);

            if(status === 200 && onSuccess) {
                onSuccess(message);
            } else {
                if(onFailure) onFailure(error || "Failed to create password reset code");
            }
        },
        buttonText: "Reset Password"
    }
    return (
        <>
        <Form submit={submit} formTitle="Password Reset">
            <EmailInput 
            label="Email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            id="email"
            validInput={validInput}
            errorMessage={regexInputConfig.email.errorMessage}
            />
        </Form>
        </>
    );
}

export default PasswordResetForm;