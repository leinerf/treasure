import { useState } from "react";
import UpdateUserForm from "../components/Forms/UpdateUserForm";
import AccountInfo from "../components/AccountInfo";

function Profile() {
    const options = ["Account Info", "Edit Account"];
    const [tab, setTab] = useState(0);
    return (
        <div className="flex flex-col items-center justify-center w-full">
            <h1 className="text-2xl font-bold mb-4">Profile Page</h1>
            <div className="mb-4 flex flex-row items-center gap-4 border-b border-gray-300 pb-2">
                {options.map((option, index) => (
                    <span 
                        key={index} 
                        className={`cursor-pointer hover:underline ${tab === index ? "font-bold" : ""}`}
                        onClick={() => setTab(index)}
                    >
                        {option}
                    </span>
                ))}
            </div>
            {tab === 0 && (
                <AccountInfo />
            )}
            {tab === 1 && (
                <UpdateUserForm />
            )}
        </div>
    );
}

export default Profile;