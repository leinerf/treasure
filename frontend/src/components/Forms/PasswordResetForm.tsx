import {useState } from "react";
import Form from "./Form";
import EmailInput from "./Inputs/EmailInput";
import { regexInputConfig } from "./Inputs/regexInputConfig";

function PasswordResetForm({onSuccess, onFailure} : {onSuccess?: () => void; onFailure?: () => void}) {
    const [email, setEmail] = useState(""); 
    const [validInput, setValidInput] = useState(true);
    const submit = {
        submitFunction: (e: React.SyntheticEvent) => {
            e.preventDefault();
            // Handle password reset submission
            if(!regexInputConfig.email.regex.test(email)) {
                setValidInput(false);
                if(onFailure) onFailure();
                return;
            } else {
                setValidInput(true);
                if(onSuccess) onSuccess();
            }
        },
        buttonText: "Reset Password"
    }
    return (
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
    );
}

export default PasswordResetForm;