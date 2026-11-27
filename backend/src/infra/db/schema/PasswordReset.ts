import { index, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { User } from "./Users.js";

export const PasswordReset = pgTable("password_reset", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => User.id, { onDelete: "cascade" }),
    email: varchar("email", { length: 255 }).notNull(),
    // SHA-256 hex digest of the emailed token; the token itself is never stored.
    tokenHash: varchar("token_hash", { length: 64 }).notNull().unique(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    expiresAt: timestamp("expires_at").notNull()
}, (table) => [
    index("password_reset_user_created_idx").on(table.userId, table.createdAt)
]);
