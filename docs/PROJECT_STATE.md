# Project State

Last updated: 2026-05-11

## Current Status

AI Debate Arena is under revival as a focused LLM debate benchmarking and alignment-research workbench. It is not production-ready.

`docs/REVIVAL_ROADMAP.md` is the source of truth for product direction. Older product, deployment, gamification, and production-readiness documents should be treated as stale unless they are explicitly updated to match the roadmap.

## Confirmed Baseline

- The working tree is dirty and contains both tracked edits and untracked files.
- `docs/REVIVAL_ROADMAP.md` and `AGENTS.md` now define the revival direction.
- Product-era dashboard, leaderboard, statistics, betting, prediction-market, sharing, rating, and abuse-detection surfaces have been archived under `archive/product-era/`.
- `npm run typecheck` passes after the Phase 1 cleanup and Phase 2/3 schema updates as of 2026-05-11.
- `npm run build` passes as of 2026-05-11.
- `npm run typecheck` passes as of 2026-05-11.
- `npm test` passes as of 2026-05-11: 42 tests, 0 failures.
- `npm run lint` exits 0 as of 2026-05-11, with 80 non-blocking warnings that still need cleanup.
- Direct OpenAI usage is being replaced with Azure OpenAI configuration for OpenAI-style infrastructure calls.
- `llm-council-master/` is untracked reference code and should not affect build, lint, test, or typecheck.
- `testsprite_tests/` contains product-era tests and reports that include prediction-market and gamification assumptions.
- Local `desktop.ini` files exist and are ignored by Git.
- `.env.example` is the only tracked `.env*` file found in the baseline check.

## Active Risks

- The core debate loop is not yet research-grade.
- Judge parse failures are now represented as `evaluation_failed` artifacts in the main executor path, but this still needs mock and live-provider verification.
- Fact-check sources are now carried into persisted records from the graph path, but export verification is still required.
- Provider-call metadata still needs an explicit durable model beyond turn-level token/latency fields.
- Provider-call metadata now has a durable table and write path for debater, fact-checker, and judge stages; live-provider verification is still needed.
- The most obvious product-era routes are now archived rather than active.
- Some tracked docs still claim or imply old production/social-product readiness and need archival or rewrite.
- `benchmark_runs`, `topic_sets`, prompt templates, model snapshots, provider-call telemetry, and dataset export manifests now exist in schema; migrations and live benchmark-loop verification still need completion.

## Current Priority

1. Make build, typecheck, lint, and default unit tests reliable.
2. Remove stale/reference code from active checks.
3. Narrow active navigation to research workflows.
4. Stabilize one debate from configuration to judged/exportable artifact.

## Latest Phase 2 Work

- Debate lifecycle statuses now use `pending`, `running`, `completed`, `failed`, `evaluation_failed`, and `cancelled` in active runtime code.
- Debate records now persist word limit, judge provider/model, fact-checker provider/model, prompt version, generation parameters, and error state.
- Judge evaluations now have fields for provider, parse status, raw response, error message, prompt version, schema version, consensus, and tiebreaker usage.
- The executor no longer reinserts turns from final graph state; accepted turns are persisted by the round transition node to reduce duplicate-turn risk.
- Single-debate export now includes the new persisted config and judge parse metadata.
- Migration `drizzle/0002_melodic_adam_warlock.sql` was generated for the new debate and evaluation metadata columns.

## Latest Cleanup And Phase 3 Work

- Product-era code was archived under `archive/product-era/`; see `docs/PHASE_1_CLEANUP.md`.
- `docs/DATA_SCHEMA.md` now documents active artifact, benchmark, provider-call, and export tables.
- Debate turns now persist token usage, latency, provider, actual model ID, and cost estimate when available.
- A durable `llm_provider_calls` table and telemetry helper now record debater, fact-checker, and judge stage calls.
- Fact-check claim extraction and evidence analysis now use the central fact-checker model configuration.
- Judge response parsing now uses a Zod schema before persistence.
- Single-debate exports include benchmark run ID, topic source metadata, turn provider/cost metadata, and provider-call telemetry.
- New CLI scripts exist for one-off debate runs, single-debate exports, and benchmark dataset JSONL plus manifest exports.
