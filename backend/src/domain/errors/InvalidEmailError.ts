import { InvalidEntryError } from "./InvalidEntryError.js";

export class InvalidEmailError extends InvalidEntryError {
    constructor(message: string) {
        super(message);
        this.name = "InvalidEmailError";
    }
}