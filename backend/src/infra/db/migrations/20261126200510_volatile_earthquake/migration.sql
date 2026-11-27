CREATE TABLE "password_reset_attempt" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"attempted_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "refresh_token" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"expires_at" timestamp NOT NULL,
	"rotated_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "password_reset" ADD COLUMN "user_id" uuid;--> statement-breakpoint
CREATE INDEX "password_reset_attempt_user_time_idx" ON "password_reset_attempt" ("user_id","attempted_at");--> statement-breakpoint
ALTER TABLE "password_reset_attempt" ADD CONSTRAINT "password_reset_attempt_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;