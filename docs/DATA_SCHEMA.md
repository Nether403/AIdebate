# Data Schema

Last updated: 2026-05-11

This document describes the active research-workbench data model. `lib/db/schema.ts` is the implementation source of truth.

## Core Artifact Tables

- `topics`: debate motions with category, difficulty, usage counts, and source metadata.
- `models`: LLM model registry entries used by debaters and infrastructure roles.
- `personas`: optional experimental persona variables.
- `debates`: one debate artifact, including benchmark run linkage, configuration, judge/fact-checker model metadata, generation parameters, status, winner fields, and error state.
- `debate_turns`: accepted or rejected model turns with RCR text, side, model, factuality counters, token usage, latency, actual provider/model, and cost estimate.
- `fact_checks`: claim-level annotations tied to debate turns, including verdict, confidence, reasoning, and sources.
- `debate_evaluations`: judge outputs and diagnostics, including provider/model, rubric scores, parse status, raw response, schema version, consensus metadata, and error messages.

## Phase 3 Benchmark Tables

- `benchmark_runs`: groups debates under a named benchmark execution and stores the run config plus aggregate status counts.
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

- `debates.jsonl`: one row per completed debate.
- `turns.jsonl`: one row per accepted or rejected turn, keyed by `debateId` and `turnId`.
- `fact_checks.jsonl`: one row per claim with verdict, confidence, reasoning, and sources.
- `judge_evaluations.jsonl`: one row per judge evaluation (pro-first, con-first, tiebreaker, consensus).
- `provider_calls.jsonl`: one row per durable LLM provider call, including stage, tokens, latency, and cost.
- `model_snapshots.jsonl`: one row per persisted benchmark-run model snapshot.
- `model_metrics.csv`: per (provider, providerModelId) aggregate metrics.
- `manifest.json`: run config, schema version (`dataset-export-v2`), list of files written, row counts, and excluded debate diagnostics.

Only `completed` debates contribute to `debates.jsonl`, `turns.jsonl`, `fact_checks.jsonl`, `judge_evaluations.jsonl`, `provider_calls.jsonl`, and `model_metrics.csv`. `failed` and `evaluation_failed` debates are preserved in the database and enumerated in the manifest diagnostics so they can be inspected but do not skew aggregate metrics.

## Legacy Product-Era Schema

Some legacy tables and columns still exist in `lib/db/schema.ts` for migration compatibility, including user voting/rating concepts from the old product era. Active product-era routes, components, and libraries have been archived under `archive/product-era/`. Do not build new workflows on the legacy voting, prediction-market, DebatePoints, or Superforecaster concepts unless the roadmap is explicitly changed.
