import apiCalls from "../../util/apiCalls";
import Form from "./Form";
import PasswordInput from "./Inputs/PasswordInput";
import TextInput from "./Inputs/TextInput";
import { useState } from "react";
import { regexInputConfig } from "./Inputs/regexInputConfig";
function LoginForm({onSuccess, onFailure} : {onSuccess?: () => void; onFailure?: () => void}) {
    const [username, setUsername] = useState("");
    const [validUsername, setValidUsername] = useState(true);
    const [password, setPassword] = useState("");
    const [validPassword, setValidPassword] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");
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

            const { data, status } = await apiCalls.login({ username, password });
            if (status === 200) {
                if(onSuccess) {
                    onSuccess();
                }
            } else {
                setErrorMessage(data?.message || "Invalid username or password");
                if(onFailure) {
                    onFailure();
                }
            }
        },
        buttonText: "Login"
    }
    return (
        <>
        {errorMessage && <p className="error-message border-1 border-red-500 text-red-500 bg-red-100 p-2 rounded">{errorMessage}</p>}
        <Form formTitle="Login" submit={submit}>
            <TextInput  
                label="Username" 
                name="username" 
                value={username} 
                onChange={(e) => {
                    setValidUsername(true);
                    setErrorMessage("");
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
                    setErrorMessage("");
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