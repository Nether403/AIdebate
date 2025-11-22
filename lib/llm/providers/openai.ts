/**
 * OpenAI Provider Adapter
 * Supports GPT-5.1 (Instant and Thinking modes), GPT-4o-mini, and other OpenAI models
 * Latest frontier: GPT-5.1 (November 2025)
 */

import { ChatOpenAI } from '@langchain/openai';
import { BaseLLMProvider } from '../base-provider';
import { stripThinkingTags } from '../utils/sanitize';
import type {
  LLMMessage,
  LLMConfig,
  LLMResponse,
  StreamChunk,
  ModelPricing,
  LLMClientOptions,
} from '@/types/llm';

export class OpenAIProvider extends BaseLLMProvider {
  protected pricing: ModelPricing = {
    // GPT-5.1 models (Latest frontier - November 2025)
    'gpt-5.1': {
      inputCostPer1M: 1.25,
      outputCostPer1M: 10.00,
    },
    'gpt-5.1-instant': {
      inputCostPer1M: 1.25,
      outputCostPer1M: 10.00,
    },
    'gpt-5.1-thinking': {
      inputCostPer1M: 1.25,
      outputCostPer1M: 10.00,
    },
    // GPT-4 series (Legacy)
    'gpt-4o': {
      inputCostPer1M: 2.50,
      outputCostPer1M: 10.00,
    },
    'gpt-4o-mini': {
      inputCostPer1M: 0.15,
      outputCostPer1M: 0.60,
    },
    'gpt-4-turbo': {
      inputCostPer1M: 10.00,
      outputCostPer1M: 30.00,
    },
    'gpt-4': {
      inputCostPer1M: 30.00,
      outputCostPer1M: 60.00,
    },
    'gpt-3.5-turbo': {
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
        const model = new ChatOpenAI({
          openAIApiKey: this.apiKey,
          modelName: config.model,
          temperature: config.temperature ?? 0.7,
          maxTokens: config.maxTokens,
          topP: config.topP,
          timeout: config.timeout || this.timeout,
        });

        const formattedMessages = messages.map((msg) => [msg.role, msg.content] as [string, string]);
        
        return await this.withTimeout(
          model.invoke(formattedMessages),
          config.timeout || this.timeout,
          'OpenAI generate'
        );
      },
      'OpenAI generate'
    );

    const latencyMs = Date.now() - startTime;
    const inputTokens = response.usage_metadata?.input_tokens || 0;
    const outputTokens = response.usage_metadata?.output_tokens || 0;
    const totalTokens = inputTokens + outputTokens;

    // Sanitize thinking tags from response content
    const rawContent = response.content as string;
    const sanitizedContent = stripThinkingTags(rawContent);

    return {
      content: sanitizedContent,
      tokensUsed: {
        input: inputTokens,
        output: outputTokens,
        total: totalTokens,
      },
      cost: this.calculateCost(inputTokens, outputTokens, config.model),
      latencyMs,
      model: config.model,
      provider: 'openai',
    };
  }

  async *stream(messages: LLMMessage[], config: LLMConfig): AsyncGenerator<StreamChunk> {
    const model = new ChatOpenAI({
      openAIApiKey: this.apiKey,
      modelName: config.model,
      temperature: config.temperature ?? 0.7,
      maxTokens: config.maxTokens,
      topP: config.topP,
      streaming: true,
      timeout: config.timeout || this.timeout,
    });

    const formattedMessages = messages.map((msg) => [msg.role, msg.content] as [string, string]);
    
    const stream = await this.withRetry(
      async () => model.stream(formattedMessages),
      'OpenAI stream'
    );

    let fullContent = '';
    let buffer = '';
    let insideThinkingTag = false;
    
    for await (const chunk of stream) {
      const content = chunk.content as string;
      fullContent += content;
      buffer += content;
      
      // Process buffer for thinking tag boundaries
      while (true) {
        if (!insideThinkingTag) {
          // Look for opening tag
          if (buffer.includes('<thought>')) {
            // Yield content before the tag
            const beforeTag = buffer.substring(0, buffer.indexOf('<thought>'));
            if (beforeTag) {
              yield {
                content: beforeTag,
                isComplete: false,
              };
            }
            // Move past the opening tag and mark as inside
            buffer = buffer.substring(buffer.indexOf('<thought>') + '<thought>'.length);
            insideThinkingTag = true;
          } else {
            // No opening tag found, yield buffer if it doesn't look like a partial tag
            if (buffer && !buffer.endsWith('<') && !buffer.endsWith('<t') && 
                !buffer.endsWith('<th') && !buffer.endsWith('<tho') && 
                !buffer.endsWith('<thou') && !buffer.endsWith('<thoug') && 
                !buffer.endsWith('<though') && !buffer.endsWith('<thought')) {
              yield {
                content: buffer,
                isComplete: false,
              };
              buffer = '';
            }
            break;
          }
        } else {
          // Inside thinking tag, look for closing tag
          if (buffer.includes('</thought>')) {
            // Discard content up to and including the closing tag
            buffer = buffer.substring(buffer.indexOf('</thought>') + '</thought>'.length);
            insideThinkingTag = false;
            // Continue processing in case there's more content
          } else {
            // No closing tag yet, keep buffering
            break;
          }
        }
      }
    }
    
    // Yield any remaining buffered content (in case stream ended mid-tag)
    if (buffer && !insideThinkingTag) {
      const sanitized = stripThinkingTags(buffer);
      if (sanitized) {
        yield {
          content: sanitized,
          isComplete: false,
        };
      }
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
    // Rough approximation: 1 token ≈ 4 characters for English text
    // For production, use tiktoken library for accurate counting
    return Math.ceil(text.length / 4);
  }
}
