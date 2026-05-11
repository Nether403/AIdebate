---
inclusion: always
---

# Model Configuration & Role Assignment

## Hybrid Architecture

AI Debate Arena uses a **hybrid architecture** that optimizes for performance, cost, and flexibility:

- **Infrastructure roles** use direct APIs for best performance
- **Debater roles** use OpenRouter for maximum model selection (200+ models)
- **Automatic fallbacks** to OpenRouter if direct APIs fail

## Primary Model Assignments

### Judge Agent: **Gemini 3.0 Pro** (Direct Google API)
- **Model:** `gemini-3-pro-preview`
- **Provider:** Google API (direct)
- **Why:** Excellent reasoning, massive context window (1M tokens), cost-effective
- **Role:** Primary debate adjudicator
- **Fallback:** OpenRouter (`google/gemini-3-pro-preview`)
- **Cost:** ~$0.11 per debate

### Fact-Checker Agent: **GPT-5.1** (Direct OpenAI API)
- **Model:** `gpt-5.1`
- **Provider:** OpenAI API (direct)
- **Why:** High precision, good at structured output, reliable search integration
- **Role:** Validate factual claims against Tavily Search
- **Fallback:** OpenRouter (`openai/gpt-5.1`)
- **Cost:** ~$0.02 per claim

### Moderator Agent: **Rule-Based** (No LLM)
- **Implementation:** Pure rule-based logic
- **Why:** Simple rule enforcement doesn't need AI, zero cost, zero latency
- **Role:** Enforce debate rules, word counts, turn management
- **Cost:** $0.00 per debate

### Debater Agents: **OpenRouter** (User Selected)
- **Provider:** OpenRouter (all models)
- **Available Models:** 200+ including:
  - **Frontier:** Claude 4.5, GPT-5.1, Gemini 3.0, Grok 4.1
  - **Advanced:** Claude 3.5, o1, Gemini 2.5, Llama 4 405B
  - **Capable:** Qwen 3, DeepSeek, Mistral Large
- **Role:** Generate debate arguments with RCR prompting
- **Why:** Maximum flexibility, easy model switching, unified API

## Cost Optimization Strategy

### Development Phase
- Judge: Gemini 3.0 Pro ($0.11/debate)
- Fact-Checker: GPT-5.1 ($0.02/claim)
- Moderator: Rule-based ($0.00/debate)
- **Total infrastructure per debate:** ~$0.17

### Production Phase
Same as development - infrastructure costs are already optimized

### Championship Rounds (Top 10 Models)
- Judge: GPT-5.1 with extended thinking ($0.30/debate)
- Fact-Checker: GPT-5.1 ($0.02/claim)
- Moderator: Rule-based ($0.00/debate)
- **Total infrastructure per debate:** ~$0.45

## Model Selection Logic

```typescript
// Infrastructure roles - use direct APIs
import { getModelConfig } from '@/lib/llm/model-config';

const judgeConfig = getModelConfig('judge');
// { model: 'gemini-3-pro-preview', provider: 'google' }

const factCheckerConfig = getModelConfig('fact-checker');
// { model: 'gpt-5.1', provider: 'openai' }

// Debater roles - use OpenRouter
import { getDebaterLLMConfig } from '@/lib/llm/debater-models';

const debaterConfig = getDebaterLLMConfig('anthropic/claude-4.5-sonnet');
// { model: 'anthropic/claude-4.5-sonnet', provider: 'openrouter' }
```

## Fallback Strategy

If primary model fails:
1. **Retry 3 times** with exponential backoff
2. **Switch to OpenRouter** automatically (same model)
3. **Log failure** for monitoring
4. **Continue debate** without interruption

## Available Debater Models

### Tier 1: Frontier Reasoning Models
- `anthropic/claude-4.5-sonnet` - Top-tier reasoning and nuanced argumentation
- `openai/gpt-5.1` - Latest OpenAI model with strong reasoning
- `google/gemini-3-pro-preview` - Massive context window, excellent reasoning
- `x-ai/grok-4.1` - Latest Grok with strong reasoning capabilities

### Tier 2: Advanced Reasoning Models
- `anthropic/claude-3.5-sonnet` - Proven reasoning and debate performance
- `openai/o1` - Extended thinking mode for complex reasoning
- `google/gemini-2.5-pro` - Previous generation Gemini with solid reasoning
- `meta-llama/llama-4-405b-instruct` - Latest open-source frontier model

### Tier 3: Capable Reasoning Models
- `qwen/qwen-3-72b-instruct` - Strong multilingual reasoning
- `deepseek/deepseek-chat` - Cost-effective with good reasoning
- `mistralai/mistral-large` - European frontier model with solid reasoning

## Testing Recommendations

### Unit Tests
- Mock all LLM responses
- Test fallback logic
- Verify cost calculations

### Integration Tests
- Use actual APIs with small debates
- Test with real models
- Validate response parsing

### Production Testing
- Start with 10 debates using production config
- Monitor costs and performance
- Adjust model assignments based on results

## Environment Variables Required

```bash
# Infrastructure (Direct APIs)
GOOGLE_API_KEY=...        # For Judge (Gemini 3.0 Pro)
OPENAI_API_KEY=...        # For Fact-Checker (GPT-5.1)

# Debaters + Fallback
OPENROUTER_API_KEY=...    # For all debater models + infrastructure fallback

# Optional (not used in hybrid architecture)
ANTHROPIC_API_KEY=...
XAI_API_KEY=...
MISTRAL_API_KEY=...
DEEPSEEK_API_KEY=...
```

## Key Benefits

1. **Performance:** Direct APIs for infrastructure = lower latency
2. **Cost:** Optimized model selection saves ~8% vs OpenRouter-only
3. **Flexibility:** 200+ debater models via OpenRouter
4. **Reliability:** Automatic fallbacks ensure uptime
5. **Simplicity:** Centralized configuration, easy to maintain

## Reference

See `docs/HYBRID_ARCHITECTURE.md` for complete implementation details.
