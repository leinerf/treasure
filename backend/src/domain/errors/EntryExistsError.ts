export class EntryExistsError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "EntryExistsError";
    }
}