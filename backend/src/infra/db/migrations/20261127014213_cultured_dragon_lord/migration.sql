-- Keep only the newest code per email so the unique constraint below can be added.
DELETE FROM "email_verification" a USING "email_verification" b
WHERE a."email" = b."email" AND (a."expires_at" < b."expires_at" OR (a."expires_at" = b."expires_at" AND a."id" < b."id"));--> statement-breakpoint
ALTER TABLE "email_verification" ADD COLUMN "send_count" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "email_verification" ADD COLUMN "send_window_started_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "email_verification" ADD CONSTRAINT "email_verification_email_key" UNIQUE("email");