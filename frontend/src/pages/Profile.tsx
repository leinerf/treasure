import { useState } from "react";
import UpdateUserForm from "../components/Forms/UpdateUserForm";
import AccountInfo from "../components/AccountInfo";
import ErrorMessage from "../components/ErrorMessage";
import SuccessMessage from "../components/SuccessMessage";
function Profile() {
    const options = ["Account Info", "Edit Account"];
    const [tab, setTab] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const handleSuccess = (message?: string) => {
        setError(null);
        setSuccessMessage(message ?? "Update successful");
        setTab(0);
    }

    const handleFailure = (error?: string) => {
        setError(error ?? "An unknown error occurred");
        setSuccessMessage(null);
    }

    const switchTabs = (index: number) => {
        setTab(index);
        setError(null);
        setSuccessMessage(null);
    }

    return (
        <div className="flex flex-col items-center justify-center w-full">
            <h1 className="text-2xl font-bold mb-4">Profile Page</h1>
            <div className="mb-4 flex flex-row items-center gap-4 border-b border-gray-300 pb-2">
                {options.map((option, index) => (
                    <span 
                        key={index} 
                        className={`cursor-pointer hover:underline ${tab === index ? "font-bold" : ""}`}
                        onClick={() => switchTabs(index)}
                    >
                        {option}
                    </span>
                ))}
            </div>
            {tab === 0 && (
                <>
                    <SuccessMessage message={successMessage} />
                    <AccountInfo />
                </>
            )}
            {tab === 1 && (
                <>
                    <ErrorMessage message={error} />
                    <UpdateUserForm onSuccess={handleSuccess} onFailure={handleFailure} />
                </>
            )}
        </div>
    );
}

export default Profile;