# Research Goals

## Purpose

The project exists to generate reliable, inspectable debate artifacts between LLMs for model comparison and alignment research.

The immediate research question is: under a fixed topic set, model set, judge configuration, prompt version, and run configuration, what debate artifacts and model-level signals are produced?

## Revival MVP Scope

- Debates are binary pro/con.
- Topics are curated by default.
- Generated topics may be used only when source metadata is stored.
- Personas are optional perturbations and off by default.
- Each benchmark run uses a fixed judge configuration.
- Human voting is optional annotation only, not primary scoring.
- Fact-checking is evidence annotation first and may later become a scoring signal.
- Outputs are private research artifacts until export quality, data governance, and limitations are documented.

## Desired Artifact Qualities

- Reproducible as far as provider APIs allow.
- Complete enough to audit prompt, model, generation, cost, latency, and failure metadata.
- Explicit about partial, failed, and evaluation-failed states.
- Exportable without relying on the UI.
- Suitable for aggregate metrics only when debates meet eligibility criteria.

## Non-Goals

- Social debate engagement.
- Prediction markets.
- DebatePoints or gamified rewards.
- Public virality features.
- New account systems for the revival MVP.
- Objective truth claims based only on AI judge output.

## Positioning (agile, multi-use)

The project is intentionally kept use-case-agile. The same reliable, reproducible, well-instrumented debate artifacts can serve several consumers — headless internal alignment experiments, a component/process inside larger external applications, or eventual dataset release. We do not over-commit to one consumer; we keep improving general functionality and artifact quality toward the research goals. The honest framing remains: a debate-based scalable-oversight testbed that emits labeled artifacts, where AI-judge output is a model-based signal, not ground truth.

## Research Instrumentation

Instrumentation that turns the pipeline into an alignment research tool:

- **Judge strength as a configurable variable.** Debate/benchmark configs may set `judgeProvider`/`judgeModel` (falling back to the infrastructure judge). This enables scalable-oversight experiments — e.g. a weaker judge adjudicating stronger debaters — rather than a single fixed judge. The tiebreaker defaults to the primary judge for reliability and can be overridden.
- **Persuasion-vs-truth divergence (the "charismatic liar" signal).** For each debate we compare the judged winner (persuasion) to the factuality-favored side (from fact-check verdicts). Exports carry `factualityWinner` and `persuasionTruthDivergence` per debate, and `model_metrics` carries `divergentDebates` and `charismaticLiarWins` per model. This is the most alignment-relevant signal the pipeline produces (persuasive-but-less-truthful behavior).
- **Judge calibration against a gold set.** `lib/benchmark/calibration.ts` + `judge:calibrate` compare a run's persisted judge verdicts to a human/expert gold-label file (no LLM calls) and report agreement rate + a confusion matrix, anchoring the AI-judge signal. A small gold set is required to make calibration meaningful; `configs/gold-set.example.json` documents the format.
