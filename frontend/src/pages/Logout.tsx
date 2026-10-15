import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useContext } from "react";
import UserAuthContext from "../contexts/UserAuthContext";

function Logout() {
    const { authenticate } = useContext(UserAuthContext);
    const navigate = useNavigate();
    useEffect(() => {
        authenticate({username: "", email: ""});
        navigate("/login");
    }, []);
    return (
        <div>
            <h1>Logout</h1>
        </div>
    );
}

export default Logout;