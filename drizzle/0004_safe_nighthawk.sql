CREATE TABLE "dataset_exports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"benchmark_run_id" uuid,
	"debate_id" uuid,
	"format" text NOT NULL,
	"output_path" text NOT NULL,
	"manifest" jsonb NOT NULL,
	"row_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "llm_provider_calls" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"debate_id" uuid,
	"debate_turn_id" uuid,
	"benchmark_run_id" uuid,
	"stage" text NOT NULL,
	"provider" text NOT NULL,
	"requested_model" text NOT NULL,
	"actual_model" text,
	"prompt_version" text,
	"generation_params" jsonb,
	"input_tokens" integer,
	"output_tokens" integer,
	"total_tokens" integer,
	"latency_ms" integer,
	"cost_estimate" real,
	"status" text DEFAULT 'success' NOT NULL,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "model_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"benchmark_run_id" uuid,
	"model_id" uuid,
	"provider" text NOT NULL,
	"provider_model_id" text NOT NULL,
	"display_name" text,
	"role" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prompt_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_id" text NOT NULL,
	"version" text NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "topic_set_topics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"topic_set_id" uuid NOT NULL,
	"topic_id" uuid NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "topic_sets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"version" text DEFAULT 'v1' NOT NULL,
	"source" text DEFAULT 'curated' NOT NULL,
	"metadata" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "debate_turns" ADD COLUMN "provider" text;--> statement-breakpoint
ALTER TABLE "debate_turns" ADD COLUMN "actual_model_id" text;--> statement-breakpoint
ALTER TABLE "debate_turns" ADD COLUMN "cost_estimate" real;--> statement-breakpoint
ALTER TABLE "topics" ADD COLUMN "source" text DEFAULT 'curated' NOT NULL;--> statement-breakpoint
ALTER TABLE "topics" ADD COLUMN "source_metadata" jsonb;--> statement-breakpoint
ALTER TABLE "dataset_exports" ADD CONSTRAINT "dataset_exports_benchmark_run_id_benchmark_runs_id_fk" FOREIGN KEY ("benchmark_run_id") REFERENCES "public"."benchmark_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dataset_exports" ADD CONSTRAINT "dataset_exports_debate_id_debates_id_fk" FOREIGN KEY ("debate_id") REFERENCES "public"."debates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "llm_provider_calls" ADD CONSTRAINT "llm_provider_calls_debate_id_debates_id_fk" FOREIGN KEY ("debate_id") REFERENCES "public"."debates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "llm_provider_calls" ADD CONSTRAINT "llm_provider_calls_debate_turn_id_debate_turns_id_fk" FOREIGN KEY ("debate_turn_id") REFERENCES "public"."debate_turns"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "llm_provider_calls" ADD CONSTRAINT "llm_provider_calls_benchmark_run_id_benchmark_runs_id_fk" FOREIGN KEY ("benchmark_run_id") REFERENCES "public"."benchmark_runs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "model_snapshots" ADD CONSTRAINT "model_snapshots_benchmark_run_id_benchmark_runs_id_fk" FOREIGN KEY ("benchmark_run_id") REFERENCES "public"."benchmark_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "model_snapshots" ADD CONSTRAINT "model_snapshots_model_id_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."models"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topic_set_topics" ADD CONSTRAINT "topic_set_topics_topic_set_id_topic_sets_id_fk" FOREIGN KEY ("topic_set_id") REFERENCES "public"."topic_sets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topic_set_topics" ADD CONSTRAINT "topic_set_topics_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "dataset_exports_run_idx" ON "dataset_exports" USING btree ("benchmark_run_id");--> statement-breakpoint
CREATE INDEX "dataset_exports_debate_idx" ON "dataset_exports" USING btree ("debate_id");--> statement-breakpoint
CREATE INDEX "llm_provider_calls_debate_idx" ON "llm_provider_calls" USING btree ("debate_id");--> statement-breakpoint
CREATE INDEX "llm_provider_calls_benchmark_run_idx" ON "llm_provider_calls" USING btree ("benchmark_run_id");--> statement-breakpoint
CREATE INDEX "llm_provider_calls_stage_idx" ON "llm_provider_calls" USING btree ("stage");--> statement-breakpoint
CREATE INDEX "model_snapshots_run_idx" ON "model_snapshots" USING btree ("benchmark_run_id");--> statement-breakpoint
CREATE INDEX "model_snapshots_provider_model_idx" ON "model_snapshots" USING btree ("provider","provider_model_id");--> statement-breakpoint
CREATE UNIQUE INDEX "prompt_templates_template_version_idx" ON "prompt_templates" USING btree ("template_id","version");--> statement-breakpoint
CREATE INDEX "prompt_templates_role_idx" ON "prompt_templates" USING btree ("role");--> statement-breakpoint
CREATE INDEX "topic_set_topics_set_idx" ON "topic_set_topics" USING btree ("topic_set_id");--> statement-breakpoint
CREATE INDEX "topic_set_topics_topic_idx" ON "topic_set_topics" USING btree ("topic_id");--> statement-breakpoint
CREATE UNIQUE INDEX "topic_set_topics_unique_idx" ON "topic_set_topics" USING btree ("topic_set_id","topic_id");--> statement-breakpoint
CREATE UNIQUE INDEX "topic_sets_name_version_idx" ON "topic_sets" USING btree ("name","version");--> statement-breakpoint
CREATE INDEX "topic_sets_active_idx" ON "topic_sets" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "debate_turns_accepted_lookup_idx" ON "debate_turns" USING btree ("debate_id","round_number","side","was_rejected");