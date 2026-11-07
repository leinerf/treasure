import { useEffect, useState } from "react";
import { Modal } from "../components/Modal";
import ErrorMessage from "../components/ErrorMessage";
import { InternalAPI } from "../api/internalAPI/InternalAPI";

const PAGE_SIZE = 8;
type AdminUser = { id: string, username: string, email: string };

export const Admin = () => {
    const [pageIndex, setPageIndex] = useState(0);
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [hasNextPage, setHasNextPage] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showUserDetails, setShowUserDetails] = useState(false);
    const [user, setUser] = useState<{ username: string, email: string } | null>(null);

    useEffect(() => {
        let cancelled = false;
        // Fetch one extra row to know whether another page exists
        InternalAPI.getUsers(pageIndex * PAGE_SIZE, PAGE_SIZE + 1).then((response) => {
            if (cancelled) return;
            if (response.status !== 200 || !response.data) {
                setError(response.error ?? "Error getting users");
                setUsers([]);
                setHasNextPage(false);
                return;
            }
            setError(null);
            setUsers(response.data.slice(0, PAGE_SIZE));
            setHasNextPage(response.data.length > PAGE_SIZE);
        });
        return () => { cancelled = true; };
    }, [pageIndex]);

    const prevPage = () => {
        setPageIndex((prev) => Math.max(prev - 1, 0));
    };
    const nextPage = () => {
        if (hasNextPage) setPageIndex((prev) => prev + 1);
    };

    const selectUser = (user: { username: string, email: string }) => {
        setUser(user);
        setShowUserDetails(true);
    };
    
    const closeUserDetails = () => {
        setShowUserDetails(false);
        setUser(null);
    };

    const handleDeleteUser = () => {
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
                <ErrorMessage message={error} />
                <ul className="w-2/3 ">
                    {users.map((u) => (
                        <li key={u.id} className="border rounded-sm border-gray-300 p-2 m-2 flex flex-row gap-2 w-ful">
                            <span className="text-lg">{u.username}</span>
                            <div className="ml-auto flex flex-row gap-2">
                                <button onClick={() => { selectUser(u); }} className="ml-auto bg-blue-500 text-white px-2 py-1 rounded">Details</button>
                                <button onClick={() => handleDeleteUser()} className="ml-auto bg-red-500 text-white px-2 py-1 rounded">Delete</button>
                            </div>
                        </li>
                    ))}
                </ul>
                <div className="flex flex-row gap-2 m-2 items-center">
                    <button onClick={prevPage} disabled={pageIndex === 0} className="bg-gray-200 text-black px-2 py-1 rounded disabled:opacity-50">{"<"}</button>
                    <span className="px-2 py-1 rounded bg-blue-500 text-white">Page {pageIndex + 1}</span>
                    <button onClick={nextPage} disabled={!hasNextPage} className="bg-gray-200 text-black px-2 py-1 rounded disabled:opacity-50">{">"}</button>
                </div>
            </div>
        </>
    );
};