---
inclusion: always
---

# Model Configuration & Role Assignment

## Primary Model Assignments

Based on available API keys and model capabilities:

### Judge Agent: **Gemini 3.0 Pro**
- **Why:** Excellent reasoning, massive context window (1M tokens), cost-effective
- **Role:** Primary debate adjudicator
- **Backup:** GPT-5.1 (if Gemini has issues)
- **Cost:** ~\.11 per debate

### Fact-Checker Agent: **GPT-5.1**
- **Why:** High precision, good at structured output, reliable search integration
- **Role:** Validate factual claims against Tavily Search
- **Backup:** Gemini 3.0 Pro
- **Cost:** ~\.02 per claim

### Moderator Agent: **GPT-4o-mini**
- **Why:** Cost-effective, simple task (rule enforcement)
- **Role:** Enforce debate rules, word counts, turn management
- **Backup:** Gemini Flash
- **Cost:** ~\.001 per debate

### Debater Agents: **Variable (User Selected)**
- **Options:** GPT-5.1, Gemini 3.0 Pro, Grok 4.1, GPT-4o-mini
- **Via OpenRouter:** Claude 4.5, Llama 4, Qwen 3, DeepSeek, etc.
- **Role:** Generate debate arguments with RCR prompting

## OpenRouter as Fallback

OpenRouter provides access to 200+ models including:
- Claude 4.5 Sonnet (when Anthropic key unavailable)
- Llama 4 variants
- Qwen 3
- DeepSeek
- Mistral models
- And many more

**Usage:**
```typescript
// Use OpenRouter for any model
const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': Bearer \,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'anthropic/claude-4.5-sonnet', // or any other model
    messages: [...]
  })
})
```

## Cost Optimization Strategy

### Development Phase
- Judge: Gemini 3.0 Pro (\.11/debate)
- Fact-Checker: GPT-4o-mini (\.005/claim) - cheaper alternative
- Moderator: GPT-4o-mini (\.001/debate)
- **Total per debate:** ~\.15

### Production Phase
- Judge: Gemini 3.0 Pro (\.11/debate)
- Fact-Checker: GPT-5.1 (\.02/claim)
- Moderator: GPT-4o-mini (\.001/debate)
- **Total per debate:** ~\.25

### Championship Rounds (Top 10 Models)
- Judge: GPT-5.1 with extended thinking (\.30/debate)
- Fact-Checker: GPT-5.1 (\.02/claim)
- Moderator: GPT-4o-mini (\.001/debate)
- **Total per debate:** ~\.45

## Model Selection Logic

```typescript
interface ModelConfig {
  provider: 'openai' | 'google' | 'xai' | 'openrouter'
  model: string
  role: 'judge' | 'fact-checker' | 'moderator' | 'debater'
  tier: 'development' | 'production' | 'championship'
}

const MODEL_ASSIGNMENTS: Record<string, ModelConfig> = {
  // Judge configurations
  'judge-dev': {
    provider: 'google',
    model: 'gemini-3.0-pro',
    role: 'judge',
    tier: 'development'
  },
  'judge-prod': {
    provider: 'google',
    model: 'gemini-3.0-pro',
    role: 'judge',
    tier: 'production'
  },
  'judge-championship': {
    provider: 'openai',
    model: 'gpt-5.1',
    role: 'judge',
    tier: 'championship'
  },
  
  // Fact-checker configurations
  'fact-checker-dev': {
    provider: 'openai',
    model: 'gpt-4o-mini',
    role: 'fact-checker',
    tier: 'development'
  },
  'fact-checker-prod': {
    provider: 'openai',
    model: 'gpt-5.1',
    role: 'fact-checker',
    tier: 'production'
  },
  
  // Moderator (same for all tiers)
  'moderator': {
    provider: 'openai',
    model: 'gpt-4o-mini',
    role: 'moderator',
    tier: 'development'
  }
}
```

## Fallback Strategy

If primary model fails:
1. **Retry 3 times** with exponential backoff
2. **Switch to backup model** (e.g., Gemini → GPT-5.1)
3. **Use OpenRouter** as last resort
4. **Log failure** for monitoring

## Testing Recommendations

### Unit Tests
- Mock all LLM responses
- Test fallback logic
- Verify cost calculations

### Integration Tests
- Use GPT-4o-mini for all roles (cheapest)
- Test with real APIs but small debates
- Validate response parsing

### Production Testing
- Start with 10 debates using production config
- Monitor costs and performance
- Adjust model assignments based on results
