# Hybrid LLM Architecture

AI Debate Arena uses a **hybrid model-routing strategy**: infrastructure roles (judge, fact-checker) use **direct provider APIs** for performance, while debaters use **OpenRouter** for breadth. Every provider has an automatic OpenRouter fallback. The implementation source of truth is `lib/llm/model-config.ts` and `lib/llm/client.ts`.

## Roles at a glance

```text
Infrastructure (direct APIs, with OpenRouter fallback)
  ├─ Judge        → Google Gemini (direct)        fallback → OpenRouter
  ├─ Fact-Checker → Azure OpenAI deployment        fallback → OpenRouter
  └─ Moderator    → rule-based / lightweight       (no heavy LLM dependency)

Debaters (OpenRouter)
  └─ Pro + Con    → ~20 curated reasoning models across providers
```

## Infrastructure roles

### Judge — Google Gemini (direct), configurable per run

- **Model:** taken from the `GEMINI_MODEL` env var (default `gemini-3.1-flash-lite`), via the direct Google API using `GEMINI_API_KEY`.
- **Fallback:** OpenRouter at `google/${GEMINI_MODEL}`.
- **Configurable as an experiment variable.** A debate or benchmark config may set `judgeProvider` / `judgeModel`, resolved by `resolveJudgeConfig()`. This is what enables **judge-strength experiments** (e.g. a deliberately weaker judge over stronger debaters) and lets the judge be pointed at any provider — including an OpenRouter slug such as `x-ai/grok-4.3`.
- **Bias mitigation:** every debate is judged twice (Pro-first and Con-first); a tiebreaker (defaulting to the primary judge model) resolves disagreement. Consensus and parse status are persisted.

### Fact-Checker — Azure OpenAI

- **Model:** the Azure deployment named by `AZURE_OPENAI_FACTCHECK_DEPLOYMENT_NAME` (e.g. `gpt-5.4-mini`), falling back to `AZURE_OPENAI_DEPLOYMENT_NAME`, then a generic model name.
- **Fallback:** OpenRouter (`openai/gpt-5.1`).
- **Search backend:** claims are validated against live web search (Tavily), with sources retained on each verdict.
- **Modes:** `standard` (flag and continue), `strict` (reject false claims and force a retry), `off`.

### Moderator — rule-based

Turn/round/word-limit enforcement is rule-based and does not require a heavy LLM call. A lightweight provider entry exists in config for completeness, but moderation logic is deterministic.

## Debater roles — OpenRouter

Debaters run through OpenRouter for a single API surface across providers and easy model switching. The curated set lives in `DEBATER_MODELS` (`lib/llm/model-config.ts`) — roughly 20 reasoning-capable models across Anthropic, OpenAI, Google, xAI, DeepSeek, Qwen/Alibaba, MoonshotAI, MiniMax, Z.AI, NVIDIA, and Deep Cogito, grouped into `frontier` / `advanced` / `capable` tiers. `getRecommendedDebaterModels()` exposes curated shortlists (best / value / budget / reasoning / coding).

> Model slugs drift as providers deprecate and rename models. Run `npm run models:validate` to cross-check every dispatchable slug (debater IDs + infrastructure OpenRouter fallbacks) against the live OpenRouter catalogue; it exits non-zero on drift and is suitable for CI / pre-benchmark gating.

## Automatic fallback

`lib/llm/client.ts` attempts the configured provider first and falls back to OpenRouter on failure. Because infrastructure models are configured with provider-native IDs (e.g. a Gemini model name) that OpenRouter does not recognize, `getOpenRouterFallbackModel()` maps a model to its declared OpenRouter `fallbackModel` slug before the fallback call. Models that are already OpenRouter slugs (contain a `/`) pass through unchanged.

## Cost and telemetry

Every provider call is recorded in `llm_provider_calls` with stage, provider, requested/actual model, tokens, latency, cost estimate, and success/error status (see `docs/DATA_SCHEMA.md`).

- **OpenRouter debater calls** capture real cost via OpenRouter's usage accounting.
- `estimateDebateCost()` provides a rough *a priori* estimate for planning; it is an approximation, not a measurement.

**Cost-estimate caveats (token/latency unaffected, only the cost estimate):**

- Cost comes from OpenRouter's `usage.cost`. **BYOK-routed models report `$0`** — OpenRouter does not bill them to credits (the spend lands on the upstream provider account). This is expected behavior, not a defect, and applies to whichever role (debater or judge) happens to use a BYOK model. In a mixed run, non-BYOK models report real cost while BYOK models report `$0`.
- **Azure** model costs display `$0` because there is no pricing entry for the Azure deployment names.

See `docs/KNOWN_LIMITATIONS.md`.

## Environment variables

```bash
# Judge (direct Google) + fallback
GEMINI_API_KEY=...                          # direct Gemini access
GEMINI_MODEL=gemini-3.1-flash-lite          # judge model (configurable)
GEMINI_MODEL_BACKUP=...                      # optional secondary

# Fact-checker (Azure OpenAI) + fallback
AZURE_OPENAI_API_KEY=...
AZURE_OPENAI_ENDPOINT=...
AZURE_OPENAI_API_VERSION=...
AZURE_OPENAI_FACTCHECK_DEPLOYMENT_NAME=...   # e.g. gpt-5.4-mini
AZURE_OPENAI_DEPLOYMENT_NAME=...             # default chat deployment

# Fact-check search
TAVILY_API_KEY=...

# Debaters + universal fallback
OPENROUTER_API_KEY=...

# Optional direct providers (used where wired / available)
XAI_API_KEY=...
ANTHROPIC_API_KEY=...
MISTRAL_API_KEY=...
DEEPSEEK_API_KEY=...
```

## Using the config in code

```typescript
import { getModelConfig, resolveJudgeConfig } from '@/lib/llm/model-config'
import { getDebaterLLMConfig, isValidDebaterModel } from '@/lib/llm/debater-models'

// Infrastructure roles
const factChecker = getModelConfig('fact-checker')         // Azure deployment + OpenRouter fallback
const judge = resolveJudgeConfig({ provider: 'openrouter', // optional per-run override
                                   model: 'x-ai/grok-4.3' })

// Debater roles (validate first)
if (!isValidDebaterModel(modelId)) throw new Error('Unknown debater model')
const debater = getDebaterLLMConfig(modelId)               // always OpenRouter
```

## Why hybrid

- **Performance** for the latency-sensitive infrastructure path (direct APIs).
- **Breadth** for debaters (one OpenRouter surface, ~20 curated models, easy switching).
- **Reliability** via automatic OpenRouter fallback on any provider failure.
- **Simplicity** via centralized configuration in `lib/llm/model-config.ts`.

The trade-off is slug-drift exposure on the OpenRouter path, which `models:validate` is designed to catch.
