import { EntryExistsError } from "./EntryExistsError.js";

export class UserExistsError extends EntryExistsError {
    constructor(message: string) {
        super(message);
        this.name = "UserExistsError";
    }
}