import { rateLimit } from "express-rate-limit";

export const apiRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { error: "Too many requests, please try again later." }
});

/**
 * Reset requests per IP, on top of the per-account cap of 3 emails an hour. Stops one machine
 * from using up the cap across many accounts or sending a stream of reset emails.
 */
export const passwordResetRequestLimit = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 5,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { error: "Too many password reset requests, please try again later." }
});
