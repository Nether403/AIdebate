/**
 * Streaming Response Handler
 * Handles Server-Sent Events (SSE) for streaming LLM responses
 * Includes timeout handling and RCR phase extraction
 */

import type { LLMMessage, LLMConfig, StreamChunk } from '@/types/llm';
import { getLLMClient } from './client';

export interface RCRPhases {
  reflection: string;
  critique: string;
  speech: string;
}

export interface StreamEvent {
  type: 'phase' | 'content' | 'complete' | 'error';
  phase?: 'reflection' | 'critique' | 'speech';
  content?: string;
  tokensUsed?: {
    input: number;
    output: number;
    total: number;
  };
  error?: string;
}

/**
 * Stream LLM response with SSE
 */
export async function* streamWithSSE(
  messages: LLMMessage[],
  config: LLMConfig,
  timeoutMs: number = 120000
): AsyncGenerator<StreamEvent> {
  const client = getLLMClient();
  
  try {
    // Create timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Stream timeout after ${timeoutMs}ms`));
      }, timeoutMs);
    });

    // Race between stream and timeout
    const streamGenerator = client.stream(messages, config);
    
    let fullContent = '';
    let hasTimedOut = false;

    // Set up timeout handler
    const timeoutHandler = timeoutPromise.catch((error) => {
      hasTimedOut = true;
      throw error;
    });

    // Process stream
    for await (const chunk of streamGenerator) {
      if (hasTimedOut) break;

      if (chunk.isComplete) {
        yield {
          type: 'complete' as const,
          tokensUsed: chunk.tokensUsed,
        };
      } else {
        fullContent += chunk.content;
        yield {
          type: 'content' as const,
          content: chunk.content,
        };
      }
    }

  } catch (error) {
    yield {
      type: 'error',
      error: error instanceof Error ? error.message : 'Unknown streaming error',
    };
  }
}

/**
 * Extract RCR phases from streamed content
 * Parses <reflection>, <critique>, and <speech> tags
 */
export function extractRCRPhases(content: string): RCRPhases {
  const reflectionMatch = content.match(/<reflection>([\s\S]*?)<\/reflection>/i);
  const critiqueMatch = content.match(/<critique>([\s\S]*?)<\/critique>/i);
  const speechMatch = content.match(/<speech>([\s\S]*?)<\/speech>/i);

  return {
    reflection: reflectionMatch ? reflectionMatch[1].trim() : '',
    critique: critiqueMatch ? critiqueMatch[1].trim() : '',
    speech: speechMatch ? speechMatch[1].trim() : content.trim(),
  };
}

/**
 * Stream with RCR phase detection
 * Emits separate events for each phase as they're detected
 */
export async function* streamWithRCRPhases(
  messages: LLMMessage[],
  config: LLMConfig,
  timeoutMs: number = 120000
): AsyncGenerator<StreamEvent> {
  let fullContent = '';
  let reflectionEmitted = false;
  let critiqueEmitted = false;
  let speechEmitted = false;

  for await (const event of streamWithSSE(messages, config, timeoutMs)) {
    if (event.type === 'content' && event.content) {
      fullContent += event.content;

      // Check for reflection phase
      if (!reflectionEmitted && fullContent.includes('</reflection>')) {
        const phases = extractRCRPhases(fullContent);
        if (phases.reflection) {
          yield {
            type: 'phase',
            phase: 'reflection',
            content: phases.reflection,
          };
          reflectionEmitted = true;
        }
      }

      // Check for critique phase
      if (!critiqueEmitted && fullContent.includes('</critique>')) {
        const phases = extractRCRPhases(fullContent);
        if (phases.critique) {
          yield {
            type: 'phase',
            phase: 'critique',
            content: phases.critique,
          };
          critiqueEmitted = true;
        }
      }

      // Check for speech phase
      if (!speechEmitted && fullContent.includes('</speech>')) {
        const phases = extractRCRPhases(fullContent);
        if (phases.speech) {
          yield {
            type: 'phase',
            phase: 'speech',
            content: phases.speech,
          };
          speechEmitted = true;
        }
      }

      // Always emit content for real-time display
      yield event;
    } else {
      yield event;
    }
  }

  // Final phase extraction if tags weren't closed properly
  if (fullContent && (!reflectionEmitted || !critiqueEmitted || !speechEmitted)) {
    const phases = extractRCRPhases(fullContent);
    
    if (!reflectionEmitted && phases.reflection) {
      yield {
        type: 'phase',
        phase: 'reflection',
        content: phases.reflection,
      };
    }
    
    if (!critiqueEmitted && phases.critique) {
      yield {
        type: 'phase',
        phase: 'critique',
        content: phases.critique,
      };
    }
    
    if (!speechEmitted && phases.speech) {
      yield {
        type: 'phase',
        phase: 'speech',
        content: phases.speech,
      };
    }
  }
}

/**
 * Create SSE response for Next.js API routes
 */
export function createSSEResponse(
  stream: AsyncGenerator<StreamEvent>
): Response {
  const encoder = new TextEncoder();

  const readableStream = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          const data = `data: ${JSON.stringify(event)}\n\n`;
          controller.enqueue(encoder.encode(data));
        }
        controller.close();
      } catch (error) {
        const errorEvent: StreamEvent = {
          type: 'error',
          error: error instanceof Error ? error.message : 'Stream error',
        };
        const data = `data: ${JSON.stringify(errorEvent)}\n\n`;
        controller.enqueue(encoder.encode(data));
        controller.close();
      }
    },
  });

  return new Response(readableStream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

/**
 * Parse SSE stream on client side
 */
export async function* parseSSEStream(
  response: Response
): AsyncGenerator<StreamEvent> {
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('Response body is not readable');
  }

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          try {
            const event = JSON.parse(data) as StreamEvent;
            yield event;
          } catch (e) {
            console.error('Failed to parse SSE event:', e);
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Timeout wrapper for streaming operations
 */
export async function withStreamTimeout<T>(
  generator: AsyncGenerator<T>,
  timeoutMs: number,
  onTimeout?: () => void
): AsyncGenerator<T> {
  let timeoutId: NodeJS.Timeout | null = null;
  let hasTimedOut = false;

  const resetTimeout = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      hasTimedOut = true;
      if (onTimeout) {
        onTimeout();
      }
    }, timeoutMs);
  };

  try {
    resetTimeout();

    for await (const value of generator) {
      if (hasTimedOut) {
        throw new Error(`Stream timeout after ${timeoutMs}ms`);
      }
      resetTimeout();
      yield value;
    }
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}
