import { useState } from 'react';
import {  useParams, useNavigate } from 'react-router';
import Form from './Form';
import ApiCalls from './services/apiCalls';
function PasswordReset() {
    const { id } = useParams();
    const [data, setData] = useState<Record<string, string[]>>({ newPassword: ["New Password", "password", "new password", ""] });
    const navigate = useNavigate();
    
    const handleSubmit = async () => {
        // TODO: submit password reset for id
        console.log(id, data.newPassword[3]);
        const { status } = await ApiCalls.resetPassword(id!, data.newPassword[3]);
        if (status === 200) {
            console.log("Password reset successfully");
        } else {
            console.error("Failed to reset password");
        }
    };

    return (
        <div>
            <h1>Password Reset</h1>
            <Form title="Password Reset" data={data} setData={setData} handleSubmit={handleSubmit} />
        </div>
    );
}

export default PasswordReset;