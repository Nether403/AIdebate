# AI Debate Arena Revival Roadmap

## Verdict

Revive the project as a focused alignment and benchmarking workbench, not as the social debate product it drifted into.

The correct product is a tool that generates reliable, inspectable debate artifacts between LLMs. The app should optimize for reproducibility, metadata quality, judge transparency, failure visibility, and exportability. It should not optimize for virality, prediction markets, user engagement loops, or monetization.

## North Star

The revived platform succeeds when it can run this loop reliably:

```text
Topic set A
Model set B
Judge configuration C
Prompt version D
Run configuration E
```

And produce:

- Complete debate transcripts.
- Full model, provider, prompt, and generation metadata.
- Fact-check annotations with sources.
- Structured judge outputs with parse status.
- Explicit failure states for incomplete or invalid runs.
- Comparable model-level metrics calculated only from eligible completed debates.
- Reproducible JSONL/CSV exports with a manifest.

## Product Scope

### Keep

- Pro/con model debates.
- Curated topic sets.
- Optional generated topics, clearly marked by source.
- Optional personas as experimental variables, not default benchmark behavior.
- AI judging as required for completed benchmark runs.
- Fact-checking as evidence annotation first, scoring signal second.
- Basic model comparison tied to benchmark runs.
- Dataset export as a first-class workflow.
- Cost caps and dry-run/mock modes.

### Remove Or Archive

- Prediction markets.
- DebatePoints.
- Superforecaster badges.
- Personal betting dashboards.
- Public social-sharing mechanics.
- Consumer-growth features.
- Production-readiness claims that are not currently verified.
- Overbuilt admin and monitoring pages that are not needed for benchmark operation.

### Defer

- Public leaderboards.
- User accounts.
- Auth.
- Human voting beyond optional annotation.
- Multi-judge ensembles beyond a documented optional mode.
- Analysis notebooks.
- Public dataset releases.

## Immediate Reality Check

These are the current baseline findings from the repository review:

- `npm run build` fails because archived Bolt code is still typechecked.
- `npm run lint` fails because `next lint` is invalid for the current setup.
- `npx tsc --noEmit` fails in `lib/agents/__tests__/topic-generator.test.ts`.
- `npm test` starts and passes several LLM tests, but does not exit reliably.
- The repo has a dirty working tree with many untracked files, including imported reference code.
- Local ignored files contain real-looking credentials and must be treated as compromised.
- The current docs claim production readiness that the repo cannot prove.
- The core debate loop exists, but it is not research-grade yet.

## Phase -1: Safety And Baseline Truth

Goal: make the repo safe to work on and establish an honest starting point.

### Tasks

- Rotate all database, Redis, OpenAI, Anthropic, Google, OpenRouter, Tavily, xAI, and related API keys that were present in local or imported `.env` files.
- Confirm no real secrets are tracked with `git ls-files` and targeted secret search.
- Remove or quarantine `llm-council-master/` unless it is intentionally kept as a reference under `docs/archive/references/`.
- Remove or properly exclude `archive/old-bolt-app` from TypeScript and Next builds.
- Delete local `desktop.ini` files and keep `desktop.ini` ignored.
- Capture current dirty worktree state before cleanup.
- Create one truthful status document: `docs/PROJECT_STATE.md`.
- Mark the project as under revival and not production-ready.
- Archive old production/deployment/status docs under `docs/archive/` if they are not currently true.

### Exit Criteria

- No tracked secrets.
- Old imported projects cannot affect build, test, lint, or typecheck.
- The repo has a single truthful project status source.
- The project no longer claims production readiness without verification.

## Phase 0: Research Scope And MVP Contract

Goal: define what the benchmark measures before changing the core loop.

### Decisions

- Debates are binary pro/con for the revival MVP.
- Topics are curated by default; generated topics are allowed only when source metadata is stored.
- Personas are optional perturbations and off by default for benchmark runs.
- Each benchmark run has a fixed judge configuration.
- Human voting is optional annotation only, not primary scoring.
- Fact-checking annotates evidence first and may later become a scoring feature.
- Outputs are private research artifacts until export quality, data governance, and limitations are documented.

### Deliverables

- `docs/RESEARCH_GOALS.md`.
- `docs/BENCHMARK_METHODOLOGY.md`.
- `docs/KNOWN_LIMITATIONS.md`.
- A short MVP contract in `README.md`.
- A removal/defer list for gamification and social product features.

### MVP Contract

The revived MVP must be able to:

- Create an ad hoc run or benchmark run.
- Select topic set, models, judge, fact-check mode, rounds, and word limit.
- Run one one-round debate and one three-round debate reliably.
- Persist transcript, configuration, metadata, judge output, fact-check output, costs, latency, and errors.
- Inspect a debate in the UI.
- Export a completed run as JSONL plus manifest.
- Compute simple metrics from completed debates only.

### Exit Criteria

- The benchmark loop is written down.
- Completed, failed, partial, and evaluation-failed runs are defined.
- MVP scope is explicit and smaller than the current app.

## Phase 1: Repository Reset

Goal: make the repository boring, buildable, and aligned with the revived mission.

### Tasks

- Fix `tsconfig.json` excludes so archive/reference code cannot break checks.
- Replace `next lint` with a modern `eslint .` setup.
- Add `typecheck`, `format`, `format:check`, `test:unit`, `test:integration`, and `test:live` scripts.
- Fix the topic-generator test syntax error.
- Make the default test command exit reliably.
- Move ad hoc scripts into `scripts/archive/` unless still useful.
- Remove prediction-market, DebatePoints, Superforecaster, dashboard, and social routes from navigation.
- Archive docs that describe the old product direction.
- Rewrite `README.md` around the research workbench, not the arena product.

### Recommended Scripts

```json
{
  "typecheck": "tsc --noEmit",
  "lint": "eslint .",
  "format": "prettier --write .",
  "format:check": "prettier --check .",
  "test": "npm run test:unit",
  "test:unit": "tsx tests/run-unit-tests.ts",
  "test:integration": "tsx --env-file=.env tests/run-integration-tests.ts",
  "test:live": "tsx --env-file=.env tests/run-live-provider-tests.ts",
  "benchmark:run": "tsx --env-file=.env scripts/run-benchmark.ts",
  "dataset:export": "tsx --env-file=.env scripts/export-dataset.ts",
  "models:validate": "tsx --env-file=.env scripts/validate-models.ts"
}
```

### Exit Criteria

- `npm run build` passes.
- `npm run typecheck` passes.
- `npm run lint` runs and passes or reports actionable findings.
- `npm test` exits reliably.
- README and docs no longer contradict the current state.

## Phase 2: Minimal Reliable Debate Artifact

Goal: one debate can run, persist, judge, and export as a trustworthy artifact.

### Core Loop

```text
Select models
Select topic
Create run
Create debate
Generate turns
Fact-check turns
Judge debate
Persist outputs
Inspect transcript
Export JSON
```

### Tasks

- Consolidate debate execution into one path.
- Persist all debate configuration needed for reproducibility.
- Store `wordLimitPerTurn`, judge provider/model, fact-check provider/model, topic source, prompt versions, generation parameters, total rounds, and run ID.
- Ensure later turns receive accepted previous turns in prompt context.
- Remove duplicate turn persistence between graph state and database writes.
- Add idempotency keys or unique constraints to avoid duplicate turns on retry.
- Make status transitions deterministic: `pending`, `running`, `completed`, `failed`, `evaluation_failed`, `cancelled`.
- Store useful diagnostics for every failure.
- Add provider timeouts and retry limits.
- Store token usage, cost estimate, latency, provider, and actual model ID per generation.
- Store fact-check sources instead of dropping them.
- Validate judge output with Zod.
- Make judge parse failures explicit rather than converting them to neutral ties.
- Persist judge evaluations, including pro-first, con-first, consensus, tiebreaker, parse status, and raw response if needed.
- Add `scripts/run-debate.ts` for one CLI debate without the web UI.
- Add `scripts/export-debate.ts` for single-debate JSON export.

### Minimum Debate Artifact Fields

- Debate ID.
- Benchmark run ID or ad hoc run ID.
- Topic ID, motion, category, difficulty, and source.
- Pro model provider, model ID, display name, and version metadata if available.
- Con model provider, model ID, display name, and version metadata if available.
- Judge provider and model ID.
- Fact-checker provider and model ID.
- Prompt template IDs and versions.
- Generation parameters.
- Total rounds.
- Word limit.
- Full turn text.
- Reflection, critique, and speech if retained.
- Fact-check claims, verdicts, confidence, reasoning, and sources.
- Judge scores, winner, reasoning, parse status, and raw output reference.
- Token usage.
- Cost estimate.
- Latency.
- Error state and failure classification.

### Exit Criteria

- A one-round debate completes reliably through CLI and UI.
- A three-round debate completes reliably through CLI and UI.
- No duplicate turns are created during normal execution.
- Judge failures are explicit.
- Fact-check sources appear in persisted records and exports.
- A completed debate exports as JSON with all required metadata.

## Phase 3: Benchmark Run Data Model

Goal: make the system produce comparable datasets, not isolated transcripts.

### Add Or Formalize

- `benchmark_runs`.
- `topic_sets`.
- `prompt_templates`.
- `model_snapshots`.
- `evaluation_results` or an expanded `debate_evaluations` table.
- `dataset_exports`.
- `provider_calls` or equivalent metadata records.

### Benchmark Run Metadata

```json
{
  "benchmarkRunId": "uuid",
  "name": "frontier-models-topic-set-v1",
  "topicSet": "alignment-risk-v1",
  "models": ["openai/gpt-5.1", "anthropic/claude-sonnet-4.5"],
  "judge": "openai/gpt-5.1",
  "factChecker": "openai/gpt-4o-mini",
  "rounds": 3,
  "wordLimit": 500,
  "promptVersion": "debate-rcr-v2",
  "createdAt": "timestamp"
}
```

### Research Integrity Rules

- Every debate belongs to a run, even if the run is marked `ad_hoc`.
- Every model response records provider and actual model ID.
- Every prompt has a stable ID and version.
- Every judge result records judge provider, model ID, prompt version, schema version, and parse status.
- Every aggregate metric can be traced back to source debates.
- Failed or partial debates are preserved but excluded from default aggregate metrics.
- Prompt changes cannot silently contaminate benchmark comparisons.

### Exit Criteria

- Runs are grouped and queryable.
- Prompt and model metadata are stored with each run.
- Metrics exclude incomplete and failed debates by default.
- Export manifests identify run config, schema version, and artifact counts.

## Phase 4: Dataset Export And Scriptable Workflow

Goal: make the platform useful outside the UI.

### Export Files

- `benchmark_manifest.json`.
- `debates.jsonl`.
- `turns.jsonl`.
- `fact_checks.jsonl`.
- `judge_evaluations.jsonl`.
- `provider_calls.jsonl` if provider call metadata is separated.
- `model_metrics.csv`.

### Tasks

- Build JSONL export for benchmark runs.
- Build CSV export for aggregate metrics.
- Add filters by run, topic set, model, date, status, judge model, prompt version, and schema version.
- Add deterministic export manifests.
- Add schema versioning for exports.
- Add anonymization controls only if human annotations remain.
- Document loading exports into Python or notebooks.

### Exit Criteria

- A complete benchmark run can be exported without the UI.
- Exported data is documented.
- Export schema is versioned.
- Export includes all prompt, model, judge, fact-check, cost, and failure metadata required for analysis.

## Phase 5: Evaluation Methodology

Goal: make scoring credible enough to support research analysis.

### Tasks

- Define the judge rubric.
- Define score ranges and expected interpretation.
- Define tie behavior.
- Define whether factuality can override persuasion.
- Add position-bias mitigation as a first-class method.
- Add judge consistency checks.
- Add calibration examples.
- Create a small gold-standard debate set for regression testing.
- Track judge disagreement.
- Track position bias by swapping pro/con order.
- Track topic sensitivity.

### Recommended Metrics

- Win rate by model within a benchmark run.
- Logical coherence score.
- Rebuttal score.
- Factuality score.
- Judge disagreement rate.
- Position bias indicator.
- Topic-category performance.
- Debate failure rate.
- Evaluation failure rate.
- Cost per completed debate.
- Cost per usable benchmark artifact.
- Charismatic Liar Index only if human voting is reintroduced as annotation.

### Framing Rule

The app must describe judge outputs as model-based evaluation signals, not objective truth.

Use wording like:

```text
Model A won according to judge configuration X under rubric version Y.
```

Do not use wording like:

```text
Model A objectively won.
```

### Exit Criteria

- Rubric is documented.
- Judge output schema is stable.
- Calibration examples exist.
- Aggregated metrics are reproducible from stored evaluations.
- UI and exports distinguish judge signal from ground truth.

## Phase 6: Simplified Research UI

Goal: expose only workflows that support benchmark operation and inspection.

### Keep Pages

- Home or overview.
- New run or new debate.
- Debate transcript.
- Benchmark runs.
- Model comparison.
- Topic sets.
- Dataset export.
- Minimal system health.

### Remove Or Hide Pages

- Prediction market.
- User betting history.
- DebatePoints dashboard.
- Superforecaster badges.
- Social sharing pages.
- Component showcase in production navigation.
- Nonessential admin pages.

### UI Flow

```text
Create Benchmark Run
Watch or Inspect Debate
Review Judge and Fact Checks
Compare Models
Export Dataset
```

### Transcript Page Must Show

- Topic.
- Model identities.
- Run configuration.
- Prompt/config metadata.
- Turn-by-turn transcript.
- Fact-check annotations and sources.
- Judge rubric scores.
- Raw judge reasoning.
- Parse status.
- Export button.
- Failure diagnostics if incomplete.

### Exit Criteria

- A user can run and inspect a benchmark without encountering gamification.
- The UI presents research artifacts clearly.
- The UI no longer implies this is a social prediction platform.

## Phase 7: Operations, Cost, And Safety

Goal: prevent accidental runaway provider spend and preserve useful failures.

### Tasks

- Keep daily spending caps.
- Add per-run max cost.
- Add per-debate timeout.
- Add max concurrent debates.
- Add dry-run mode.
- Add mock-provider mode for UI development and tests.
- Add fact-check-off mode for cheap experiments.
- Add run cancellation if feasible.
- Add provider failure logging.
- Add pre-run cost estimate.
- Add post-run actual cost summary.
- Keep raw model outputs immutable once generated.

### Data Controls

- Do not collect unnecessary personal data.
- If human annotation returns, use anonymous session IDs carefully.
- Add retention policy.
- Add export anonymization for human annotation fields.
- Add content warnings or moderation if topics can be user-generated.

### Exit Criteria

- A benchmark cannot run unbounded.
- Cost is visible before and after execution.
- Failed runs are diagnosable.
- Human-related data is minimized or absent.

## Concrete Timeline

### Week 0: Safety And Truth

Deliverables:

- Rotated credentials.
- Quarantined imported/reference projects.
- Archive code excluded from checks.
- `docs/PROJECT_STATE.md` created.
- Old production claims archived.

Verification:

- Secret search shows no tracked secrets.
- `git status` has known, intentional changes only.

### Week 1: Buildable Baseline

Deliverables:

- Fixed `build`, `lint`, `typecheck`, and `test` scripts.
- Default unit test runner exits reliably.
- README rewritten for revival scope.
- Gamification removed from active navigation.

Verification:

- `npm run build` passes.
- `npm run typecheck` passes.
- `npm run lint` passes or has documented non-blocking findings.
- `npm test` exits reliably.

### Week 2: Reliable Single Debate

Deliverables:

- Consolidated debate executor.
- Persisted run/debate config.
- Previous turns correctly included in later prompts.
- Fact-check sources persisted.
- Judge parse failures explicit.
- Single-debate CLI runner.
- Single-debate JSON export.

Verification:

- One-round mock debate passes.
- Three-round mock debate passes.
- One cheap live-provider one-round debate passes.
- Export includes required metadata.

### Week 3: Benchmark Runs

Deliverables:

- `benchmark_runs` concept implemented.
- Topic sets implemented minimally.
- Prompt template versioning implemented minimally.
- Model snapshot metadata implemented minimally.
- Scriptable benchmark runner.

Verification:

- One benchmark run can execute multiple debates.
- Failed debates are preserved and excluded from default metrics.
- Run metadata is queryable.

### Week 4: Dataset Export

Deliverables:

- JSONL benchmark export.
- CSV metrics export.
- Export manifest.
- Export schema docs.

Verification:

- Full run exports without UI.
- Manifest artifact counts match exported files.
- Export can be loaded downstream without app-specific assumptions.

### Week 5: Evaluation Quality

Deliverables:

- Judge rubric documentation.
- Judge output schema version.
- Calibration examples.
- Position-swap measurement.
- Judge disagreement tracking if multi-judge mode is added.

Verification:

- Aggregated metrics can be reproduced from stored evaluations.
- UI and exports state judge configuration for every result.

### Week 6: UI Reset And Polish

Deliverables:

- Research-focused navigation.
- Benchmark runs page.
- Transcript inspection page with metadata, fact-checks, and judge outputs.
- Model comparison scoped to benchmark runs.
- Dataset export page.

Verification:

- User can create, inspect, compare, and export without encountering prediction-market or gamification mechanics.

## Priority Order

### Highest Priority

- Rotate credentials.
- Build passes.
- Typecheck passes.
- Test runner exits.
- Core debate loop reliable.
- Debate artifacts include required metadata.
- Judge failures are explicit.
- Exports are complete enough for analysis.
- Docs reflect reality.

### Medium Priority

- Benchmark run grouping.
- Topic sets.
- Prompt versioning.
- Model snapshots.
- Calibration set.
- Aggregate metrics.
- Cost controls.

### Low Priority

- Public leaderboard.
- Auth.
- User accounts.
- Admin UI.
- Human voting.
- Social sharing.

### Remove Or Indefinitely Defer

- Prediction market.
- DebatePoints.
- Superforecaster badges.
- Gamified dashboards.
- Public virality mechanics.

## Definition Of Done For Revival MVP

The project reaches revival MVP when the following command-line workflow works end-to-end:

```text
npm run models:validate
npm run benchmark:run -- --config configs/frontier-smoke.json
npm run dataset:export -- --run <benchmarkRunId> --out exports/<benchmarkRunId>
```

And produces:

- Completed debate records.
- No duplicate turns.
- Explicit failures for any failed provider or judge calls.
- Inspectable transcripts.
- Fact-check annotations with sources.
- Structured judge outputs.
- Model metrics from completed debates only.
- `benchmark_manifest.json`.
- JSONL exports for debates, turns, fact checks, and judge evaluations.
- CSV export for aggregate metrics.

## Working Rule

Do not add new product features until the benchmark artifact is trustworthy.

If a feature does not improve reliable run configuration, execution, persistence, evaluation, inspection, export, or cost safety, it is out of scope for the revival MVP.
