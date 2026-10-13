import { type InputInterface } from "./interfaces/InputInterface";

const Input = ({label, name, value, onChange, placeholder, id, validInput, type, errorMessage}: InputInterface) => {
    return (
        <div className="mb-4 flex flex-col gap-2 w-full">
            {!validInput && typeof errorMessage === "string" && <span className="border rounded-sm border-red-300 bg-red-100 text-red-500 text-sm p-2">{errorMessage}</span>}
            {!validInput && Array.isArray(errorMessage) && (
                <ul className="border rounded-sm border-red-300 bg-red-100 text-red-500 text-sm">
                    {errorMessage.map((msg, index) => (
                        <li key={index} className="p-2">{msg}</li>
                    ))}
                </ul>
            )}
            <label className="font-medium text-gray-700" htmlFor={id}>
                {label}
            </label>
            <input
                type={type}
                id={id}
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className="border border-gray-300 rounded p-2 w-full"
            />
        </div>
    );
};

export default Input;