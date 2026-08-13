import { useState } from "react";
import { GiHamburgerMenu } from "react-icons/gi";
import {useNavigate} from "react-router";
function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const headerData = [
    {
      name: "Profile",
      link: "/profile"
    },
    {
      name: "Store",
      link: "/store"
    }
  ]

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
          <div>
            {navItems({name: "Login", link: "/login"})}
          </div>
          <div>
            {navItems({name: "Register", link: "/register"})}
          </div>
      </div>
      <div className="hamburger-menu md:hidden lg:hidden">
            <GiHamburgerMenu size={24} onClick={() => setIsMenuOpen(!isMenuOpen)} />
      </div>
      </div>
      <div className={`mobile-menu md:hidden lg:hidden ${isMenuOpen ? "block" : "hidden"} flex justify-center flex-col items-center gap-4`}>
        {headerData.map((item, index) => (
          <div key={index} className="nav-item">
            {navItems(item)}
          </div>
        ))}
        <div>
          {navItems({name: "Login", link: "/login"})}
        </div>
        <div>
          {navItems({name: "Register", link: "/register"})}
        </div>
      </div>
    </nav>
  </>
}

export default Navbar