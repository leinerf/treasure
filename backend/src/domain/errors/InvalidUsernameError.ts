import { InvalidEntryError } from "./InvalidEntryError.js";

export class InvalidUsernameError extends InvalidEntryError {
    constructor(message: string) {
        super(message);
        this.name = "InvalidUsernameError";
    }
}