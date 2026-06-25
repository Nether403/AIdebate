# Project State

Last updated: 2026-05-11

## Current Status

AI Debate Arena is under revival as a focused LLM debate benchmarking and alignment-research workbench. It is not production-ready.

`docs/REVIVAL_ROADMAP.md` is the source of truth for product direction. Older product, deployment, gamification, and production-readiness documents should be treated as stale unless they are explicitly updated to match the roadmap.

## Confirmed Baseline

- The working tree is dirty and contains both tracked edits and untracked files.
- `docs/REVIVAL_ROADMAP.md` and `AGENTS.md` define the revival direction.
- Product-era surfaces (dashboard, leaderboard, statistics, betting, prediction-market, public-sharing, rating, abuse-detection, anonymized export) are archived under `archive/product-era/`.
- Ad-hoc and product-era development scripts are archived under `scripts/archive/`. The active scripts are limited to the benchmark loop (`run-debate`, `run-benchmark`, `export-debate`, `export-dataset`, `seed-database`, `clean-desktop-ini`).
- `npm run build` passes as of 2026-05-11 (22 active routes).
- `npm run typecheck` passes as of 2026-05-11 and now covers `scripts/`.
- `npm test` passes as of 2026-05-11: 60 tests, 0 failures.
- `npm run lint` exits 0 with 47 non-blocking unused-vars warnings.
- Direct OpenAI usage is being replaced with Azure OpenAI configuration for OpenAI-style infrastructure calls.
- `llm-council-master/` is untracked reference code and does not affect build, lint, test, or typecheck.
- `testsprite_tests/` contains product-era tests and reports that include prediction-market and gamification assumptions.
- Local `desktop.ini` files exist and are ignored by Git.
- `.env.example` is the only tracked `.env*` file found in the baseline check.

## Active Risks

- The core debate loop has not been verified end-to-end against a live provider on the current schema.
- Judge provider-call telemetry is still synthetic; the executor writes a single placeholder `judge-consensus` row rather than per-evaluation telemetry for pro-first, con-first, and tiebreaker calls.
- `fact_checks` sources are persisted and carried through exports, but an end-to-end live smoke has not confirmed real sources appear on disk.
- `topic_sets` and `prompt_templates` tables exist but have no write paths; they are scaffolding for Phase 3.
- There is still no partial unique constraint on accepted turns (roadmap calls for idempotency to avoid duplicate turns on retry).
- Drizzle snapshot chain pre-dates the migration rename and remains nonlinear; this is only risky the next time `drizzle-kit generate` is run.

## Phase 1 Cleanup Follow-Up (2026-05-11)

- Fixed the dataset-export script schema mismatch: `datasetExports.outputPath` is now passed correctly and `rowCount` is populated.
- Removed `scripts/` from `tsconfig.json` excludes so active scripts are typechecked. Moved all ad-hoc and product-era scripts to `scripts/archive/`.
- Renamed duplicate migration ordinal `0004_sleepy_black_panther.sql` to `0003_sleepy_black_panther.sql` and updated `_journal.json`.
- Archived `/api/export/anonymized` under `archive/product-era/api/export/anonymized/` and removed the empty `app/api/export` directory.
- Rewrote `app/page.tsx` and `app/layout.tsx` to match the revival scope. Removed the broken `/leaderboard` CTA and product-era marketing copy.

## Phase 3 Work In Progress (2026-05-11)

- `runBenchmark` now persists `model_snapshots` for pro, con, judge, and fact-checker roles at run start. Debater snapshots resolve `provider`, `providerModelId`, and `displayName` from the `models` table. Judge and fact-checker snapshots are sourced from the central infrastructure model config.
- `collectPendingSnapshots` is a pure helper with unit tests in `lib/benchmark/__tests__/snapshots.test.ts`.

## Phase 4 Work In Progress (2026-05-11)

- `scripts/export-dataset.ts` now emits per-table JSONL files: `debates.jsonl`, `turns.jsonl`, `fact_checks.jsonl`, `judge_evaluations.jsonl`, `provider_calls.jsonl`, and `model_snapshots.jsonl`.
- A `model_metrics.csv` is written alongside the JSONL files. Metrics count wins, losses, ties, unknown outcomes, evaluation failures, and failed executions per (provider, provider model id) pair. Only `completed` debates contribute to wins/losses/ties.
- The `manifest.json` has schema version `dataset-export-v2`, lists every file written, and records row counts.
- Pure dataset helpers live in `lib/benchmark/dataset.ts` with unit tests in `lib/benchmark/__tests__/dataset.test.ts`.

## Latest Phase 2 Work

- Debate lifecycle statuses now use `pending`, `running`, `completed`, `failed`, `evaluation_failed`, and `cancelled` in active runtime code.
- Debate records persist word limit, judge provider/model, fact-checker provider/model, prompt version, generation parameters, and error state.
- Judge evaluations have fields for provider, parse status, raw response, error message, prompt version, schema version, consensus, and tiebreaker usage.
- The executor no longer reinserts turns from final graph state; accepted turns are persisted by the round transition node to reduce duplicate-turn risk.
- Single-debate export includes the persisted config and judge parse metadata.

## Latest Cleanup And Phase 3 Work (Earlier)

- Product-era code was archived under `archive/product-era/`; see `docs/PHASE_1_CLEANUP.md`.
- `docs/DATA_SCHEMA.md` documents active artifact, benchmark, provider-call, and export tables.
- Debate turns persist token usage, latency, provider, actual model ID, and cost estimate when available.
- A durable `llm_provider_calls` table and telemetry helper record debater, fact-checker, and judge stage calls.
- Fact-check claim extraction and evidence analysis use the central fact-checker model configuration.
- Judge response parsing uses a Zod schema before persistence.
- Single-debate exports include benchmark run ID, topic source metadata, turn provider/cost metadata, and provider-call telemetry.
- New CLI scripts exist for one-off debate runs, single-debate exports, and benchmark dataset exports.
