import { integer, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// One row per email. Requesting a new code updates the row rather than replacing it, so the
// send counter below survives new codes, expiry and lockouts; a successful verification deletes it.
export const EmailVerification = pgTable("email_verification", {
    id: uuid("id").primaryKey().defaultRandom(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    code: varchar("code", { length: 255 }).notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    // Submissions checked against this code, right or wrong. The 5th wrong one makes the code
    // unusable, so a 6-digit code can't be found by guessing. A new code starts again at 0.
    attempts: integer("attempts").notNull().default(0),
    // Codes sent to this address in the current window, and when that window began. Caps how many
    // verification emails one address can receive, so the endpoint can't flood an inbox.
    sendCount: integer("send_count").notNull().default(1),
    sendWindowStartedAt: timestamp("send_window_started_at").notNull().default(sql`now()`)
});