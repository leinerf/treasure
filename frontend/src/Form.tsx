function Input({name, label, type, value, placeholder, data, setData}: {name: string, label: string, type: string, value: string, placeholder: string, data: Record<string, string[]>, setData: (data: Record<string, string[]>) => void}){
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setData({...data, [name]: [data[name][0], e.target.value]});
        console.log(data);
    }

    return <div>
        <label className="block text-gray-700 text-sm font-bold mb-2">{label}</label>
        <input name={name} value={value} type={type} placeholder={placeholder} className="border border-gray-300 rounded px-4 py-2 mb-4 w-full" onChange={handleChange} />
    </div>    
}

function Form({title, data, setData, handleSubmit, onClose=undefined}: {title: string, data: Record<string, string[]>, setData: (data: Record<string, string[]>) => void, handleSubmit: () => void, onClose?: () => void}) {
    return <>
    <form onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
    }} className="flex flex-col w-full max-w-sm mx-auto bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <h2 className="text-2xl font-bold mb-4">{title} Form</h2>
        {Object.keys(data).map((key, index) => {
            return <Input key={index} name={key} label={data[key][0]} type={data[key][1]} placeholder={data[key][2]} value={data[key][3]} data={data} setData={setData} />
        })}
        <div className="flex gap-2 justify-end">
            {onClose && <button className="bg-gray-800 hover:bg-gray-500 text-gray-100 font-bold py-2 px-4 border border-gray-300 rounded" type="button" onClick={onClose}>Cancel</button>  }
            <button className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 border border-gray-300 rounded" type="submit">{title}</button>
        </div>
        
    </form>
    </>
    
}

export default Form;