import { InvalidEntryError } from "./InvalidEntryError.js";

export class InvalidEmailVerificationError extends InvalidEntryError {
    constructor(message: string) {
        super(message);
        this.name = "InvalidEmailVerificationError";
    }
}