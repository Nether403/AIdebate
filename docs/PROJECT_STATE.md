# Project State

Last updated: 2026-06-28

## Current Status

AI Debate Arena is under revival as a focused LLM debate benchmarking and alignment-research workbench. It is not production-ready.

`docs/REVIVAL_ROADMAP.md` is the source of truth for product direction. Older product, deployment, gamification, and production-readiness documents should be treated as stale unless they are explicitly updated to match the roadmap.

## 2026-06-28 End-to-End Verification and Reliability Fixes

The core debate loop was verified end-to-end against live providers for the first time, using disposable Neon branches (created from the `green-feather-38305116` project, then deleted). Both a one-round and a three-round debate were run from configuration through persistence, judging, and JSON export.

Verified working:

- LangGraph orchestration, word-limit enforcement with retry, and turn persistence with no duplicate turns.
- Three-round debates now produce genuine cross-turn rebuttals (previously debaters argued blind).
- Order-swapped judge evaluation (pro-first, con-first, consensus) parses and persists; failures are recorded as `evaluation_failed` with diagnostics rather than silent ties.
- Single-debate JSON export contains full config, transcript, RCR phases, judge evaluations, and provider-call telemetry.

Fixes landed on branch `fix/debate-loop-reliability` (verified by 63 passing unit tests):

- `lib/agents/round-transition.ts`: repopulate the shared transcript so debater nodes receive prior turns as rebuttal context.
- `lib/llm/providers/openrouter.ts`: capture real cost via OpenRouter `usage` accounting instead of a stale static price table. Per-turn and per-call cost estimates are now populated.
- `lib/agents/judge.ts` + `lib/debate/executor.ts`: record real per-evaluation judge telemetry (tokens/cost/latency); relax the verdict schema so free-form fallacy labels and unexpected severities no longer fail the whole evaluation.
- `lib/llm/model-config.ts` + `lib/llm/client.ts`: map infrastructure models to valid OpenRouter slugs on fallback, correct the retired `google/gemini-3-pro-preview` slug to `google/gemini-3.1-pro-preview`, and tolerate both `AZURE_OPENAI_API_DEPLOYMENT_NAME` and `AZURE_OPENAI_DEPLOYMENT_NAME`.
- `lib/db/seed.ts`: seed debater models from the canonical `DEBATER_MODELS` registry so a freshly seeded database is actually runnable (previous seed used provider-native IDs the OpenRouter debater path rejected).

## 2026-06-28 Documentation Cleanup

- Root-level stale docs (deployment/monitoring/celebration guides, early planning drafts, research papers) were moved into `docs/archive/{product-era-docs,planning,research}` (gitignored, kept on disk). Root now holds only `AGENTS.md` and `README.md`.
- Stale `docs/` files (task summaries, UI/UX, component, monitoring, production-deployment, system-status) moved into `docs/archive/product-era-docs`. `docs/` now holds only the canonical revival docs.
- Auxiliary spec artifacts (task summaries, prediction-market, UI evaluation, frontend test results) moved into `docs/archive/specs-history`; the `requirements.md`/`design.md`/`tasks.md` triplet was kept.
- Product-era `testsprite_tests/` relocated under `archive/product-era/`.

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

- The configured Gemini judge is unusable in the current environment: there is no `GOOGLE_API_KEY` for the direct path, and the OpenRouter Gemini route is BYOK-linked to a Google project with billing disabled. The judge must be pointed at a model the available keys can serve (e.g. a first-party-served OpenRouter slug) until Gemini access is restored.
- Accepted turns have no minimum-length enforcement: a model that returns an empty speech produces a persisted 0-word turn that still counts toward a completed debate. The moderator's minimum-length check is only a warning and is not enforced in the fact-checker gate.
- A live debate with fact-checking enabled (`standard`/`strict`) has not yet been exercised end-to-end; the verification runs used `factCheckMode: off`. Tavily + Azure fact-checker wiring is therefore unconfirmed on the current schema.
- `topic_sets` and `prompt_templates` tables exist but have no write paths; they are scaffolding for Phase 3.
- There is still no partial unique constraint on accepted turns (roadmap calls for idempotency to avoid duplicate turns on retry).
- Drizzle snapshot chain pre-dates the migration rename and remains nonlinear; this is only risky the next time `drizzle-kit generate` is run.
- Model registry drift: `DEBATER_MODELS` and the infrastructure model slugs can fall out of sync with OpenRouter's current catalog (the retired `gemini-3-pro-preview` slug is one example). Validate slugs against the live OpenRouter catalog periodically.

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
