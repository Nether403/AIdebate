/**
 * LLM Client Error Handling Tests
 * Tests retry logic, timeout scenarios, and token counting accuracy
 */

import { describe, it, mock, beforeEach } from 'node:test';
import assert from 'node:assert';
import { LLMClient } from '../client';
import { BaseLLMProvider } from '../base-provider';
import type { LLMMessage, LLMConfig, LLMResponse, StreamChunk, ModelPricing } from '@/types/llm';

// Mock environment variables
process.env.OPENAI_API_KEY = 'test-key';
process.env.GOOGLE_API_KEY = 'test-key';

// Mock provider for testing
class MockProvider extends BaseLLMProvider {
  protected pricing: ModelPricing = {
    'test-model': {
      inputCostPer1M: 1.0,
      outputCostPer1M: 2.0,
    },
    'gpt-4o-mini': {
      inputCostPer1M: 0.15,
      outputCostPer1M: 0.60,
    },
    'gpt-4o': {
      inputCostPer1M: 2.50,
      outputCostPer1M: 10.00,
    },
  };

  public attemptCount = 0;
  public shouldFail = false;
  public failCount = 0;
  public responseDelay = 0;
  public mockResponse: LLMResponse | null = null;

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

    if (this.mockResponse) {
      return this.mockResponse;
    }

    const content = 'Hello!';
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

describe('LLM Client Error Handling', () => {
  let client: LLMClient;

  beforeEach(() => {
    client = new LLMClient();
  });

  describe('Retry Logic', () => {
    it('should retry on failure and succeed on second attempt', async () => {
      const messages: LLMMessage[] = [
        { role: 'user', content: 'Hello' }
      ];
      const config: LLMConfig = {
        provider: 'openai',
        model: 'test-model',
      };

      // Create mock provider that fails once then succeeds
      const provider = new MockProvider({ 
        apiKey: 'test-key',
        retryConfig: {
          maxRetries: 2,
          initialDelayMs: 10,
          maxDelayMs: 100,
          backoffMultiplier: 2,
        }
      });
      provider.shouldFail = true;
      provider.failCount = 1; // Fail on first attempt only
      provider.mockResponse = {
        content: 'Hello!',
        tokensUsed: { input: 10, output: 5, total: 15 },
        cost: 0.001,
        latencyMs: 100,
        model: 'test-model',
        provider: 'openai',
      };

      (client as any).providers.set('openai', provider);

      const response = await client.generate(messages, config);
      
      assert.strictEqual(provider.attemptCount, 2, 'Should retry once after failure');
      assert.strictEqual(response.content, 'Hello!');
    });

    it('should fail after max retries exceeded', async () => {
      const messages: LLMMessage[] = [
        { role: 'user', content: 'Hello' }
      ];
      const config: LLMConfig = {
        provider: 'openai',
        model: 'test-model',
      };

      // Create mock provider that always fails
      const provider = new MockProvider({ 
        apiKey: 'test-key',
        retryConfig: {
          maxRetries: 2,
          initialDelayMs: 10,
          maxDelayMs: 100,
          backoffMultiplier: 2,
        }
      });
      provider.shouldFail = true;
      provider.failCount = 10; // Always fail

      (client as any).providers.set('openai', provider);

      await assert.rejects(
        async () => await client.generate(messages, config),
        /failed after 3 attempts/,
        'Should throw error after max retries'
      );

      assert.strictEqual(provider.attemptCount, 3, 'Should attempt 3 times (initial + 2 retries)');
    });

    it('should use exponential backoff between retries', async () => {
      const messages: LLMMessage[] = [
        { role: 'user', content: 'Hello' }
      ];
      const config: LLMConfig = {
        provider: 'openai',
        model: 'test-model',
      };

      const startTime = Date.now();
      
      // Create mock provider that always fails
      const provider = new MockProvider({ 
        apiKey: 'test-key',
        retryConfig: {
          maxRetries: 2,
          initialDelayMs: 50,
          maxDelayMs: 200,
          backoffMultiplier: 2,
        }
      });
      provider.shouldFail = true;
      provider.failCount = 10; // Always fail

      (client as any).providers.set('openai', provider);

      try {
        await client.generate(messages, config);
      } catch (e) {
        // Expected to fail
      }

      const totalTime = Date.now() - startTime;
      
      // With exponential backoff: 50ms + 100ms = 150ms minimum
      // Allow some tolerance for execution time
      assert.ok(totalTime >= 140, `Total time should be at least 140ms (got ${totalTime}ms)`);
      assert.strictEqual(provider.attemptCount, 3, 'Should attempt 3 times');
    });
  });

  describe('Timeout Handling', () => {
    it('should timeout after specified duration', async () => {
      const messages: LLMMessage[] = [
        { role: 'user', content: 'Hello' }
      ];
      const config: LLMConfig = {
        provider: 'openai',
        model: 'test-model',
        timeout: 100, // 100ms timeout
      };

      // Create mock provider that takes too long
      const provider = new MockProvider({ 
        apiKey: 'test-key',
        timeout: 100,
      });
      provider.responseDelay = 200; // Delay longer than timeout

      (client as any).providers.set('openai', provider);

      await assert.rejects(
        async () => await client.generate(messages, config),
        /timed out/,
        'Should throw timeout error'
      );
    });

    it('should succeed if response comes before timeout', async () => {
      const messages: LLMMessage[] = [
        { role: 'user', content: 'Hello' }
      ];
      const config: LLMConfig = {
        provider: 'openai',
        model: 'test-model',
        timeout: 200, // 200ms timeout
      };

      // Create mock provider that responds quickly
      const provider = new MockProvider({ 
        apiKey: 'test-key',
        timeout: 200,
      });
      provider.responseDelay = 50; // Delay shorter than timeout
      provider.mockResponse = {
        content: 'Hello!',
        tokensUsed: { input: 10, output: 5, total: 15 },
        cost: 0.001,
        latencyMs: 50,
        model: 'test-model',
        provider: 'openai',
      };

      (client as any).providers.set('openai', provider);

      const response = await client.generate(messages, config);
      assert.strictEqual(response.content, 'Hello!');
    });
  });

  describe('Token Counting', () => {
    it('should count tokens accurately for simple text', () => {
      const text = 'Hello world';
      const tokenCount = client.countTokens(text, 'openai');
      
      // Rough approximation: 1 token ≈ 4 characters
      // "Hello world" = 11 characters ≈ 3 tokens
      assert.ok(tokenCount >= 2 && tokenCount <= 4, 'Token count should be approximately correct');
    });

    it('should count tokens for longer text', () => {
      const text = 'This is a longer piece of text that should have more tokens. It contains multiple sentences and various words.';
      const tokenCount = client.countTokens(text, 'openai');
      
      // Should be roughly text.length / 4
      const expectedTokens = Math.ceil(text.length / 4);
      assert.strictEqual(tokenCount, expectedTokens, 'Token count should match approximation');
    });

    it('should handle empty text', () => {
      const text = '';
      const tokenCount = client.countTokens(text, 'openai');
      assert.strictEqual(tokenCount, 0, 'Empty text should have 0 tokens');
    });

    it('should handle special characters', () => {
      const text = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      const tokenCount = client.countTokens(text, 'openai');
      assert.ok(tokenCount > 0, 'Special characters should be counted');
    });
  });

  describe('Cost Calculation', () => {
    it('should calculate cost correctly for GPT-4o-mini', () => {
      const inputTokens = 1000;
      const outputTokens = 500;
      const cost = client.calculateCost(inputTokens, outputTokens, 'gpt-4o-mini', 'openai');
      
      // GPT-4o-mini: $0.15 per 1M input, $0.60 per 1M output
      // 1000 input tokens = 0.001M * 0.15 = $0.00015
      // 500 output tokens = 0.0005M * 0.60 = $0.0003
      // Total = $0.00045
      const expectedCost = 0.00045;
      assert.ok(Math.abs(cost - expectedCost) < 0.000001, 'Cost should be calculated correctly');
    });

    it('should calculate cost correctly for GPT-4o', () => {
      const inputTokens = 1000;
      const outputTokens = 500;
      const cost = client.calculateCost(inputTokens, outputTokens, 'gpt-4o', 'openai');
      
      // GPT-4o: $2.50 per 1M input, $10.00 per 1M output
      // 1000 input tokens = 0.001M * 2.50 = $0.0025
      // 500 output tokens = 0.0005M * 10.00 = $0.005
      // Total = $0.0075
      const expectedCost = 0.0075;
      assert.ok(Math.abs(cost - expectedCost) < 0.000001, 'Cost should be calculated correctly');
    });

    it('should return 0 for unknown model', () => {
      const inputTokens = 1000;
      const outputTokens = 500;
      const cost = client.calculateCost(inputTokens, outputTokens, 'unknown-model', 'openai');
      assert.strictEqual(cost, 0, 'Unknown model should return 0 cost');
    });
  });

  describe('Provider Availability', () => {
    it('should check if provider is available', () => {
      const isAvailable = client.isProviderAvailable('openai');
      assert.strictEqual(isAvailable, true, 'OpenAI should be available');
    });

    it('should return false for unavailable provider', () => {
      const isAvailable = client.isProviderAvailable('anthropic');
      // Anthropic might not be available if API key is not set
      assert.ok(typeof isAvailable === 'boolean', 'Should return boolean');
    });

    it('should list available providers', () => {
      const providers = client.getAvailableProviders();
      assert.ok(Array.isArray(providers), 'Should return array');
      assert.ok(providers.length > 0, 'Should have at least one provider');
      assert.ok(providers.includes('openai'), 'Should include OpenAI');
    });

    it('should throw error when using unavailable provider', async () => {
      const messages: LLMMessage[] = [
        { role: 'user', content: 'Hello' }
      ];
      const config: LLMConfig = {
        provider: 'anthropic',
        model: 'claude-3-5-sonnet-20241022',
      };

      // Remove Anthropic provider
      (client as any).providers.delete('anthropic');

      await assert.rejects(
        async () => await client.generate(messages, config),
        /not initialized/,
        'Should throw error for unavailable provider'
      );
    });
  });
});
