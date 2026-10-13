
const Container = ({ children }: { children: React.ReactNode }) => {
    return (
        <div className="rounded shadow-container mx-auto px-4 shadow-md shadow-gray-300 p-4 m-4 w-1/3">
            {children}
        </div>
    );
}

export default Container;