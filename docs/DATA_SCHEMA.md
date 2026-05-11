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
- `topic_sets`: versioned sets of topics for repeatable benchmark runs.
- `topic_set_topics`: membership table linking topics to topic sets.
- `prompt_templates`: versioned prompt metadata for reproducible debater, judge, fact-checker, and moderator prompts.
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

Dataset exports write completed debates only to `debates.jsonl` and write excluded failed or evaluation-failed debates to `manifest.json` diagnostics. Failed artifacts are preserved in the database but excluded from aggregate metrics by default.

## Legacy Product-Era Schema

Some legacy tables and columns still exist in `lib/db/schema.ts` for migration compatibility, including user voting/rating concepts from the old product era. Active product-era routes, components, and libraries have been archived under `archive/product-era/`. Do not build new workflows on the legacy voting, prediction-market, DebatePoints, or Superforecaster concepts unless the roadmap is explicitly changed.
