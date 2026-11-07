import { InvalidEntryError } from "./InvalidEntryError.js";

export class InvalidOffsetOrLimitError extends InvalidEntryError {
    constructor(message: string) {
        super(message);
        this.name = "InvalidOffsetOrLimitError";
    }
}