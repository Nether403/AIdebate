# Data Schema

Last updated: 2026-06-30

This document describes the active research-workbench data model. `lib/db/schema.ts` is the implementation source of truth.

## Core Artifact Tables

- `topics`: debate motions with category, difficulty, usage counts, and source metadata.
- `models`: LLM model registry entries used by debaters and infrastructure roles.
- `personas`: optional experimental persona variables.
- `debates`: one debate artifact, including benchmark run linkage, configuration, judge/fact-checker model metadata, generation parameters, status, winner fields, and error state. The `errorState` jsonb is discriminated by a `stage` field: judge/execution failures coexist with cost-governor trips (`{ stage: 'cost-governor', ceilingType: 'per_debate' | 'per_run', ceiling, accumulated, measuredAt }`). A cost trip only changes `status`/`errorState`/`completedAt`; turns, provider calls, votes, and tallies are preserved.
- `debate_turns`: accepted or rejected model turns with RCR text, side, model, factuality counters, token usage, latency, actual provider/model, and cost estimate.
- `fact_checks`: claim-level annotations tied to debate turns, including verdict, confidence, reasoning, and sources.
- `debate_evaluations`: judge outputs and diagnostics, including provider/model, rubric scores, parse status, raw response, schema version, consensus metadata, and error messages.

## Phase 3 Benchmark Tables

- `benchmark_runs`: groups debates under a named benchmark execution and stores the run config plus aggregate status counts. The `config` jsonb may carry optional cost ceilings `perDebateCostCeilingUsd` and `perRunCostCeilingUsd` (each a finite USD value in `[0, 1_000_000]`, validated by `parseBenchmarkRunConfig`); when present the cost governor trips offending debates to `evaluation_failed`. The `evaluationFailedDebates` counter is incremented once per debate's first transition into `evaluation_failed`.
- `topic_sets`: versioned sets of topics for repeatable benchmark runs. Write path: `createTopicSet()` in `lib/topics/topic-sets.ts` and the `topicset:create` CLI. A benchmark debate config may set `topicSetId` (instead of `topicId`) to draw a topic from the set; debates sharing a set are spread across it round-robin.
- `topic_set_topics`: membership table linking topics to topic sets, ordered by `position` (de-duplicated on insert).
- `prompt_templates`: versioned prompt registry for reproducible debater, judge, fact-checker, and moderator prompts. Write path: `lib/prompts/registry.ts` (`seedPromptTemplates()`), the `prompts:seed` CLI, and `db:seed`. Agents reference the registry version constants (`DEBATER_PROMPT_VERSION`, `FACT_CHECK_PROMPT_VERSION`, `JUDGE_SCHEMA_VERSION`); a record's `promptVersion` equals `${templateId}-${version}` (e.g. `debate-rcr-v1`), which links back to a registry row.
- `model_snapshots`: benchmark-run-scoped snapshots of model/provider identifiers and configuration.
- `llm_provider_calls`: durable provider-call telemetry for debater, fact-checker, and judge stages.
- `dataset_exports`: export manifests for benchmark-run or single-debate datasets.

## Provider Call Telemetry

`llm_provider_calls` records:

- debate ID, debate turn ID, and benchmark run ID when available.
- pipeline stage, provider, requested model, actual model, and prompt version.
- generation parameters.
- input/output/total token counts.
- latency and cost estimate.
- success/error status and error message.

This table is intentionally separate from turn records so non-turn calls such as claim extraction, evidence analysis, and judge evaluation can be preserved.

## Export Semantics

Single-debate exports include:

- debate metadata and configuration.
- topic source metadata.
- participant model/persona metadata.
- full transcript and fact-check annotations.
- judge evaluations and parse diagnostics.
- provider-call telemetry.

Dataset exports produce a per-run set of files under the output directory:

- `debates.jsonl`: one row per completed debate. Includes `factualityWinner` and `persuasionTruthDivergence` (`aligned` | `diverged` | `inconclusive`) derived from fact-check verdicts vs the judged winner.
- `turns.jsonl`: one row per accepted or rejected turn, keyed by `debateId` and `turnId`.
- `fact_checks.jsonl`: one row per claim with verdict, confidence, reasoning, and sources.
- `judge_evaluations.jsonl`: one row per judge evaluation (pro-first, con-first, tiebreaker, consensus).
- `provider_calls.jsonl`: one row per durable LLM provider call, including stage, tokens, latency, and cost.
- `model_snapshots.jsonl`: one row per persisted benchmark-run model snapshot.
- `model_metrics.csv`: per (provider, providerModelId) aggregate metrics, including `divergentDebates` and `charismaticLiarWins` (persuasion-vs-truth divergence per model).
- `manifest.json`: run config, schema version (`dataset-export-v2`), list of files written, row counts, and excluded debate diagnostics.

Only `completed` debates contribute to `debates.jsonl`, `turns.jsonl`, `fact_checks.jsonl`, `judge_evaluations.jsonl`, `provider_calls.jsonl`, and `model_metrics.csv`. `failed` and `evaluation_failed` debates are preserved in the database and enumerated in the manifest diagnostics so they can be inspected but do not skew aggregate metrics. `buildModelMetrics` excludes `evaluation_failed` debates from win/loss/tie aggregation by default; callers may pass `{ includeEvaluationFailed: true }` to opt them in. An individual `evaluation_failed` debate remains fully inspectable/exportable (retained turns, provider calls, metadata, and `errorState`) via the single-debate export transforms.

## Crowd Voting (Plain) and Removed Gamification

`user_votes` retains plain crowd-voting signal only: `vote`, `confidence`, `reasoning`, `debateId`, `userId`, `sessionId`, `ipAddress`, `wasCorrect`, `createdAt`. The `debates` crowd-tally columns (`crowdVotesProCount`, `crowdVotesConCount`, `crowdVotesTieCount`, `crowdWinner`) are also retained. These are protected by a migration guard (`lib/db/migration-guard.ts`) and a static schema-guard test (`lib/db/__tests__/schema-guard.test.ts`) that reject any drop/rename/retype of a protected column.

The legacy gamification structures have been **removed** from the active schema (cost-governor spec, 2026-06-30):

- The `userProfiles` table and its relations are deleted.
- The betting columns `wagerAmount`, `oddsAtBet`, and `payoutAmount` are removed from `user_votes`.
- Migration `drizzle/0005_clear_johnny_blaze.sql` performs the removal inside a transaction, relocating the dropped structures into an unreachable `archive` schema (`archive.user_profiles_legacy`, `archive.user_votes_betting_legacy`) for historical reference. It is idempotent (`IF EXISTS`/`IF NOT EXISTS` guards) so re-application is a no-op success.

Do not build new workflows on prediction-market, DebatePoints, or Superforecaster concepts unless the roadmap is explicitly changed.

## Cost Governance

The cost governor (`lib/cost/*` + `lib/cost/governor.ts`) is a thin layer over already-recorded data — no new cost tables. It sums `llm_provider_calls.cost_estimate` (`$0`/`null` normalize to a `0` contribution) per debate and per run, and trips offending debates to `evaluation_failed` when a configured ceiling is strictly exceeded. It is invoked from `recordLLMProviderCall` after a successful insert (fails soft) and gated in `runBenchmark` (reads ceilings before dispatch; stops launching debates once the run is tripped; fails the run on an invalid ceiling).

The daily spending cap (`lib/middleware/cost-guard.ts`) computes real `Current_Day_Spend` from `llm_provider_calls` over the current UTC day window `[00:00:00.000, 23:59:59.999]`, denies when `currentSpend + estimatedCost > cap`, and fails closed (deny) if spend cannot be computed.
