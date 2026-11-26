-- Outstanding 6-digit reset codes cannot be used with link tokens; users request a new reset link.
DELETE FROM "password_reset";--> statement-breakpoint
DROP TABLE "password_reset_attempt";--> statement-breakpoint
ALTER TABLE "password_reset" DROP COLUMN "code";