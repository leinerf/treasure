import { FaEdit } from "react-icons/fa";

import ModalForm from "./ModalForm";
import "./assets/styles/Profile.css"
import dogProfile from "./assets/images/dog_profile.jpg"
import { useState } from "react";

function UsernameForm({isOpen, onClose}: {isOpen: boolean, onClose: () => void}) {
    const [formData, setFormData] = useState<Record<string, string[]>>({
        username:["Username", "text", "john_doe", ""]
    });
    return <ModalForm isOpen={isOpen} onClose={onClose} title="Edit Username" data={formData} setData={setFormData} handleSubmit={() => {
        console.log("Username form submitted");
    }} />
}

function EmailForm({isOpen, onClose}: {isOpen: boolean, onClose: () => void}) {
    const [formData, setFormData] = useState<Record<string, string[]>>({
        email:["Email", "email", "john@example.com", ""]
    });
    return <ModalForm isOpen={isOpen} onClose={onClose} title="Edit Email" data={formData} setData={setFormData} handleSubmit={() => {
        console.log("Email form submitted");
    }} />
}

function PasswordForm({isOpen, onClose}: {isOpen: boolean, onClose: () => void}){
    const [formData, setFormData] = useState<Record<string, string[]>>({
        password:["Password", "password", "secret123", ""],
        confirmPassword:["Confirm Password", "password", "secret123", ""]
    });
    return <ModalForm isOpen={isOpen} onClose={onClose} title="Change Password" data={formData} setData={setFormData} handleSubmit={() => {
        console.log("Password form submitted");
    }} />
}

function Profile() {
    const [showUsernameForm, setShowUsernameForm] = useState(false);
    const [showEmailForm, setShowEmailForm] = useState(false);
    const [showPasswordForm, setShowPasswordForm] = useState(false);

    const handleShowUsernameForm = () => {
        setShowUsernameForm(!showUsernameForm);
        setShowEmailForm(false);
        setShowPasswordForm(false);
    }

    const handleShowEmailForm = () => {
        setShowEmailForm(!showEmailForm);
        setShowUsernameForm(false);
        setShowPasswordForm(false);
    }

    const handleShowPasswordForm = () => {
        setShowPasswordForm(!showPasswordForm);
        setShowUsernameForm(false);
        setShowEmailForm(false);
    }
    
    return <>
        <UsernameForm isOpen={showUsernameForm} onClose={() => setShowUsernameForm(false)} />
        <EmailForm isOpen={showEmailForm} onClose={() => setShowEmailForm(false)} />
        <PasswordForm isOpen={showPasswordForm} onClose={() => setShowPasswordForm(false)} />

        <div className={`profile-container flex flex-col items-center justify-center bg-white shadow-md rounded p-8 m-4 `}>          
            <div className="profile-image">
                <img src={dogProfile} alt="Profile" className="rounded-full w-32 h-32 mb-4" />
            </div>
            <div className="profile-info mb-4">
                <div className="mb-2 flex items-center">
                    <h1 className="text-2xl font-bold">Welcome back, John!</h1>
                    <FaEdit className="w-5 h-5 ml-2" onClick={handleShowUsernameForm} />
                </div>
                <div>
                    <div className="flex items-center">
                        <p className="text-gray-600">Email: john.doe@example.com</p>
                        <FaEdit className="w-5 h-5 ml-2" onClick={handleShowEmailForm} />
                    </div>
                    <div  className=" flex items-center">
                        <p className="text-gray-600">Change password?</p>
                        <FaEdit className="w-5 h-5 ml-2" onClick={handleShowPasswordForm} />
                    </div>
                </div>
            </div>
        </div>
    </>
}

export default Profile