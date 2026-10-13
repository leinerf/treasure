import { type InputInterface } from "./interfaces/InputInterface";
import Input from "./Input";

type TextInputInterface = Omit<InputInterface, "type">;
const TextInput = ({label, name, value, onChange, placeholder, id, validInput, errorMessage}: TextInputInterface) => {
    return (
        <Input
            label={label}
            type="text"
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

export default TextInput;
