import { pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const PasswordReset = pgTable("password_reset", {
    id: uuid("id").primaryKey().defaultRandom(),
    email: varchar("email", { length: 255 }).notNull(),
    code: varchar("code", { length: 255 }).notNull(),
    expiresAt: timestamp("expires_at").notNull()
});