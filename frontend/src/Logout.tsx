import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ApiCalls from "./services/apiCalls";

function Logout() {
    const navigate = useNavigate();
    const handleLogout = async () => {
        try {
            const { data, status } = await ApiCalls.logout();
            if (status !== 200) {
                console.error("Failed to logout: Status code", status);
            }
            console.log(data.message);
        } catch (error) {
            console.error("Failed to logout:", error);
        }
    };
    useEffect(() => {
        handleLogout();
        localStorage.clear();
        navigate("/login")
    }, []);
    return (
        <div>
            <h1>Logout</h1>
        </div>
    );
}

export default Logout;