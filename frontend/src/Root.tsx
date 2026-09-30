import { Outlet } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

function Root() {
    const navigate = useNavigate();
    useEffect(() => {
        if(localStorage.getItem("authenticated") !== "true") {            
            navigate("/login");
        }
    });

    return (
        <Outlet />
    );
}

export default Root;