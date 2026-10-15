import { type ReactNode } from "react";

interface FormProps {
    children: ReactNode | ReactNode[];
    submit?: {
        submitFunction: (e: React.SyntheticEvent) => void | Promise<void>;
        buttonText?: string;
    }
    formTitle?: string;
    
}

function Form({children, submit, formTitle}: FormProps) {
    return (
        <form className="flex flex-col gap-4 justify-center rounded-sm w-1/3 min-w-[300px] p-4 m-4">
            {formTitle && 
            <div className="text-center">
                <h2 className="text-4xl font-bold mb-4 ">{formTitle}</h2>
                <hr className="my-4" />
            </div>
            }
            {children && Array.isArray(children) ? children.map((child, index) => {
                return <div key={index}>{child}</div>;
            }) : <div>{children}</div>}
            {submit && (
                <div className="mt-4">
                    <button type="submit" onClick={submit.submitFunction} className="bg-blue-500 text-white py-2 px-4 rounded w-full hover:bg-blue-600 hover:cursor-pointer">
                        {submit.buttonText || "Submit"}
                    </button>
                </div>
            )}
        </form>
    );
}

export default Form;