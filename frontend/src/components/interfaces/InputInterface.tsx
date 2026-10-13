interface InputInterface {
    id: string;
    label: string;
    name: string;
    value: string;
    type: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    validInput: boolean;
    errorMessage: string | string[];
    placeholder: string;
}

export { type InputInterface };