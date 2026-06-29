# AI Debate Arena — Documentation

AI Debate Arena is a lean **LLM debate benchmarking and alignment-research workbench**. It runs structured pro/con debates between language models, fact-checks them, judges them with bias mitigation, and exports the result as clean, inspectable research artifacts.

This directory holds the canonical documentation. The project is under revival and is **not production-ready**; readiness is proven through build/typecheck/lint/test and benchmark-loop verification, not asserted.

> **Source of truth:** `docs/REVIVAL_ROADMAP.md` defines scope and priority. Anything that conflicts with the roadmap should be treated as stale until updated.

## Start here

| If you want… | Read |
|---|---|
| A one-page summary for a meeting or intro | [`EXECUTIVE_BRIEF.md`](EXECUTIVE_BRIEF.md) |
| The full description of what it is and how it works | [`OVERVIEW.md`](OVERVIEW.md) |
| Use cases, synthetic-data ideas, and integration patterns | [`POSSIBILITIES.md`](POSSIBILITIES.md) |

## Canonical docs

- [`REVIVAL_ROADMAP.md`](REVIVAL_ROADMAP.md) — source-of-truth roadmap, scope, and definition of done.
- [`PROJECT_STATE.md`](PROJECT_STATE.md) — current, dated repo status and active risks.
- [`RESEARCH_GOALS.md`](RESEARCH_GOALS.md) — research purpose, scope, and instrumentation.
- [`BENCHMARK_METHODOLOGY.md`](BENCHMARK_METHODOLOGY.md) — the benchmark loop, run statuses, and scoring framing.
- [`DATA_SCHEMA.md`](DATA_SCHEMA.md) — active artifact, benchmark, telemetry, and export schema.
- [`HYBRID_ARCHITECTURE.md`](HYBRID_ARCHITECTURE.md) — how models are routed across direct APIs and OpenRouter.
- [`RUNBOOK.md`](RUNBOOK.md) — how to run a benchmark.
- [`KNOWN_LIMITATIONS.md`](KNOWN_LIMITATIONS.md) — caveats and interpretation rules.
- [`PHASE_1_CLEANUP.md`](PHASE_1_CLEANUP.md) — record of archived product-era surfaces.

## Quick start

```bash
# Verify the toolchain
npm run build
npm run typecheck
npm run lint
npm test

# Check that model slugs are still live on OpenRouter
npm run models:validate
```

To run and export a debate, see the commands in the root [`README.md`](../README.md) and the step-by-step in [`RUNBOOK.md`](RUNBOOK.md).

## What this produces

Every completed debate is exportable as an analysis-ready artifact: full transcript with RCR (reflect/critique/refine) phases, per-claim fact-checks **with sources**, structured judge evaluations (judged in both argument orders, with consensus and parse status), and full per-call telemetry (provider, model, tokens, latency, cost, failure state). Benchmark runs export as JSONL + CSV with a versioned manifest. See [`DATA_SCHEMA.md`](DATA_SCHEMA.md).

## Honest framing

AI judge output is a **model-based signal, not ground truth**. The value is reliable, reproducible, well-labeled artifacts under a fixed configuration — not a claim that one model "objectively won." See [`KNOWN_LIMITATIONS.md`](KNOWN_LIMITATIONS.md).

## A note on archived material

Product-era surfaces (prediction markets, DebatePoints, leaderboards, betting, public social sharing) have been archived under `archive/product-era/` and are out of scope for the revival MVP unless the roadmap explicitly changes. Older stale guides live under `docs/archive/` (kept on disk). If a document elsewhere references those features, a public `ai-debate-arena.com` site, or hosted export endpoints, it is stale.
