import { InvalidEntryError } from "./InvalidEntryError.js";

export class InvalidPasswordError extends InvalidEntryError {
    constructor(message: string) {
        super(message);
        this.name = "InvalidPasswordError";
    }
}