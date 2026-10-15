import Form from "./Form";
import PasswordInput from "./Inputs/PasswordInput";
import TextInput from "./Inputs/TextInput";
import { useState } from "react";

function LoginForm({onSuccess, onFailure} : {onSuccess?: () => void; onFailure?: () => void}) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [validInput, setValidInput] = useState(true);

    const submit = {
        submitFunction: (e: React.SyntheticEvent) => {
            e.preventDefault();
            if (username && password) {
                setValidInput(true);
                if(onSuccess) {
                    onSuccess();
                }
            } else {
                setValidInput(false);
                if(onFailure) {
                    onFailure();
                }
            }
        },
        buttonText: "Login"
    }
    return (
        <Form formTitle="Login" submit={submit}>
            <TextInput  
            label="Username" name="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Enter your username" id="username" validInput={validInput} errorMessage="Invalid username or password"
            />
            <PasswordInput
            label="Password" name="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" id="password" validInput={validInput} errorMessage={["Invalid username or password"]}
            />
        </Form>
    );
}

export default LoginForm;