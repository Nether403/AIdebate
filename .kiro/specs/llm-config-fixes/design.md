# Design Document: LLM Configuration Fixes

## Overview

This design addresses two critical issues in the LLM infrastructure:
1. Updating the Judge Agent to use the current Gemini 3.0 Pro model instead of the legacy 1.5 Pro version
2. Implementing a content sanitization layer in the OpenAI provider to strip internal thinking tags before returning responses

The solution maintains backward compatibility while ensuring users see clean, professional output and the system uses the most capable models available.

## Architecture

### Component Interaction Flow

```
┌─────────────────┐
│  Judge Agent    │
│  (judge.ts)     │
└────────┬────────┘
         │ Uses default config
         │ model: "gemini-3.0-pro"
         ▼
┌─────────────────┐
│  LLM Client     │
│  (client.ts)    │
└────────┬────────┘
         │ Routes to provider
         ▼
┌─────────────────┐       ┌──────────────────┐
│ Google Provider │       │ OpenAI Provider  │
│ (google.ts)     │       │ (openai.ts)      │
└─────────────────┘       └────────┬─────────┘
                                   │
                                   │ Sanitizes response
                                   ▼
                          ┌──────────────────┐
                          │ stripThinkingTags│
                          │ utility function │
                          └──────────────────┘
```

## Components and Interfaces

### 1. Judge Agent Configuration Update

**File:** `lib/agents/judge.ts`

**Changes:**
- Update default model from `gemini-3.0-pro` to `gemini-3-pro-preview`
- Ensure factory function uses updated default

**Current Code (INCORRECT):**
```typescript
const defaultConfig: JudgeConfig = {
  model: 'gemini-3.0-pro',  // ❌ Wrong model name!
  provider: 'google',
  // ...
};
```

**Corrected Code:**
```typescript
const defaultConfig: JudgeConfig = {
  model: 'gemini-3-pro-preview',  // ✅ Correct model name
  provider: 'google',
  // ...
};
```

**Issue:** The model name in the factory is incorrect. According to Google's official documentation, the Gemini 3 Pro model is called `gemini-3-pro-preview`, not `gemini-3.0-pro`.

### 2. Thinking Tag Sanitization Utility

**File:** `lib/llm/utils/sanitize.ts` (new file)

**Purpose:** Provide a reusable utility to strip thinking tags from LLM responses

**Interface:**
```typescript
/**
 * Strip thinking tags from LLM response content
 * Removes <thought>...</thought> blocks and their content
 * 
 * @param content - Raw LLM response content
 * @returns Sanitized content without thinking tags
 */
export function stripThinkingTags(content: string): string;

/**
 * Check if content contains thinking tags
 * 
 * @param content - Content to check
 * @returns True if thinking tags are present
 */
export function hasThinkingTags(content: string): boolean;
```

**Implementation Strategy:**
- Use regex to match `<thought>...</thought>` patterns
- Handle multiple occurrences
- Handle nested tags gracefully
- Preserve whitespace and formatting outside tags
- Handle malformed tags (unclosed, mismatched) without crashing

**Regex Pattern:**
```typescript
const THINKING_TAG_PATTERN = /<thought>[\s\S]*?<\/thought>/gi;
```

**Edge Cases:**
1. Multiple thinking blocks: `<thought>A</thought> text <thought>B</thought>`
2. Nested tags: `<thought>outer <thought>inner</thought></thought>`
3. Unclosed tags: `<thought>incomplete`
4. No tags: `regular content`
5. Empty tags: `<thought></thought>`

### 3. OpenAI Provider Update

**File:** `lib/llm/providers/openai.ts`

**Changes:**
- Import sanitization utility
- Apply sanitization to response content before returning
- Apply to both `generate()` and `stream()` methods

**Updated `generate()` method:**
```typescript
import { stripThinkingTags } from '../utils/sanitize';

async generate(messages: LLMMessage[], config: LLMConfig): Promise<LLMResponse> {
  // ... existing code ...
  
  const rawContent = response.content as string;
  const sanitizedContent = stripThinkingTags(rawContent);

  return {
    content: sanitizedContent,  // Return sanitized content
    tokensUsed: {
      input: inputTokens,
      output: outputTokens,
      total: totalTokens,
    },
    cost: this.calculateCost(inputTokens, outputTokens, config.model),
    latencyMs,
    model: config.model,
    provider: 'openai',
  };
}
```

**Updated `stream()` method:**
```typescript
async *stream(messages: LLMMessage[], config: LLMConfig): AsyncGenerator<StreamChunk> {
  // ... existing code ...
  
  let fullContent = '';
  let insideThinkingTag = false;
  let buffer = '';
  
  for await (const chunk of stream) {
    const content = chunk.content as string;
    fullContent += content;
    buffer += content;
    
    // Check for thinking tag boundaries
    if (buffer.includes('<thought>')) {
      insideThinkingTag = true;
      // Yield content before the tag
      const beforeTag = buffer.split('<thought>')[0];
      if (beforeTag) {
        yield { content: beforeTag, isComplete: false };
      }
      buffer = buffer.substring(buffer.indexOf('<thought>'));
    }
    
    if (buffer.includes('</thought>')) {
      insideThinkingTag = false;
      // Discard content up to and including the closing tag
      buffer = buffer.substring(buffer.indexOf('</thought>') + '</thought>'.length);
      // Yield any remaining content
      if (buffer && !insideThinkingTag) {
        yield { content: buffer, isComplete: false };
        buffer = '';
      }
    } else if (!insideThinkingTag && buffer) {
      // Yield content if we're not inside a thinking tag
      yield { content: buffer, isComplete: false };
      buffer = '';
    }
  }
  
  // ... final chunk with token usage ...
}
```

**Note:** Streaming implementation is more complex because we need to handle tags that span multiple chunks. The above approach uses a buffer to accumulate content and detect tag boundaries.

### 4. Google Provider Pricing Update

**File:** `lib/llm/providers/google.ts`

**Changes:**
- Add pricing for `gemini-3-pro-preview`
- Add pricing for `gemini-2.5-pro`
- Keep legacy pricing for backward compatibility

**Updated pricing:**
```typescript
protected pricing: ModelPricing = {
  // Gemini 3 series (Latest frontier - November 2025)
  'gemini-3-pro-preview': {
    inputCostPer1M: 1.25,
    outputCostPer1M: 5.00,
  },
  // Gemini 2.5 series (Latest frontier - June 2025)
  'gemini-2.5-pro': {
    inputCostPer1M: 1.25,
    outputCostPer1M: 5.00,
  },
  'gemini-2.5-flash': {
    inputCostPer1M: 0.075,
    outputCostPer1M: 0.30,
  },
  // Legacy models (keep for backward compatibility)
  'gemini-1.5-pro': {
    inputCostPer1M: 1.25,
    outputCostPer1M: 5.00,
  },
  // ... other legacy models
};
```

### 5. Database Seed Data Update

**File:** `lib/db/seed.ts`

**Changes:**
- Update Gemini model entry from `gemini-1.5-pro` to `gemini-3-pro-preview`
- Add GPT-5.1 variants if not present
- Add Gemini 2.5 Pro if not present
- Mark legacy models as inactive

**Updated seed data:**
```typescript
const models = [
  // Current frontier models (active)
  { name: 'GPT-5.1', provider: 'openai', modelId: 'gpt-5.1', isActive: true },
  { name: 'GPT-5.1 Instant', provider: 'openai', modelId: 'gpt-5.1-instant', isActive: true },
  { name: 'Gemini 3 Pro Preview', provider: 'google', modelId: 'gemini-3-pro-preview', isActive: true },
  { name: 'Gemini 2.5 Pro', provider: 'google', modelId: 'gemini-2.5-pro', isActive: true },
  { name: 'Gemini 2.5 Flash', provider: 'google', modelId: 'gemini-2.5-flash', isActive: true },
  { name: 'Claude 4.5 Sonnet', provider: 'anthropic', modelId: 'claude-4.5-sonnet', isActive: true },
  { name: 'Grok 4.1', provider: 'xai', modelId: 'grok-4.1', isActive: true },
  
  // Legacy models (inactive but supported for historical data)
  { name: 'GPT-4o', provider: 'openai', modelId: 'gpt-4o', isActive: false },
  { name: 'GPT-4o-mini', provider: 'openai', modelId: 'gpt-4o-mini', isActive: true }, // Still useful for cheap tasks
  { name: 'Gemini 1.5 Pro', provider: 'google', modelId: 'gemini-1.5-pro', isActive: false },
  { name: 'Claude 3.5 Sonnet', provider: 'anthropic', modelId: 'claude-3-5-sonnet-20241022', isActive: false },
];
```

## Data Models

### Sanitization Utility Types

```typescript
// lib/llm/utils/sanitize.ts

export interface SanitizationResult {
  sanitizedContent: string;
  hadThinkingTags: boolean;
  removedTagCount: number;
}

export interface SanitizationOptions {
  preserveWhitespace?: boolean;
  logRemovals?: boolean;
}
```

## Error Handling

### Sanitization Errors

**Scenario:** Malformed thinking tags cause regex to fail

**Handling:**
```typescript
export function stripThinkingTags(content: string): string {
  try {
    return content.replace(THINKING_TAG_PATTERN, '');
  } catch (error) {
    console.error('Error sanitizing thinking tags:', error);
    // Return original content if sanitization fails
    return content;
  }
}
```

**Rationale:** Better to show thinking tags than crash the system

### Provider Errors

**Scenario:** OpenAI API returns unexpected format

**Handling:**
- Existing error handling in provider remains unchanged
- Sanitization is applied as a post-processing step
- If sanitization fails, original content is returned

## Testing Strategy

### Unit Tests

**File:** `lib/llm/utils/sanitize.test.ts`

Test cases:
1. ✅ Strip single thinking tag
2. ✅ Strip multiple thinking tags
3. ✅ Handle nested thinking tags
4. ✅ Handle unclosed thinking tags
5. ✅ Handle content without thinking tags
6. ✅ Handle empty thinking tags
7. ✅ Preserve whitespace and formatting
8. ✅ Handle malformed tags gracefully

**File:** `lib/llm/providers/openai.test.ts`

Test cases:
1. ✅ Verify sanitization is applied to generate() responses
2. ✅ Verify sanitization is applied to stream() responses
3. ✅ Verify token counts remain accurate
4. ✅ Verify cost calculations remain accurate

### Integration Tests

**File:** `lib/agents/judge.test.ts`

Test cases:
1. ✅ Verify Judge Agent uses gemini-3.0-pro by default
2. ✅ Verify tiebreaker uses gpt-5.1
3. ✅ Verify judge responses are clean (no thinking tags)

### Manual Testing

1. Run a debate with GPT-5.1-thinking as a debater
2. Verify debate transcript shows no `<thought>` tags
3. Verify judge evaluation uses gemini-3.0-pro
4. Check database for correct model identifiers

## Performance Considerations

### Regex Performance

**Concern:** Regex operations on large responses could be slow

**Mitigation:**
- Thinking tags are typically small (< 1KB)
- Regex is compiled once and reused
- Non-greedy matching (`.*?`) prevents catastrophic backtracking

**Benchmark Target:** < 1ms for typical response (< 10KB)

### Streaming Performance

**Concern:** Buffering chunks for tag detection could delay output

**Mitigation:**
- Buffer only accumulates until tag boundaries are found
- Content outside tags is yielded immediately
- Typical delay: < 100ms (time to receive closing tag)

**Trade-off:** Slight delay in streaming vs. clean output

## Security Considerations

### Content Injection

**Risk:** Malicious content could include fake thinking tags to hide information

**Mitigation:**
- Thinking tags are stripped regardless of content
- No special handling for "trusted" vs "untrusted" sources
- Sanitization is applied uniformly

### Information Disclosure

**Risk:** Thinking tags might contain sensitive reasoning that should be hidden

**Benefit:** This is exactly what we want - thinking tags are internal monologue and should not be shown to users

## Migration Strategy

### Phase 1: Add Sanitization Utility
1. Create `lib/llm/utils/sanitize.ts`
2. Add unit tests
3. Verify tests pass

### Phase 2: Update OpenAI Provider
1. Import sanitization utility
2. Apply to `generate()` method
3. Apply to `stream()` method
4. Add provider-level tests

### Phase 3: Update Seed Data
1. Update model identifiers in `lib/db/seed.ts`
2. Run seed script on development database
3. Verify models are correct

### Phase 4: Verification
1. Run integration tests
2. Manual testing with GPT-5.1-thinking
3. Verify judge uses gemini-3.0-pro
4. Check production database

## Rollback Plan

If issues arise:
1. **Sanitization issues:** Remove sanitization call, return raw content
2. **Model issues:** Revert to gemini-1.5-pro in judge config
3. **Seed data issues:** Run migration to restore previous model identifiers

## Future Enhancements

### Advanced Sanitization
- Strip other internal tags (e.g., `<reasoning>`, `<analysis>`)
- Configurable tag patterns per model
- Preserve thinking tags in admin/debug mode

### Model Configuration
- Dynamic model selection based on task complexity
- A/B testing different models for judge role
- Cost-based model selection

### Monitoring
- Track frequency of thinking tag removal
- Monitor sanitization performance
- Alert on unexpected tag patterns
