import { ipKeyGenerator, rateLimit } from "express-rate-limit";

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

/**
 * Failed logins per username and IP: 5 every 15 minutes. Only failures count, so normal
 * logins never use it up. Keying by username and IP together means an attacker's IPs get
 * blocked while the account owner, on their own IP, can still sign in: strangers can't
 * lock the owner out the way a per-account-only limit would let them.
 */
export const loginFailureLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    skipSuccessfulRequests: true,
    keyGenerator: (req) => {
        const username = typeof req.body?.username === "string" ? req.body.username.trim().toLowerCase() : "";
        return `${ipKeyGenerator(req.ip ?? "")}:${username}`;
    },
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { error: "Too many failed login attempts. Try again later." }
});
