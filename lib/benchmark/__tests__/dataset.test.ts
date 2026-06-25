import { describe, it } from 'node:test'
import assert from 'node:assert'
import {
  buildModelMetrics,
  formatModelMetricsCsv,
  toDebateRow,
  toFactCheckRows,
  toJsonl,
  toJudgeEvaluationRows,
  toProviderCallRows,
  toTurnRows,
} from '../dataset'

function buildDebateFixture(overrides: Partial<any> = {}) {
  return {
    id: 'debate-1',
    benchmarkRunId: 'run-1',
    status: 'completed',
    topicId: 'topic-1',
    topicCategory: 'methodology',
    topic: {
      motion: 'Resolved: exports preserve fact-check sources.',
      category: 'methodology',
      difficulty: 'medium',
      source: 'curated',
    },
    proModelId: 'model-pro-db',
    proModel: {
      name: 'Pro Model',
      provider: 'openai',
      modelId: 'gpt-pro',
    },
    conModelId: 'model-con-db',
    conModel: {
      name: 'Con Model',
      provider: 'anthropic',
      modelId: 'claude-con',
    },
    proPersona: null,
    conPersona: null,
    totalRounds: 1,
    factCheckMode: 'standard',
    wordLimitPerTurn: 500,
    judgeProvider: 'google',
    judgeModel: 'gemini-3-pro-preview',
    factCheckerProvider: 'openai',
    factCheckerModel: 'gpt-4o-mini',
    promptVersion: 'prompt-v1',
    generationParams: { temperature: 0.3 },
    winner: 'pro',
    aiJudgeWinner: 'pro',
    errorState: null,
    createdAt: new Date('2026-05-11T10:00:00Z'),
    startedAt: new Date('2026-05-11T10:01:00Z'),
    completedAt: new Date('2026-05-11T10:05:00Z'),
    turns: [
      {
        id: 'turn-1',
        roundNumber: 1,
        side: 'pro',
        modelId: 'model-pro-db',
        model: { name: 'Pro Model' },
        wasRejected: false,
        retryCount: 0,
        wordCount: 120,
        factChecksPassed: 2,
        factChecksFailed: 0,
        reflection: 'Reflection text',
        critique: 'Critique text',
        speech: 'Speech body',
        tokensUsed: 250,
        latencyMs: 1500,
        provider: 'openai',
        actualModelId: 'gpt-pro-actual',
        costEstimate: 0.004,
        createdAt: new Date('2026-05-11T10:02:00Z'),
        factChecks: [
          {
            id: 'fc-1',
            claim: 'Fact-check sources are preserved in exports.',
            verdict: 'true',
            confidence: 0.9,
            reasoning: 'Schema includes a sources field.',
            sources: [{ url: 'https://example.test/1', title: 'Source 1' }],
            createdAt: new Date('2026-05-11T10:03:00Z'),
          },
        ],
      },
    ],
    evaluations: [
      {
        id: 'eval-1',
        judgeProvider: 'google',
        judgeModel: 'gemini-3-pro-preview',
        evaluationOrder: 'pro_first',
        winner: 'pro',
        proScore: 7.5,
        conScore: 6.0,
        rubricScores: { logical_coherence: 8 },
        reasoning: 'Pro side stronger.',
        positionBiasDetected: false,
        parseStatus: 'parsed',
        rawResponse: null,
        errorMessage: null,
        promptVersion: 'prompt-v1',
        schemaVersion: 'judge-v1',
        consensus: true,
        tiebreakerUsed: false,
        createdAt: new Date('2026-05-11T10:05:00Z'),
      },
    ],
    llmProviderCalls: [
      {
        id: 'call-1',
        debateId: 'debate-1',
        benchmarkRunId: 'run-1',
        debateTurnId: 'turn-1',
        stage: 'debater-pro',
        provider: 'openai',
        requestedModel: 'gpt-pro',
        actualModel: 'gpt-pro-actual',
        promptVersion: 'prompt-v1',
        generationParams: { temperature: 0.7 },
        inputTokens: 100,
        outputTokens: 150,
        totalTokens: 250,
        latencyMs: 1500,
        costEstimate: 0.004,
        status: 'success',
        errorMessage: null,
        createdAt: new Date('2026-05-11T10:02:00Z'),
      },
    ],
    ...overrides,
  }
}

describe('toDebateRow', () => {
  it('flattens a debate into a single row with ISO timestamps', () => {
    const row = toDebateRow(buildDebateFixture())
    assert.strictEqual(row.debateId, 'debate-1')
    assert.strictEqual(row.topicMotion, 'Resolved: exports preserve fact-check sources.')
    assert.strictEqual(row.proModelProvider, 'openai')
    assert.strictEqual(row.conModelModelId, 'claude-con')
    assert.strictEqual(row.judgeProvider, 'google')
    assert.strictEqual(row.aiJudgeWinner, 'pro')
    assert.strictEqual(row.createdAt, '2026-05-11T10:00:00.000Z')
  })
})

describe('toTurnRows / toFactCheckRows', () => {
  it('emits a row per turn and per fact-check, keyed by debate and turn id', () => {
    const debate = buildDebateFixture()
    const turnRows = toTurnRows(debate)
    const factCheckRows = toFactCheckRows(debate)

    assert.strictEqual(turnRows.length, 1)
    assert.strictEqual(turnRows[0].turnId, 'turn-1')
    assert.strictEqual(turnRows[0].provider, 'openai')
    assert.strictEqual(turnRows[0].costEstimate, 0.004)

    assert.strictEqual(factCheckRows.length, 1)
    assert.strictEqual(factCheckRows[0].debateId, 'debate-1')
    assert.strictEqual(factCheckRows[0].turnId, 'turn-1')
    assert.deepStrictEqual(factCheckRows[0].sources, [{ url: 'https://example.test/1', title: 'Source 1' }])
  })
})

describe('toJudgeEvaluationRows / toProviderCallRows', () => {
  it('flattens evaluations and provider calls with their diagnostic fields', () => {
    const debate = buildDebateFixture()
    const judgeRows = toJudgeEvaluationRows(debate)
    const providerRows = toProviderCallRows(debate)

    assert.strictEqual(judgeRows.length, 1)
    assert.strictEqual(judgeRows[0].parseStatus, 'parsed')
    assert.strictEqual(judgeRows[0].schemaVersion, 'judge-v1')

    assert.strictEqual(providerRows.length, 1)
    assert.strictEqual(providerRows[0].stage, 'debater-pro')
    assert.strictEqual(providerRows[0].totalTokens, 250)
    assert.strictEqual(providerRows[0].status, 'success')
  })
})

describe('buildModelMetrics', () => {
  it('counts completed debates separately from failed and evaluation_failed', () => {
    const debates = [
      buildDebateFixture({ id: 'd1', status: 'completed', aiJudgeWinner: 'pro', winner: 'pro' }),
      buildDebateFixture({ id: 'd2', status: 'completed', aiJudgeWinner: 'con', winner: 'con' }),
      buildDebateFixture({ id: 'd3', status: 'completed', aiJudgeWinner: 'tie', winner: 'tie' }),
      buildDebateFixture({ id: 'd4', status: 'evaluation_failed', aiJudgeWinner: null, winner: null }),
      buildDebateFixture({ id: 'd5', status: 'failed', aiJudgeWinner: null, winner: null }),
    ]

    const metrics = buildModelMetrics(debates)
    const pro = metrics.find(m => m.providerModelId === 'gpt-pro')
    const con = metrics.find(m => m.providerModelId === 'claude-con')

    assert.ok(pro && con)
    assert.strictEqual(pro!.completedDebates, 3)
    assert.strictEqual(con!.completedDebates, 3)
    assert.strictEqual(pro!.wins, 1)
    assert.strictEqual(pro!.losses, 1)
    assert.strictEqual(pro!.ties, 1)
    assert.strictEqual(con!.wins, 1)
    assert.strictEqual(con!.losses, 1)
    assert.strictEqual(con!.ties, 1)
    assert.strictEqual(pro!.evaluationFailed, 1)
    assert.strictEqual(pro!.failedExecution, 1)
  })

  it('skips debates without pro or con model metadata', () => {
    const debates = [
      { id: 'ghost', status: 'completed', proModel: null, conModel: null, aiJudgeWinner: 'pro' } as any,
    ]
    assert.deepStrictEqual(buildModelMetrics(debates), [])
  })
})

describe('formatModelMetricsCsv', () => {
  it('emits a stable header and escapes display names with special characters', () => {
    const csv = formatModelMetricsCsv([
      {
        providerModelId: 'gpt-pro',
        provider: 'openai',
        displayName: 'Pro, Model "Alpha"',
        completedDebates: 2,
        wins: 1,
        losses: 1,
        ties: 0,
        unknownOutcomes: 0,
        evaluationFailed: 0,
        failedExecution: 0,
        asProDebates: 2,
        asConDebates: 0,
      },
    ])

    const [header, firstRow] = csv.trim().split('\n')
    assert.ok(header.startsWith('providerModelId,provider,displayName,completedDebates'))
    assert.ok(firstRow.includes('"Pro, Model ""Alpha"""'))
  })
})

describe('toJsonl', () => {
  it('returns an empty string for no rows and one json object per line otherwise', () => {
    assert.strictEqual(toJsonl([]), '')
    const out = toJsonl([{ a: 1 }, { b: 2 }])
    assert.strictEqual(out, '{"a":1}\n{"b":2}\n')
  })
})
