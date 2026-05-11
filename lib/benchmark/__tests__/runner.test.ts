import { describe, it } from 'node:test'
import assert from 'node:assert'
import { summarizeBenchmarkStatuses } from '../summary'

describe('summarizeBenchmarkStatuses', () => {
  it('counts completed, failed, and evaluation_failed debates', () => {
    const summary = summarizeBenchmarkStatuses([
      'completed',
      'evaluation_failed',
      'failed',
      'completed',
      'running',
    ])

    assert.deepStrictEqual(summary, {
      status: 'failed',
      completedDebates: 2,
      failedDebates: 1,
      evaluationFailedDebates: 1,
    })
  })

  it('treats evaluation_failed debates as diagnosable artifacts, not run execution failures', () => {
    const summary = summarizeBenchmarkStatuses([
      'completed',
      'evaluation_failed',
    ])

    assert.deepStrictEqual(summary, {
      status: 'completed',
      completedDebates: 1,
      failedDebates: 0,
      evaluationFailedDebates: 1,
    })
  })
})
