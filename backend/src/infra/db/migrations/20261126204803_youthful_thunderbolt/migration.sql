-- Sessions whose user no longer exists would block the constraint; they cannot be used anyway.
DELETE FROM "refresh_token" WHERE "user_id" NOT IN (SELECT "id" FROM "user");--> statement-breakpoint
ALTER TABLE "refresh_token" ADD CONSTRAINT "refresh_token_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;