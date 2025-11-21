/**
 * OpenRouter Provider Adapter
 * Fallback provider supporting 200+ models including Claude 4.5, GPT-5.1, Gemini 3.0, Grok 4.1, Llama 4, Qwen 3, etc.
 * Latest frontier models available: Claude 4.5 Sonnet, GPT-5.1, Gemini 3.0 Pro, Grok 4.1
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

export class OpenRouterProvider extends BaseLLMProvider {
  protected pricing: ModelPricing = {
    // OpenRouter pricing varies by model, these are examples
    // Latest frontier models (Late 2025)
    'anthropic/claude-4.5-sonnet': {
      inputCostPer1M: 3.00,
      outputCostPer1M: 15.00,
    },
    'openai/gpt-5.1': {
      inputCostPer1M: 1.25,
      outputCostPer1M: 10.00,
    },
    'google/gemini-3.0-pro': {
      inputCostPer1M: 1.25,
      outputCostPer1M: 5.00,
    },
    'x-ai/grok-4.1': {
      inputCostPer1M: 5.00,
      outputCostPer1M: 15.00,
    },
    // Legacy models
    'anthropic/claude-3.5-sonnet': {
      inputCostPer1M: 3.00,
      outputCostPer1M: 15.00,
    },
    'meta-llama/llama-3.1-405b-instruct': {
      inputCostPer1M: 2.70,
      outputCostPer1M: 2.70,
    },
    'meta-llama/llama-4-405b-instruct': {
      inputCostPer1M: 3.00,
      outputCostPer1M: 3.00,
    },
    'google/gemini-pro-1.5': {
      inputCostPer1M: 1.25,
      outputCostPer1M: 5.00,
    },
    'qwen/qwen-3-72b-instruct': {
      inputCostPer1M: 0.40,
      outputCostPer1M: 0.45,
    },
    'qwen/qwen-2.5-72b-instruct': {
      inputCostPer1M: 0.35,
      outputCostPer1M: 0.40,
    },
    'deepseek/deepseek-chat': {
      inputCostPer1M: 0.14,
      outputCostPer1M: 0.28,
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

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
            'HTTP-Referer': process.env.NEXTAUTH_URL || 'http://localhost:3000',
            'X-Title': 'AI Debate Arena',
          },
          body: JSON.stringify(requestBody),
          signal: AbortSignal.timeout(config.timeout || this.timeout),
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
        }

        return await response.json();
      },
      'OpenRouter generate'
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
      provider: 'openrouter',
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
        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
            'HTTP-Referer': process.env.NEXTAUTH_URL || 'http://localhost:3000',
            'X-Title': 'AI Debate Arena',
          },
          body: JSON.stringify(requestBody),
          signal: AbortSignal.timeout(config.timeout || this.timeout),
        });

        if (!res.ok) {
          const error = await res.text();
          throw new Error(`OpenRouter API error: ${res.status} - ${error}`);
        }

        return res;
      },
      'OpenRouter stream'
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
