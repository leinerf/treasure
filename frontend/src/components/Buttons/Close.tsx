export const Close = ({ onClick }: { onClick: () => void }) => {
    return (
        <button onClick={onClick} className="bg-gray-500 text-white px-2 py-1 rounded">Close</button>
    );
};