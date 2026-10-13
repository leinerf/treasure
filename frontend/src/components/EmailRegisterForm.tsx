import {useState} from "react";
import EmailInput from "./EmailInput";
import Form from "./Form";

function EmailRegisterForm() {
    const [email, setEmail] = useState(""); 
    const [isEmailValid, setIsEmailValid] = useState(true); 
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const submit = {
        submitFunction: (e: React.SyntheticEvent) => { 
            e.preventDefault();
            console.log("Email verification submitted");
            if (!emailRegex.test(email)) {
                setIsEmailValid(false);
                return;
            }
            console.log("Email is valid:", email);
            // Proceed with email verification logic here
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
                errorMessage={"Invalid Email"}
            />
        </Form>
    );
}

export default EmailRegisterForm;