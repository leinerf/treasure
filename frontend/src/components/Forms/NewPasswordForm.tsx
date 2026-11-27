import { useState } from "react";
import Form from "./Form";
import PasswordInput from "./Inputs/PasswordInput";
import { regexInputConfig } from "./Inputs/regexInputConfig";
import { InternalAPI } from "../../api/internalAPI/InternalAPI";

function NewPasswordForm({token, onSuccess, onFailure}: {token: string, onSuccess?: (message?: string) => void, onFailure?: (error?: string) => void}) {
    const [password, setPassword] = useState("");
    const [isPasswordValid, setIsPasswordValid] = useState(true);
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isConfirmPasswordValid, setIsConfirmPasswordValid] = useState(true);

    const submit = {
        submitFunction: async (e: React.SyntheticEvent) => {
            e.preventDefault();
            if(!regexInputConfig.password.regex.test(password)){
                setIsPasswordValid(false);
                return;
            }
            if(password !== confirmPassword){
                setIsConfirmPasswordValid(false);
                return;
            }
            const { message, status, error } = await InternalAPI.resetPassword(token, password);
            if(status === 200 && onSuccess){
                onSuccess(message)
            } else {
                if(onFailure){
                    onFailure(error ?? "Failed to reset password")
                }
            }
        },
        buttonText: "Reset Password"
    }
    return (
        <>
        <Form formTitle="Create New Password" submit={submit}>
            <PasswordInput
                id="new-password"
                name="new-password"
                label="New Password"
                placeholder="Enter your new password"
                value={password}
                onChange={(e) => {
                    setPassword(e.target.value);
                    setIsPasswordValid(true);
                }}
                validInput={isPasswordValid}
                errorMessage={regexInputConfig.password.errorMessage}
            />
            <PasswordInput
                id="confirm-password"
                name="confirm-password"
                placeholder="Confirm your new password"
                label="Confirm Password"
                value={confirmPassword}
                onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setIsConfirmPasswordValid(true);
                }}
                validInput={isConfirmPasswordValid}
                errorMessage={["passwords do not match"]}
            />
        </Form>
        </>
    );
}

export default NewPasswordForm;
