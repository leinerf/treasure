import React, { useState } from "react"; 

function VerificationCode({verifyHandler, resendHandler}: {verifyHandler: (code: string) => void, resendHandler: () => void}){
    const [code, setCode] = useState(Array(6).fill(""));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        verifyHandler(code.join(""));
    };

    return (
        <div className="absolute w-full h-full z-20 top-0 left-0 bg-gray-300/90 flex items-center justify-center ">
            <div className="bg-white p-8 rounded-lg shadow-md">
                    <form onSubmit={handleSubmit}>
                        <p className="text-center mb-4">Enter the 6-digit verification code sent to your email.</p>
                        <div className="flex justify-center mb-4">
                            {Array.from({ length: 6}).map((_, index) => {
                                return (
                                    <input
                                        key={index}
                                        type="text"
                                        pattern="\d{1}"
                                        value={code[index] || ""}
                                        onChange={(e) => {
                                            const {value} = e.target;
                                            const newCode = [...code];
                                            newCode[index] = value;
                                            setCode(newCode);
                                        }}
                                        required
                                        maxLength={1}
                                        className="verification-code-input w-8 h-8 text-center mx-1 bg-gray-200"
                                    />
                                );
                            })}
                        </div>
                        <div className="flex justify-center mb-4 flex-col items-center">
                            <a href="#" className="text-blue-500 hover:underline mb-4" onClick={resendHandler}>Resend code</a>
                            <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">Verify</button>
                        </div>
                    </form>
            </div>
        </div>
    );
};

export default VerificationCode;