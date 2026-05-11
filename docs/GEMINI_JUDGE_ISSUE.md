# Gemini Judge Issue - Technical Analysis

## Issue Summary
Gemini models (gemini-2.5-flash, gemini-3-pro-preview) fail when used as the AI Judge with the error:
```
Cannot read properties of undefined (reading 'reduce')
```

## Status
- **Severity**: Medium (workaround available)
- **Impact**: Cannot use Gemini models for judging debates
- **Workaround**: Using GPT-5.1-thinking for judge (working perfectly)
- **Date Identified**: November 22, 2025

## Technical Details

### Error Location
The error occurs in `lib/llm/providers/google.ts` at line 42, inside the `withRetry` call when invoking the LangChain `ChatGoogleGenerativeAI` model.

### Root Cause Analysis

#### 1. Message Format Issue
The judge sends messages with a `system` role:
```typescript
const messages: LLMMessage[] = [
  { role: 'system', content: systemPrompt },
  { role: 'user', content: userPrompt },
];
```

Gemini doesn't natively support system messages in the same way as OpenAI. Our current implementation attempts to handle this by prepending system content to the first user message:

```typescript
// Current implementation in google.ts
for (const msg of messages) {
  if (msg.role === 'system') {
    systemContent += msg.content + '\n\n';
  } else if (msg.role === 'user') {
    const content = systemContent ? systemContent + msg.content : msg.content;
    formattedMessages.push({ role: 'human', content });
    systemContent = ''; // Clear after first use
  }
}
```

#### 2. LangChain Compatibility
The error "Cannot read properties of undefined (reading 'reduce')" suggests that:
- The `model.invoke()` call is receiving an unexpected format
- LangChain's `ChatGoogleGenerativeAI` expects a specific message structure
- The formatted messages array might be empty or malformed in certain cases

#### 3. Why It Works for Debaters but Not Judge

**Debaters (Working):**
- Use single-role messages (only 'user' role)
- Simpler message structure
- No system messages

**Judge (Failing):**
- Uses both 'system' and 'user' roles
- More complex message structure
- System message contains extensive judging criteria (~2000 tokens)
- The system message prepending might be causing issues with LangChain's internal processing

### Evidence from Testing

1. **Debaters with Gemini**: ✅ Working
   - Model: `gemini-3-pro-preview` (Con debater)
   - Message format: Single user messages
   - Result: Generates responses successfully

2. **Judge with Gemini**: ❌ Failing
   - Models tested: `gemini-2.5-flash`, `gemini-3-pro-preview`
   - Message format: System + User messages
   - Result: "Cannot read properties of undefined (reading 'reduce')"

3. **Judge with GPT-5.1-thinking**: ✅ Working
   - Model: `gpt-5.1-thinking`
   - Message format: System + User messages (same as Gemini attempt)
   - Result: Evaluates debates successfully

### Error Logging Output
```
[Google Provider] Error details: {
  error: "Cannot read properties of undefined (reading 'reduce')",
  messagesCount: [number],
  firstMessage: [object]
}
```

The error occurs during the `model.invoke(formattedMessages)` call, suggesting the issue is within LangChain's processing of the message array.

## Potential Solutions (To Investigate)

### Option 1: Use LangChain's SystemMessage Class
Instead of manually formatting, use LangChain's message classes:
```typescript
import { SystemMessage, HumanMessage } from '@langchain/core/messages';

const formattedMessages = messages.map((msg) => {
  if (msg.role === 'system') {
    return new SystemMessage(msg.content);
  } else if (msg.role === 'user') {
    return new HumanMessage(msg.content);
  }
  // ...
});
```

### Option 2: Combine System and User Messages
Gemini might require system instructions to be part of the first user message:
```typescript
const systemMsg = messages.find(m => m.role === 'system');
const userMsg = messages.find(m => m.role === 'user');

if (systemMsg && userMsg) {
  const combined = `${systemMsg.content}\n\n${userMsg.content}`;
  formattedMessages.push({ role: 'human', content: combined });
}
```

### Option 3: Use Gemini's Native System Instruction
LangChain's ChatGoogleGenerativeAI might support a `systemInstruction` parameter:
```typescript
const model = new ChatGoogleGenerativeAI({
  apiKey: this.apiKey,
  model: config.model,
  systemInstruction: systemPrompt, // Native Gemini system instruction
  // ...
});
```

### Option 4: Split Judge Prompt Differently
Restructure the judge prompt to avoid system messages entirely:
```typescript
// Instead of system + user, use single user message with clear sections
const combinedPrompt = `
ROLE AND INSTRUCTIONS:
${systemPrompt}

DEBATE TO EVALUATE:
${userPrompt}
`;
```

## Workaround (Current Solution)

Using GPT-5.1-thinking for the judge:
```typescript
const judge = new JudgeAgent({
  model: 'gpt-5.1-thinking',
  provider: 'openai',
  temperature: 0.3,
});
```

**Benefits:**
- ✅ Works reliably
- ✅ Extended thinking mode provides high-quality judgments
- ✅ Better reasoning for complex debates
- ✅ No message format issues

**Tradeoffs:**
- Higher cost than Gemini (~$1.25 input + $10 output per 1M tokens vs Gemini's $0.075/$0.30)
- Slower response time due to thinking process

## Next Steps

1. **Investigate LangChain Version**
   - Check if newer versions of `@langchain/google-genai` fix this issue
   - Review LangChain's Gemini integration documentation

2. **Test Alternative Message Formats**
   - Try each of the potential solutions listed above
   - Test with minimal judge prompts to isolate the issue

3. **Contact LangChain/Google**
   - File issue on LangChain GitHub if this is a library bug
   - Check Google's Gemini API documentation for system message handling

4. **Consider Hybrid Approach**
   - Use Gemini for debaters (working, cost-effective)
   - Use GPT-5.1-thinking for judge (working, high-quality)
   - This might be the optimal configuration anyway

## Related Files
- `lib/llm/providers/google.ts` - Google provider implementation
- `lib/agents/judge.ts` - Judge agent that sends system messages
- `lib/debate/executor.ts` - Executor that initializes the judge

## References
- LangChain Google GenAI: https://github.com/langchain-ai/langchain-google
- Gemini API Docs: https://ai.google.dev/gemini-api/docs
- Issue #980: https://github.com/langchain-ai/langchain-google/issues/980

## Conclusion

While Gemini works perfectly for debate generation, it currently fails for judging due to message format incompatibility with LangChain's implementation. The current workaround (GPT-5.1-thinking) actually provides superior judging quality, so this may not be a critical issue to resolve immediately. However, for cost optimization in production, resolving this would allow using Gemini's cheaper models for judging.
