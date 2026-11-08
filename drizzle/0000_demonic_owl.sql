CREATE TABLE IF NOT EXISTS "interviews" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"user_id" varchar(64) NOT NULL,
	"type" varchar(32) NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"ended_at" timestamp,
	"score" integer,
	"transcript" text,
	"feedback_json" jsonb
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "problem_attempts" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"user_id" varchar(64) NOT NULL,
	"interview_id" varchar(64),
	"source" varchar(32) NOT NULL,
	"external_id" varchar(128) NOT NULL,
	"difficulty" varchar(32),
	"solved" boolean DEFAULT false NOT NULL,
	"submitted_code" text,
	"language" varchar(32),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "problems" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"source" varchar(32) NOT NULL,
	"external_id" varchar(128) NOT NULL,
	"title" varchar(255) NOT NULL,
	"url" text NOT NULL,
	"difficulty" varchar(64) NOT NULL,
	"topics" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"rank_tier" varchar(32) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "reports" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"user_id" varchar(64),
	"category" varchar(64) NOT NULL,
	"description" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "reviews" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"name" varchar(128) NOT NULL,
	"text" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"google_id" varchar(128),
	"email" varchar(255) NOT NULL,
	"username" varchar(64),
	"rank" varchar(32) DEFAULT 'Bronze' NOT NULL,
	"points" integer DEFAULT 0 NOT NULL,
	"resume_url" text,
	"resume_text" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_google_id_unique" UNIQUE("google_id"),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "interviews" ADD CONSTRAINT "interviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "problem_attempts" ADD CONSTRAINT "problem_attempts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "problem_attempts" ADD CONSTRAINT "problem_attempts_interview_id_interviews_id_fk" FOREIGN KEY ("interview_id") REFERENCES "public"."interviews"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "reports" ADD CONSTRAINT "reports_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "interviews_user_history_idx" ON "interviews" USING btree ("user_id","started_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "problem_attempts_user_solved_idx" ON "problem_attempts" USING btree ("user_id","solved");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "problems_rank_tier_idx" ON "problems" USING btree ("rank_tier");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "problems_source_external_idx" ON "problems" USING btree ("source","external_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_rank_idx" ON "users" USING btree ("rank");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_points_idx" ON "users" USING btree ("points");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_leaderboard_idx" ON "users" USING btree ("rank","points");