import { useState } from "react";
function Dropdown({ title, children }: { title: string, children: React.ReactNode[] | React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    
    return <>
    <div className="relative">
        <button onClick={() => {
            setIsOpen(!isOpen);
        }} className={`rounded flex items-center align-center justify-items-center flex-row px-4 py-2 rounded-md hover:cursor-pointer hover:bg-gray-200 min-w-[100px] ${isOpen ? "bg-gray-200" : ""}`}>
            <span>{title}</span>
        </button>
            {isOpen && 
    <div id="dropdown"  className={"absolute mt-1 bg-gray-100 shadow-md rounded-md min-w-[100px]"}>
        <ul className="p-2">
            {!Array.isArray(children) && (
                <li className="p-2">
                    {children}
                </li>
            )}
            {Array.isArray(children) && children.map((child, index) => (
                <li key={index} className="p-2">
                    {child}
                </li>
            ))}
        </ul>
    </div>
    }
    </div>

  </>
}

export default Dropdown;