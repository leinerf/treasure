CREATE TYPE "trait" AS ENUM('basic', 'profile');--> statement-breakpoint
CREATE TABLE "photo_metadata" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"filename" varchar(255) NOT NULL,
	"size" varchar(255) NOT NULL,
	"trait" "trait" NOT NULL,
	"user_id" uuid NOT NULL
);
