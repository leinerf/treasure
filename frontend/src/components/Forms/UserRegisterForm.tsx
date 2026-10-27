import {useState} from "react";
import Form from "./Form";
import TextInput from "./Inputs/TextInput";
import EmailInput from "./Inputs/EmailInput";
import PasswordInput from "./Inputs/PasswordInput";
import VerificationCodeInput from "./Inputs/VerificationCodeInput";
import { regexInputConfig } from "./Inputs/regexInputConfig";
import { InternalAPI } from "../../api/internalAPI/InternalAPI";

// Call onSuccess during successful submission
// Call onFailure during failed submission
const UserRegisterForm = ({onSuccess, onFailure}: {onSuccess?: (message?: string) => void, onFailure?: (error?: string) => void }) => {
    const [username, setUsername] = useState("");
    const [isUsernameValid, setIsUsernameValid] = useState(true)
    // Username validation regex: must start with a letter, can contain letters, numbers, and underscores, and be 3-21 characters long
    
    const [email, setEmail] = useState("");
    const [isEmailValid, setIsEmailValid] = useState(true);
    // Email validation regex: must be a valid email format
    
    const [password, setPassword] = useState("");
    const [isPasswordValid, setIsPasswordValid] = useState(true);
    // Password validation regex: must contain at least one lowercase letter, one uppercase letter, one number, one special character, and be at least 8 characters long
    
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isConfirmPasswordValid, setIsConfirmPasswordValid] = useState(true);
    // Confirm password validation: must match the password
    const confirmPasswordRegex = new RegExp(`^${password}$`);
    
    const [verificationCode, setVerificationCode] = useState("");
    const [isVerificationCodeValid, setIsVerificationCodeValid] = useState(true);
    
    const submit = {
        buttonText: "Register",
        submitFunction: async (e: React.SyntheticEvent) => {
            e.preventDefault();
            let validInputs = true;
            if (!regexInputConfig.username.regex.test(username)) {
                setIsUsernameValid(false);
                validInputs = false;
            }
            if (!regexInputConfig.email.regex.test(email)) {
                setIsEmailValid(false);
                validInputs = false;
            }
            if (!regexInputConfig.password.regex.test(password)) {
                setIsPasswordValid(false);
                validInputs = false;
            }
            if (!confirmPasswordRegex.test(confirmPassword)) {
                setIsConfirmPasswordValid(false);
                validInputs = false;    
            }
            if (!validInputs) {
                return;
            }
            // All inputs are valid, proceed with form submission logic here
            const { message, status, error } = await InternalAPI.register({
                username,
                email,
                password,
                emailVerificationCode: verificationCode
            });

            // Call the onSuccess callback if provided
            if(status === 200 && onSuccess) {
                onSuccess(message);
            } else {
                if(onFailure) {
                    onFailure(error);
                }
            }
        },
    };
    return (
        <Form submit={submit} formTitle="Register">
            <TextInput
                label="Username"
                name="username"
                value={username}
                onChange={(e) => {
                    setIsUsernameValid(true);
                    setUsername(e.target.value)
                }}
                placeholder="Enter your username"
                id="username"
                validInput={isUsernameValid}
                errorMessage={regexInputConfig.username.errorMessage}
            />
            <EmailInput
                label="Verified Email"
                name="email"
                value={email}
                onChange={(e) => {
                    setIsEmailValid(true);
                    setEmail(e.target.value)
                }}
                placeholder="Enter your email"
                id="email"
                validInput={isEmailValid}
                errorMessage={regexInputConfig.email.errorMessage}
            />
            <PasswordInput
                label="Password"
                name="password"
                value={password}
                onChange={(e) => {
                    setIsPasswordValid(true);
                    setPassword(e.target.value)
                }}
                placeholder="Enter your password"
                id="password"
                validInput={isPasswordValid}
                errorMessage={regexInputConfig.password.errorMessage}
            />
            <PasswordInput
                label="Confirm Password"
                name="confirmPassword"
                value={confirmPassword}
                onChange={(e) => {
                    setIsConfirmPasswordValid(true);
                    setConfirmPassword(e.target.value)
                }}
                placeholder="Confirm your password"
                id="confirmPassword"
                validInput={isConfirmPasswordValid}
                errorMessage={[
                    "Must match the password"
                ]}
            />

            <VerificationCodeInput
                label="Verification Code"
                length={6}
                onChange={(code) => {
                    setVerificationCode(code);
                    setIsVerificationCodeValid(true);
                }}
                code={verificationCode}
                validInput={isVerificationCodeValid}
                errorMessage={regexInputConfig.verificationCode.errorMessage}
            />
        </Form>
    );
};

export default UserRegisterForm;