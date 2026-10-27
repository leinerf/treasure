function ErrorMessage({ message }: { message: string | null }) {
    return <>
        {message && <p className="error-message border-1 rounded-sm border-red-500 text-red-500 bg-red-100 p-2 rounded">{message}</p>}
    </>
}

export default ErrorMessage;