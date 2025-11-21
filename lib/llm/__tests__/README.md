# LLM Client Tests

## Test Coverage

This directory contains tests for the LLM client implementation, covering:

1. **Retry Logic** - Exponential backoff with configurable max retries
2. **Timeout Handling** - 120-second default timeout for LLM operations
3. **Token Counting** - Approximate token counting for cost estimation
4. **Cost Calculation** - Accurate cost calculation based on model pricing
5. **Streaming** - Async generator-based streaming support
6. **Provider Management** - Multi-provider support with availability checking

## Running Tests

```bash
# Run all LLM tests
npm run test:llm

# Or run directly with tsx
tsx lib/llm/__tests__/integration.test.ts
```

## Test Results

### Integration Tests (Practical Tests)

✅ **Token Counting Accuracy** - Verifies approximate token counting (1 token ≈ 4 characters)
✅ **Cost Calculation** - Validates cost calculation for different models
✅ **Streaming** - Tests async generator streaming functionality

⚠️ **Retry Logic** - Requires actual API calls or complex mocking (tested manually)
⚠️ **Timeout Handling** - Requires actual API calls or complex mocking (tested manually)

### Unit Tests (Mock-Based Tests)

✅ **Token Counting** - Multiple test cases for different text lengths
✅ **Cost Calculation** - Tests for GPT-4o, GPT-4o-mini, and unknown models
✅ **Provider Availability** - Tests provider checking and listing
✅ **Error Handling** - Tests for unavailable providers

⚠️ **Retry with Mocks** - Complex mocking of retry logic (partially working)
⚠️ **Timeout with Mocks** - Complex mocking of timeout behavior (partially working)

## Manual Testing Recommendations

For production validation, test the following scenarios with real API calls:

1. **Retry Logic**
   - Temporarily disable network to trigger retries
   - Verify exponential backoff delays
   - Confirm max retries are respected

2. **Timeout Handling**
   - Use a very low timeout (e.g., 1ms) to force timeout
   - Verify timeout error message
   - Confirm operation is cancelled

3. **Token Counting**
   - Compare with official tokenizer libraries (tiktoken for OpenAI)
   - Validate across different languages and special characters

4. **Cost Tracking**
   - Compare calculated costs with actual API bills
   - Verify pricing is up-to-date for all models

## Test Configuration

Tests use the following configuration:

- **Retry Config**: 3 max retries, 10ms initial delay, 2x backoff multiplier
- **Timeout**: 100-200ms for tests (120s in production)
- **Token Approximation**: 1 token ≈ 4 characters

## Known Limitations

1. **Token Counting**: Uses rough approximation (4 chars/token). For production, consider:
   - OpenAI: Use `tiktoken` library
   - Anthropic: Use Anthropic's token counting API
   - Google: Use Google's token counting API

2. **Mocking Complexity**: Some tests require complex mocking of async operations and timers. Integration tests with real APIs are recommended for critical paths.

3. **Provider-Specific Behavior**: Each provider has unique characteristics (rate limits, error formats, etc.) that may not be fully captured in tests.

## Future Improvements

- [ ] Add integration tests with real API calls (using test API keys)
- [ ] Implement accurate token counting using provider-specific libraries
- [ ] Add performance benchmarks for different providers
- [ ] Test concurrent request handling
- [ ] Add tests for rate limiting behavior
- [ ] Test error recovery scenarios (network failures, API outages)
