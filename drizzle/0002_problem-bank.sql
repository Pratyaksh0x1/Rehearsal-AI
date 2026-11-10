CREATE TABLE IF NOT EXISTS "problem_bank" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"rank_tier" varchar(32) NOT NULL,
	"difficulty" varchar(64) NOT NULL,
	"topic" varchar(128) NOT NULL,
	"title" varchar(255) NOT NULL,
	"payload" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "rating" integer DEFAULT 5;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "problem_bank_rank_tier_idx" ON "problem_bank" USING btree ("rank_tier");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "problem_bank_topic_idx" ON "problem_bank" USING btree ("rank_tier","topic");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "problem_bank_rank_title_unique" ON "problem_bank" USING btree ("rank_tier","title");