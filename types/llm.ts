/**
 * LLM Client Types and Interfaces
 * Defines the unified interface for all LLM providers
 */

export type LLMProvider = 'openai' | 'anthropic' | 'google' | 'xai' | 'openrouter';

export type LLMRole = 'judge' | 'fact-checker' | 'moderator' | 'debater';

export type LLMTier = 'development' | 'production' | 'championship';

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMConfig {
  provider: LLMProvider;
  model: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  timeout?: number; // in milliseconds
}

export interface LLMResponse {
  content: string;
  tokensUsed: {
    input: number;
    output: number;
    total: number;
  };
  cost: number;
  latencyMs: number;
  model: string;
  provider: LLMProvider;
}

export interface StreamChunk {
  content: string;
  isComplete: boolean;
  tokensUsed?: {
    input: number;
    output: number;
    total: number;
  };
}

export interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

export interface CostConfig {
  inputCostPer1M: number;
  outputCostPer1M: number;
}

export interface ModelPricing {
  [key: string]: CostConfig;
}

export interface LLMClientOptions {
  apiKey: string;
  retryConfig?: RetryConfig;
  timeout?: number;
}

export interface ILLMProvider {
  generate(messages: LLMMessage[], config: LLMConfig): Promise<LLMResponse>;
  stream(messages: LLMMessage[], config: LLMConfig): AsyncGenerator<StreamChunk>;
  countTokens(text: string): number;
  calculateCost(inputTokens: number, outputTokens: number, model: string): number;
}
