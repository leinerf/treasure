import {useEffect, useState} from "react";
import ApiCalls from "./services/apiCalls";
import VerificationCode from "./VerificationCode";

function AccountSetting() {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showVerificationCode, setShowVerificationCode] = useState(false);
    useEffect(() => {
        // Fetch initial account settings here if needed
        const fetchAccountSettings = async () => {
            try {
                const { data, status } = await ApiCalls.getUserData();
                if (status !== 200) {
                    console.error("Failed to fetch account settings: Status code", status);
                }
                setUsername(data.username);
                setEmail(data.email);
            } catch (error) {
                console.error("Failed to fetch account settings:", error);
            }
        };
        fetchAccountSettings();
    }, []);
    
    const handleUpdateUsername = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const { status } = await ApiCalls.updateUsername(username);
            if (status !== 200) {
                console.error("Failed to update username: Status code", status);
            }
        } catch (error) {
            console.error("Failed to update username:", error);
        }
    };

    const handleUpdateEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const { status: emailVerificationStatus } = await ApiCalls.createEmailVerification(email);
            if (emailVerificationStatus !== 200) {
                console.error("Failed to create email verification: Status code", emailVerificationStatus);
            }
            setShowVerificationCode(true);
        } catch (error) {
            console.error("Failed to update email:", error);
        }
    };

    const verifyHandler = async (code: string) => {
        try {
            const { status } = await ApiCalls.verifyEmail(email, code);
            if (status !== 200) {
                console.error("Failed to verify email: Status code", status);
                return;
            }
            const { status: emailUpdateStatus } = await ApiCalls.updateEmail(email);
            if (emailUpdateStatus !== 200) {
                console.error("Failed to update email: Status code", emailUpdateStatus);
            }
            setShowVerificationCode(false);
        } catch (error) {
            console.error("Failed to verify email:", error);
        }
    };

    const resendHandler = async () => {
        try {
            const { status } = await ApiCalls.createEmailVerification(email);
            if (status !== 200) {
                console.error("Failed to resend email verification: Status code", status);
            }
        } catch (error) {
            console.error("Failed to resend email verification:", error);
        }
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            console.error("New password and confirm password do not match");
            return;
        }
        try {
            const { data, status } = await ApiCalls.updatePassword(password, newPassword);
            if (status !== 200) {
                console.error("Failed to update password: Status code", status);
            }
            console.log(data.message);
        } catch (error) {
            console.error("Failed to update password:", error);
        }
    };
    return (
        <>
        {showVerificationCode && <VerificationCode verifyHandler={verifyHandler} resendHandler={resendHandler} />}
        <div className="shadow-md p-4 bg-white rounded-md min-w-[400px]">
            <h1 className="text-2xl mb-4">Account Settings</h1>
            <hr className="my-4 border-gray-300" />
            <div>
                <form >
                    <div className="mb-4 flex flex-col">
                        <label htmlFor="username" className="block mb-2">Update Username:</label>
                        <input type="text" id="username" name="username" className="border p-2 rounded-md" value={username} onChange={(e) => setUsername(e.target.value)} />
                        <button type="submit" className="bg-blue-500 text-white p-2 rounded-md m-2 w-32 self-end" onClick={handleUpdateUsername}>Update</button>    
                    </div>
                    
                </form>
                <hr className="my-4 border-gray-300" />
                <form >
                    <div className="mb-4 flex flex-col">
                        <label htmlFor="email" className="block mb-2">Update Email:</label>
                        <input type="email" id="email" name="email" className="border p-2 rounded-md" onChange={(e) => setEmail(e.target.value)} value={email} />
                        <button type="submit" className="bg-blue-500 text-white p-2 rounded-md m-2 w-32 self-end" onClick={handleUpdateEmail}>Update</button>
                    </div>
                </form>
                <hr className="my-4 border-gray-300" />
                <form >
                    <div className="mb-4 flex flex-col">
                        <label htmlFor="password" className="block mb-2">Old Password:</label>
                        <input type="password" id="password" name="password" className="border p-2 rounded-md" onChange={(e) => setPassword(e.target.value)} value={password} />
                    </div>
                    <div className="mb-4 flex flex-col">
                        <label htmlFor="newPassword" className="block mb-2">New Password:</label>
                        <input type="password" id="newPassword" name="newPassword" className="border p-2 rounded-md" onChange={(e) => setNewPassword(e.target.value)} value={newPassword} />
                    </div>
                    <div className="mb-4 flex flex-col">
                        <label htmlFor="confirmPassword" className="block mb-2">Confirm Password:</label>
                        <input type="password" id="confirmPassword" name="confirmPassword" className="border p-2 rounded-md" onChange={(e) => setConfirmPassword(e.target.value)} value={confirmPassword} />
                        <button type="submit" className="bg-blue-500 text-white p-2 rounded-md m-2  w-32 self-end" onClick={handleUpdatePassword}>Update</button>
                    </div>
                    
                    
                </form>
            </div>
        </div>
        </>
    );
}

export default AccountSetting;