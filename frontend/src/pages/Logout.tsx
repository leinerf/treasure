import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useContext } from "react";
import UserAuthContext from "../contexts/UserAuthContext";
import { InternalAPI } from "../api/internalAPI/InternalAPI";
function Logout() {
    const { authenticate } = useContext(UserAuthContext);
    const navigate = useNavigate();
    useEffect(() => {
        InternalAPI.logout().finally(() => {
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