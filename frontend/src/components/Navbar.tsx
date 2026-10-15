import { useState, useContext } from "react";
import { GiHamburgerMenu } from "react-icons/gi";
import Dropdown from "./Dropdown";
import NavLink from "./NavLink";
import UserAuthContext from "../contexts/UserAuthContext";

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user } = useContext(UserAuthContext);
  const generalLinks = [{ name: "Store", link: "/store" }];

  const authenticatedLinks = [
    { name: "Profile", link: "/profile" },
    { name: "Logout", link: "/logout" }
  ];

  const authLinks = [
    { name: "Login", link: "/login" }, 
    { name: "Register", link: "/register" }
  ];

  const createNavLinks = (links: { name: string; link: string }[]) => {
    return links.map((item, index) => (
      <div key={index} className="nav-item px-4 py-2">
        <NavLink name={item.name} link={item.link} />
      </div>
    ));
  };

  return <>
    <nav className="navbar bg-gray-100 rounded mx-4 shadow-md p-4 ">
      <div className="flex justify-between w-full">
        <div className="flex items-center nav-left">
        <div className="nav-logo font-bold text-2xl mr-8">
          Treasure
        </div>
        <div className="hidden md:flex nav-items">
            {createNavLinks(generalLinks)}
        </div>  
      </div>
      <div className="hidden md:flex  items-center nav-right">
        {user.isAuthenticated && (
          <Dropdown title={user.username}>
            {createNavLinks(authenticatedLinks)}
          </Dropdown>
        )}
        {!user.isAuthenticated && (createNavLinks(authLinks))}
      </div>
      <div className="hamburger-menu md:hidden lg:hidden">
            <GiHamburgerMenu size={24} onClick={() => setIsMenuOpen(!isMenuOpen)} />
      </div>
      </div>
      {isMenuOpen && (
        <div className={`mobile-menu md:hidden lg:hidden flex justify-center flex-col items-center gap-4`}>
          {user.isAuthenticated && (<>  
            <div>
              <Dropdown title={user.username}>
                {createNavLinks(authenticatedLinks)}
              </Dropdown>
            </div>
          </>)}
          {!user.isAuthenticated && (
            <>
              {createNavLinks(authLinks)}
            </>
          )}
          {createNavLinks(generalLinks)}
        </div>
      )}

    </nav>
  </>
}

export default Navbar