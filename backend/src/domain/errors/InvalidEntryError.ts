export class InvalidEntryError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "InvalidEntryError";
    }
}