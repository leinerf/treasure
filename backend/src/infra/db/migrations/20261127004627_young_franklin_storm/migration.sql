-- Store every email lowercase. If two accounts differ only by case, this UPDATE fails on the
-- unique constraint and the migration stops: merge or rename one of them by hand, then rerun.
UPDATE "user" SET "email" = lower("email") WHERE "email" <> lower("email");--> statement-breakpoint
UPDATE "email_verification" SET "email" = lower("email") WHERE "email" <> lower("email");--> statement-breakpoint
UPDATE "password_reset" SET "email" = lower("email") WHERE "email" <> lower("email");--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_email_lowercase" CHECK ("email" = lower("email"));