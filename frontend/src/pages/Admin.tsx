import { useState } from "react";
import { Modal } from "../components/Modal";
export const Admin = () => {
    const [pageIndex, setPageIndex] = useState(0);
    const [showUserDetails, setShowUserDetails] = useState(false);
    const [user, setUser] = useState<{ username: string, email: string } | null>(null);
    const prevPage = () => {
        setPageIndex((prev) => Math.max(prev - 1, 0));
    };
    const nextPage = () => {
        setPageIndex((prev) => prev + 1);
    };
    const selectPage = (page: number) => {
        setPageIndex(page);
    };

    const selectUser = (user: { username: string, email: string }) => {
        setUser(user);
        setShowUserDetails(true);
    };
    
    const closeUserDetails = () => {
        setShowUserDetails(false);
        setUser(null);
    };

    const handleDeleteUser = (user: { username: string, email: string }) => {
        // Implement delete logic here
    };
    return (
        <>
            {showUserDetails && 
            <Modal onClose={closeUserDetails}>
                <div className="flex flex-col">
                    <h1 className="text-xl font-bold p-2">User Details</h1>
                    <ul className="list-disc list-inside p-2">
                        <li >Username: {user?.username}</li>
                        <li>Email: {user?.email}</li>
                    </ul>
                </div>
            </Modal>}
            <div className="w-2/3 flex flex-col justify-center items-center">
                <ul className="w-2/3 ">
                    {Array.from({ length: 8}).map((_, index) => (
                        <li key={index} className="border rounded-sm border-gray-300 p-2 m-2 flex flex-row gap-2 w-ful">
                            <span className="text-lg">User</span>
                            <div className="ml-auto flex flex-row gap-2">
                                <button onClick={() => { selectUser({ username: "User", email: "user@example.com" }); }} className="ml-auto bg-blue-500 text-white px-2 py-1 rounded">Details</button>
                                <button onClick={() => handleDeleteUser({ username: "User", email: "user@example.com" })} className="ml-auto bg-red-500 text-white px-2 py-1 rounded">Delete</button>
                            </div>
                        </li>
                    ))}
                </ul>
                <div className="flex flex-row gap-2 m-2">
                    <button onClick={prevPage} className="bg-gray-200 text-black px-2 py-1 rounded">{"<"}</button>
                    {Array.from({ length: 8}).map((_, index) => (
                        <button key={index} onClick={() => selectPage(index)} className={`px-2 py-1 rounded ${index === pageIndex ? "bg-blue-500 text-white" : "bg-gray-200 text-black"}`}>Page {index + 1}</button>
                    ))}
                    <button onClick={nextPage} className="bg-gray-200 text-black px-2 py-1 rounded" > {">"} </button>
                </div>
            </div>
        </>
    );
};