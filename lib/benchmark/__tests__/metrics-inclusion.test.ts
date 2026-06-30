// Feature: cost-governor, Property 7: Aggregate metrics exclude evaluation-failed debates by default and include them on opt-in
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fc from 'fast-check'
import { buildModelMetrics } from '../dataset'

// A small pool of reused model identities so aggregation buckets overlap across
// many debates (the same model appears as pro in some debates, con in others).
const MODEL_POOL = [
  { provider: 'openai', modelId: 'gpt-pro', name: 'GPT Pro' },
  { provider: 'anthropic', modelId: 'claude-con', name: 'Claude Con' },
  { provider: 'google', modelId: 'gemini', name: 'Gemini' },
] as const

// All lifecycle statuses that buildModelMetrics distinguishes. 'completed' and
// 'evaluation_failed' participate in win/loss/tie aggregation (the latter only on
// opt-in); 'failed' and the non-terminal statuses are excluded in both modes.
const STATUSES = ['completed', 'evaluation_failed', 'failed', 'running', 'pending'] as const
const WINNERS = ['pro', 'con', 'tie', null] as const

const debateArb = (i: number): fc.Arbitrary<any> =>
  fc.record({
    status: fc.constantFrom<string>(...STATUSES),
    winner: fc.constantFrom<'pro' | 'con' | 'tie' | null>(...WINNERS),
    proIdx: fc.nat({ max: MODEL_POOL.length - 1 }),
    conIdx: fc.nat({ max: MODEL_POOL.length - 1 }),
  }).map(({ status, winner, proIdx, conIdx }) => ({
    id: `debate-${i}`,
    status,
    aiJudgeWinner: winner,
    winner,
    proModel: MODEL_POOL[proIdx],
    conModel: MODEL_POOL[conIdx],
    turns: [],
  }))

const debateSetArb = () =>
  fc.array(fc.nat({ max: 9_999 }), { maxLength: 40 }).chain((seeds) =>
    fc.tuple(...seeds.map((_, i) => debateArb(i)))
  )

// Reduce a metrics array to the win/loss/tie aggregation governed by Req 5.4/5.5,
// keyed by model. A missing key is treated as all-zeros so two metric sets that
// differ only in which zero-activity models they list still compare equal.
type Agg = { wins: number; losses: number; ties: number; completedDebates: number }
function aggMap(metrics: ReturnType<typeof buildModelMetrics>): Map<string, Agg> {
  const m = new Map<string, Agg>()
  for (const row of metrics) {
    m.set(`${row.provider}:${row.providerModelId}`, {
      wins: row.wins,
      losses: row.losses,
      ties: row.ties,
      completedDebates: row.completedDebates,
    })
  }
  return m
}

const ZERO: Agg = { wins: 0, losses: 0, ties: 0, completedDebates: 0 }

function assertSameAggregates(
  actual: ReturnType<typeof buildModelMetrics>,
  expected: ReturnType<typeof buildModelMetrics>
) {
  const a = aggMap(actual)
  const e = aggMap(expected)
  const keys = new Set([...a.keys(), ...e.keys()])
  for (const key of keys) {
    assert.deepEqual(a.get(key) ?? ZERO, e.get(key) ?? ZERO, `aggregates mismatch for ${key}`)
  }
}

describe('buildModelMetrics - Property 7: evaluation-failed debates excluded by default, included on opt-in', () => {
  it('default mode equals metrics computed over debates with evaluation_failed removed', () => {
    fc.assert(
      fc.property(debateSetArb(), (debates) => {
        // Oracle: the win/loss/tie aggregation in default mode must match a set
        // where evaluation_failed debates simply do not exist.
        const onlyNonEvalFailed = debates.filter((d) => d.status !== 'evaluation_failed')
        assertSameAggregates(buildModelMetrics(debates), buildModelMetrics(onlyNonEvalFailed))
      }),
      { numRuns: 100 }
    )
  })

  it('opt-in mode equals metrics where evaluation_failed debates are treated as completed', () => {
    fc.assert(
      fc.property(debateSetArb(), (debates) => {
        // Oracle: opting in must aggregate evaluation_failed debates exactly like
        // completed ones. Relabel them to 'completed' to get the reference, which
        // avoids re-implementing the aggregator.
        const relabeled = debates.map((d) =>
          d.status === 'evaluation_failed' ? { ...d, status: 'completed' } : d
        )
        assertSameAggregates(
          buildModelMetrics(debates, { includeEvaluationFailed: true }),
          buildModelMetrics(relabeled)
        )
      }),
      { numRuns: 100 }
    )
  })

  it('failed and non-terminal statuses are excluded from win/loss/tie in both modes', () => {
    fc.assert(
      fc.property(debateSetArb(), (debates) => {
        // Removing failed/running/pending debates must not change the win/loss/tie
        // aggregation in either mode, since those statuses never contribute.
        const excluded = new Set(['failed', 'running', 'pending'])
        const withoutNonParticipating = debates.filter((d) => !excluded.has(d.status))
        assertSameAggregates(
          buildModelMetrics(debates),
          buildModelMetrics(withoutNonParticipating)
        )
        assertSameAggregates(
          buildModelMetrics(debates, { includeEvaluationFailed: true }),
          buildModelMetrics(withoutNonParticipating, { includeEvaluationFailed: true })
        )
      }),
      { numRuns: 100 }
    )
  })
})
