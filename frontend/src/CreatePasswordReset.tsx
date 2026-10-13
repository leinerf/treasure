import Form from "./Form";
import { useState } from "react";
import ApiCalls from "./services/apiCalls";

function CreatePasswordReset() {
    const [formData, setFormData] = useState<Record<string, string[]>>({
        email:["Email", "email", "example@example.com", ""]
    });

    const [resetEmailSent, setResetEmailSent] = useState(false);
    const [resetEmailFailed, setResetEmailFailed] = useState(false);

    const submitHandler = async () => {
        const email = formData.email[3]; 
        const { status } = await ApiCalls.createPasswordReset(email);
        if (status === 200) {
            setResetEmailSent(true);
            setResetEmailFailed(false)
        } else {
            setResetEmailFailed(true);
            setResetEmailSent(false);
        }
    }
    return <>
        <div>
            {resetEmailSent && <p className="bg-green-200 border border-green-400 text-green-800 p-2 rounded m-4">Verification email sent successfully.</p>}
            {resetEmailFailed && <p className="bg-red-200 border border-red-400 text-red-800 p-2 rounded m-4">Failed to send verification email.</p>}
            <Form title="Password Reset" data={formData} setData={setFormData} handleSubmit={submitHandler} />
        </div>
    </>
}

export default CreatePasswordReset;