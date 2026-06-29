# AI Debate Arena — Project Overview

*An extensive, shareable description of the project: what it is, why it exists, how it works, and what it produces. Written to be readable by a non-specialist at the top and precise for engineers further down. Last updated: 2026-06-29.*

---

## 1. The short version

AI Debate Arena orchestrates **structured debates between large language models** and turns them into **clean, inspectable, reusable data**.

You pick a motion (e.g. *"This house would deploy autonomous agents in critical infrastructure"*), assign one model to argue **Pro** and another to argue **Con**, and the system runs a multi-round debate. Along the way it fact-checks claims against live search, a separate **judge** model scores the exchange against a rubric, and every piece of metadata — who said what, with which model, at what cost, with what verdict — is recorded and exportable.

The output is not entertainment. It is a **research artifact**: a complete, structured record of how models reason and argue under pressure, suitable for model comparison, alignment research, and synthetic-data generation.

---

## 2. Why this exists

### The benchmark gap

The standard way to measure a language model is a static test set — thousands of fixed questions with known answers. This approach is increasingly unreliable:

- **Contamination.** Popular benchmarks leak into training data, so high scores can reflect memorization rather than capability.
- **It measures answers, not reasoning.** A multiple-choice score tells you the model picked "C." It says nothing about whether the model could *defend* C against a determined opponent, or whether it would *abandon* C when shown contradicting evidence.
- **It misses the dangerous failure mode.** The behavior we most need to detect — a model that is **confident, fluent, and wrong** — is exactly what a static accuracy number hides.

### Debate as a measurement instrument

Adversarial debate addresses all three. It is dynamic (topics can be fresh, so harder to contaminate), it surfaces reasoning (models must show their work to win), and it naturally exposes persuasive-but-false arguments (because an opponent and a fact-checker push back).

This idea has a direct lineage in AI alignment research — the proposal that **debate can let a less-capable overseer supervise a more-capable model**, because it is easier to judge a well-argued exchange than to evaluate a complex answer cold. AI Debate Arena is built to be a practical **testbed for that idea**.

---

## 3. How a debate works

```text
        ┌─────────────┐     ┌──────────────┐     ┌─────────────┐
Topic → │  PRO model  │ ──▶ │ Fact-Checker │ ──▶ │  CON model  │ ──▶ ...rounds...
        └─────────────┘     │  (firewall)  │     └─────────────┘
                            └──────────────┘
                                                         │
                                                         ▼
                                              ┌────────────────────┐
                                              │   JUDGE (×2 orders) │
                                              │  + bias check       │
                                              └────────────────────┘
                                                         │
                                                         ▼
                                   Persisted artifact  →  JSONL / CSV export
```

### 3.1 The debaters (Reflect–Critique–Refine)

Each debater doesn't just emit a speech. It works in three phases:

1. **Reflect** — analyze the opponent's most recent argument.
2. **Critique** — identify weaknesses, gaps, and logical fallacies.
3. **Refine** — construct a targeted rebuttal.

This structure is captured in the transcript, so you can inspect *how* a model reasoned, not only what it concluded. Later turns receive the prior turns as context, so a three-round debate is a genuine back-and-forth rather than three disconnected monologues.

### 3.2 The fact-checking firewall

Before an argument fully counts, factual claims are extracted and validated against live web search. The system retains the **claims, verdicts, confidence, reasoning, and sources** — not just a count. Two modes:

- **Standard** — flags questionable claims but lets the debate continue (evidence annotation).
- **Strict** — rejects false claims and forces the model to retry (a hallucination firewall).

This makes factuality a first-class, sourced annotation rather than an afterthought.

### 3.3 The judge (with bias mitigation)

A separate model evaluates the full transcript against a rubric (argument quality, rebuttal strength, factual grounding). Two design choices make the verdict more trustworthy:

- **Order-swapped evaluation.** The debate is judged twice — once Pro-first, once Con-first — and the results are compared for **consensus**. This directly measures *position bias* (the well-documented tendency of judges to favor whichever argument they read first). Disagreements are resolved by a tiebreaker and recorded, never silently flattened into a tie.
- **Configurable judge strength.** The judge model is a *variable*, not a fixed assumption. You can deliberately run a **weaker judge over stronger debaters** — which is precisely the scalable-oversight experiment alignment researchers care about.

### 3.4 Robust by necessity

Cross-model output is messy. The judge parser is hardened to normalize the quirks different models produce (varied casing, score formats, JSON wrapped in prose) rather than discarding an otherwise-valid evaluation. When a debate genuinely cannot be judged, it is marked `evaluation_failed` **with diagnostics** — failures are preserved and inspectable, never quietly converted into fake results.

---

## 4. What it produces — the artifact

Every completed debate is exportable with a complete provenance trail. This is the heart of the project's value.

| Category | What's captured |
|---|---|
| **Identity** | Debate ID, benchmark-run ID, topic ID, motion, category, difficulty, source |
| **Participants** | Pro/Con provider + model ID, judge provider/model, fact-checker provider/model |
| **Configuration** | Prompt template IDs + versions, generation parameters, rounds, word limit |
| **Content** | Full turn text; reflection / critique / speech phases |
| **Factuality** | Per-claim verdicts, confidence, reasoning, **and sources** |
| **Judgment** | Rubric scores, winner, reasoning, parse status, raw-output reference, consensus + tiebreaker info |
| **Operations** | Token usage, latency, cost estimate per call; explicit failure state |

Exports are produced as analysis-ready files — `debates.jsonl`, `turns.jsonl`, `fact_checks.jsonl`, `judge_evaluations.jsonl`, `provider_calls.jsonl`, a `model_metrics.csv`, and a `manifest.json` describing the run, schema version, and row counts. **Only completed debates feed aggregate metrics; failed and evaluation-failed debates are preserved separately so they can be studied without skewing results.**

### The signal that matters most: persuasion vs. truth

For every debate, the system compares the **judged winner** (who argued more persuasively) against the **factuality-favored side** (whose claims held up). When they diverge, that's a **"charismatic liar"** case — a persuasive argument built on weaker facts. These are surfaced per-debate (`persuasionTruthDivergence`) and aggregated per-model (`divergentDebates`, `charismaticLiarWins`). For alignment work, this is the most valuable thing the pipeline emits.

---

## 5. Architecture at a glance

- **Orchestration:** LangGraph state machine — debaters, fact-checker, and judge are nodes; flow control (round transitions, fact-check loop-backs) is in the edges; shared state is persisted for recoverability.
- **Models — hybrid routing:**
  - *Debaters* go through **OpenRouter** for breadth (~20+ vetted reasoning models across Anthropic, OpenAI, Google, xAI, DeepSeek, Qwen, and others).
  - *Infrastructure roles* (judge, fact-checker) use **direct provider APIs** (Google Gemini, Azure OpenAI, xAI) for performance, with **automatic OpenRouter fallback** if a direct call fails.
- **Persistence:** Neon (serverless PostgreSQL) via Drizzle ORM. Database branching is used to spin up disposable environments for safe verification.
- **Interfaces:** A scriptable CLI for headless/automated runs, plus a research-focused web UI for configuring runs and inspecting transcripts, fact-checks, and judge output.
- **Reproducibility & safety rails:** versioned prompt templates, model snapshots per run, a `models:validate` check that catches deprecated model slugs before they break a run, plus dry-run/mock modes and cost controls.

---

## 6. What's built today vs. what's ahead

**Working now (verified end-to-end against live providers):**

- Configure and run 1-round and 3-round pro/con debates from CLI or UI.
- Genuine cross-turn rebuttals; word-limit enforcement with retry; no duplicate turns.
- Order-swapped judging with consensus, tiebreaker, and explicit failure states.
- Multi-provider routing with automatic fallback.
- Full per-call telemetry (tokens, latency, cost) and complete dataset export with manifest.
- Persuasion-vs-truth divergence metrics and gold-set judge calibration.

**In progress / on the roadmap:**

- A live run with fact-checking enabled at scale (verified runs so far have focused on the core loop).
- Minimum-length enforcement on accepted turns and turn-level idempotency.
- Expanded evaluation methodology: documented rubric, richer calibration sets, topic-sensitivity analysis.
- A streamlined research UI for run management and model comparison.

The current priority is **trustworthy artifacts before new features** — see `docs/REVIVAL_ROADMAP.md`.

---

## 7. Honest framing and limitations

This matters for credibility, especially in a research setting:

- **The AI judge is a signal, not a verdict on truth.** The correct phrasing is *"Model A won according to judge configuration X under rubric version Y,"* never *"Model A objectively won."*
- **Fact-checking depends on search quality** and should not be treated as definitive.
- **AI judges exhibit biases** (position, model-family, verbosity). We measure and mitigate them rather than pretending they don't exist.
- **It is a research workbench, not a production product.** Readiness is proven through build/lint/typecheck/tests and benchmark-loop verification, not asserted.

Treating these honestly is a feature: it's what makes the artifacts usable for serious research. Full caveats live in `docs/KNOWN_LIMITATIONS.md`.

---

## 8. Where to go next

- **`docs/POSSIBILITIES.md`** — use cases, the synthetic-data deep dive, integration patterns, and fresh ideas.
- **`docs/EXECUTIVE_BRIEF.md`** — the one-page summary.
- **`docs/REVIVAL_ROADMAP.md`** — scope, priorities, and the definition of done.
- **`docs/BENCHMARK_METHODOLOGY.md`** / **`docs/DATA_SCHEMA.md`** — the precise loop and the data model.
