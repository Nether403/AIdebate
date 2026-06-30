import { db } from '@/lib/db/client'
import { llmProviderCalls } from '@/lib/db/schema'
import { recomputeAndGovern } from '@/lib/cost/governor'
import type { LLMConfig, LLMProvider, LLMResponse } from '@/types/llm'

export interface RecordLLMProviderCallInput {
  debateId?: string | null
  debateTurnId?: string | null
  benchmarkRunId?: string | null
  stage: string
  config: LLMConfig
  response?: LLMResponse | null
  promptVersion?: string | null
  status?: 'success' | 'error'
  error?: unknown
}

export async function recordLLMProviderCall(input: RecordLLMProviderCallInput): Promise<void> {
  try {
    await db.insert(llmProviderCalls).values({
      debateId: input.debateId || null,
      debateTurnId: input.debateTurnId || null,
      benchmarkRunId: input.benchmarkRunId || null,
      stage: input.stage,
      provider: input.response?.provider || input.config.provider,
      requestedModel: input.config.model,
      actualModel: input.response?.model || null,
      promptVersion: input.promptVersion || null,
      generationParams: {
        temperature: input.config.temperature,
        maxTokens: input.config.maxTokens,
        topP: input.config.topP,
        timeout: input.config.timeout,
      },
      inputTokens: input.response?.tokensUsed.input ?? null,
      outputTokens: input.response?.tokensUsed.output ?? null,
      totalTokens: input.response?.tokensUsed.total ?? null,
      latencyMs: input.response?.latencyMs ?? null,
      costEstimate: input.response?.cost ?? null,
      status: input.status || (input.error ? 'error' : 'success'),
      errorMessage: input.error instanceof Error ? input.error.message : input.error ? String(input.error) : null,
    })
  } catch (telemetryError) {
    console.error('[LLM Telemetry] Failed to persist provider call:', telemetryError)
    return
  }

  // Governance runs only after a successful insert and is isolated in its own
  // try/catch so a governance failure fails SOFT and never corrupts or hides the
  // recorded artifact (the insert above already succeeded).
  try {
    await recomputeAndGovern(input.debateId ?? null, input.benchmarkRunId ?? null)
  } catch (governanceError) {
    console.error('[Cost Governor] Failed to recompute/govern after provider call:', governanceError)
  }
}

export function fallbackProviderForConfig(config: LLMConfig, response?: LLMResponse): LLMProvider {
  return response?.provider || config.provider
}
