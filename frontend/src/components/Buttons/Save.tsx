export const Save = ({ onClick }: { onClick: () => void }) => {
    return (
        <button onClick={onClick} className="bg-blue-500 text-white px-2 py-1 rounded">Save</button>
    );
};