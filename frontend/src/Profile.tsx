import "./assets/styles/Profile.css"
import dogProfile from "./assets/images/dog_profile.jpg"
import ApiCalls from "./services/apiCalls";
import { useState, useEffect } from "react";

function Profile() {
    const [profileData, setProfileData] = useState({
        username: "",
        email: "",
    });

    const getUserData = async () => {
        // Example function to get user data
        const { data: userData, status } = await ApiCalls.getUserData();
        console.log(userData, status);
        if (status !== 200) {
            console.error("Failed to fetch user data");
            return;
        }
        const { username, email } = userData;
        setProfileData({ username, email });
        
    };
    useEffect(() => {
        // Example effect: log profile data when it changes
        // eslint-disable-next-line react-hooks/set-state-in-effect
        getUserData();
    }, []);
    
    return <>
        <div className={`profile-container flex flex-col items-center justify-center bg-white shadow-md rounded p-8 m-4 `}>          
            <div className="profile-image">
                <img src={dogProfile} alt="Profile" className="rounded-full w-32 h-32 mb-4" />
            </div>
            <div className="profile-info mb-4">
                <div className="mb-2 flex items-center">
                    <h1 className="text-2xl font-bold">Welcome back, {profileData.username}!</h1>
                </div>
            </div>
        </div>
    </>
}

export default Profile