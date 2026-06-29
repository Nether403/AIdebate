# AI Debate Arena — Executive Brief

*One-page summary for discussion. Last updated: 2026-06-29.*

## In one sentence

AI Debate Arena is a **debate-based testbed that makes two language models argue opposite sides of a question, fact-checks them, has a third model judge the exchange, and records the whole thing as a clean, structured, reusable data artifact.**

## The problem it addresses

Static benchmarks (multiple-choice question banks) are leaking into training data and no longer tell us much about how models *reason*, *persuade*, or *mislead*. What teams increasingly need is a way to:

- compare models on open-ended reasoning, not memorized answers;
- catch the failure mode where a model is **persuasive but wrong**;
- produce **labeled, inspectable training and evaluation data** at scale, on demand.

Adversarial debate is a natural fit: it forces models to expose their reasoning, attack each other's weak points, and respond to challenges — and it generates rich, structured transcripts as a by-product.

## What makes it different

- **Adversarial by design.** Two models take opposing sides with structured "reflect → critique → rebut" reasoning, so weak arguments get stress-tested instead of going unchallenged.
- **A fact-checking firewall.** Claims are validated against live search before they count, with sources retained — not just a verdict.
- **Bias-aware judging.** Every debate is judged in both argument orders to detect position bias, the judge model is itself a configurable variable, and judge quality can be calibrated against a human gold set.
- **The "charismatic liar" signal.** The system measures when the *persuasive* winner diverges from the *factually* stronger side — the single most alignment-relevant signal it produces.
- **Everything is recorded.** Provider, model, prompt version, generation settings, tokens, latency, cost, and failure state are captured for every call and exported as analysis-ready JSONL + CSV.

## What exists today

A working command-line and web pipeline that can configure a debate, run it (1 or 3 rounds), fact-check it, judge it with bias mitigation, persist every artifact, and export a full dataset with a manifest. Multi-provider support (OpenRouter for ~20+ debater models, plus Azure OpenAI, Google Gemini, and xAI for infrastructure roles) with automatic fallback. Verified end-to-end against live providers on disposable databases.

It is a **research workbench, not a production product** — and intentionally so.

## Why it is worth a conversation

The same reliable, well-instrumented debate artifact can serve several directions, and we have not locked into one:

- **Internal alignment research** — a literal scalable-oversight testbed (can a weaker judge supervise stronger debaters?).
- **A synthetic-data engine** — preference pairs, reasoning traces, and adversarial examples for fine-tuning and evaluation.
- **A component inside other applications** — a headless "argue both sides and adjudicate" service, or a model-regression gate in an ML pipeline.

## Honest framing

The AI judge's verdict is a **model-based signal, not ground truth.** The value is reliable, reproducible, well-labeled artifacts under a fixed configuration — not a claim that one model "objectively won."

## Discussion prompts

1. Which direction is most valuable to us first: internal alignment experiments, synthetic-data generation, or an embeddable component?
2. What models and topic domains would make the most compelling first benchmark run to show the room?
3. Is there an existing application or pipeline this could plug into as a data source or evaluation gate?

*See `docs/OVERVIEW.md` for the full description and `docs/POSSIBILITIES.md` for use cases and the synthetic-data deep dive.*
