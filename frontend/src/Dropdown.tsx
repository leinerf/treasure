import { useState } from "react";
function Dropdown({ title, items }: { title: string, items: { name: string, link: string }[] }) {
    const [isOpen, setIsOpen] = useState(false);
    
    return <>
    <div >
        <button onClick={() => {
            setIsOpen(!isOpen);
        }} className={`flex items-center align-center justify-items-center flex-row px-4 py-2 rounded-md hover:cursor-pointer w-[100px] ${isOpen ? "bg-gray-300" : ""}`}>
            <span>{title}</span>
            <svg className="w-4 h-4 ms-1.5 -me-0.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 9-7 7-7-7"/></svg>
        </button>
    </div>
    {isOpen && 
    <div id="dropdown"  className=" absolute bg-gray-100 shadow-md rounded-md">
        <ul className="p-2 text-sm text-body font-medium">
            {items.map((item, index) => (
                <li key={index} className="px-4 py-2 hover:cursor-pointer hover:bg-gray-200">
                    <a href={item.link}>{item.name}</a>
                </li>
            ))}
        </ul>
    </div>
    }
  </>
}

export default Dropdown;