import { describe, it } from 'node:test'
import assert from 'node:assert'
import { formatDebateExport } from '../format'

describe('formatDebateExport', () => {
  it('exports evaluation_failed debates with judge parse diagnostics and fact-check sources', () => {
    const exportedAt = new Date('2026-05-11T12:00:00.000Z')
    const debate = {
      id: 'debate-export-1',
      benchmarkRunId: 'benchmark-run-1',
      status: 'evaluation_failed',
      topic: {
        motion: 'Resolved: failed judge evaluations should remain inspectable.',
        category: 'methodology',
        difficulty: 'medium',
        source: 'curated',
        sourceMetadata: { collection: 'unit-test' },
      },
      proModel: {
        name: 'Pro Model',
        provider: 'openai',
        modelId: 'gpt-pro',
      },
      conModel: {
        name: 'Con Model',
        provider: 'anthropic',
        modelId: 'claude-con',
      },
      proPersona: null,
      conPersona: {
        name: 'Skeptic',
        description: 'Challenges weak methodology.',
      },
      totalRounds: 1,
      factCheckMode: 'auto',
      wordLimitPerTurn: 250,
      judgeProvider: 'google',
      judgeModel: 'gemini-3-pro-preview',
      factCheckerProvider: 'openai',
      factCheckerModel: 'gpt-4o-mini',
      promptVersion: 'prompt-v1',
      generationParams: { temperature: 0.3 },
      winner: null,
      crowdWinner: null,
      aiJudgeWinner: null,
      crowdVotesProCount: 0,
      crowdVotesConCount: 0,
      crowdVotesTieCount: 0,
      errorState: {
        stage: 'judge',
        parseStatus: 'parse_failed',
        message: 'Unable to parse judge response: Unexpected token',
      },
      createdAt: new Date('2026-05-11T11:00:00.000Z'),
      startedAt: new Date('2026-05-11T11:01:00.000Z'),
      completedAt: new Date('2026-05-11T11:05:00.000Z'),
      turns: [
        {
          roundNumber: 1,
          side: 'pro',
          model: { name: 'Pro Model' },
          reflection: 'Focus on artifact integrity.',
          critique: null,
          speech: 'The export should preserve source-backed fact checks.',
          wordCount: 8,
          tokensUsed: 20,
          latencyMs: 1200,
          provider: 'openai',
          actualModelId: 'gpt-pro-actual',
          costEstimate: 0.0012,
          wasRejected: false,
          retryCount: 0,
          factChecks: [
            {
              claim: 'Exports can preserve fact-check sources.',
              verdict: 'true',
              confidence: 0.92,
              sources: [
                {
                  url: 'https://example.test/source',
                  title: 'Source title',
                  snippet: 'Source-backed annotations are preserved.',
                },
              ],
              reasoning: 'The fact-check source is retained in the export shape.',
            },
          ],
          createdAt: new Date('2026-05-11T11:02:00.000Z'),
        },
      ],
      evaluations: [
        {
          judgeProvider: 'google',
          judgeModel: 'gemini-3-pro-preview',
          evaluationOrder: 'pro_first',
          winner: null,
          proScore: null,
          conScore: null,
          rubricScores: {},
          reasoning: 'Unable to parse judge response: Unexpected token',
          positionBiasDetected: false,
          parseStatus: 'parse_failed',
          rawResponse: 'not-json',
          errorMessage: 'Unable to parse judge response: Unexpected token',
          promptVersion: 'prompt-v1',
          schemaVersion: 'judge-v1',
          consensus: null,
          tiebreakerUsed: null,
          createdAt: new Date('2026-05-11T11:05:00.000Z'),
        },
      ],
      llmProviderCalls: [
        {
          stage: 'debater-pro',
          provider: 'openai',
          requestedModel: 'gpt-pro',
          actualModel: 'gpt-pro-actual',
          promptVersion: 'prompt-v1',
          generationParams: { temperature: 0.7 },
          inputTokens: 10,
          outputTokens: 10,
          totalTokens: 20,
          latencyMs: 1200,
          costEstimate: 0.0012,
          status: 'success',
          errorMessage: null,
          createdAt: new Date('2026-05-11T11:02:00.000Z'),
        },
      ],
    }

    const exportData = formatDebateExport(debate, exportedAt)

    assert.strictEqual(exportData.debate.status, 'evaluation_failed')
    assert.strictEqual(exportData.debate.benchmarkRunId, 'benchmark-run-1')
    assert.strictEqual(exportData.debate.topic.source, 'curated')
    assert.deepStrictEqual(exportData.debate.results.errorState, debate.errorState)
    assert.deepStrictEqual(exportData.debate.configuration.judge, {
      provider: 'google',
      model: 'gemini-3-pro-preview',
    })
    assert.strictEqual(exportData.evaluations[0].parseStatus, 'parse_failed')
    assert.strictEqual(exportData.evaluations[0].rawResponse, 'not-json')
    assert.strictEqual(exportData.evaluations[0].errorMessage, 'Unable to parse judge response: Unexpected token')
    assert.strictEqual(exportData.evaluations[0].schemaVersion, 'judge-v1')
    assert.strictEqual(exportData.transcript[0].metadata.provider, 'openai')
    assert.strictEqual(exportData.transcript[0].metadata.actualModelId, 'gpt-pro-actual')
    assert.strictEqual(exportData.providerCalls[0].stage, 'debater-pro')
    assert.strictEqual(exportData.providerCalls[0].tokenUsage.total, 20)
    assert.deepStrictEqual(exportData.transcript[0].factChecks[0].sources, debate.turns[0].factChecks[0].sources)
    assert.strictEqual(exportData.exportMetadata.exportedAt, '2026-05-11T12:00:00.000Z')
  })
})
