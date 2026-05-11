CREATE TABLE "user_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"session_id" text NOT NULL,
	"debate_points" integer DEFAULT 1000 NOT NULL,
	"total_votes" integer DEFAULT 0 NOT NULL,
	"correct_predictions" integer DEFAULT 0 NOT NULL,
	"total_bets_placed" integer DEFAULT 0 NOT NULL,
	"total_bets_won" integer DEFAULT 0 NOT NULL,
	"total_points_wagered" integer DEFAULT 0 NOT NULL,
	"total_points_won" integer DEFAULT 0 NOT NULL,
	"is_superforecaster" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_profiles_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "user_profiles_session_id_unique" UNIQUE("session_id")
);
--> statement-breakpoint
ALTER TABLE "user_votes" ADD COLUMN "wager_amount" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "user_votes" ADD COLUMN "odds_at_bet" real;--> statement-breakpoint
ALTER TABLE "user_votes" ADD COLUMN "payout_amount" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "user_votes" ADD COLUMN "was_correct" boolean;--> statement-breakpoint
CREATE UNIQUE INDEX "user_profiles_user_idx" ON "user_profiles" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_profiles_session_idx" ON "user_profiles" USING btree ("session_id");