import { EntryNotFoundError } from "./EntryNotFound.js";

export class EmailVerificationNotFoundError extends EntryNotFoundError {
    constructor() {
        super("Invalid or missing verification code. Check the code or request a new one.");
        this.name = "EmailVerificationNotFoundError";
    }
}
