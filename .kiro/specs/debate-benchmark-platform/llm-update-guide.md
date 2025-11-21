# LLM Provider Update Guide

## Overview

This guide provides detailed instructions for updating the LLM client implementation to use the latest frontier models as of late 2025, based on the research in `Frontier_LLMs_in_Late_2025.md` and `Model&APIselection.md`.

## Model Updates Required

### 1. OpenAI Provider Updates

**Current Models (Outdated):**
- gpt-4o
- gpt-4o-mini
- gpt-4-turbo
- gpt-3.5-turbo

**New Models (2025):**
- **gpt-5.1** - Primary model with dynamic thinking time
- **gpt-5.1-instant** - Fast mode for quick responses
- **gpt-5.1-thinking** - Extended reasoning mode

**Key Changes:**
- GPT-5.1 offers adaptive compute: uses more "brainpower" on hard tasks, less on routine ones
- Improved instruction following and persona customization
- Better reasoning capabilities than GPT-4
- Pricing: ~$1.25 per 1M input tokens, $10 per 1M output tokens (cheaper than competitors)

**Implementation:**
```typescript
// Update model names in openai.ts
const OPENAI_MODELS = {
  'gpt-5.1': { inputCost: 0.00125, outputCost: 0.01 },
  'gpt-5.1-instant': { inputCost: 0.001, outputCost: 0.008 },
  'gpt-5.1-thinking': { inputCost: 0.0015, outputCost: 0.012 },
  // Keep legacy models for comparison
  'gpt-4o': { inputCost: 0.0025, outputCost: 0.01 },
  'gpt-4o-mini': { inputCost: 0.00015, outputCost: 0.0006 }
};

// Use latest streaming pattern from OpenAI SDK v6.x
const stream = await this.client.chat.completions.stream({
  model: 'gpt-5.1',
  messages: messages,
  stream: true,
  temperature: config.temperature
});

for await (const chunk of stream) {
  const content = chunk.choices[0]?.delta?.content || '';
  // Process chunk
}
```

### 2. Anthropic Provider Updates

**Current Models (Outdated):**
- claude-3-opus-20240229
- claude-3-sonnet-20240229
- claude-3-haiku-20240307

**New Models (2025):**
- **claude-sonnet-4-5-20250929** - Primary model (Claude 4.5 Sonnet)
- **claude-opus-4-5** - Highest capability variant
- **claude-haiku-4-5** - Fast, cost-effective variant

**Key Changes:**
- Claude 4.5 Sonnet is the "best overall coding & agent model"
- Improved reasoning, math, and long-horizon autonomy
- Training data through mid-2025
- Better at empathy and human-like communication
- Pricing: ~$3 per 1M input, $15 per 1M output (higher than GPT-5.1)

**Implementation:**
```typescript
// Update model names in anthropic.ts
const ANTHROPIC_MODELS = {
  'claude-sonnet-4-5-20250929': { inputCost: 0.003, outputCost: 0.015 },
  'claude-opus-4-5': { inputCost: 0.015, outputCost: 0.075 },
  'claude-haiku-4-5': { inputCost: 0.0008, outputCost: 0.004 },
  // Keep legacy for comparison
  'claude-3-opus-20240229': { inputCost: 0.015, outputCost: 0.075 }
};

// Use latest streaming pattern from Anthropic SDK
const stream = await this.client.messages.stream({
  model: 'claude-sonnet-4-5-20250929',
  max_tokens: config.maxTokens || 4096,
  messages: messages,
  temperature: config.temperature
});

stream
  .on('text', (text) => {
    // Process text chunk
  })
  .on('message', (message) => {
    // Handle complete message
  });

const finalMessage = await stream.finalMessage();
```

### 3. Google Gemini Provider Updates

**Current Models (Outdated):**
- gemini-1.5-pro
- gemini-1.5-flash
- gemini-pro

**New Models (2025):**
- **gemini-3.0-pro** - State-of-the-art reasoning (Gemini 3 Pro)
- **gemini-2.5-flash** - Fast, efficient variant
- **gemini-2.0-flash** - Free tier option

**Key Changes:**
- Gemini 3.0 Pro dominates benchmarks (19/20 tests vs GPT-5.1 and Claude 4.5)
- Best reasoning capabilities: 37.5% on "Humanity's Last Exam" vs GPT-5.1's 26.5%
- Massive 1M token context window
- "Deep Think" mode for complex reasoning
- Real-time knowledge integration
- Pricing: Premium tier, more expensive than GPT-5.1

**Implementation:**
```typescript
// Update model names in google.ts
const GEMINI_MODELS = {
  'gemini-3.0-pro': { inputCost: 0.00125, outputCost: 0.005 },
  'gemini-2.5-flash': { inputCost: 0.000075, outputCost: 0.0003 },
  'gemini-2.0-flash': { inputCost: 0, outputCost: 0 }, // Free tier
  // Keep legacy
  'gemini-1.5-pro': { inputCost: 0.00125, outputCost: 0.005 }
};

// Use new unified Google Gen AI SDK pattern
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: this.apiKey });

const response = await ai.models.generateContentStream({
  model: 'gemini-3.0-pro',
  contents: messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }))
});

for await (const chunk of response) {
  const text = chunk.text;
  // Process chunk
}
```

### 4. xAI Grok Provider Updates

**Current Models (Outdated):**
- grok-beta
- grok-vision-beta

**New Models (2025):**
- **grok-4.1** - Top-ranked model on LMArena
- **grok-4.1-fast** - Optimized for speed and tool use with 2M context
- **grok-4.1-thinking** - Extended reasoning mode

**Key Changes:**
- Grok 4.1 ranks #1 on LMArena Text Leaderboard (Elo ~1483)
- Best emotional intelligence (EQ-Bench3 leader)
- Excellent creative writing and style control
- Native tool use and real-time search
- Pricing: ~$5 per 1M input, $15 per 1M output

**Implementation:**
```typescript
// Update model names in xai.ts
const XAI_MODELS = {
  'grok-4.1': { inputCost: 0.005, outputCost: 0.015 },
  'grok-4.1-fast': { inputCost: 0.003, outputCost: 0.01 },
  'grok-4.1-thinking': { inputCost: 0.007, outputCost: 0.02 },
  // Keep legacy
  'grok-beta': { inputCost: 0.005, outputCost: 0.015 }
};

// xAI uses OpenAI-compatible API
const response = await fetch('https://api.x.ai/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${this.apiKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'grok-4.1',
    messages: messages,
    stream: true,
    temperature: config.temperature
  })
});

// Process SSE stream
const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const chunk = decoder.decode(value);
  // Parse SSE format and extract content
}
```

### 5. Add OpenRouter as Fallback Provider

**Purpose:** Access to 200+ models including Claude 4.5, Llama 4, Qwen 3, DeepSeek, etc.

**Implementation:**
```typescript
// Create new openrouter.ts provider
export class OpenRouterProvider extends BaseLLMProvider {
  private baseUrl = 'https://openrouter.ai/api/v1';
  
  async generate(messages: Message[], config: LLMConfig): Promise<LLMResponse> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'HTTP-Referer': 'https://ai-debate-arena.com', // Required
        'X-Title': 'AI Debate Arena',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: config.model, // e.g., 'anthropic/claude-4.5-sonnet'
        messages: messages,
        temperature: config.temperature
      })
    });
    
    const data = await response.json();
    return this.parseResponse(data);
  }
}

// Available models via OpenRouter:
const OPENROUTER_MODELS = {
  'anthropic/claude-4.5-sonnet': { inputCost: 0.003, outputCost: 0.015 },
  'meta-llama/llama-4-maverick': { inputCost: 0.0002, outputCost: 0.0002 },
  'qwen/qwen-3-72b': { inputCost: 0.0004, outputCost: 0.0004 },
  'deepseek/deepseek-v3': { inputCost: 0.00014, outputCost: 0.00028 }
};
```

## Recommended Model Assignments for Debate Roles

Based on the research, here are the optimal model assignments:

### Judge Agent
**Primary:** Gemini 3.0 Pro (best reasoning, 19/20 benchmark wins)
**Backup:** GPT-5.1 (proven judge, high agreement with humans)
**Cost-Optimized:** Claude 4.5 Sonnet (balanced, thoughtful)

### Fact-Checker Agent
**Primary:** GPT-5.1 (high precision, good structured output)
**Backup:** Gemini 3.0 Pro (excellent factual accuracy: 72% vs GPT-5.1's 35% on SimpleQA)
**Cost-Optimized:** GPT-4o-mini (cheap, competent)

### Moderator Agent
**Primary:** GPT-4o-mini (ultra-cheap, obedient)
**Backup:** Gemini 2.0 Flash (free tier)

### Debater Agents (User Selected)
**Options:**
- GPT-5.1 (balanced, reliable)
- Claude 4.5 Sonnet (empathetic, human-like)
- Gemini 3.0 Pro (cutting-edge reasoning)
- Grok 4.1 (charismatic, creative)

## Migration Checklist

- [ ] Update OpenAI provider with GPT-5.1 models
- [ ] Update Anthropic provider with Claude 4.5 models
- [ ] Update Google provider with Gemini 3.0/2.5 models
- [ ] Update xAI provider with Grok 4.1 models
- [ ] Add OpenRouter provider for fallback
- [ ] Update model pricing in cost tracking
- [ ] Update streaming implementations to use latest SDK patterns
- [ ] Update model selection UI to show new models
- [ ] Update database seed data with new model entries
- [ ] Test all providers with new models
- [ ] Update documentation with new model capabilities
- [ ] Add model version tracking for comparison studies

## Testing Strategy

1. **Unit Tests:** Test each provider with new models
2. **Integration Tests:** Run complete debates with new models
3. **Cost Validation:** Verify token counting and cost calculations
4. **Performance Tests:** Measure latency and throughput
5. **Quality Tests:** Compare output quality across models

## References

- `Frontier_LLMs_in_Late_2025.md` - Comprehensive model comparison
- `Model&APIselection.md` - Model selection recommendations
- OpenAI SDK v6.x documentation
- Anthropic SDK TypeScript documentation
- Google Gen AI SDK documentation
- xAI API documentation
