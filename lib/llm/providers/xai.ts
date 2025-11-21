/**
 * xAI Provider Adapter
 * Supports Grok 4.1, Grok 4.1 Fast, and other xAI models
 * Latest frontier: Grok 4.1 (grok-4.1) and Grok 4.1 Fast (grok-4.1-fast) - Late 2025
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

export class XAIProvider extends BaseLLMProvider {
  protected pricing: ModelPricing = {
    // Grok 4.1 series (Latest frontier - Late 2025)
    'grok-4.1': {
      inputCostPer1M: 5.00,
      outputCostPer1M: 15.00,
    },
    'grok-4.1-fast': {
      inputCostPer1M: 2.50,
      outputCostPer1M: 7.50,
    },
    // Grok Beta series (Legacy)
    'grok-beta': {
      inputCostPer1M: 5.00,
      outputCostPer1M: 15.00,
    },
    'grok-vision-beta': {
      inputCostPer1M: 5.00,
      outputCostPer1M: 15.00,
    },
  };

  constructor(options: LLMClientOptions) {
    super(options);
  }

  async generate(messages: LLMMessage[], config: LLMConfig): Promise<LLMResponse> {
    const startTime = Date.now();

    const response = await this.withRetry(
      async () => {
        const requestBody = {
          model: config.model,
          messages: messages.map(msg => ({
            role: msg.role,
            content: msg.content,
          })),
          temperature: config.temperature ?? 0.7,
          max_tokens: config.maxTokens,
          top_p: config.topP,
        };

        const response = await fetch('https://api.x.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify(requestBody),
          signal: AbortSignal.timeout(config.timeout || this.timeout),
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`xAI API error: ${response.status} - ${error}`);
        }

        return await response.json();
      },
      'xAI generate'
    );

    const latencyMs = Date.now() - startTime;
    const inputTokens = response.usage?.prompt_tokens || 0;
    const outputTokens = response.usage?.completion_tokens || 0;
    const totalTokens = inputTokens + outputTokens;

    return {
      content: response.choices[0]?.message?.content || '',
      tokensUsed: {
        input: inputTokens,
        output: outputTokens,
        total: totalTokens,
      },
      cost: this.calculateCost(inputTokens, outputTokens, config.model),
      latencyMs,
      model: config.model,
      provider: 'xai',
    };
  }

  async *stream(messages: LLMMessage[], config: LLMConfig): AsyncGenerator<StreamChunk> {
    const requestBody = {
      model: config.model,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      })),
      temperature: config.temperature ?? 0.7,
      max_tokens: config.maxTokens,
      top_p: config.topP,
      stream: true,
    };

    const response = await this.withRetry(
      async () => {
        const res = await fetch('https://api.x.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify(requestBody),
          signal: AbortSignal.timeout(config.timeout || this.timeout),
        });

        if (!res.ok) {
          const error = await res.text();
          throw new Error(`xAI API error: ${res.status} - ${error}`);
        }

        return res;
      },
      'xAI stream'
    );

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Failed to get response reader');
    }

    const decoder = new TextDecoder();
    let fullContent = '';

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
            const content = parsed.choices[0]?.delta?.content;
            
            if (content) {
              fullContent += content;
              yield {
                content,
                isComplete: false,
              };
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
    return Math.ceil(text.length / 4);
  }
}
