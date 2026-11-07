import { InvalidEntryError } from "./InvalidEntryError.js";

export class InvalidRoleError extends InvalidEntryError {
    constructor(message: string) {
        super(message);
        this.name = "InvalidRoleError";
    }
}