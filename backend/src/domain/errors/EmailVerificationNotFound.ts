import { EntryNotFoundError } from "./EntryNotFound.js";

export class EmailVerificationNotFoundError extends EntryNotFoundError {
    constructor(message: string) {
        super(message);
        this.name = "EmailVerificationNotFoundError";
    }
}