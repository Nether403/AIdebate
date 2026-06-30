import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  toDebateRow,
  toProviderCallRows,
  toTurnRows,
  toJsonl,
} from '../dataset'

/**
 * cost-governor Req 5.6: When an individual debate with status `evaluation_failed`
 * is requested for inspection or export, the System returns that debate's retained
 * turns, provider calls, metadata, and `errorState`.
 *
 * The export/row transforms are status-agnostic: unlike aggregate metrics
 * (`buildModelMetrics`), they never strip an `evaluation_failed` debate. These tests
 * pin that behavior so a cost-tripped debate stays fully inspectable/exportable.
 */

// Cost-governor trip errorState shape (design.md: debates.errorState — cost-trip payload).
const costErrorState = {
  stage: 'cost-governor' as const,
  ceilingType: 'per_debate' as const,
  ceiling: 0.5,
  accumulated: 0.73,
  measuredAt: '2026-05-11T10:04:30.000Z',
}

function buildEvaluationFailedDebate(overrides: Partial<any> = {}) {
  return {
    id: 'debate-ef-1',
    benchmarkRunId: 'run-ef-1',
    status: 'evaluation_failed',
    topicId: 'topic-1',
    topic: {
      motion: 'Resolved: cost-tripped debates remain inspectable.',
      category: 'methodology',
      difficulty: 'medium',
      source: 'curated',
    },
    proModelId: 'model-pro-db',
    proModel: { name: 'Pro Model', provider: 'openai', modelId: 'gpt-pro' },
    conModelId: 'model-con-db',
    conModel: { name: 'Con Model', provider: 'anthropic', modelId: 'claude-con' },
    proPersona: null,
    conPersona: null,
    totalRounds: 2,
    factCheckMode: 'standard',
    wordLimitPerTurn: 500,
    judgeProvider: 'google',
    judgeModel: 'gemini-3.1-flash-lite',
    factCheckerProvider: 'openai',
    factCheckerModel: 'gpt-4o-mini',
    promptVersion: 'prompt-v1',
    generationParams: { temperature: 0.3 },
    // A cost trip never reaches a winner; the artifact is still preserved.
    winner: null,
    aiJudgeWinner: null,
    errorState: costErrorState,
    createdAt: new Date('2026-05-11T10:00:00Z'),
    startedAt: new Date('2026-05-11T10:01:00Z'),
    completedAt: new Date('2026-05-11T10:04:30Z'),
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
        factChecksPassed: 1,
        factChecksFailed: 0,
        reflection: 'Reflection text',
        critique: 'Critique text',
        speech: 'Pro opening speech.',
        tokensUsed: 250,
        latencyMs: 1500,
        provider: 'openai',
        actualModelId: 'gpt-pro-actual',
        costEstimate: 0.4,
        createdAt: new Date('2026-05-11T10:02:00Z'),
        factChecks: [],
      },
      {
        id: 'turn-2',
        roundNumber: 1,
        side: 'con',
        modelId: 'model-con-db',
        model: { name: 'Con Model' },
        wasRejected: false,
        retryCount: 0,
        wordCount: 130,
        factChecksPassed: 0,
        factChecksFailed: 0,
        reflection: 'Con reflection',
        critique: 'Con critique',
        speech: 'Con rebuttal speech.',
        tokensUsed: 280,
        latencyMs: 1600,
        provider: 'anthropic',
        actualModelId: 'claude-con-actual',
        costEstimate: 0.33,
        createdAt: new Date('2026-05-11T10:03:00Z'),
        factChecks: [],
      },
    ],
    evaluations: [],
    llmProviderCalls: [
      {
        id: 'call-1',
        debateId: 'debate-ef-1',
        benchmarkRunId: 'run-ef-1',
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
        costEstimate: 0.4,
        status: 'success',
        errorMessage: null,
        createdAt: new Date('2026-05-11T10:02:00Z'),
      },
      {
        id: 'call-2',
        debateId: 'debate-ef-1',
        benchmarkRunId: 'run-ef-1',
        debateTurnId: 'turn-2',
        stage: 'debater-con',
        provider: 'anthropic',
        requestedModel: 'claude-con',
        actualModel: 'claude-con-actual',
        promptVersion: 'prompt-v1',
        generationParams: { temperature: 0.7 },
        inputTokens: 110,
        outputTokens: 170,
        totalTokens: 280,
        latencyMs: 1600,
        costEstimate: 0.33,
        status: 'success',
        errorMessage: null,
        createdAt: new Date('2026-05-11T10:03:00Z'),
      },
    ],
    ...overrides,
  }
}

describe('evaluation_failed debate inspection/export (Req 5.6)', () => {
  it('toDebateRow retains status evaluation_failed and the cost-trip errorState', () => {
    const row = toDebateRow(buildEvaluationFailedDebate())

    // Status is surfaced, not normalized away.
    assert.equal(row.status, 'evaluation_failed')

    // errorState is preserved intact (not dropped or nulled because of the status).
    assert.deepEqual(row.errorState, costErrorState)
    assert.equal((row.errorState as any).stage, 'cost-governor')
    assert.equal((row.errorState as any).ceilingType, 'per_debate')
    assert.equal((row.errorState as any).ceiling, 0.5)
    assert.equal((row.errorState as any).accumulated, 0.73)
    assert.equal((row.errorState as any).measuredAt, '2026-05-11T10:04:30.000Z')

    // Metadata fields are present.
    assert.equal(row.debateId, 'debate-ef-1')
    assert.equal(row.benchmarkRunId, 'run-ef-1')
    assert.equal(row.topicMotion, 'Resolved: cost-tripped debates remain inspectable.')
    assert.equal(row.proModelProvider, 'openai')
    assert.equal(row.conModelModelId, 'claude-con')
    assert.equal(row.judgeProvider, 'google')
    assert.equal(row.totalRounds, 2)
    assert.equal(row.createdAt, '2026-05-11T10:00:00.000Z')
  })

  it('toTurnRows returns every retained turn for an evaluation_failed debate', () => {
    const debate = buildEvaluationFailedDebate()
    const turnRows = toTurnRows(debate)

    assert.equal(turnRows.length, debate.turns.length)
    assert.deepEqual(
      turnRows.map(t => t.turnId),
      ['turn-1', 'turn-2']
    )
    // Turn content is retained verbatim.
    assert.equal(turnRows[0].speech, 'Pro opening speech.')
    assert.equal(turnRows[1].speech, 'Con rebuttal speech.')
    assert.equal(turnRows[0].costEstimate, 0.4)
    assert.equal(turnRows[1].provider, 'anthropic')
  })

  it('toProviderCallRows returns every retained provider call for an evaluation_failed debate', () => {
    const debate = buildEvaluationFailedDebate()
    const callRows = toProviderCallRows(debate)

    assert.equal(callRows.length, debate.llmProviderCalls.length)
    assert.deepEqual(
      callRows.map(c => c.providerCallId),
      ['call-1', 'call-2']
    )
    // Provider-call telemetry (cost, tokens) is retained.
    assert.equal(callRows[0].costEstimate, 0.4)
    assert.equal(callRows[1].costEstimate, 0.33)
    assert.equal(callRows[0].totalTokens, 250)
    assert.equal(callRows[1].stage, 'debater-con')
  })

  it('toJsonl export of an evaluation_failed debate carries status and errorState through serialization', () => {
    const debate = buildEvaluationFailedDebate()
    const jsonl = toJsonl([toDebateRow(debate), ...toTurnRows(debate), ...toProviderCallRows(debate)])

    const lines = jsonl.trim().split('\n').map(line => JSON.parse(line))
    // 1 debate row + 2 turn rows + 2 provider-call rows.
    assert.equal(lines.length, 5)

    const debateLine = lines[0]
    assert.equal(debateLine.status, 'evaluation_failed')
    assert.deepEqual(debateLine.errorState, costErrorState)
  })
})
