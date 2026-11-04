import { pgTable, uuid, varchar } from "drizzle-orm/pg-core";

export const User = pgTable("user", {
    id: uuid("id").primaryKey().defaultRandom(),
    username: varchar("username", { length: 255 }).notNull().unique(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    password: varchar("password", { length: 255 }).notNull()
});