CREATE TABLE "debate_evaluations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"debate_id" uuid NOT NULL,
	"judge_model" text NOT NULL,
	"evaluation_order" text NOT NULL,
	"winner" text NOT NULL,
	"pro_score" real NOT NULL,
	"con_score" real NOT NULL,
	"reasoning" text NOT NULL,
	"rubric_scores" jsonb NOT NULL,
	"position_bias_detected" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "debate_turns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"debate_id" uuid NOT NULL,
	"round_number" integer NOT NULL,
	"side" text NOT NULL,
	"model_id" uuid NOT NULL,
	"reflection" text,
	"critique" text,
	"speech" text NOT NULL,
	"word_count" integer NOT NULL,
	"fact_checks_passed" integer DEFAULT 0 NOT NULL,
	"fact_checks_failed" integer DEFAULT 0 NOT NULL,
	"was_rejected" boolean DEFAULT false NOT NULL,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"tokens_used" integer,
	"latency_ms" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "debates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"topic_id" uuid NOT NULL,
	"pro_model_id" uuid NOT NULL,
	"con_model_id" uuid NOT NULL,
	"pro_persona_id" uuid,
	"con_persona_id" uuid,
	"status" text NOT NULL,
	"total_rounds" integer DEFAULT 3 NOT NULL,
	"current_round" integer DEFAULT 0 NOT NULL,
	"fact_check_mode" text DEFAULT 'standard' NOT NULL,
	"winner" text,
	"crowd_winner" text,
	"ai_judge_winner" text,
	"crowd_votes_pro_count" integer DEFAULT 0 NOT NULL,
	"crowd_votes_con_count" integer DEFAULT 0 NOT NULL,
	"crowd_votes_tie_count" integer DEFAULT 0 NOT NULL,
	"started_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fact_checks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"debate_turn_id" uuid NOT NULL,
	"claim" text NOT NULL,
	"verdict" text NOT NULL,
	"confidence" real NOT NULL,
	"sources" jsonb NOT NULL,
	"reasoning" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "model_ratings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"model_id" uuid NOT NULL,
	"rating_type" text NOT NULL,
	"rating" real NOT NULL,
	"rating_deviation" real NOT NULL,
	"volatility" real,
	"debates_count" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "models" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"provider" text NOT NULL,
	"model_id" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"crowd_rating" real DEFAULT 1500 NOT NULL,
	"crowd_rating_deviation" real DEFAULT 350 NOT NULL,
	"ai_quality_rating" real DEFAULT 1500 NOT NULL,
	"ai_quality_rating_deviation" real DEFAULT 350 NOT NULL,
	"ai_quality_volatility" real DEFAULT 0.06 NOT NULL,
	"total_debates" integer DEFAULT 0 NOT NULL,
	"wins" integer DEFAULT 0 NOT NULL,
	"losses" integer DEFAULT 0 NOT NULL,
	"ties" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "personas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"system_prompt" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "topics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"motion" text NOT NULL,
	"category" text NOT NULL,
	"difficulty" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_votes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"debate_id" uuid NOT NULL,
	"user_id" text,
	"session_id" text NOT NULL,
	"vote" text NOT NULL,
	"confidence" integer,
	"reasoning" text,
	"ip_address" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "debate_evaluations" ADD CONSTRAINT "debate_evaluations_debate_id_debates_id_fk" FOREIGN KEY ("debate_id") REFERENCES "public"."debates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "debate_turns" ADD CONSTRAINT "debate_turns_debate_id_debates_id_fk" FOREIGN KEY ("debate_id") REFERENCES "public"."debates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "debate_turns" ADD CONSTRAINT "debate_turns_model_id_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."models"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "debates" ADD CONSTRAINT "debates_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "debates" ADD CONSTRAINT "debates_pro_model_id_models_id_fk" FOREIGN KEY ("pro_model_id") REFERENCES "public"."models"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "debates" ADD CONSTRAINT "debates_con_model_id_models_id_fk" FOREIGN KEY ("con_model_id") REFERENCES "public"."models"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "debates" ADD CONSTRAINT "debates_pro_persona_id_personas_id_fk" FOREIGN KEY ("pro_persona_id") REFERENCES "public"."personas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "debates" ADD CONSTRAINT "debates_con_persona_id_personas_id_fk" FOREIGN KEY ("con_persona_id") REFERENCES "public"."personas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fact_checks" ADD CONSTRAINT "fact_checks_debate_turn_id_debate_turns_id_fk" FOREIGN KEY ("debate_turn_id") REFERENCES "public"."debate_turns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "model_ratings" ADD CONSTRAINT "model_ratings_model_id_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."models"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_votes" ADD CONSTRAINT "user_votes_debate_id_debates_id_fk" FOREIGN KEY ("debate_id") REFERENCES "public"."debates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "debate_evaluations_debate_idx" ON "debate_evaluations" USING btree ("debate_id");--> statement-breakpoint
CREATE INDEX "debate_evaluations_winner_idx" ON "debate_evaluations" USING btree ("winner");--> statement-breakpoint
CREATE INDEX "debate_turns_debate_idx" ON "debate_turns" USING btree ("debate_id");--> statement-breakpoint
CREATE INDEX "debate_turns_round_idx" ON "debate_turns" USING btree ("round_number");--> statement-breakpoint
CREATE INDEX "debates_status_idx" ON "debates" USING btree ("status");--> statement-breakpoint
CREATE INDEX "debates_topic_idx" ON "debates" USING btree ("topic_id");--> statement-breakpoint
CREATE INDEX "debates_pro_model_idx" ON "debates" USING btree ("pro_model_id");--> statement-breakpoint
CREATE INDEX "debates_con_model_idx" ON "debates" USING btree ("con_model_id");--> statement-breakpoint
CREATE INDEX "debates_created_at_idx" ON "debates" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "fact_checks_turn_idx" ON "fact_checks" USING btree ("debate_turn_id");--> statement-breakpoint
CREATE INDEX "fact_checks_verdict_idx" ON "fact_checks" USING btree ("verdict");--> statement-breakpoint
CREATE INDEX "model_ratings_model_idx" ON "model_ratings" USING btree ("model_id");--> statement-breakpoint
CREATE INDEX "model_ratings_type_idx" ON "model_ratings" USING btree ("rating_type");--> statement-breakpoint
CREATE INDEX "model_ratings_created_at_idx" ON "model_ratings" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "models_name_idx" ON "models" USING btree ("name");--> statement-breakpoint
CREATE INDEX "models_provider_idx" ON "models" USING btree ("provider");--> statement-breakpoint
CREATE UNIQUE INDEX "personas_name_idx" ON "personas" USING btree ("name");--> statement-breakpoint
CREATE INDEX "topics_category_idx" ON "topics" USING btree ("category");--> statement-breakpoint
CREATE INDEX "topics_difficulty_idx" ON "topics" USING btree ("difficulty");--> statement-breakpoint
CREATE INDEX "user_votes_debate_idx" ON "user_votes" USING btree ("debate_id");--> statement-breakpoint
CREATE INDEX "user_votes_user_idx" ON "user_votes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_votes_session_idx" ON "user_votes" USING btree ("session_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_votes_unique_idx" ON "user_votes" USING btree ("debate_id","session_id");