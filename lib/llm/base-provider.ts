/**
 * Base LLM Provider
 * Abstract class that all provider adapters extend
 */

import type {
  ILLMProvider,
  LLMMessage,
  LLMConfig,
  LLMResponse,
  StreamChunk,
  RetryConfig,
  LLMClientOptions,
  ModelPricing,
} from '@/types/llm';

export abstract class BaseLLMProvider implements ILLMProvider {
  protected apiKey: string;
  protected retryConfig: RetryConfig;
  protected timeout: number;
  protected abstract pricing: ModelPricing;

  constructor(options: LLMClientOptions) {
    this.apiKey = options.apiKey;
    this.retryConfig = options.retryConfig || {
      maxRetries: 3,
      initialDelayMs: 1000,
      maxDelayMs: 8000,
      backoffMultiplier: 2,
    };
    this.timeout = options.timeout || 120000; // 120 seconds default
  }

  abstract generate(messages: LLMMessage[], config: LLMConfig): Promise<LLMResponse>;
  abstract stream(messages: LLMMessage[], config: LLMConfig): AsyncGenerator<StreamChunk>;
  abstract countTokens(text: string): number;

  calculateCost(inputTokens: number, outputTokens: number, model: string): number {
    const modelPricing = this.pricing[model];
    if (!modelPricing) {
      console.warn(`No pricing found for model: ${model}, returning 0`);
      return 0;
    }

    const inputCost = (inputTokens / 1_000_000) * modelPricing.inputCostPer1M;
    const outputCost = (outputTokens / 1_000_000) * modelPricing.outputCostPer1M;
    return inputCost + outputCost;
  }

  /**
   * Retry logic with exponential backoff
   */
  protected async withRetry<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    let lastError: Error | null = null;
    let delay = this.retryConfig.initialDelayMs;

    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        const result = await operation();
        return result;
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < this.retryConfig.maxRetries) {
          console.warn(
            `${operationName} failed (attempt ${attempt + 1}/${this.retryConfig.maxRetries + 1}): ${lastError.message}`
          );
          console.warn(`Retrying in ${delay}ms...`);
          
          await this.sleep(delay);
          delay = Math.min(delay * this.retryConfig.backoffMultiplier, this.retryConfig.maxDelayMs);
        }
      }
    }

    throw new Error(
      `${operationName} failed after ${this.retryConfig.maxRetries + 1} attempts: ${lastError?.message}`
    );
  }

  /**
   * Timeout wrapper for operations
   */
  protected async withTimeout<T>(
    operation: Promise<T>,
    timeoutMs: number,
    operationName: string
  ): Promise<T> {
    return Promise.race([
      operation,
      new Promise<T>((_, reject) =>
        setTimeout(
          () => reject(new Error(`${operationName} timed out after ${timeoutMs}ms`)),
          timeoutMs
        )
      ),
    ]);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
