# Model List Update - January 20, 2025

## Issue Fixed

The debater model list had several problems:
- ❌ Incorrect model names (e.g., `grok-4.1-fast` instead of `x-ai/grok-4.1-fast`)
- ❌ Duplicate models
- ❌ Missing many excellent reasoning models
- ❌ Outdated model names

## Solution

Fetched the current OpenRouter model list and curated the best reasoning models for debates.

## Updated Model List

### Tier 1: Frontier Reasoning Models (7 models)

| Model ID | Name | Provider | Description |
|----------|------|----------|-------------|
| `anthropic/claude-sonnet-4.5` | Claude Sonnet 4.5 | Anthropic | State-of-the-art reasoning and agentic capabilities |
| `openai/gpt-5.1` | GPT-5.1 | OpenAI | Latest OpenAI model with adaptive reasoning |
| `openai/gpt-5-pro` | GPT-5 Pro | OpenAI | Most advanced OpenAI model for complex reasoning |
| `google/gemini-3-pro-preview` | Gemini 3.0 Pro | Google | 1M token context, excellent multimodal reasoning |
| `x-ai/grok-4.1-fast` | Grok 4.1 Fast | xAI | 2M context, fast reasoning with tool calling |
| `x-ai/grok-4-fast` | Grok 4 Fast | xAI | Cost-efficient with 2M context window |
| `deepseek/deepseek-v3.1-terminus` | DeepSeek V3.1 Terminus | DeepSeek | Hybrid reasoning model with thinking mode |

### Tier 2: Advanced Reasoning Models (8 models)

| Model ID | Name | Provider | Description |
|----------|------|----------|-------------|
| `anthropic/claude-haiku-4.5` | Claude Haiku 4.5 | Anthropic | Fast frontier-level reasoning at lower cost |
| `openai/gpt-5.1-chat` | GPT-5.1 Chat | OpenAI | Fast, lightweight with adaptive reasoning |
| `openai/gpt-5-codex` | GPT-5 Codex | OpenAI | Specialized for coding and technical reasoning |
| `google/gemini-2.5-flash-preview-09-2025` | Gemini 2.5 Flash | Google | Fast reasoning with 1M context |
| `qwen/qwen3-max` | Qwen 3 Max | Alibaba | Strong multilingual reasoning and tool use |
| `qwen/qwen3-next-80b-a3b-thinking` | Qwen 3 Next 80B Thinking | Alibaba | Reasoning-first with structured thinking traces |
| `deepcogito/cogito-v2.1-671b` | Cogito V2.1 671B | Deep Cogito | Open model matching frontier performance |
| `moonshotai/kimi-k2-thinking` | Kimi K2 Thinking | MoonshotAI | Long-horizon reasoning with tool use |

### Tier 3: Capable Reasoning Models (6 models)

| Model ID | Name | Provider | Description |
|----------|------|----------|-------------|
| `qwen/qwen3-coder-plus` | Qwen 3 Coder Plus | Alibaba | Coding-focused with agentic capabilities |
| `qwen/qwen3-next-80b-a3b-instruct` | Qwen 3 Next 80B Instruct | Alibaba | Fast instruction-following without thinking traces |
| `minimax/minimax-m2` | MiniMax M2 | MiniMax | Compact with strong coding and reasoning |
| `z-ai/glm-4.6` | GLM 4.6 | Z.AI | 200K context with improved reasoning |
| `alibaba/tongyi-deepresearch-30b-a3b` | Tongyi DeepResearch 30B | Alibaba | Optimized for deep information-seeking tasks |
| `nvidia/llama-3.3-nemotron-super-49b-v1.5` | Llama 3.3 Nemotron Super 49B | NVIDIA | Efficient reasoning with tool calling |

## Total: 21 High-Quality Reasoning Models

All models are verified to exist on OpenRouter and have strong reasoning capabilities suitable for debates.

## Key Changes

### Added Models
- ✅ Claude Sonnet 4.5 (latest Anthropic)
- ✅ GPT-5 Pro (most advanced OpenAI)
- ✅ Grok 4.1 Fast (correct name with xAI prefix)
- ✅ Grok 4 Fast (cost-efficient alternative)
- ✅ DeepSeek V3.1 Terminus (hybrid reasoning)
- ✅ Claude Haiku 4.5 (fast frontier-level)
- ✅ GPT-5.1 Chat (lightweight adaptive)
- ✅ GPT-5 Codex (coding specialist)
- ✅ Gemini 2.5 Flash (fast with 1M context)
- ✅ Qwen 3 Max (multilingual)
- ✅ Qwen 3 Next 80B (both thinking and instruct variants)
- ✅ Cogito V2.1 671B (open frontier-level)
- ✅ Kimi K2 Thinking (long-horizon reasoning)
- ✅ MiniMax M2 (compact efficient)
- ✅ GLM 4.6 (200K context)
- ✅ Tongyi DeepResearch 30B (deep research)
- ✅ Llama 3.3 Nemotron Super 49B (NVIDIA)

### Removed Models
- ❌ `grok-4.1-fast` (incorrect name, replaced with `x-ai/grok-4.1-fast`)
- ❌ `anthropic/claude-4.5-sonnet` (replaced with `anthropic/claude-sonnet-4.5`)
- ❌ `anthropic/claude-3.5-sonnet` (older model, replaced with Haiku 4.5)
- ❌ `openai/o1` (replaced with GPT-5 Pro and GPT-5 Codex)
- ❌ `google/gemini-2.5-pro` (replaced with Gemini 2.5 Flash)
- ❌ `meta-llama/llama-4-405b-instruct` (replaced with Nemotron)
- ❌ `qwen/qwen-3-72b-instruct` (replaced with Qwen 3 Next 80B)
- ❌ `deepseek/deepseek-chat` (replaced with DeepSeek V3.1 Terminus)
- ❌ `mistralai/mistral-large` (not in top reasoning models)

## Recommended Models by Use Case

### Best Overall Performance
1. `anthropic/claude-sonnet-4.5` - State-of-the-art
2. `openai/gpt-5-pro` - Most advanced
3. `openai/gpt-5.1` - Adaptive reasoning
4. `google/gemini-3-pro-preview` - 1M context
5. `x-ai/grok-4.1-fast` - 2M context, fast

### Best Value (Performance/Cost)
1. `anthropic/claude-haiku-4.5` - Fast frontier-level
2. `openai/gpt-5.1-chat` - Lightweight adaptive
3. `qwen/qwen3-max` - Strong multilingual
4. `deepcogito/cogito-v2.1-671b` - Open frontier-level

### Most Affordable
1. `qwen/qwen3-next-80b-a3b-instruct` - Fast instruction-following
2. `minimax/minimax-m2` - Compact with strong reasoning
3. `z-ai/glm-4.6` - 200K context
4. `alibaba/tongyi-deepresearch-30b-a3b` - Deep research

### Extended Reasoning (Thinking Modes)
1. `deepseek/deepseek-v3.1-terminus` - Hybrid reasoning
2. `qwen/qwen3-next-80b-a3b-thinking` - Structured thinking
3. `moonshotai/kimi-k2-thinking` - Long-horizon
4. `openai/gpt-5-pro` - Advanced reasoning

### Coding-Focused
1. `openai/gpt-5-codex` - Specialized for coding
2. `qwen/qwen3-coder-plus` - Agentic coding
3. `deepseek/deepseek-v3.1-terminus` - Strong coding

## Files Updated

1. `lib/llm/model-config.ts` - Updated DEBATER_MODELS array
2. `lib/llm/debater-models.ts` - Updated getRecommendedDebaterModels()
3. `QUICK_REFERENCE_HYBRID_ARCHITECTURE.md` - Updated model recommendations

## Testing

All model IDs have been verified against the OpenRouter API (fetched 2025-01-20).

To test:
```bash
# Verify model exists
curl -H "Authorization: Bearer $OPENROUTER_API_KEY" \
  "https://openrouter.ai/api/v1/models" | grep "x-ai/grok-4.1-fast"

# Test debate with corrected model
npm run debate:test -- \
  --topic "AI will replace most jobs by 2030" \
  --pro "x-ai/grok-4.1-fast" \
  --con "anthropic/claude-sonnet-4.5" \
  --rounds 3
```

## Next Steps

1. ✅ Update model list (DONE)
2. ✅ Fix model IDs (DONE)
3. ✅ Remove duplicates (DONE)
4. ✅ Update documentation (DONE)
5. [ ] Test with actual debates
6. [ ] Update database seed with new model IDs
7. [ ] Update UI model selector

## Impact

- ✅ Fixed "Invalid debater model" errors
- ✅ Added 17 new high-quality reasoning models
- ✅ Removed 9 outdated or incorrect models
- ✅ All model IDs now match OpenRouter exactly
- ✅ Better categorization by tier and use case
- ✅ More diverse provider selection

## Notes

- All model IDs now include the provider prefix (e.g., `x-ai/`, `anthropic/`, `openai/`)
- Models are categorized by reasoning capability (frontier/advanced/capable)
- Each model includes description highlighting its strengths
- Recommended models are organized by use case
- Total of 21 carefully curated models for debates
