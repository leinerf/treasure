import Form from "./Form"
import { useState, useContext } from "react";
import UserAuthContext from "../../contexts/UserAuthContext";
import EmailInput from "./Inputs/EmailInput";
import VerificationCodeInput from "./Inputs/VerificationCodeInput";
import TextInput from "./Inputs/TextInput";
import PasswordInput from "./Inputs/PasswordInput";
import { regexInputConfig } from "./Inputs/regexInputConfig";
import FileInput from "./Inputs/ProfileInput";

function UpdateUserForm() {
    const { user, authenticate } = useContext(UserAuthContext);
    const [email, setEmail] = useState(user.email);
    const [isEmailValid, setIsEmailValid] = useState(true);
    const [code, setCode] = useState("");
    const [isCodeValid, setIsCodeValid] = useState(true);
    const [username, setUsername] = useState(user.username);
    const [isUsernameValid, setIsUsernameValid] = useState(true);
    const [oldPassword, setOldPassword] = useState("");
    const [isOldPasswordValid, setIsOldPasswordValid] = useState(true);
    const [newPassword, setNewPassword] = useState("");
    const [isNewPasswordValid, setIsNewPasswordValid] = useState(true);
    const [showVerificationInput, setShowVerificationInput] = useState(false);
    const [image, setImage] = useState<File | null>(user.profileImg);

    const updateImageSubmitHandler = {
        submitFunction: (e: React.SyntheticEvent) => {
            e.preventDefault();
            authenticate({ username: user.username, email: user.email, profileImg: image });
        },
        buttonText: "Update Image"
    };

    const updateEmailSubmitHandler = {
        submitFunction: (e: React.SyntheticEvent) => {
            e.preventDefault();
            if (!regexInputConfig.email.regex.test(email)) {
                setIsEmailValid(false);
                // Handle invalid email format
                return;
            }
            authenticate({ username: user.username, email, profileImg: user.profileImg });
            // Show the verification input after submitting the email update
            setShowVerificationInput(true);
        },
        buttonText: "Update Email"
    }

    const verifyEmailSubmitHandler = {
        submitFunction: (e: React.SyntheticEvent) => {
            e.preventDefault();
            // Handle verification code submission
            if(code.length !== 6) {
                setIsCodeValid(false);
                // Handle invalid verification code length
                return;
            }
        },
        buttonText: "Verify Email"
    }

    const updateUsernameSubmitHandler = {
        submitFunction: (e: React.SyntheticEvent) => {
            e.preventDefault();
            if (!regexInputConfig.username.regex.test(username)) {
                setIsUsernameValid(false);
                // Handle invalid username format
                return;
            }
            authenticate({ username, email: user.email, profileImg: user.profileImg });
            // Handle username update submission
        },
        buttonText: "Update Username"
    }

    const updatePasswordSubmitHandler = {
        submitFunction: (e: React.SyntheticEvent) => {
            e.preventDefault();

            // check old password and new password validity
            if(oldPassword === "") {
                setIsOldPasswordValid(false);
                // Handle empty old password
                return;
            }
            if (!regexInputConfig.password.regex.test(newPassword)) {
                setIsNewPasswordValid(false);
                // Handle invalid new password format
                return;
            }
            // Handle password update submission
            if (oldPassword && newPassword) {
                // save password logic here
            }
        },
        buttonText: "Update Password"
    }

    return (
        <div className="flex flex-col items-center justify-center w-full">
            <Form submit={updateImageSubmitHandler}>
                <FileInput 
                    label="Upload Image" 
                    onChange={(file: File | null) => {
                        setImage(file);
                        // Handle file change logic here
                    }} 
                    imgUrl={image} 
                    />
            </Form>

            <Form submit={updateEmailSubmitHandler}>
                <EmailInput 
                    label="Update Email"
                    name="email"
                    value={email}
                    onChange={(e) => {
                        setEmail(e.target.value);
                        setIsEmailValid(true);
                        setShowVerificationInput(false);
                    }}
                    placeholder="Enter your email"
                    id="email"
                    validInput={isEmailValid}
                    errorMessage={regexInputConfig.email.errorMessage}
                />

            </Form>

            {showVerificationInput && (
                <Form submit={verifyEmailSubmitHandler}>
                    <VerificationCodeInput
                        label="Verify Email"
                        length={6}
                        code={code}
                        validInput={isCodeValid}
                        errorMessage={["Invalid verification code"]}
                        onChange={(code: string) => {
                            setCode(code);
                            setIsCodeValid(true);
                        }}
                    />
            </Form>)}
            <Form submit={updateUsernameSubmitHandler}>
                <TextInput 
                    label="Update Username"
                    name="username"
                    value={username}
                    onChange={(e) => {
                        setUsername(e.target.value)
                        setIsUsernameValid(true);
                    }}
                    placeholder="Enter your username"
                    id="username"
                    validInput={isUsernameValid}
                    errorMessage={regexInputConfig.username.errorMessage}
                />
            </Form>
            <Form submit={updatePasswordSubmitHandler}>
                <PasswordInput 
                    label="Old Password"
                    name="password"
                    value={oldPassword}
                    onChange={(e) => {
                        setOldPassword(e.target.value); 
                        setIsOldPasswordValid(true);
                    }}
                    placeholder="Enter your old password"
                    id="password"
                    validInput={isOldPasswordValid}
                    errorMessage={["Invalid old password"]}
                />
                <PasswordInput 
                    label="New Password"
                    name="newPassword"
                    value={newPassword}
                    onChange={(e) => {
                        setNewPassword(e.target.value);
                        setIsNewPasswordValid(true);
                    }}
                    placeholder="Enter your new password"
                    id="newPassword"
                    validInput={isNewPasswordValid}
                    errorMessage={regexInputConfig.password.errorMessage}
                />
            </Form>
        </div>
    );
}

export default UpdateUserForm;