import Form from "./Form";

function ModalForm({isOpen, onClose, title, data, setData, handleSubmit}: {isOpen: boolean, onClose: () => void, title: string, data: Record<string, string[]>, setData: (data: Record<string, string[]>) => void, handleSubmit: () => void}) {
    return isOpen && (
        <div className="absolute w-full h-full z-20 top-0 left-0 bg-gray-300/90 flex items-center justify-center ">
            <Form title={title} data={data} setData={setData} handleSubmit={handleSubmit} onClose={onClose} />
        </div>
    )
}

export default ModalForm;