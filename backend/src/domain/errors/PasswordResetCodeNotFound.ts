import { EntryNotFoundError } from "./EntryNotFound.js";

export class PasswordResetCodeNotFoundError extends EntryNotFoundError {
    constructor(message: string) {
        super(message);
        this.name = "PasswordResetCodeNotFoundError";
    }
}