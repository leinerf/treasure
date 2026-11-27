import { InvalidEntryError } from "./InvalidEntryError.js";

/**
 * A failed login. Used for both an unknown username and a wrong password, with the same
 * message, so a login attempt never reveals whether the username exists.
 */
export class InvalidCredentialsError extends InvalidEntryError {
    constructor() {
        super("Invalid username or password");
        this.name = "InvalidCredentialsError";
    }
}
