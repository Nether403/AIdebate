# LLM Client Library

A unified interface for interacting with multiple LLM providers (OpenAI, Google, Anthropic, xAI, OpenRouter) with built-in retry logic, timeout handling, streaming support, and cost tracking.

## Features

✅ **Multi-Provider Support**
- OpenAI (GPT-4o, GPT-4o-mini, GPT-4-turbo, GPT-3.5-turbo)
- Google Gemini (Gemini 2.0 Flash, Gemini 1.5 Pro, Gemini 1.5 Flash)
- Anthropic Claude (Claude 3.5 Sonnet, Claude 3.5 Haiku, Claude 3 Opus)
- xAI Grok (Grok Beta, Grok Vision Beta)
- OpenRouter (200+ models as fallback)

✅ **Robust Error Handling**
- Exponential backoff retry logic (configurable)
- Automatic timeout handling (120s default)
- Graceful fallback to alternative providers

✅ **Streaming Support**
- Server-Sent Events (SSE) for real-time responses
- RCR (Reflect-Critique-Refine) phase extraction
- Timeout handling for long-running streams

✅ **Cost Tracking**
- Token counting for all providers
- Accurate cost calculation based on model pricing
- Per-request cost tracking

## Quick Start

### Basic Usage

```typescript
import { getLLMClient } from '@/lib/llm/client';

const client = getLLMClient();

// Simple chat completion
const response = await client.generate(
  [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'What is the capital of France?' }
  ],
  {
    provider: 'openai',
    model: 'gpt-4o-mini',
    temperature: 0.7,
  }
);

console.log(response.content);
console.log(`Cost: $${response.cost.toFixed(4)}`);
console.log(`Tokens: ${response.tokensUsed.total}`);
```

### Streaming

```typescript
import { getLLMClient } from '@/lib/llm/client';

const client = getLLMClient();

for await (const chunk of client.stream(messages, config)) {
  if (!chunk.isComplete) {
    process.stdout.write(chunk.content);
  } else {
    console.log(`\nTotal tokens: ${chunk.tokensUsed?.total}`);
  }
}
```

### Streaming with SSE (Next.js API Route)

```typescript
import { streamWithSSE, createSSEResponse } from '@/lib/llm/streaming';

export async function POST(request: Request) {
  const { messages, config } = await request.json();
  
  const stream = streamWithSSE(messages, config);
  return createSSEResponse(stream);
}
```

### RCR Phase Extraction

```typescript
import { streamWithRCRPhases } from '@/lib/llm/streaming';

for await (const event of streamWithRCRPhases(messages, config)) {
  if (event.type === 'phase') {
    console.log(`[${event.phase}]`, event.content);
  } else if (event.type === 'content') {
    process.stdout.write(event.content);
  }
}
```

## Configuration

### Environment Variables

```bash
# Required: At least one provider API key
OPENAI_API_KEY=sk-...
GOOGLE_API_KEY=...
ANTHROPIC_API_KEY=sk-ant-...
XAI_API_KEY=xai-...
OPENROUTER_API_KEY=sk-or-v1-...
```

### Retry Configuration

```typescript
import { OpenAIProvider } from '@/lib/llm/providers/openai';

const provider = new OpenAIProvider({
  apiKey: process.env.OPENAI_API_KEY!,
  retryConfig: {
    maxRetries: 3,
    initialDelayMs: 1000,
    maxDelayMs: 8000,
    backoffMultiplier: 2,
  },
  timeout: 120000, // 120 seconds
});
```

## Provider-Specific Notes

### OpenAI
- Uses LangChain's `ChatOpenAI` for better integration
- Supports all GPT models including GPT-4o and GPT-4o-mini
- Token usage from API response metadata

### Google Gemini
- Uses LangChain's `ChatGoogleGenerativeAI`
- Supports Gemini 2.0 Flash (free tier), Gemini 1.5 Pro, and Flash
- Large context window (1M tokens for Pro)

### Anthropic Claude
- Direct API integration (no LangChain wrapper)
- Requires separate system message handling
- Streaming uses SSE format

### xAI Grok
- Direct API integration
- OpenAI-compatible API format
- Supports Grok Beta and Grok Vision Beta

### OpenRouter
- Fallback provider for 200+ models
- Unified API for multiple providers
- Requires HTTP-Referer header

## Cost Tracking

All providers include accurate cost calculation:

```typescript
const response = await client.generate(messages, config);

console.log(`Input tokens: ${response.tokensUsed.input}`);
console.log(`Output tokens: ${response.tokensUsed.output}`);
console.log(`Total cost: $${response.cost.toFixed(4)}`);
```

### Current Pricing (as of implementation)

**OpenAI:**
- GPT-4o: $2.50/$10.00 per 1M tokens (input/output)
- GPT-4o-mini: $0.15/$0.60 per 1M tokens

**Google:**
- Gemini 2.0 Flash: Free (experimental)
- Gemini 1.5 Pro: $1.25/$5.00 per 1M tokens
- Gemini 1.5 Flash: $0.075/$0.30 per 1M tokens

**Anthropic:**
- Claude 3.5 Sonnet: $3.00/$15.00 per 1M tokens
- Claude 3.5 Haiku: $0.80/$4.00 per 1M tokens

**xAI:**
- Grok Beta: $5.00/$15.00 per 1M tokens

## Architecture

```
lib/llm/
├── client.ts              # Unified LLM client (factory)
├── base-provider.ts       # Abstract base class for providers
├── streaming.ts           # SSE and RCR streaming utilities
├── providers/
│   ├── openai.ts         # OpenAI provider adapter
│   ├── google.ts         # Google Gemini provider adapter
│   ├── anthropic.ts      # Anthropic Claude provider adapter
│   ├── xai.ts            # xAI Grok provider adapter
│   └── openrouter.ts     # OpenRouter fallback provider
└── __tests__/
    ├── client.test.ts    # Unit tests
    ├── integration.test.ts # Integration tests
    └── README.md         # Test documentation
```

## Error Handling

The client includes comprehensive error handling:

1. **Retry Logic**: Automatic retry with exponential backoff
2. **Timeout Handling**: Configurable timeouts for all operations
3. **Provider Fallback**: Graceful degradation to alternative providers
4. **Error Messages**: Clear, actionable error messages

```typescript
try {
  const response = await client.generate(messages, config);
} catch (error) {
  if (error.message.includes('timed out')) {
    // Handle timeout
  } else if (error.message.includes('not initialized')) {
    // Handle missing API key
  } else {
    // Handle other errors
  }
}
```

## Testing

```bash
# Run all tests
npm run test:llm

# Run specific test file
tsx lib/llm/__tests__/integration.test.ts
```

See `__tests__/README.md` for detailed test documentation.

## Future Enhancements

- [ ] Implement accurate token counting using provider-specific libraries (tiktoken, etc.)
- [ ] Add request/response caching
- [ ] Implement rate limiting per provider
- [ ] Add support for function calling
- [ ] Add support for vision models
- [ ] Implement cost budgeting and alerts
- [ ] Add telemetry and monitoring
