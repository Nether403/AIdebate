/**
 * LLM Client Integration Tests
 * Practical tests for retry logic, timeout, and token counting
 */

import { BaseLLMProvider } from '../base-provider';
import type { LLMMessage, LLMConfig, LLMResponse, StreamChunk, ModelPricing, LLMClientOptions } from '@/types/llm';

// Mock provider for testing
class MockProvider extends BaseLLMProvider {
  protected pricing: ModelPricing = {
    'test-model': {
      inputCostPer1M: 1.0,
      outputCostPer1M: 2.0,
    },
  };

  public attemptCount = 0;
  public shouldFail = false;
  public failCount = 0;
  public responseDelay = 0;

  async generate(messages: LLMMessage[], config: LLMConfig): Promise<LLMResponse> {
    return this.withRetry(async () => {
      return this.withTimeout(
        this.generateInternal(messages, config),
        config.timeout || this.timeout,
        'generate'
      );
    }, 'generate');
  }

  private async generateInternal(messages: LLMMessage[], config: LLMConfig): Promise<LLMResponse> {
    this.attemptCount++;

    if (this.shouldFail && this.attemptCount <= this.failCount) {
      throw new Error('Mock API Error');
    }

    if (this.responseDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.responseDelay));
    }

    const content = 'Mock response';
    const inputTokens = this.countTokens(messages.map(m => m.content).join(' '));
    const outputTokens = this.countTokens(content);

    return {
      content,
      tokensUsed: {
        input: inputTokens,
        output: outputTokens,
        total: inputTokens + outputTokens,
      },
      cost: this.calculateCost(inputTokens, outputTokens, config.model),
      latencyMs: this.responseDelay,
      model: config.model,
      provider: 'openai',
    };
  }

  async *stream(messages: LLMMessage[], config: LLMConfig): AsyncGenerator<StreamChunk> {
    yield { content: 'Mock', isComplete: false };
    yield { content: ' stream', isComplete: false };
    yield { 
      content: '', 
      isComplete: true,
      tokensUsed: { input: 10, output: 5, total: 15 }
    };
  }

  countTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }
}

// Test runner
async function runTests() {
  console.log('Running LLM Client Integration Tests\n');
  let passed = 0;
  let failed = 0;

  // Test 1: Retry logic with eventual success
  try {
    console.log('Test 1: Retry logic with eventual success');
    const provider = new MockProvider({ 
      apiKey: 'test',
      retryConfig: {
        maxRetries: 3,
        initialDelayMs: 10,
        maxDelayMs: 100,
        backoffMultiplier: 2,
      }
    });
    provider.shouldFail = true;
    provider.failCount = 2; // Fail twice, succeed on third

    const messages: LLMMessage[] = [{ role: 'user', content: 'Hello' }];
    const config: LLMConfig = { provider: 'openai', model: 'test-model' };

    const response = await provider.generate(messages, config);
    
    if (provider.attemptCount === 3 && response.content === 'Mock response') {
      console.log('✓ PASSED: Retried and succeeded on third attempt\n');
      passed++;
    } else {
      console.log(`✗ FAILED: Expected 3 attempts, got ${provider.attemptCount}\n`);
      failed++;
    }
  } catch (error) {
    console.log(`✗ FAILED: ${error}\n`);
    failed++;
  }

  // Test 2: Retry logic with max retries exceeded
  try {
    console.log('Test 2: Retry logic with max retries exceeded');
    const provider = new MockProvider({ 
      apiKey: 'test',
      retryConfig: {
        maxRetries: 2,
        initialDelayMs: 10,
        maxDelayMs: 100,
        backoffMultiplier: 2,
      }
    });
    provider.shouldFail = true;
    provider.failCount = 10; // Always fail

    const messages: LLMMessage[] = [{ role: 'user', content: 'Hello' }];
    const config: LLMConfig = { provider: 'openai', model: 'test-model' };

    try {
      await provider.generate(messages, config);
      console.log('✗ FAILED: Should have thrown error after max retries\n');
      failed++;
    } catch (error) {
      if (provider.attemptCount === 3 && (error as Error).message.includes('failed after 3 attempts')) {
        console.log('✓ PASSED: Failed after max retries (3 attempts)\n');
        passed++;
      } else {
        console.log(`✗ FAILED: Expected 3 attempts and specific error message\n`);
        failed++;
      }
    }
  } catch (error) {
    console.log(`✗ FAILED: ${error}\n`);
    failed++;
  }

  // Test 3: Timeout handling
  try {
    console.log('Test 3: Timeout handling');
    const provider = new MockProvider({ 
      apiKey: 'test',
      timeout: 100,
    });
    provider.responseDelay = 200; // Delay longer than timeout

    const messages: LLMMessage[] = [{ role: 'user', content: 'Hello' }];
    const config: LLMConfig = { 
      provider: 'openai', 
      model: 'test-model',
      timeout: 100,
    };

    try {
      await provider.generate(messages, config);
      console.log('✗ FAILED: Should have timed out\n');
      failed++;
    } catch (error) {
      if ((error as Error).message.includes('timed out')) {
        console.log('✓ PASSED: Request timed out as expected\n');
        passed++;
      } else {
        console.log(`✗ FAILED: Expected timeout error, got: ${(error as Error).message}\n`);
        failed++;
      }
    }
  } catch (error) {
    console.log(`✗ FAILED: ${error}\n`);
    failed++;
  }

  // Test 4: Token counting accuracy
  try {
    console.log('Test 4: Token counting accuracy');
    const provider = new MockProvider({ apiKey: 'test' });

    const tests = [
      { text: 'Hello world', expectedMin: 2, expectedMax: 4 },
      { text: 'This is a longer text with more words', expectedMin: 8, expectedMax: 12 },
      { text: '', expectedMin: 0, expectedMax: 0 },
    ];

    let allPassed = true;
    for (const test of tests) {
      const count = provider.countTokens(test.text);
      if (count < test.expectedMin || count > test.expectedMax) {
        console.log(`  ✗ Text "${test.text}" - Expected ${test.expectedMin}-${test.expectedMax}, got ${count}`);
        allPassed = false;
      }
    }

    if (allPassed) {
      console.log('✓ PASSED: Token counting is accurate\n');
      passed++;
    } else {
      console.log('✗ FAILED: Token counting inaccurate\n');
      failed++;
    }
  } catch (error) {
    console.log(`✗ FAILED: ${error}\n`);
    failed++;
  }

  // Test 5: Cost calculation
  try {
    console.log('Test 5: Cost calculation');
    const provider = new MockProvider({ apiKey: 'test' });

    const inputTokens = 1000;
    const outputTokens = 500;
    const cost = provider.calculateCost(inputTokens, outputTokens, 'test-model');

    // test-model: $1.00 per 1M input, $2.00 per 1M output
    // 1000 input = 0.001M * 1.00 = $0.001
    // 500 output = 0.0005M * 2.00 = $0.001
    // Total = $0.002
    const expectedCost = 0.002;

    if (Math.abs(cost - expectedCost) < 0.000001) {
      console.log('✓ PASSED: Cost calculation is accurate\n');
      passed++;
    } else {
      console.log(`✗ FAILED: Expected cost ${expectedCost}, got ${cost}\n`);
      failed++;
    }
  } catch (error) {
    console.log(`✗ FAILED: ${error}\n`);
    failed++;
  }

  // Test 6: Streaming
  try {
    console.log('Test 6: Streaming');
    const provider = new MockProvider({ apiKey: 'test' });

    const messages: LLMMessage[] = [{ role: 'user', content: 'Hello' }];
    const config: LLMConfig = { provider: 'openai', model: 'test-model' };

    let chunks: string[] = [];
    let completed = false;

    for await (const chunk of provider.stream(messages, config)) {
      if (chunk.isComplete) {
        completed = true;
      } else {
        chunks.push(chunk.content);
      }
    }

    if (chunks.length === 2 && completed && chunks.join('') === 'Mock stream') {
      console.log('✓ PASSED: Streaming works correctly\n');
      passed++;
    } else {
      console.log(`✗ FAILED: Expected 2 chunks and completion, got ${chunks.length} chunks\n`);
      failed++;
    }
  } catch (error) {
    console.log(`✗ FAILED: ${error}\n`);
    failed++;
  }

  // Summary
  console.log('='.repeat(50));
  console.log(`Test Results: ${passed} passed, ${failed} failed`);
  console.log('='.repeat(50));

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((error) => {
  console.error('Test runner error:', error);
  process.exit(1);
});
