/**
 * Anthropic Provider Adapter
 * Supports Claude 4.5 Sonnet, Claude 3.5 Sonnet, and other Anthropic models
 * Latest frontier: Claude 4.5 Sonnet (claude-sonnet-4-5-20250929) - September 2025
 */

import { BaseLLMProvider } from '../base-provider';
import type {
  LLMMessage,
  LLMConfig,
  LLMResponse,
  StreamChunk,
  ModelPricing,
  LLMClientOptions,
} from '@/types/llm';

export class AnthropicProvider extends BaseLLMProvider {
  protected pricing: ModelPricing = {
    // Claude 4.5 series (Latest frontier - September 2025)
    'claude-sonnet-4-5-20250929': {
      inputCostPer1M: 3.00,
      outputCostPer1M: 15.00,
    },
    'claude-4.5-sonnet': {
      inputCostPer1M: 3.00,
      outputCostPer1M: 15.00,
    },
    // Claude 3.5 series (Legacy)
    'claude-3-5-sonnet-20241022': {
      inputCostPer1M: 3.00,
      outputCostPer1M: 15.00,
    },
    'claude-3-5-haiku-20241022': {
      inputCostPer1M: 0.80,
      outputCostPer1M: 4.00,
    },
    // Claude 3 series (Legacy)
    'claude-3-opus-20240229': {
      inputCostPer1M: 15.00,
      outputCostPer1M: 75.00,
    },
    'claude-3-sonnet-20240229': {
      inputCostPer1M: 3.00,
      outputCostPer1M: 15.00,
    },
    'claude-3-haiku-20240307': {
      inputCostPer1M: 0.25,
      outputCostPer1M: 1.25,
    },
  };

  constructor(options: LLMClientOptions) {
    super(options);
  }

  async generate(messages: LLMMessage[], config: LLMConfig): Promise<LLMResponse> {
    const startTime = Date.now();

    const response = await this.withRetry(
      async () => {
        // Separate system message from other messages
        const systemMessage = messages.find(m => m.role === 'system');
        const conversationMessages = messages.filter(m => m.role !== 'system');

        const requestBody = {
          model: config.model,
          max_tokens: config.maxTokens || 4096,
          temperature: config.temperature ?? 0.7,
          top_p: config.topP,
          system: systemMessage?.content,
          messages: conversationMessages.map(msg => ({
            role: msg.role === 'assistant' ? 'assistant' : 'user',
            content: msg.content,
          })),
        };

        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.apiKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify(requestBody),
          signal: AbortSignal.timeout(config.timeout || this.timeout),
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Anthropic API error: ${response.status} - ${error}`);
        }

        return await response.json();
      },
      'Anthropic generate'
    );

    const latencyMs = Date.now() - startTime;
    const inputTokens = response.usage?.input_tokens || 0;
    const outputTokens = response.usage?.output_tokens || 0;
    const totalTokens = inputTokens + outputTokens;

    return {
      content: response.content[0]?.text || '',
      tokensUsed: {
        input: inputTokens,
        output: outputTokens,
        total: totalTokens,
      },
      cost: this.calculateCost(inputTokens, outputTokens, config.model),
      latencyMs,
      model: config.model,
      provider: 'anthropic',
    };
  }

  async *stream(messages: LLMMessage[], config: LLMConfig): AsyncGenerator<StreamChunk> {
    const systemMessage = messages.find(m => m.role === 'system');
    const conversationMessages = messages.filter(m => m.role !== 'system');

    const requestBody = {
      model: config.model,
      max_tokens: config.maxTokens || 4096,
      temperature: config.temperature ?? 0.7,
      top_p: config.topP,
      system: systemMessage?.content,
      messages: conversationMessages.map(msg => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content,
      })),
      stream: true,
    };

    const response = await this.withRetry(
      async () => {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.apiKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify(requestBody),
          signal: AbortSignal.timeout(config.timeout || this.timeout),
        });

        if (!res.ok) {
          const error = await res.text();
          throw new Error(`Anthropic API error: ${res.status} - ${error}`);
        }

        return res;
      },
      'Anthropic stream'
    );

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Failed to get response reader');
    }

    const decoder = new TextDecoder();
    let fullContent = '';
    let inputTokens = 0;
    let outputTokens = 0;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim().startsWith('data:'));

        for (const line of lines) {
          const data = line.replace('data:', '').trim();
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            
            if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
              const content = parsed.delta.text;
              fullContent += content;
              yield {
                content,
                isComplete: false,
              };
            }

            if (parsed.type === 'message_start' && parsed.message?.usage) {
              inputTokens = parsed.message.usage.input_tokens || 0;
            }

            if (parsed.type === 'message_delta' && parsed.usage) {
              outputTokens = parsed.usage.output_tokens || 0;
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    // Final chunk with token usage
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
    // For production, use Anthropic's token counting API
    return Math.ceil(text.length / 4);
  }
}
