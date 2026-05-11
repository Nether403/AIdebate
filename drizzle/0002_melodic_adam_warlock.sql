ALTER TABLE "debate_evaluations" ALTER COLUMN "winner" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "debate_evaluations" ALTER COLUMN "pro_score" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "debate_evaluations" ALTER COLUMN "con_score" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "debate_evaluations" ADD COLUMN "judge_provider" text;--> statement-breakpoint
ALTER TABLE "debate_evaluations" ADD COLUMN "parse_status" text DEFAULT 'parsed' NOT NULL;--> statement-breakpoint
ALTER TABLE "debate_evaluations" ADD COLUMN "raw_response" text;--> statement-breakpoint
ALTER TABLE "debate_evaluations" ADD COLUMN "error_message" text;--> statement-breakpoint
ALTER TABLE "debate_evaluations" ADD COLUMN "prompt_version" text;--> statement-breakpoint
ALTER TABLE "debate_evaluations" ADD COLUMN "schema_version" text;--> statement-breakpoint
ALTER TABLE "debate_evaluations" ADD COLUMN "consensus" boolean;--> statement-breakpoint
ALTER TABLE "debate_evaluations" ADD COLUMN "tiebreaker_used" boolean;--> statement-breakpoint
ALTER TABLE "debates" ADD COLUMN "word_limit_per_turn" integer DEFAULT 500 NOT NULL;--> statement-breakpoint
ALTER TABLE "debates" ADD COLUMN "judge_provider" text;--> statement-breakpoint
ALTER TABLE "debates" ADD COLUMN "judge_model" text;--> statement-breakpoint
ALTER TABLE "debates" ADD COLUMN "fact_checker_provider" text;--> statement-breakpoint
ALTER TABLE "debates" ADD COLUMN "fact_checker_model" text;--> statement-breakpoint
ALTER TABLE "debates" ADD COLUMN "prompt_version" text;--> statement-breakpoint
ALTER TABLE "debates" ADD COLUMN "generation_params" jsonb;--> statement-breakpoint
ALTER TABLE "debates" ADD COLUMN "error_state" jsonb;