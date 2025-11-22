# Implementation Plan: LLM Configuration Fixes

- [x] 1. Create thinking tag sanitization utility





  - Create `lib/llm/utils/sanitize.ts` with `stripThinkingTags()` function
  - Implement regex-based tag removal with error handling
  - Handle edge cases: multiple tags, nested tags, malformed tags, empty tags
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 1.1 Write unit tests for sanitization utility


  - Test single thinking tag removal
  - Test multiple thinking tags removal
  - Test nested thinking tags handling
  - Test unclosed/malformed tags handling
  - Test content without thinking tags (no-op)
  - Test empty thinking tags
  - Test whitespace preservation
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 2. Update OpenAI provider to use sanitization


  - Import `stripThinkingTags` utility in `lib/llm/providers/openai.ts`
  - Apply sanitization to `generate()` method response content
  - Apply sanitization to `stream()` method with buffering logic
  - Ensure token counts and costs remain accurate
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 2.1 Write tests for OpenAI provider sanitization
  - Test that `generate()` applies sanitization
  - Test that `stream()` applies sanitization
  - Test that token counts remain accurate
  - Test that cost calculations remain accurate
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 3. Update Judge Agent model configuration




  - Change default model from `gemini-3.0-pro` to `gemini-3-pro-preview` in `lib/agents/judge.ts`
  - Verify tiebreaker model remains `gpt-5.1`
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 4. Update Google provider pricing





  - Add pricing for `gemini-3-pro-preview` in `lib/llm/providers/google.ts`
  - Add pricing for `gemini-2.5-pro`
  - Ensure legacy model pricing remains for backward compatibility
  - _Requirements: 3.1, 3.2, 3.3, 5.1, 5.2, 5.3_

- [x] 5. Update database seed data




  - Update model entry from `gemini-1.5-pro` to `gemini-3-pro-preview` in `lib/db/seed.ts`
  - Add `gemini-2.5-pro` model entry if not present
  - Add GPT-5.1 variants (`gpt-5.1`, `gpt-5.1-instant`) if not present
  - Mark legacy models as inactive (`gemini-1.5-pro`, `gpt-4o`, etc.)
  - Keep `gpt-4o-mini` as active (still useful for cheap tasks)
  - _Requirements: 1.4, 4.1, 4.2, 4.3, 4.4_

- [x] 6. Integration testing





  - Run a test debate with GPT-5.1-thinking as debater
  - Verify debate transcript shows no `<thought>` tags
  - Verify judge evaluation uses `gemini-3-pro-preview`
  - Check database for correct model identifiers
  - Verify cost calculations are accurate
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 4.1, 5.1_
