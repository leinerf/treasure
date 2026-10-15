import {useState} from "react";
import EmailInput from "./Inputs/EmailInput";
import Form from "./Form";
import { regexInputConfig } from "./Inputs/regexInputConfig";
// Call onSuccess during successful submission
function EmailRegisterForm({onSuccess, onFailure}: {onSuccess?: () => void, onFailure?: () => void}) {
    const [email, setEmail] = useState(""); 
    const [isEmailValid, setIsEmailValid] = useState(true); 

    const submit = {
        submitFunction: (e: React.SyntheticEvent) => { 
            e.preventDefault();
            if (!regexInputConfig.email.regex.test(email)) {
                setIsEmailValid(false);
                return;
            }
            // Proceed with email verification logic here

            // Call the onSuccess callback if provided 
            if(onSuccess) {
                onSuccess();
            } else {
                if(onFailure) {
                    onFailure();
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