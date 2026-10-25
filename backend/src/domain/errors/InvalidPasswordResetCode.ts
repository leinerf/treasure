import { InvalidEntryError } from "./InvalidEntryError.js";

export class InvalidPasswordResetCodeError extends InvalidEntryError {
    constructor(message: string) {
        super(message);
        this.name = "InvalidPasswordResetCodeError";
    }
}