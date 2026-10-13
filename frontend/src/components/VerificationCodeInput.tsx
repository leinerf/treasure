interface VerificationCodeInputProps { 
    label: string;
    length: number;
    code: string;
    onChange: (code: string) => void;
}

const VerificationCodeInput = ({ label, length, code, onChange}: VerificationCodeInputProps) => {
    return (
        <div className="mb-4 flex flex-col gap-2 w-full">
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