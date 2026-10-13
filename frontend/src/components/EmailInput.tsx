import { type InputInterface } from "./interfaces/InputInterface";
import Input from "./Input";

type EmailInputInterface = Omit<InputInterface, "type">;
const EmailInput = ({label, name, value, onChange, placeholder, id, validInput, errorMessage}: EmailInputInterface) => {
    return (
        <Input
            label={label}
            type="email"
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

export default EmailInput;