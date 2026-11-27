import { index, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { User } from "./Users.js";

export const RefreshToken = pgTable("refresh_token", {
    id: uuid("id").primaryKey().defaultRandom(),
    // Deleting a user deletes their sessions, and a session can't point at a user that doesn't exist.
    userId: uuid("user_id").notNull().references(() => User.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at").notNull(),
    rotatedAt: timestamp("rotated_at")
}, (table) => [
    // Token lookups use the primary key (the token's jti). This index serves the per-user
    // deletes: expired sessions on every login, and every session on revoke-all.
    index("refresh_token_user_id_idx").on(table.userId)
]);
