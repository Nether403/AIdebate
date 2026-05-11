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
