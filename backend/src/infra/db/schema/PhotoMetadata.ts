import { integer, numeric, pgEnum, pgTable, uuid, varchar } from "drizzle-orm/pg-core";

export const traitEnum = pgEnum("trait", ["basic", "profile"]);

export const PhotoMetadata = pgTable("photo_metadata", {
    id: uuid("id").primaryKey().defaultRandom(),
    filename: varchar("filename", { length: 255 }).notNull(),
    path: varchar("path", { length: 255 }).notNull(),
    size: integer("size").notNull(),
    trait: traitEnum().notNull(),
    userId: uuid("user_id").notNull()
});