import { integer, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const EmailVerification = pgTable("email_verification", {
    id: uuid("id").primaryKey().defaultRandom(),
    email: varchar("email", { length: 255 }).notNull(),
    code: varchar("code", { length: 255 }).notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    // Submissions checked against this code, right or wrong. The code is deleted after the 5th
    // wrong one, so a 6-digit code can't be found by guessing. A new code starts again at 0.
    attempts: integer("attempts").notNull().default(0)
});