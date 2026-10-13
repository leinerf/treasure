import { Outlet } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import UserAuthContext from "./contexts/UserAuthContext";
import { useEffect, useContext } from "react";

function Root() {
    const navigate = useNavigate();
    const { user } = useContext(UserAuthContext);
    useEffect(() => {
        if(!user.isAuthenticated) {            
            navigate("/login");
        }
    }, [user]);

    return (
        <Outlet />
    );
}

export default Root;