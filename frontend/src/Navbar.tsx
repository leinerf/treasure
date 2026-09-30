import { useState } from "react";
import { GiHamburgerMenu } from "react-icons/gi";
import {useNavigate} from "react-router";
import Dropdown from "./Dropdown";
function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const headerData = [
    {
      name: "Store",
      link: "/store"
    }
  ]

  const dropdownTitle = "User";
  const dropdownItems = [
    { name: "Profile", link: "/profile" },
    
    { name: "Account Settings", link: "/account-settings" },
    { name: "Logout", link: "/logout" }
  ];
  function navItems({name, link}: {name: string, link: string}){
    return <a href={link} className="nav-item hover:shadow-md hover:rounded hover:text-bold hover:bg-gray-200 text-center px-4 py-2 m-2 md:p-4 md:m-0" onClick={(e) => {
      e.preventDefault();
      navigate(link);
    }}>{name}</a>
  }

  return <>
    <nav className="navbar bg-gray-100 rounded mx-4 shadow-md p-4 ">
      <div className="flex justify-between w-full">
        <div className="flex items-center nav-left">
        <div className="nav-logo font-bold text-2xl mr-8">
          Treasure
        </div>
        <div className="hidden md:flex nav-items">
            {headerData.map((item, index) => (
              <div key={index} className="nav-item">
                {navItems(item)}
              </div>
            ))}
        </div>  
      </div>
      <div className="hidden md:flex items-center nav-right">
        {localStorage.getItem("authenticated") === "true" && (
          <div>
            <Dropdown title={dropdownTitle} items={dropdownItems} />
          </div>
        )}
        {localStorage.getItem("authenticated") !== "true" && (
          <>
            <div>
              {navItems({name: "Login", link: "/login"})}
            </div>
            <div>
              {navItems({name: "Register", link: "/register"})}
            </div>
          </>
        )}
      </div>
      <div className="hamburger-menu md:hidden lg:hidden">
            <GiHamburgerMenu size={24} onClick={() => setIsMenuOpen(!isMenuOpen)} />
      </div>
      </div>
      <div className={`mobile-menu md:hidden lg:hidden ${isMenuOpen ? "block" : "hidden"} flex justify-center flex-col items-center gap-4`}>
        {localStorage.getItem("authenticated") === "true" && (<>
          {headerData.map((item, index) => (
            <div key={index} className="nav-item">
              {navItems(item)}
            </div>
          
          ))}
          <div>
            <Dropdown title={dropdownTitle} items={dropdownItems} />
          </div>
          
        </>)}
        {localStorage.getItem("authenticated") !== "true" && (
          <>
            <div>
              {navItems({name: "Login", link: "/login"})}
            </div>
            <div>
              {navItems({name: "Register", link: "/register"})}
            </div>
          </>
        )}
      </div>
    </nav>
  </>
}

export default Navbar