import { Save as SaveButton } from "./Buttons/Save";
import { Close as CloseButton } from "./Buttons/Close";

export const Modal = ({ onClose, onSave, children }: { onClose: () => void, onSave?: () => void, children: React.ReactNode }) => {
    return (
        <div className="w-full h-full z-50 fixed top-0 left-0 bg-white opacity-90 flex justify-center items-center mb-4">
            <div className="border rounded-md p-4 flex flex-col gap-2 w-1/4 h-1/3">
                <h1 className="text-2xl">Modal Header</h1>
                <hr />
                <div className="h-full">
                    {children}
                </div>
                <hr />
                <div className="flex justify-end gap-2 text-lg">
                    {onSave && (
                        <SaveButton onClick={onSave} />
                    )}
                    <CloseButton onClick={onClose} />
                </div>
            </div>
        </div>
    );
};