import { EntryNotFoundError } from "./EntryNotFound.js";

export class EmailVerificationNotFoundError extends EntryNotFoundError {
    constructor(email: string) {
        super(`Email verification not found for email: ${email}`);
        this.name = "EmailVerificationNotFoundError";
    }
}