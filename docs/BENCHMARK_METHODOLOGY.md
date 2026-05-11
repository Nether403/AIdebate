# Benchmark Methodology

## Benchmark Loop

The revival benchmark loop is:

```text
Topic set A
Model set B
Judge configuration C
Prompt version D
Run configuration E
```

This loop should produce complete debate transcripts, provider/model metadata, fact-check annotations with sources, structured judge outputs with parse status, explicit failure states, comparable metrics, and reproducible exports.

## Debate Types

The revival MVP supports binary pro/con debates. Multi-party formats are out of scope until the basic artifact is trustworthy.

## Run Status Definitions

- `pending`: configured but not started.
- `running`: provider calls or persistence are in progress.
- `completed`: transcript and required judge output are present and valid.
- `failed`: generation, persistence, or orchestration failed before a valid judged artifact was produced.
- `evaluation_failed`: transcript exists, but judge output failed or could not be parsed/validated.
- `cancelled`: explicitly stopped before completion.

## Scoring Framing

AI judge output is a model-based evaluation signal, not ground truth.

Preferred wording:

```text
Model A won according to judge configuration X under rubric version Y.
```

Avoid wording that says a model objectively won.

## Metric Eligibility

Aggregate metrics should exclude failed, partial, and evaluation-failed debates by default. Reports may include those debates only when explicitly requested and clearly labeled.

## Required Metadata

Every completed debate should preserve:

- Debate and benchmark run identifiers.
- Topic ID, motion, category, difficulty, and source.
- Pro/con provider and model identifiers.
- Judge and fact-checker provider/model identifiers.
- Prompt template IDs and versions.
- Generation parameters.
- Total rounds and word limit.
- Full turn text.
- Reflection, critique, and speech if retained.
- Fact-check claims, verdicts, confidence, reasoning, and sources.
- Judge scores, winner, reasoning, parse status, and failure state if applicable.
- Token usage, latency, and cost estimate.
