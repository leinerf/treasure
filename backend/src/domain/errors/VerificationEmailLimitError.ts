/** Too many verification emails sent to one address recently. Answered with HTTP 429. */
export class VerificationEmailLimitError extends Error {
    constructor() {
        super("Too many verification emails requested for this address. Try again later.");
        this.name = "VerificationEmailLimitError";
    }
}
