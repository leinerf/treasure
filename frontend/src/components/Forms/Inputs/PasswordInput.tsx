import { type InputInterface } from "./InputInterface";
import Input from "./Input";
interface PasswordInputInterface extends Omit<InputInterface, "type"> {
    errorMessage: string[]; 
}

const PasswordInput = ({label, name, value, onChange, placeholder, id, errorMessage, validInput}: PasswordInputInterface) => {    
    return (
        <Input
            label={label}
            type="password"
            id={id}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            validInput={validInput}
            errorMessage={errorMessage}
        />
    );
};

export default PasswordInput;