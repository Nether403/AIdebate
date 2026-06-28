# AI Debate Arena Revival

AI Debate Arena is being revived as a lean LLM debate benchmarking and alignment-research workbench.

The current goal is not a social debate product. The goal is to generate reliable, inspectable debate artifacts between LLMs with enough transcript, metadata, fact-check, judge, cost, latency, and failure information to support model comparison and alignment research.

## Status

This repository is under revival and is not production-ready. Build, lint, typecheck, tests, provider integrations, data persistence, and export workflows must prove readiness before any production claims are made.

`docs/REVIVAL_ROADMAP.md` is the source of truth for scope and priority.

## MVP Contract

The revival MVP must be able to:

- Create an ad hoc run or benchmark run.
- Select topic set, models, judge, fact-check mode, rounds, and word limit.
- Run one one-round debate and one three-round debate reliably.
- Persist transcript, configuration, metadata, judge output, fact-check output, cost, latency, and errors.
- Inspect a debate in the UI.
- Export a completed run as JSONL plus manifest.
- Compute simple metrics from completed debates only.

## In Scope

- Binary pro/con model debates.
- Curated topic sets, with generated topics clearly marked by source when used.
- Optional personas as experimental variables, not default benchmark behavior.
- AI judging as required for completed benchmark runs.
- Fact-checking as evidence annotation first and scoring signal second.
- Basic model comparison tied to benchmark runs.
- Dataset export as a first-class workflow.
- Cost caps, dry-run mode, and mock mode where useful.

## Out Of Scope

- Prediction markets.
- DebatePoints.
- Superforecaster badges.
- Personal betting dashboards.
- Public social-sharing mechanics.
- Consumer-growth or virality features.
- New auth or user-account systems for the revival MVP.
- Production-readiness claims without verification.

## Stack

- Next.js, React, TypeScript, Tailwind CSS.
- Drizzle ORM with Neon PostgreSQL.
- LangGraph/LangChain where they remain testable and useful.
- OpenRouter for broad debater model access.
- Azure OpenAI for direct OpenAI-style infrastructure roles.
- Google Gemini and xAI where provider integrations are verified.

## Setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env` and fill in local development values.
3. Use a development Neon database for `DATABASE_URL`.
4. Run `npm run db:push` only against a disposable or explicitly approved database.
5. Start the app with `npm run dev`.

## Baseline Commands

```bash
npm run build
npm run typecheck
npm run lint
npm test
```

## Benchmark Commands

Run one debate from a JSON config:

```bash
npm run debate:run -- --config configs/debate.json
```

Run a benchmark config:

```bash
npm run benchmark:run -- --config configs/frontier-smoke.example.json
```

Export a completed debate:

```bash
npm run debate:export -- --debate <debateId> --out exports/<debateId>.json
```

Export completed debates from a benchmark run as JSONL plus manifest:

```bash
npm run dataset:export -- --run <benchmarkRunId> --out exports/<benchmarkRunId>
```

Live-provider checks are intentionally separate:

```bash
npm run test:live
```

## Documentation

- `docs/REVIVAL_ROADMAP.md`: source-of-truth roadmap.
- `docs/PROJECT_STATE.md`: current known repo status.
- `docs/RESEARCH_GOALS.md`: research purpose and boundaries.
- `docs/BENCHMARK_METHODOLOGY.md`: benchmark loop and evaluation framing.
- `docs/DATA_SCHEMA.md`: active artifact, benchmark, telemetry, and export schema.
- `docs/PHASE_1_CLEANUP.md`: archived product-era surfaces and restore policy.
- `docs/KNOWN_LIMITATIONS.md`: caveats and current risks.

## Archived Product-Era Code

Prediction-market, DebatePoints, leaderboard, betting, public-sharing, and other consumer-product surfaces have been archived under `archive/product-era/` for reference. They are out of scope for the revival MVP unless `docs/REVIVAL_ROADMAP.md` is explicitly changed.

Stale documentation (deployment/monitoring guides, early planning drafts, research papers, task summaries, and product-era spec artifacts) has been moved under `docs/archive/` (kept on disk, untracked). Active documentation is limited to the canonical docs listed above.

## Working Rule

Do not add new product features until the benchmark artifact is trustworthy. A change is in scope only if it improves reliable run configuration, execution, persistence, evaluation, inspection, export, or cost safety.
