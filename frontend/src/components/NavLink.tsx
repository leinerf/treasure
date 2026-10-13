import { useNavigate } from "react-router";

const NavLink = ({name, link}: {name: string, link: string}) => {
  const navigate = useNavigate();
    return <a href={link} className="nav-item hover:underline" onClick={(e) => {
      e.preventDefault();
      navigate(link);
    }}>{name}</a>
  }

  export default NavLink;