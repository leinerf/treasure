import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ApiCalls from "./services/apiCalls";
import { useContext } from "react";
import UserAuthContext from "./contexts/UserAuthContext";

function Logout() {
    const { login } = useContext(UserAuthContext);
    const navigate = useNavigate();
    const handleLogout = async () => {
        try {
            const { data, status } = await ApiCalls.logout();
            if (status !== 200) {
                console.error("Failed to logout: Status code", status);
            }
            login("");
            console.log(data.message);
        } catch (error) {
            console.error("Failed to logout:", error);
        }
    };
    useEffect(() => {
        handleLogout();
        navigate("/login")
    }, []);
    return (
        <div>
            <h1>Logout</h1>
        </div>
    );
}

export default Logout;