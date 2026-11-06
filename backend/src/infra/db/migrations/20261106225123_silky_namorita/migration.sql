CREATE TYPE "trait" AS ENUM('basic', 'profile');--> statement-breakpoint
CREATE TYPE "role" AS ENUM('admin', 'user');--> statement-breakpoint
CREATE TABLE "email_verification" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"email" varchar(255) NOT NULL,
	"code" varchar(255) NOT NULL,
	"expires_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "password_reset" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"email" varchar(255) NOT NULL,
	"code" varchar(255) NOT NULL,
	"expires_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "photo_metadata" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"filename" varchar(255) NOT NULL,
	"path" varchar(255) NOT NULL,
	"size" integer NOT NULL,
	"trait" "trait" NOT NULL,
	"user_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"username" varchar(255) NOT NULL UNIQUE,
	"email" varchar(255) NOT NULL UNIQUE,
	"password" varchar(255) NOT NULL,
	"role" "role" DEFAULT 'user'::"role"
);
