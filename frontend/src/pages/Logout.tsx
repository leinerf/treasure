import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useContext } from "react";
import UserAuthContext from "../contexts/UserAuthContext";
import apiCalls from "../api/internalAPI/apiCalls";
function Logout() {
    const { authenticate } = useContext(UserAuthContext);
    const navigate = useNavigate();
    useEffect(() => {
        apiCalls.logout().finally(() => {
            authenticate({username: "", email: "", profileImg: null});
            navigate("/login");
        });
    }, []);
    return (
        <div>
            <h1>Logout</h1>
        </div>
    );
}

export default Logout;