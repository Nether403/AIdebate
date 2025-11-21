/**
 * Google Gemini Provider Adapter
 * Supports Gemini 3.0 Pro, Gemini 2.5 Flash, and other Google models
 * Latest frontier: Gemini 3.0 Pro (gemini-3.0-pro) - November 2025
 */

import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { BaseLLMProvider } from '../base-provider';
import type {
  LLMMessage,
  LLMConfig,
  LLMResponse,
  StreamChunk,
  ModelPricing,
  LLMClientOptions,
} from '@/types/llm';

export class GoogleProvider extends BaseLLMProvider {
  protected pricing: ModelPricing = {
    // Gemini 3.0 series (Latest frontier - November 2025)
    'gemini-3.0-pro': {
      inputCostPer1M: 1.25,
      outputCostPer1M: 5.00,
    },
    'gemini-3-pro': {
      inputCostPer1M: 1.25,
      outputCostPer1M: 5.00,
    },
    // Gemini 2.5 series (Latest frontier - November 2025)
    'gemini-2.5-flash': {
      inputCostPer1M: 0.075,
      outputCostPer1M: 0.30,
    },
    // Gemini 2.0 series (Legacy)
    'gemini-2.0-flash-exp': {
      inputCostPer1M: 0.00,
      outputCostPer1M: 0.00,
    },
    // Gemini 1.5 series (Legacy)
    'gemini-1.5-pro': {
      inputCostPer1M: 1.25,
      outputCostPer1M: 5.00,
    },
    'gemini-1.5-flash': {
      inputCostPer1M: 0.075,
      outputCostPer1M: 0.30,
    },
    'gemini-pro': {
      inputCostPer1M: 0.50,
      outputCostPer1M: 1.50,
    },
  };

  constructor(options: LLMClientOptions) {
    super(options);
  }

  async generate(messages: LLMMessage[], config: LLMConfig): Promise<LLMResponse> {
    const startTime = Date.now();

    const response = await this.withRetry(
      async () => {
        const model = new ChatGoogleGenerativeAI({
          apiKey: this.apiKey,
          model: config.model,
          temperature: config.temperature ?? 0.7,
          maxOutputTokens: config.maxTokens,
          topP: config.topP,
        });

        const formattedMessages = messages.map((msg) => [msg.role, msg.content] as [string, string]);
        
        return await this.withTimeout(
          model.invoke(formattedMessages),
          config.timeout || this.timeout,
          'Google generate'
        );
      },
      'Google generate'
    );

    const latencyMs = Date.now() - startTime;
    const inputTokens = response.usage_metadata?.input_tokens || 0;
    const outputTokens = response.usage_metadata?.output_tokens || 0;
    const totalTokens = inputTokens + outputTokens;

    return {
      content: response.content as string,
      tokensUsed: {
        input: inputTokens,
        output: outputTokens,
        total: totalTokens,
      },
      cost: this.calculateCost(inputTokens, outputTokens, config.model),
      latencyMs,
      model: config.model,
      provider: 'google',
    };
  }

  async *stream(messages: LLMMessage[], config: LLMConfig): AsyncGenerator<StreamChunk> {
    const model = new ChatGoogleGenerativeAI({
      apiKey: this.apiKey,
      model: config.model,
      temperature: config.temperature ?? 0.7,
      maxOutputTokens: config.maxTokens,
      topP: config.topP,
      streaming: true,
    });

    const formattedMessages = messages.map((msg) => [msg.role, msg.content] as [string, string]);
    
    const stream = await this.withRetry(
      async () => model.stream(formattedMessages),
      'Google stream'
    );

    let fullContent = '';
    
    for await (const chunk of stream) {
      const content = chunk.content as string;
      fullContent += content;
      
      yield {
        content,
        isComplete: false,
      };
    }

    // Final chunk with token usage
    const inputTokens = this.countTokens(messages.map(m => m.content).join(' '));
    const outputTokens = this.countTokens(fullContent);

    yield {
      content: '',
      isComplete: true,
      tokensUsed: {
        input: inputTokens,
        output: outputTokens,
        total: inputTokens + outputTokens,
      },
    };
  }

  countTokens(text: string): number {
    // Rough approximation: 1 token ≈ 4 characters
    // For production, use Google's token counting API
    return Math.ceil(text.length / 4);
  }
}
