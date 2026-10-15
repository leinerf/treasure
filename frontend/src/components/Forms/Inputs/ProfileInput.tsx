
function ProfileInput({ label, onChange, imgUrl }: { label: string; onChange: (file: File | null) => void, imgUrl: File | null }) {
    return (
        <div className="mb-4 flex flex-col">
            {imgUrl instanceof File && <img src={URL.createObjectURL(imgUrl)} alt="Preview" className="rounded-full mt-2 h-40 w-40 self-center" />}
            <label className="block text-gray-700 text-sm font-bold mb-2">{label}</label>
            <input
                type="file"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                onChange={(e) => onChange(e.target.files ? e.target.files[0] : null)}
            />
            
        </div>
    );
}

export default ProfileInput;