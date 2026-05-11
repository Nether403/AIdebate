import { describe, it } from 'node:test'
import assert from 'node:assert'
import { JudgeAgent, JudgeParseError, type CompletedDebate } from '../judge'

const debate: CompletedDebate = {
  id: 'debate-parse-failure',
  topic: 'Resolved: focused benchmark artifacts should preserve judge failures.',
  pro_turns: [
    {
      id: 'turn-pro-1',
      debateId: 'debate-parse-failure',
      roundNumber: 1,
      side: 'pro',
      modelId: 'model-pro',
      reflection: null,
      critique: null,
      speech: 'Judge parse failures should be preserved as explicit research artifacts.',
      wordCount: 10,
      factChecksPassed: 0,
      factChecksFailed: 0,
      wasRejected: false,
      retryCount: 0,
      tokensUsed: 10,
      latencyMs: 100,
      createdAt: new Date('2026-05-11T00:00:00.000Z'),
    },
  ],
  con_turns: [
    {
      id: 'turn-con-1',
      debateId: 'debate-parse-failure',
      roundNumber: 1,
      side: 'con',
      modelId: 'model-con',
      reflection: null,
      critique: null,
      speech: 'Silent fallback verdicts can make aggregate benchmark results misleading.',
      wordCount: 9,
      factChecksPassed: 0,
      factChecksFailed: 0,
      wasRejected: false,
      retryCount: 0,
      tokensUsed: 10,
      latencyMs: 100,
      createdAt: new Date('2026-05-11T00:00:01.000Z'),
    },
  ],
}

describe('JudgeAgent parse failures', () => {
  it('throws JudgeParseError with raw response and evaluation order for invalid JSON', async () => {
    const rawResponse = 'not-json judge response'
    const judge = new JudgeAgent({
      model: 'judge-model',
      provider: 'openai',
      useTiebreaker: false,
    })

    ;(judge as any).llmClient = {
      generate: async () => ({
        content: rawResponse,
        provider: 'openai',
        model: 'judge-model',
        tokensUsed: 3,
        latencyMs: 1,
        cost: 0,
      }),
    }

    await assert.rejects(
      () => judge.evaluateDebate(debate, 'pro_first'),
      (error: unknown) => {
        assert.ok(error instanceof JudgeParseError)
        assert.strictEqual(error.rawResponse, rawResponse)
        assert.strictEqual(error.evaluationOrder, 'pro_first')
        assert.match(error.message, /^Unable to parse judge response:/)
        return true
      }
    )
  })
})
