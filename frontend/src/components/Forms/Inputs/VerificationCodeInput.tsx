interface VerificationCodeInputProps { 
    label: string;
    length: number;
    code: string;
    onChange: (code: string) => void;
    validInput: boolean;
    errorMessage: string | string[];
}

const VerificationCodeInput = ({ label, length, code, onChange, validInput, errorMessage }: VerificationCodeInputProps) => {
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
            <label htmlFor="verification-code">{label}</label>
            <div id="verification-code" className="verification-code-input flex flex-row gap-2">
            {Array.from({length}).map((_, index) => (
                <input
                    key={index}
                    type="text"
                    maxLength={1}
                    value={code[index] || ''}
                    onChange={(e) => {
                        const newCode = code.split('');
                        newCode[index] = e.target.value;
                        const updatedCode = newCode.join('');
                        onChange(updatedCode);
                    }}
                    className="w-10 h-10 text-center border border-gray-300 rounded"
                />
            ))}
        </div>
    </div>
    )
};

export default VerificationCodeInput;