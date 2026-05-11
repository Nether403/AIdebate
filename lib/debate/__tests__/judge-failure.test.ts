import { describe, it } from 'node:test'
import assert from 'node:assert'
import { JudgeParseError } from '@/lib/agents/judge'
import { buildJudgeFailureErrorState, buildJudgeFailureEvaluationValues } from '../judge-failure'

describe('judge failure persistence values', () => {
  it('builds a parse-failed evaluation artifact from JudgeParseError', () => {
    const error = new JudgeParseError(
      'Unable to parse judge response: Unexpected token',
      'raw judge text',
      'con_first'
    )

    const values = buildJudgeFailureEvaluationValues({
      debateId: 'debate-1',
      judgeProvider: 'google',
      judgeModel: 'gemini-3-pro-preview',
      promptVersion: 'prompt-v1',
      error,
    })

    assert.deepStrictEqual(values, {
      debateId: 'debate-1',
      judgeProvider: 'google',
      judgeModel: 'gemini-3-pro-preview',
      evaluationOrder: 'con_first',
      winner: null,
      proScore: null,
      conScore: null,
      reasoning: 'Unable to parse judge response: Unexpected token',
      rubricScores: {},
      positionBiasDetected: false,
      parseStatus: 'parse_failed',
      rawResponse: 'raw judge text',
      errorMessage: 'Unable to parse judge response: Unexpected token',
      promptVersion: 'prompt-v1',
      schemaVersion: 'judge-v1',
      consensus: null,
      tiebreakerUsed: null,
    })
  })

  it('builds an evaluation_failed debate error state for judge parse failures', () => {
    const error = new JudgeParseError(
      'Unable to parse judge response: Missing required fields',
      '{"winner":"pro"}',
      'pro_first'
    )

    const errorState = buildJudgeFailureErrorState(error)

    assert.deepStrictEqual(errorState, {
      stage: 'judge',
      parseStatus: 'parse_failed',
      message: 'Unable to parse judge response: Missing required fields',
    })
  })
})
