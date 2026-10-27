function SuccessMessage({ message }: { message: string | null }) {
    return <>
        {message && <p className="success-message border-1 rounded-sm border-green-500 text-green-500 bg-green-100 p-2 rounded">{message}</p>}
    </>
}

export default SuccessMessage;