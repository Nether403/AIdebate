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
    // Current active Gemini models (November 2025)
    'gemini-3-pro-preview': {
      inputCostPer1M: 1.25,
      outputCostPer1M: 5.00,
    },
    'gemini-2.5-pro': {
      inputCostPer1M: 1.25,
      outputCostPer1M: 5.00,
    },
    'gemini-2.5-flash': {
      inputCostPer1M: 0.075,
      outputCostPer1M: 0.30,
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

        // Convert to LangChain message format
        // Gemini doesn't support system messages, so we prepend them to the first user message
        const formattedMessages: Array<{ role: string; content: string }> = [];
        let systemContent = '';
        
        for (const msg of messages) {
          if (msg.role === 'system') {
            // Accumulate system messages
            systemContent += msg.content + '\n\n';
          } else if (msg.role === 'user') {
            // Prepend system content to first user message
            const content = systemContent ? systemContent + msg.content : msg.content;
            formattedMessages.push({ role: 'human', content });
            systemContent = ''; // Clear after first use
          } else if (msg.role === 'assistant') {
            formattedMessages.push({ role: 'ai', content: msg.content });
          }
        }
        
        try {
          const result = await this.withTimeout(
            model.invoke(formattedMessages),
            config.timeout || this.timeout,
            'Google generate'
          );
          
          if (!result) {
            throw new Error('Google API returned undefined response');
          }
          
          return result;
        } catch (error) {
          console.error('[Google Provider] Error details:', {
            error: error instanceof Error ? error.message : String(error),
            messagesCount: formattedMessages.length,
            firstMessage: formattedMessages[0],
          });
          throw error;
        }
      },
      'Google generate'
    );

    const latencyMs = Date.now() - startTime;
    const inputTokens = response.usage_metadata?.input_tokens || 0;
    const outputTokens = response.usage_metadata?.output_tokens || 0;
    const totalTokens = inputTokens + outputTokens;

    // Handle content - it might be a string or an array of content parts
    let content: string;
    if (typeof response.content === 'string') {
      content = response.content;
    } else if (Array.isArray(response.content)) {
      // If it's an array, join the text parts
      content = response.content
        .map((part: any) => (typeof part === 'string' ? part : part.text || ''))
        .join('');
    } else {
      content = String(response.content || '');
    }

    return {
      content,
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

    // Convert to LangChain message format
    const formattedMessages = messages.map((msg) => {
      if (msg.role === 'system' || msg.role === 'user') {
        return { role: 'human', content: msg.content };
      } else if (msg.role === 'assistant') {
        return { role: 'ai', content: msg.content };
      }
      return { role: 'human', content: msg.content };
    });
    
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
