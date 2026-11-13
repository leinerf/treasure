import { InvalidEntryError } from "./InvalidEntryError.js";

export class InvalidQueryError extends InvalidEntryError {
    constructor(message: string) {
        super(message);
        this.name = "InvalidQueryError";
    }
}