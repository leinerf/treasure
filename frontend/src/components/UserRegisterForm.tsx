import {useState} from "react";
import Form from "./Form";
import TextInput from "./TextInput";
import EmailInput from "./EmailInput";
import PasswordInput from "./PasswordInput";
import VerificationCodeInput from "./VerificationCodeInput";

const UserRegisterForm = () => {
    const [username, setUsername] = useState("");
    const [isUsernameValid, setIsUsernameValid] = useState(true)
    // Username validation regex: must start with a letter, can contain letters, numbers, and underscores, and be 3-21 characters long
    const usernameRegex = /^[a-zA-Z][a-zA-Z0-9_]{2,20}$/;
    
    const [email, setEmail] = useState("");
    const [isEmailValid, setIsEmailValid] = useState(true);
    // Email validation regex: must be a valid email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    const [password, setPassword] = useState("");
    const [isPasswordValid, setIsPasswordValid] = useState(true);
    // Password validation regex: must contain at least one lowercase letter, one uppercase letter, one number, one special character, and be at least 8 characters long
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isConfirmPasswordValid, setIsConfirmPasswordValid] = useState(true);
    // Confirm password validation: must match the password
    const confirmPasswordRegex = new RegExp(`^${password}$`);
    
    const [verificationCode, setVerificationCode] = useState("");
    
    const submit = {
        buttonText: "Register",
        submitFunction: (e: React.SyntheticEvent) => {
            console.log("Form submitted");
            //TODO validation is stil wrong, need to check all fields before setting them as valid
            e.preventDefault();
            let validInputs = true;
            if (!usernameRegex.test(username)) {
                setIsUsernameValid(false);
                validInputs = false;
            }
            if (!emailRegex.test(email)) {
                setIsEmailValid(false);
                validInputs = false;
            }
            if (!passwordRegex.test(password)) {
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
            console.log({ username, email, password, confirmPassword, verificationCode})
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
                errorMessage={"Invalid Username"}
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
                errorMessage={"Invalid Email"}
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
                errorMessage={[
                    "At least one lowercase letter",
                    "At least one uppercase letter",
                    "At least one number",
                    "At least one special character",
                    "Minimum 8 characters"
                ]}
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
                }}
                code={verificationCode}
            />
        </Form>
    );
};

export default UserRegisterForm;