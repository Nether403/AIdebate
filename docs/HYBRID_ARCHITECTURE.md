# Hybrid LLM Architecture

## Overview

AI Debate Arena uses a **hybrid architecture** that combines direct API access for infrastructure roles with OpenRouter for debater models. This approach optimizes for performance, cost, and flexibility.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    AI Debate Arena                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Infrastructure Roles (Direct APIs)                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                                                      │  │
│  │  Judge Agent                                         │  │
│  │  ├─ Primary: Gemini 3.0 Pro (Google API)           │  │
│  │  └─ Fallback: OpenRouter                           │  │
│  │                                                      │  │
│  │  Fact-Checker Agent                                  │  │
│  │  ├─ Primary: GPT-5.1 (OpenAI API)                  │  │
│  │  └─ Fallback: OpenRouter                           │  │
│  │                                                      │  │
│  │  Moderator Agent                                     │  │
│  │  └─ Rule-based (No LLM)                            │  │
│  │                                                      │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  Debater Roles (OpenRouter)                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                                                      │  │
│  │  Pro Debater & Con Debater                          │  │
│  │  └─ OpenRouter (200+ models)                       │  │
│  │     ├─ Claude 4.5 Sonnet                           │  │
│  │     ├─ GPT-5.1                                     │  │
│  │     ├─ Gemini 3.0 Pro                              │  │
│  │     ├─ Grok 4.1                                    │  │
│  │     ├─ Llama 4 405B                                │  │
│  │     ├─ Qwen 3 72B                                  │  │
│  │     └─ ... and 190+ more                           │  │
│  │                                                      │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Role Assignments

### Infrastructure Roles (Direct APIs)

#### Judge Agent
- **Model:** Gemini 3.0 Pro (`gemini-3-pro-preview`)
- **Provider:** Google API (direct)
- **Why:** 
  - Excellent reasoning capabilities
  - Massive 1M token context window
  - Cost-effective ($1.25/M input, $5.00/M output)
  - Low latency for critical path
- **Fallback:** OpenRouter (`google/gemini-3-pro-preview`)
- **Cost per debate:** ~$0.11

#### Fact-Checker Agent
- **Model:** GPT-5.1 (`gpt-5.1`)
- **Provider:** OpenAI API (direct)
- **Why:**
  - High precision for fact validation
  - Excellent structured output
  - Reliable search integration
  - Fast response times
- **Fallback:** OpenRouter (`openai/gpt-5.1`)
- **Cost per claim:** ~$0.02

#### Moderator Agent
- **Implementation:** Rule-based (no LLM)
- **Why:**
  - Simple rule enforcement doesn't need AI
  - Zero latency
  - Zero cost
  - 100% reliable
- **Responsibilities:**
  - Round announcements
  - Word count validation
  - Turn structure validation
  - State management

### Debater Roles (OpenRouter)

#### Pro & Con Debaters
- **Provider:** OpenRouter (all models)
- **Why:**
  - Access to 200+ models
  - Easy model switching without code changes
  - Unified API interface
  - Automatic fallbacks
  - Users can choose any model
- **Available Tiers:**
  - **Frontier:** Claude 4.5, GPT-5.1, Gemini 3.0, Grok 4.1
  - **Advanced:** Claude 3.5, o1, Gemini 2.5, Llama 4 405B
  - **Capable:** Qwen 3, DeepSeek, Mistral Large

## Cost Analysis

### Per Debate Cost (3 rounds, 6 turns total)

**Infrastructure (Direct APIs):**
- Judge: $0.11 (Gemini 3.0 Pro)
- Fact-Checker: $0.06 (3 claims × $0.02, GPT-5.1)
- Moderator: $0.00 (rule-based)
- **Total Infrastructure:** $0.17

**Debaters (OpenRouter, varies by model):**
- Frontier models (Claude 4.5, GPT-5.1): ~$0.20
- Advanced models (Claude 3.5, Llama 4): ~$0.12
- Capable models (Qwen 3, DeepSeek): ~$0.05

**Total per debate:** $0.22 - $0.37 (depending on debater models)

### Cost Comparison: Hybrid vs OpenRouter-Only

**Hybrid Architecture (Current):**
- Infrastructure: $0.17 (direct APIs)
- Debaters: $0.20 (OpenRouter)
- **Total:** $0.37

**OpenRouter-Only (Alternative):**
- Infrastructure: $0.20 (20% markup)
- Debaters: $0.20 (OpenRouter)
- **Total:** $0.40

**Savings:** $0.03 per debate (8% reduction)

**At 1000 debates/month:** $30 savings

## Performance Benefits

### Latency Comparison

| Component | Direct API | OpenRouter | Difference |
|-----------|-----------|------------|------------|
| Judge | 800ms | 1000ms | +200ms |
| Fact-Checker | 600ms | 750ms | +150ms |
| Debater | N/A | 1200ms | Baseline |

**Total latency savings per debate:** ~350ms

### Reliability

**Direct APIs:**
- Full provider rate limits
- No proxy layer failures
- Provider-specific optimizations
- Native SDK features

**OpenRouter:**
- Shared rate limits
- Additional failure point
- Unified interface (simpler)
- Automatic model fallbacks

## Implementation

### Model Configuration

```typescript
// lib/llm/model-config.ts

export const INFRASTRUCTURE_MODELS = {
  judge: {
    role: 'judge',
    model: 'gemini-3-pro-preview',
    provider: 'google',
    fallbackProvider: 'openrouter',
    fallbackModel: 'google/gemini-3-pro-preview',
  },
  factChecker: {
    role: 'fact-checker',
    model: 'gpt-5.1',
    provider: 'openai',
    fallbackProvider: 'openrouter',
    fallbackModel: 'openai/gpt-5.1',
  },
  moderator: {
    role: 'moderator',
    // Rule-based, no LLM
  },
};

export const DEBATER_MODELS = [
  {
    id: 'anthropic/claude-4.5-sonnet',
    name: 'Claude 4.5 Sonnet',
    provider: 'Anthropic',
    tier: 'frontier',
  },
  // ... 200+ more models
];
```

### Automatic Fallback

```typescript
// lib/llm/client.ts

async generate(messages, config) {
  try {
    // Try primary provider
    const provider = this.getProvider(config.provider);
    return await provider.generate(messages, config);
  } catch (error) {
    // Automatic fallback to OpenRouter
    if (config.provider !== 'openrouter' && this.isProviderAvailable('openrouter')) {
      console.warn('Primary provider failed, using OpenRouter fallback');
      const fallbackProvider = this.getProvider('openrouter');
      return await fallbackProvider.generate(messages, { ...config, provider: 'openrouter' });
    }
    throw error;
  }
}
```

### Usage in Agents

```typescript
// Judge Agent
import { getModelConfig } from '@/lib/llm/model-config';

const judgeConfig = getModelConfig('judge');
// { model: 'gemini-3-pro-preview', provider: 'google' }

// Fact-Checker Agent
const factCheckerConfig = getModelConfig('fact-checker');
// { model: 'gpt-5.1', provider: 'openai' }

// Debater Agent
import { getDebaterLLMConfig } from '@/lib/llm/debater-models';

const debaterConfig = getDebaterLLMConfig('anthropic/claude-4.5-sonnet');
// { model: 'anthropic/claude-4.5-sonnet', provider: 'openrouter' }
```

## Environment Variables

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

## Migration Guide

### From Direct APIs Only

**Before:**
```typescript
const config = {
  provider: 'anthropic',
  model: 'claude-4.5-sonnet',
};
```

**After:**
```typescript
import { getDebaterLLMConfig } from '@/lib/llm/debater-models';

const config = getDebaterLLMConfig('anthropic/claude-4.5-sonnet');
// Automatically uses OpenRouter
```

### From OpenRouter Only

**Before:**
```typescript
const config = {
  provider: 'openrouter',
  model: 'google/gemini-3-pro-preview',
};
```

**After:**
```typescript
import { getModelConfig } from '@/lib/llm/model-config';

// For infrastructure roles
const judgeConfig = getModelConfig('judge');
// Uses direct Google API with OpenRouter fallback

// For debater roles
const debaterConfig = getDebaterLLMConfig('google/gemini-3-pro-preview');
// Still uses OpenRouter
```

## Monitoring

### Cost Tracking

```typescript
// Track costs per role
const costs = {
  judge: calculateCost(inputTokens, outputTokens, 'gemini-3-pro-preview'),
  factChecker: calculateCost(inputTokens, outputTokens, 'gpt-5.1'),
  debater: calculateCost(inputTokens, outputTokens, debaterModel),
};

// Log to monitoring system
logCost({
  debateId,
  role,
  model,
  provider,
  cost,
  latencyMs,
});
```

### Fallback Tracking

```typescript
// Monitor fallback usage
if (usedFallback) {
  logFallback({
    role,
    primaryProvider,
    fallbackProvider,
    reason: error.message,
  });
}
```

## Best Practices

### 1. Always Use Model Config

❌ **Don't:**
```typescript
const config = { provider: 'google', model: 'gemini-3-pro-preview' };
```

✅ **Do:**
```typescript
const config = getModelConfig('judge');
```

### 2. Validate Debater Models

❌ **Don't:**
```typescript
const config = { provider: 'openrouter', model: userInput };
```

✅ **Do:**
```typescript
import { isValidDebaterModel, getDebaterLLMConfig } from '@/lib/llm/debater-models';

if (!isValidDebaterModel(userInput)) {
  throw new Error('Invalid model');
}
const config = getDebaterLLMConfig(userInput);
```

### 3. Handle Fallbacks Gracefully

```typescript
try {
  const response = await llmClient.generate(messages, config);
} catch (error) {
  // Fallback is automatic, but log for monitoring
  console.error('LLM call failed:', error);
  // Don't retry manually - fallback already attempted
  throw error;
}
```

### 4. Monitor Costs

```typescript
// Log every LLM call
await logLLMCall({
  debateId,
  role,
  model,
  provider,
  inputTokens,
  outputTokens,
  cost,
  latencyMs,
  usedFallback,
});
```

## Future Enhancements

### 1. Dynamic Model Selection

```typescript
// Automatically choose best model based on:
// - Current load
// - Cost budget
// - Latency requirements
const config = await selectOptimalModel('judge', {
  maxLatency: 1000,
  maxCost: 0.15,
});
```

### 2. A/B Testing

```typescript
// Test different models for same role
const judgeVariant = getExperimentVariant('judge-model-test');
const config = getModelConfig('judge', { variant: judgeVariant });
```

### 3. Cost Optimization

```typescript
// Use cheaper models for non-critical debates
if (debate.priority === 'low') {
  config = getModelConfig('judge', { tier: 'budget' });
}
```

## Troubleshooting

### Issue: Primary API failing frequently

**Solution:** Check API key validity and rate limits
```bash
# Test API keys
curl -H "Authorization: Bearer $GOOGLE_API_KEY" \
  https://generativelanguage.googleapis.com/v1/models

curl -H "Authorization: Bearer $OPENAI_API_KEY" \
  https://api.openai.com/v1/models
```

### Issue: High fallback usage

**Solution:** Investigate primary provider issues
```typescript
// Check fallback rate
const fallbackRate = fallbackCount / totalCalls;
if (fallbackRate > 0.1) {
  alert('High fallback rate detected');
}
```

### Issue: Unexpected costs

**Solution:** Audit model usage
```typescript
// Generate cost report
const report = await generateCostReport({
  startDate,
  endDate,
  groupBy: 'role',
});
```

## Summary

The hybrid architecture provides:

✅ **Best performance** for critical infrastructure roles  
✅ **Maximum flexibility** for debater model selection  
✅ **Automatic fallbacks** for reliability  
✅ **Cost optimization** through direct APIs  
✅ **Simple maintenance** with centralized config  

This approach balances performance, cost, and flexibility while maintaining reliability through automatic fallbacks.
