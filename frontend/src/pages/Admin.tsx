import { useEffect, useState } from "react";
import { Modal } from "../components/Modal";
import ErrorMessage from "../components/ErrorMessage";
import { InternalAPI } from "../api/internalAPI/InternalAPI";
import { type Role, type User } from "../api/internalAPI/interfaces/UserResponse"
import { useSearchParams } from "react-router";
import { SearchBar } from "../components/SearchBar";
/**
 * Admin page for managing users
 * Initialize with the first set of users 0, 40
 * Record first id and last id of the current set of users
 * pull next 
 */

const PAGE_SIZE = 8
export const Admin = () => {
    const [searchParams, setSearchParams] = useSearchParams();

    const [users, setUsers] = useState<User[]>([]);
    const [count, setCount] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [showUserDetails, setShowUserDetails] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [rightLimit, setRightLimit] = useState(0);
    const [leftLimit, setLeftLimit] = useState(0);
    const [currentPage, setCurrentPage] = useState(searchParams.get("page") ? parseInt(searchParams.get("page") ?? "0") : 0);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/immutability
        initializePage();
    }, []);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/immutability
        setLeftLimit(0);
        setRightLimit(Math.ceil(count / PAGE_SIZE) - 1);
    }, [count]);

    const selectUser = (user: User) => {
        setUser(user);
        setShowUserDetails(true);
    };
    
    const closeUserDetails = () => {
        setShowUserDetails(false);
        setUser(null);
    };

    const handleDeleteUser = async (user: User) => {
        // Implement delete logic here
        const { status } = await InternalAPI.deleteUser(user.id);
        if (status === 200) {
            setUsers(users.filter(u => u.id !== user.id));
            setCount(count - 1);
            setShowUserDetails(false);
            setUser(null);
        } else {
            setError("Failed to delete user");
        }
    };
    
    const prevPage = () => {
        // Implement previous page logic here
        if (currentPage > leftLimit) {
            handlePageClick(currentPage - 1);
            
        }
    };

    const nextPage = () => {
        // Implement next page logic here
        if (currentPage < rightLimit) {
            handlePageClick(currentPage + 1);
        }
    };

    const firstPage = () => {
        handlePageClick(0);
    };

    const lastPage = () => {
        const last = Math.ceil(count / PAGE_SIZE) - 1;
        handlePageClick(last);
    };

    const grabUsersByPageNum = async (page: number) => {
        const offset = page * PAGE_SIZE;
        const limit = PAGE_SIZE;
        const { data, count, status } = await InternalAPI.getUsers(offset, limit);

        if (status === 200 && data && data.length > 0 && count !== undefined) {
            return { users: [...data], count };
        } else {
            
            return { users: [], count: 0 };
        }
    };


    const initializePage = async () => {
        const page = parseInt(searchParams.get("page") ?? "1") - 1;
        const {users, count } = await grabUsersByPageNum(page);
        if (users && count !== undefined) {
            setUsers(users);
            setCount(count);
        } else {
            const { users:start, count:startCount } = await grabUsersByPageNum(0);
            setUsers(start);
            setCount(startCount);
        }
        setCurrentPage(page);
    };



    const createPageNumbers = () => {
        const pageNumbers: number[] = [];
        
        for(let i = currentPage - 2; i <= currentPage + 2; i++) {
            if(i >= leftLimit && i <= rightLimit) {
                pageNumbers.push(i);
            }
        }

        return pageNumbers;
    }

    const handlePageClick = async (page: number) => {
        const { users, count } = await grabUsersByPageNum(page);
        if (users && count !== undefined) {
            setUsers(users);
            setCount(count);
            setCurrentPage(page);
            setSearchParams({ page: (page + 1).toString() });
        }
    };

    const handleSearch = async (query: string) => {
        
        const { data, status } = await InternalAPI.searchUser(query);
        if (status === 200 && data && data.length > 0) {
            const transformedData = data.map((user: User) => ({ id: user.id, name: user.username, email: user.email, role: user.role }));
            return [...transformedData];
        } else {
            return [];
        }
    };

    const handleSelect = (result: {id?: string, name: string, email?: string, role?: Role}) => {
        if (!result.id || !result.name || !result.email || !result.role) {
            return;
        }
        selectUser({ id: result.id, username: result.name, email: result.email, role: result.role });
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
            <div className="w-2/3 flex flex-row justify-center items-center gap-2">
                <SearchBar onSearch={handleSearch} onSelect={handleSelect} title="Search Users" />
            </div>
            

            <div className="w-2/3 flex flex-col justify-center items-center">
                <ErrorMessage message={error} />
                <ul className="w-2/3 ">
                    {users.map((u) => (
                        <li key={u.id} className="border rounded-sm border-gray-300 p-2 m-2 flex flex-row gap-2 w-ful">
                            <span className="text-lg">{u.username}</span>
                            <div className="ml-auto flex flex-row gap-2">
                                <button onClick={() => { selectUser(u); }} className="ml-auto bg-blue-500 text-white px-2 py-1 rounded">Details</button>
                                <button onClick={() => handleDeleteUser(u)} className="ml-auto bg-red-500 text-white px-2 py-1 rounded">Delete</button>
                            </div>
                        </li>
                    ))}
                </ul>
                <div className="flex flex-row gap-2 m-2 items-center">
                    <button onClick={firstPage} disabled={currentPage === leftLimit} className="bg-gray-200 text-black px-2 py-1 rounded disabled:opacity-50">{"<<"}</button>
                    <button onClick={prevPage} disabled={currentPage === leftLimit} className="bg-gray-200 text-black px-2 py-1 rounded disabled:opacity-50">{"<"}</button>
                    {createPageNumbers().map((pageNumber: number) => 
                        <span key={pageNumber} className={`px-2 py-1 rounded ${pageNumber === currentPage ? "bg-blue-500 text-white" : "bg-gray-200 text-black"}`} onClick={() => { handlePageClick(pageNumber); }}>
                            {pageNumber + 1}
                        </span>
                    )}
                    <button onClick={nextPage} disabled={currentPage === rightLimit} className="bg-gray-200 text-black px-2 py-1 rounded disabled:opacity-50">{">"}</button>
                    <button onClick={lastPage} disabled={currentPage === rightLimit} className="bg-gray-200 text-black px-2 py-1 rounded disabled:opacity-50">{">>"}</button>
                </div>
            </div>
        </>
    );
};