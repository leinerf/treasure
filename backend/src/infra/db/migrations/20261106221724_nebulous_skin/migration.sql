CREATE TYPE "role" AS ENUM('admin', 'user');--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "role" "role" DEFAULT 'user'::"role";