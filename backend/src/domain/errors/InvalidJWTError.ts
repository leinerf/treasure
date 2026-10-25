import { InvalidEntryError } from "./InvalidEntryError.js";

export class InvalidJWTError extends InvalidEntryError {
    constructor(message: string) {
        super(message);
        this.name = "InvalidJWTError";
    }
}