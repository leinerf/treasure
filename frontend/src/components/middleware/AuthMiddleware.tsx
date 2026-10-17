import { Outlet } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import UserAuthContext from "../../contexts/UserAuthContext";
import { useEffect, useContext } from "react";

function AuthMiddleware() {
    const navigate = useNavigate();
    const { user } = useContext(UserAuthContext);
    useEffect(() => {
        if(!user.isAuthenticated) {            
            navigate("/login");
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    return (
        <Outlet />
    );
}

export default AuthMiddleware;