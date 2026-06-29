---
inclusion: always
---

# Model Configuration & Role Assignment

Implementation source of truth: `lib/llm/model-config.ts` (+ `lib/llm/debater-models.ts`, `lib/llm/client.ts`). This file summarizes it; if they disagree, the code wins.

## Hybrid Architecture

- **Infrastructure roles** (judge, fact-checker) use **direct provider APIs** for performance.
- **Debater roles** use **OpenRouter** for breadth (a curated set of reasoning models).
- **Automatic fallback** to OpenRouter on any provider failure, with slug remapping via `getOpenRouterFallbackModel()`.

## Primary Model Assignments

### Judge Agent: Google Gemini (direct), configurable per run
- **Model:** `process.env.GEMINI_MODEL` (default `gemini-3.1-flash-lite`), direct Google API via `GEMINI_API_KEY`.
- **Fallback:** OpenRouter at `google/${GEMINI_MODEL}`.
- **Per-run override:** debate/benchmark configs may set `judgeProvider` / `judgeModel`; resolved by `resolveJudgeConfig()`. This makes "judge strength" an experimental variable (e.g. weak judge over strong debaters) and allows pointing the judge at any provider/slug (e.g. `openrouter` / `x-ai/grok-4.3`).
- **Bias mitigation:** every debate is judged Pro-first and Con-first; a tiebreaker (defaults to the primary judge) resolves disagreement. Consensus + parse status are persisted.

### Fact-Checker Agent: Azure OpenAI
- **Model:** Azure deployment from `AZURE_OPENAI_FACTCHECK_DEPLOYMENT_NAME` (e.g. `gpt-5.4-mini`), falling back to `AZURE_OPENAI_DEPLOYMENT_NAME`, then a generic model name.
- **Provider:** Azure OpenAI (direct).
- **Fallback:** OpenRouter (`openai/gpt-5.1`).
- **Search backend:** Tavily; sources are retained on every verdict.
- **Modes:** `standard` (flag + continue), `strict` (reject false claims + retry), `off`.

### Moderator Agent: Rule-based
- Turn/round/word-limit enforcement is deterministic logic, no heavy LLM call. Zero cost, zero latency.

### Debater Agents: OpenRouter (user-selected)
- **Provider:** OpenRouter for all debaters.
- **Available models:** the curated `DEBATER_MODELS` list (~20 reasoning models), grouped `frontier` / `advanced` / `capable`. `getRecommendedDebaterModels()` exposes best / value / budget / reasoning / coding shortlists.
- **Role:** generate arguments with RCR (reflect/critique/refine) prompting.

## Model selection logic

```typescript
import { getModelConfig, resolveJudgeConfig } from '@/lib/llm/model-config'
import { getDebaterLLMConfig, isValidDebaterModel } from '@/lib/llm/debater-models'

const factChecker = getModelConfig('fact-checker')          // Azure deployment + OpenRouter fallback
const judge = resolveJudgeConfig()                          // infra default, or pass an override
const judgeOverride = resolveJudgeConfig({ provider: 'openrouter', model: 'x-ai/grok-4.3' })

if (!isValidDebaterModel(modelId)) throw new Error('Unknown debater model')
const debater = getDebaterLLMConfig(modelId)                // always OpenRouter
```

## Slug drift

Provider slugs deprecate and rename often (e.g. `gemini-3-pro-preview` and `grok-4.1-fast` were both retired). Run `npm run models:validate` to cross-check every dispatchable slug (debater IDs + infrastructure OpenRouter fallbacks) against the live OpenRouter catalogue. It exits non-zero on drift and is suitable for CI / pre-benchmark gating.

## Fallback strategy

1. Try the configured provider.
2. On failure, remap the model to its OpenRouter fallback slug (`getOpenRouterFallbackModel`) and retry via OpenRouter.
3. Telemetry (provider, model, tokens, latency, cost, status) is recorded in `llm_provider_calls`.

## Cost & telemetry notes

- OpenRouter **debater** calls capture real cost from OpenRouter usage accounting.
- `estimateDebateCost()` gives a rough a-priori estimate for planning, not a measurement.
- **Cost estimate caveats (tokens/latency unaffected):** cost comes from OpenRouter's `usage.cost`. **BYOK-routed models report `$0`** because OpenRouter does not bill them to credits (the spend lands on the upstream provider account) — this is expected, not a defect, and applies equally to debaters or judge depending on which models are BYOK. **Azure** model costs display `$0` (no pricing entry for the deployment names). See `docs/KNOWN_LIMITATIONS.md`.

## Environment variables

```bash
# Judge (direct Google) + fallback
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-3.1-flash-lite
GEMINI_MODEL_BACKUP=...

# Fact-checker (Azure OpenAI) + fallback
AZURE_OPENAI_API_KEY=...
AZURE_OPENAI_ENDPOINT=...
AZURE_OPENAI_API_VERSION=...
AZURE_OPENAI_FACTCHECK_DEPLOYMENT_NAME=...   # e.g. gpt-5.4-mini
AZURE_OPENAI_DEPLOYMENT_NAME=...

# Fact-check search
TAVILY_API_KEY=...

# Debaters + universal fallback
OPENROUTER_API_KEY=...

# Optional direct providers
XAI_API_KEY=...
ANTHROPIC_API_KEY=...
MISTRAL_API_KEY=...
DEEPSEEK_API_KEY=...
```

## Reference

See `docs/HYBRID_ARCHITECTURE.md` for the full architecture writeup.
