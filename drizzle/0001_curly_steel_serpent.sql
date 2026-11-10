ALTER TABLE "users" ADD COLUMN "technical_rank" varchar(32) DEFAULT 'Bronze' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "technical_points" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "hr_rank" varchar(32) DEFAULT 'Bronze' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "hr_points" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "onboarded_at" timestamp;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "problem_attempts_interview_id_idx" ON "problem_attempts" USING btree ("interview_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reports_user_id_idx" ON "reports" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_tech_leaderboard_idx" ON "users" USING btree ("technical_points");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_hr_leaderboard_idx" ON "users" USING btree ("hr_points");