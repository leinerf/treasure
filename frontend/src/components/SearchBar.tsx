import { useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import { FaSearch } from "react-icons/fa";


export function SearchBar({ onSearch, onSelect, title }: { onSearch: (query: string) => Promise<Array<{name: string}>>, onSelect: (result: {name: string}) => void, title?: string }) {
    const [query, setQuery] = useState("");
    const [showResults, setShowResults] = useState(false);
    const [results, setResults] = useState<Array<{name: string}>>([]);
    const debounced = useDebouncedCallback(async (value: string) => {
        const result = await onSearch(value);
        if (result && result.length > 0) {
            setResults(result);
            setShowResults(true);
        } else {
            setShowResults(false);
        }
        // This will be called after 300ms of inactivity with the latest value
    }, 1000);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = e.target;
        setQuery(value);
        setShowResults(false);
        if(value.trim().length >= 3) {
            debounced(value);
        }
        
    };

    return (
        <div className="flex flex-col w-full items-center gap-2 mb-4">
            {title && <h2 className="text-xl mr-2">{title}:</h2>}
            <div className="w-full flex flex-row justify-center items-center gap-2">
                
                <div className="relative w-2/3">
                <input
                    type="text"
                    value={query}
                    onChange={handleChange}
                    placeholder="Search..."
                    className="border rounded p-2 w-full"
                />
                {showResults && (
                <div className="absolute bg-white border rounded mt-2 p-2 w-full max-h-60 overflow-hidden overflow-y-scroll">
                    <ul>
                        {results.map((result, index) => (
                            <li key={index} className="p-1 cursor-pointer hover:bg-gray-200" onClick={() => onSelect(result)}>
                                {result.name}
                            </li>
                        ))}
                    </ul>
                </div>
                )}
                </div>
                <FaSearch className="border rounded h-9 w-9 p-2" />
            </div>
        </div>
    );
}