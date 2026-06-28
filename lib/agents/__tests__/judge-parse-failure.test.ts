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

  it('tolerates fallacy types outside the known set instead of failing the whole verdict', async () => {
    // Judges emit free-form fallacy labels; an unrecognized `type` must not
    // sink an otherwise-valid verdict (this previously threw a parse failure).
    const judgeJson = JSON.stringify({
      winner: 'pro',
      scores: { logical_coherence: 8, rebuttal_strength: 0, factuality: 7 },
      justification: 'Pro presented a more internally consistent case across all three rounds and directly addressed the strongest objections raised by Con, which is sufficient for a clear decision here.',
      flagged_fallacies: [
        { type: 'false_equivalence', description: 'Conflated two unlike things', location: 'Con R2', severity: 'galaxy-brained' },
      ],
    })

    const judge = new JudgeAgent({ model: 'judge-model', provider: 'openai', useTiebreaker: false })
    ;(judge as any).llmClient = {
      generate: async () => ({
        content: judgeJson,
        provider: 'openai',
        model: 'judge-model',
        tokensUsed: { input: 10, output: 20, total: 30 },
        latencyMs: 1,
        cost: 0.01,
      }),
    }

    const verdict = await judge.evaluateDebate(debate, 'pro_first')
    assert.strictEqual(verdict.winner, 'pro')
    assert.strictEqual(verdict.flagged_fallacies[0].type, 'false_equivalence')
    // Unknown severity is coerced to a safe default rather than rejected.
    assert.strictEqual(verdict.flagged_fallacies[0].severity, 'moderate')
    // Per-evaluation telemetry is threaded through verdict metadata.
    assert.strictEqual(verdict.metadata.cost, 0.01)
    assert.deepStrictEqual(verdict.metadata.tokens_used, { input: 10, output: 20, total: 30 })
  })
})
