import { InternalAPI } from "../../api/internalAPI/InternalAPI";
import Form from "./Form";
import PasswordInput from "./Inputs/PasswordInput";
import TextInput from "./Inputs/TextInput";
import { useState } from "react";
import { regexInputConfig } from "./Inputs/regexInputConfig";

function LoginForm({onSuccess, onFailure} : {onSuccess?: (message?: string) => void; onFailure?: (error?: string) => void}) {
    const [username, setUsername] = useState("");
    const [validUsername, setValidUsername] = useState(true);
    const [password, setPassword] = useState("");
    const [validPassword, setValidPassword] = useState(true);

    const submit = {
        submitFunction: async (e: React.SyntheticEvent) => {
            e.preventDefault();
            if(!regexInputConfig.username.regex.test(username)) {
                setValidUsername(false);
                
            }
            if(!regexInputConfig.password.regex.test(password)) {
                setValidPassword(false);
                
            }
            if(!regexInputConfig.username.regex.test(username) || !regexInputConfig.password.regex.test(password)) {
                return;
            }

            const { message, status, error } = await InternalAPI.login({ username, password });
            if (status === 200) {
                if(onSuccess) {
                    onSuccess(message);
                }
            } else {
                if(onFailure) {
                    onFailure(error);
                }
            }
        },
        buttonText: "Login"
    }
    return (
        <>
        <Form formTitle="Login" submit={submit}>
            <TextInput  
                label="Username" 
                name="username" 
                value={username} 
                onChange={(e) => {
                    setValidUsername(true);
                    setUsername(e.target.value)
                }} 
                placeholder="Enter your username" 
                id="username" 
                validInput={validUsername} 
                errorMessage="Invalid username"
            />
            <PasswordInput
                label="Password" 
                name="password" 
                value={password} 
                onChange={(e) => {
                    setValidPassword(true);
                    setPassword(e.target.value)
                }} 
                placeholder="Enter your password" 
                id="password" 
                validInput={validPassword} 
                errorMessage={["Invalid password"]}
            />
        </Form>
        </>
    );
}

export default LoginForm;