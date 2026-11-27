import { check, pgTable, uuid, varchar, pgEnum } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { Role } from "../../../domain/models/entity/User.js";

export const roleEnum = pgEnum("role", Object.values(Role) as [string]);

export const User = pgTable("user", {
    id: uuid("id").primaryKey().defaultRandom(),
    username: varchar("username", { length: 255 }).notNull().unique(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    password: varchar("password", { length: 255 }).notNull(),
    role: roleEnum().default(Role.User)
}, (table) => [
    // Emails are stored lowercase (see ValidationService.normalizeEmail). With the unique
    // constraint above, two accounts can't share an email that differs only by case.
    check("user_email_lowercase", sql`${table.email} = lower(${table.email})`)
]);