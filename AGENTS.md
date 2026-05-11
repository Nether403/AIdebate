# Agent Instructions For AI Debate Arena

## Project Mission

This project is being revived as a lean LLM debate benchmarking and alignment-research workbench.

The goal is to generate reliable, inspectable debate artifacts between LLMs with enough metadata, judging, factuality annotations, failure diagnostics, and exports to support model comparison and alignment research.

This is not a monetized product, social arena, prediction market, or gamified consumer app.

## Canonical Roadmap

Use `docs/REVIVAL_ROADMAP.md` as the current source of truth for project direction.

If another document conflicts with `docs/REVIVAL_ROADMAP.md`, prefer the roadmap and treat the older document as stale until the user says otherwise.

## Current State Assumptions

- The repository may be dirty.
- Some existing docs claim production readiness, but the current codebase must prove readiness through build, typecheck, lint, tests, and benchmark-loop verification.
- Old generated docs, imported projects, archive code, and gamification features may still exist.
- Local ignored files may contain real-looking secrets. Treat any discovered credential as compromised and warn the user. Do not print full secrets in responses.

## Non-Goals

Do not add or revive these features unless the user explicitly overrides the roadmap:

- Prediction markets.
- DebatePoints.
- Superforecaster badges.
- Personal betting dashboards.
- Public social-sharing mechanics.
- Consumer-growth or virality features.
- Production-readiness claims without verification.
- New auth or account systems for the revival MVP.

## Priority Order

Work in this order unless the user gives a more specific task:

1. Safety and truthful repo state.
2. Build, lint, typecheck, and reliable unit tests.
3. One reliable debate artifact from configuration to export.
4. Benchmark run grouping and metadata integrity.
5. Dataset exports and schema documentation.
6. Evaluation methodology and calibration.
7. Simplified research UI.

## Engineering Rules

- Prefer small, reversible changes.
- Do not rewrite architecture before proving the smallest reliable benchmark loop.
- Do not preserve backward compatibility for gamification or abandoned product features unless the user explicitly asks for it.
- Do not silently convert failures into valid research results.
- Failed, partial, and evaluation-failed debates should be preserved, diagnosable, and excluded from aggregate metrics by default.
- Every model response should record provider, model ID, prompt version, generation parameters, latency, token usage, cost estimate, and error state when applicable.
- Every judge output should record judge provider/model, rubric version, prompt version, schema version, parse status, and raw-output reference when needed.
- Fact-check annotations should keep sources, not only verdict counts.
- Treat AI judge output as a model-based signal, not ground truth.

## Data Integrity Requirements

The benchmark artifact is more important than UI polish.

Every completed debate should be exportable with:

- Debate ID.
- Benchmark run ID or ad hoc run ID.
- Topic ID, motion, category, difficulty, and source.
- Pro/con provider and model identifiers.
- Judge and fact-checker provider/model identifiers.
- Prompt template IDs and versions.
- Generation parameters.
- Total rounds and word limit.
- Full turn text.
- Reflection, critique, and speech if retained.
- Fact-check claims, verdicts, confidence, reasoning, and sources.
- Judge scores, winner, reasoning, parse status, and failure state if evaluation failed.
- Token usage, latency, and cost estimate.

## Verification Expectations

Run the narrowest relevant verification after changes.

Preferred baseline commands once scripts exist:

```bash
npm run build
npm run typecheck
npm run lint
npm test
```

For benchmark-loop work, also verify the relevant CLI or route once implemented:

```bash
npm run models:validate
npm run benchmark:run -- --config configs/frontier-smoke.json
npm run dataset:export -- --run <benchmarkRunId> --out exports/<benchmarkRunId>
```

If a command is currently known to fail, state the failure and whether it is pre-existing or introduced by the change.

## Files And Areas To Treat Carefully

- `.env`, `.env.*`, imported `.env` files, credentials, and deployment secrets.
- `lib/db/schema.ts` and database migrations.
- `lib/debate/*` debate lifecycle and persistence.
- `lib/agents/*` debater, fact-checker, judge, moderator, and graph logic.
- `lib/llm/*` provider abstraction and model configuration.
- `app/api/debate/*` debate execution, streaming, fetch, voting, and judging routes.
- `app/api/export/*` and export scripts.
- Old docs that claim production readiness.

## Cleanup Guidance

Archive or remove stale product-era material when it blocks the revival direction:

- Old production/deployment celebration docs.
- Prediction-market docs and tests.
- DebatePoints and Superforecaster docs.
- Imported reference projects that are not used by the app.
- Archive code that affects build, lint, typecheck, or test.

Do not delete potentially useful research notes unless the user asks. Prefer moving them to `docs/archive/`.

## UI Guidance

The UI should support research workflows only:

- Create benchmark run.
- Inspect debate transcript.
- Review fact-checks and judge output.
- Compare models within a benchmark run.
- Export datasets.
- Check minimal system health.

Do not expose prediction, betting, social, or gamified flows in active navigation.

## Documentation Guidance

Keep docs factual and current.

Preferred active docs:

- `README.md` for current project purpose and setup.
- `docs/REVIVAL_ROADMAP.md` for roadmap.
- `docs/PROJECT_STATE.md` for current known status.
- `docs/RESEARCH_GOALS.md` for research scope.
- `docs/BENCHMARK_METHODOLOGY.md` for evaluation methodology.
- `docs/DATA_SCHEMA.md` for database and export schema.
- `docs/RUNBOOK.md` for running benchmarks.
- `docs/KNOWN_LIMITATIONS.md` for caveats.

## Git And Safety

- Do not revert or overwrite user changes unless explicitly requested.
- Do not run destructive git commands.
- Do not create commits unless the user asks.
- If unexpected changes conflict with the task, stop and ask the user how to proceed.

## Working Rule

Do not add new product features until the benchmark artifact is trustworthy.

If a change does not improve reliable run configuration, execution, persistence, evaluation, inspection, export, or cost safety, it is probably out of scope for the revival MVP.
