import { EntryNotFoundError } from "./EntryNotFound.js";

export class UserNotFoundError extends EntryNotFoundError {
    constructor(message: string) {
        super(message);
        this.name = "UserNotFoundError";
    }
}