CREATE TABLE "benchmark_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"config" jsonb NOT NULL,
	"total_debates" integer DEFAULT 0 NOT NULL,
	"completed_debates" integer DEFAULT 0 NOT NULL,
	"failed_debates" integer DEFAULT 0 NOT NULL,
	"evaluation_failed_debates" integer DEFAULT 0 NOT NULL,
	"started_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "debates" ADD COLUMN "benchmark_run_id" uuid;--> statement-breakpoint
CREATE INDEX "benchmark_runs_status_idx" ON "benchmark_runs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "benchmark_runs_created_at_idx" ON "benchmark_runs" USING btree ("created_at");--> statement-breakpoint
ALTER TABLE "debates" ADD CONSTRAINT "debates_benchmark_run_id_benchmark_runs_id_fk" FOREIGN KEY ("benchmark_run_id") REFERENCES "public"."benchmark_runs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "debates_benchmark_run_idx" ON "debates" USING btree ("benchmark_run_id");