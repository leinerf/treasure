import { pgTable, uuid, varchar, pgEnum } from "drizzle-orm/pg-core";
import { Role } from "../../../domain/models/entity/User.js";

export const roleEnum = pgEnum("role", Object.values(Role) as [string]);

export const User = pgTable("user", {
    id: uuid("id").primaryKey().defaultRandom(),
    username: varchar("username", { length: 255 }).notNull().unique(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    password: varchar("password", { length: 255 }).notNull(),
    role: roleEnum().default(Role.User)
});