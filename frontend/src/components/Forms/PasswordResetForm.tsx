import {useState } from "react";
import Form from "./Form";
import EmailInput from "./Inputs/EmailInput";
import { regexInputConfig } from "./Inputs/regexInputConfig";
import apiCall from "../../util/apiCalls"
function PasswordResetForm({onSuccess, onFailure} : {onSuccess?: () => void; onFailure?: () => void}) {
    const [email, setEmail] = useState(""); 
    const [validInput, setValidInput] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");
    const submit = {
        submitFunction: async (e: React.SyntheticEvent) => {
            e.preventDefault();
            // Handle password reset submission
            if(!regexInputConfig.email.regex.test(email)) {
                setValidInput(false);
                if(onFailure) onFailure();
                return;
            }

            const { data, status } = await apiCall.createPasswordReset(email);

            if(status === 200 && onSuccess) {
                onSuccess();
            } else {
                setErrorMessage(data?.message || "Failed to create password reset code");
                if(onFailure) onFailure();
            }
        },
        buttonText: "Reset Password"
    }
    return (
        <>
        {errorMessage && <p className="error-message border-red-500 text-red-500 bg-red-100 p-2 rounded">{errorMessage}</p>}
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