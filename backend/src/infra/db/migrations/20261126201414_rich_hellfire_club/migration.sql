ALTER TABLE "password_reset" ADD COLUMN "token_hash" varchar(64) NOT NULL;--> statement-breakpoint
ALTER TABLE "password_reset" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "password_reset" ALTER COLUMN "user_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "password_reset" ADD CONSTRAINT "password_reset_token_hash_key" UNIQUE("token_hash");--> statement-breakpoint
CREATE INDEX "password_reset_user_created_idx" ON "password_reset" ("user_id","created_at");--> statement-breakpoint
ALTER TABLE "password_reset" ADD CONSTRAINT "password_reset_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;