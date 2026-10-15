import { useContext } from "react";
import UserAuthContext from "../contexts/UserAuthContext";

function AccountInfo() {
    const { user } = useContext(UserAuthContext);
    
    return (
        <div className="p-4  rounded-lg bg-white shadow-md w-1/3 min-w-[300px] flex flex-col items-center">
            {user.profileImg instanceof File && <img src={URL.createObjectURL(user.profileImg)} alt="Profile" className="rounded-full mt-2 h-40 w-40 self-center" />}
            <h2 className="text-xl font-bold mb-4">Account Information</h2>
            {user && (
                <div>
                    <p className="text-lg">Username: {user.username}</p>
                    <p className="text-lg">Email: {user.email}</p>
                </div>
            )}
        </div>
    );
}

export default AccountInfo;