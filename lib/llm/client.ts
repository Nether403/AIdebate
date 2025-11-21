/**
 * Unified LLM Client
 * Factory for creating provider instances and managing LLM interactions
 */

import { OpenAIProvider } from './providers/openai';
import { GoogleProvider } from './providers/google';
import { AnthropicProvider } from './providers/anthropic';
import { XAIProvider } from './providers/xai';
import { OpenRouterProvider } from './providers/openrouter';
import type {
  LLMProvider,
  LLMMessage,
  LLMConfig,
  LLMResponse,
  StreamChunk,
  ILLMProvider,
  LLMClientOptions,
} from '@/types/llm';

export class LLMClient {
  private providers: Map<LLMProvider, ILLMProvider> = new Map();

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders(): void {
    // Initialize OpenAI
    if (process.env.OPENAI_API_KEY) {
      this.providers.set('openai', new OpenAIProvider({
        apiKey: process.env.OPENAI_API_KEY,
      }));
    }

    // Initialize Google
    if (process.env.GOOGLE_API_KEY) {
      this.providers.set('google', new GoogleProvider({
        apiKey: process.env.GOOGLE_API_KEY,
      }));
    }

    // Initialize Anthropic
    if (process.env.ANTHROPIC_API_KEY) {
      this.providers.set('anthropic', new AnthropicProvider({
        apiKey: process.env.ANTHROPIC_API_KEY,
      }));
    }

    // Initialize xAI
    if (process.env.XAI_API_KEY) {
      this.providers.set('xai', new XAIProvider({
        apiKey: process.env.XAI_API_KEY,
      }));
    }

    // Initialize OpenRouter (fallback)
    if (process.env.OPENROUTER_API_KEY) {
      this.providers.set('openrouter', new OpenRouterProvider({
        apiKey: process.env.OPENROUTER_API_KEY,
      }));
    }
  }

  /**
   * Get a provider instance
   */
  private getProvider(provider: LLMProvider): ILLMProvider {
    const providerInstance = this.providers.get(provider);
    if (!providerInstance) {
      throw new Error(
        `Provider "${provider}" not initialized. Check that the API key is set in environment variables.`
      );
    }
    return providerInstance;
  }

  /**
   * Generate a response from an LLM
   */
  async generate(messages: LLMMessage[], config: LLMConfig): Promise<LLMResponse> {
    const provider = this.getProvider(config.provider);
    return await provider.generate(messages, config);
  }

  /**
   * Stream a response from an LLM
   */
  async *stream(messages: LLMMessage[], config: LLMConfig): AsyncGenerator<StreamChunk> {
    const provider = this.getProvider(config.provider);
    yield* provider.stream(messages, config);
  }

  /**
   * Count tokens in text
   */
  countTokens(text: string, provider: LLMProvider): number {
    const providerInstance = this.getProvider(provider);
    return providerInstance.countTokens(text);
  }

  /**
   * Calculate cost for a given number of tokens
   */
  calculateCost(
    inputTokens: number,
    outputTokens: number,
    model: string,
    provider: LLMProvider
  ): number {
    const providerInstance = this.getProvider(provider);
    return providerInstance.calculateCost(inputTokens, outputTokens, model);
  }

  /**
   * Check if a provider is available
   */
  isProviderAvailable(provider: LLMProvider): boolean {
    return this.providers.has(provider);
  }

  /**
   * Get list of available providers
   */
  getAvailableProviders(): LLMProvider[] {
    return Array.from(this.providers.keys());
  }
}

// Singleton instance
let llmClientInstance: LLMClient | null = null;

/**
 * Get the singleton LLM client instance
 */
export function getLLMClient(): LLMClient {
  if (!llmClientInstance) {
    llmClientInstance = new LLMClient();
  }
  return llmClientInstance;
}

/**
 * Helper function to create a simple chat completion
 */
export async function chat(
  prompt: string,
  config: LLMConfig,
  systemPrompt?: string
): Promise<string> {
  const client = getLLMClient();
  const messages: LLMMessage[] = [];

  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }

  messages.push({ role: 'user', content: prompt });

  const response = await client.generate(messages, config);
  return response.content;
}

/**
 * Helper function to stream a chat completion
 */
export async function* chatStream(
  prompt: string,
  config: LLMConfig,
  systemPrompt?: string
): AsyncGenerator<string> {
  const client = getLLMClient();
  const messages: LLMMessage[] = [];

  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }

  messages.push({ role: 'user', content: prompt });

  for await (const chunk of client.stream(messages, config)) {
    if (!chunk.isComplete) {
      yield chunk.content;
    }
  }
}
