import { useContext, useState, useEffect } from "react";
import UserAuthContext from "../contexts/UserAuthContext";
import { InternalAPI } from "../api/internalAPI/InternalAPI";
import dogProfile from "../assets/images/dog_profile.jpg";
import Loading from "./loading";
function AccountInfo() {
    const { user } = useContext(UserAuthContext);
    const [file, setFile] = useState<File | string>("");
    
    useEffect(() => {
        const fetchProfilePicture = async () => {
            if (user) {
                const { file, error, status } = await InternalAPI.getProfilePicture();
                if (error || !file || status !== 200) {
                    setFile(dogProfile);
                    return;
                }                
                setFile(file);
            }
        };
        fetchProfilePicture();
    }, []); 
    
    return (
        <div className="p-4  rounded-lg bg-white shadow-md w-1/3 min-w-[300px] flex flex-col items-center">
            {!file && <Loading />}
            {file && (
                <>
                    <img src={typeof file === "string" ? file : URL.createObjectURL(file)} alt="Profile" className="rounded-full mt-2 h-40 w-40 self-center" />
                    <h2 className="text-xl font-bold mb-4">Account Information</h2>
                    {user && (
                        <div>
                            <p className="text-lg">Username: {user.username}</p>
                            <p className="text-lg">Email: {user.email}</p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default AccountInfo;