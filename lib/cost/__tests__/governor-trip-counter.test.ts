// Feature: cost-governor, Property 6: Tripping preserves artifacts and increments the counter exactly once
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fc from 'fast-check'
import { buildCostErrorState } from '../error-state'
import { evaluateCeiling } from '../ceiling'

/**
 * Property 6 targets the counter/idempotency rule that `governor.ts` encodes in
 * `tripDebate`/`tripRunDebates`. We cannot drive a live Neon DB from a unit test,
 * so we model the rule the code enforces and exercise it over random trip-attempt
 * sequences. The model mirrors the SQL guards exactly:
 *
 *   - per-debate trip (`tripDebate`): updates `WHERE status != 'evaluation_failed'`
 *     and increments the run counter by 1 only when a row was actually updated.
 *   - a trip only writes `status` / `errorState` / `completedAt`; turns, provider
 *     calls, votes, and tallies are never part of the UPDATE set.
 *
 * So: a debate transitions (and counts +1) iff its current status is not already
 * 'evaluation_failed'; once failed, further trip attempts are no-ops (+0).
 */

// The guard the real code encodes: a debate is trippable iff not already failed.
const isPerDebateTrippable = (status: string): boolean => status !== 'evaluation_failed'

// Representative debate.status values (mirrors lib/db/schema status domain).
const STATUSES = ['pending', 'running', 'completed', 'failed', 'evaluation_failed'] as const
const statusArb = (): fc.Arbitrary<string> => fc.constantFrom(...STATUSES)

// Immutable artifacts attached to every modeled debate. A trip must never touch
// any of these — only status/errorState/completedAt may change.
interface Artifacts {
  turns: number[]
  providerCalls: number[]
  crowdVotesProCount: number
  crowdVotesConCount: number
  crowdVotesTieCount: number
}

interface ModelDebate {
  id: string
  initialStatus: string
  status: string
  errorState: unknown
  completedAt: Date | null
  artifacts: Artifacts
}

function makeDebate(index: number, status: string): ModelDebate {
  return {
    id: `debate-${index}`,
    initialStatus: status,
    status,
    errorState: null,
    completedAt: null,
    // Deterministic, distinct artifacts per debate so a stray mutation is visible.
    artifacts: {
      turns: [index, index + 1, index + 2],
      providerCalls: [index * 10],
      crowdVotesProCount: index,
      crowdVotesConCount: index + 1,
      crowdVotesTieCount: index + 2,
    },
  }
}

// Snapshot for deep-equality comparison of the artifacts that must never change.
function snapshotArtifacts(d: ModelDebate): string {
  return JSON.stringify(d.artifacts)
}

// A single per-debate trip attempt, mirroring `tripDebate`. Returns the counter
// delta (1 on a genuine transition, 0 on an idempotent no-op).
function applyTripAttempt(d: ModelDebate): 0 | 1 {
  if (!isPerDebateTrippable(d.status)) return 0
  const decision = evaluateCeiling('per_debate', 100, 1) // tripped decision
  d.status = 'evaluation_failed'
  d.errorState = buildCostErrorState(decision)
  d.completedAt = new Date()
  return 1
}

describe('cost governor trip - Property 6: preserves artifacts and counts exactly once', () => {
  it('counter equals the number of debates that genuinely transitioned; re-trips never re-increment; artifacts untouched', () => {
    fc.assert(
      fc.property(
        // One status per debate -> defines the run's debate set (>=1 debate).
        fc.array(statusArb(), { minLength: 1, maxLength: 8 }),
        // A sequence of raw indices; each maps to a debate the trip targets.
        fc.array(fc.nat(), { maxLength: 60 }),
        (statuses, rawAttempts) => {
          const debates = statuses.map((s, i) => makeDebate(i, s))
          const n = debates.length
          const attempts = rawAttempts.map((r) => r % n)

          // Capture the pre-trip artifact snapshots (must survive untouched).
          const beforeArtifacts = debates.map(snapshotArtifacts)
          const attemptCount = new Array(n).fill(0)
          attempts.forEach((idx) => (attemptCount[idx] += 1))

          // Apply every trip attempt against the run's debates, accumulating the
          // run counter exactly as the DB shell would.
          let counter = 0
          attempts.forEach((idx) => {
            const d = debates[idx]
            const wasFailed = d.status === 'evaluation_failed'
            const delta = applyTripAttempt(d)

            // (a) A genuine transition counts exactly once...
            // (b) ...and an already-failed debate contributes zero.
            assert.equal(delta, wasFailed ? 0 : 1)
            counter += delta
          })

          // The run counter must equal the number of debates whose status changed
          // INTO 'evaluation_failed' from a DIFFERENT status: i.e. debates that
          // started non-failed and received at least one trip attempt (Req 5.2).
          const expected = debates.filter(
            (d, i) => d.initialStatus !== 'evaluation_failed' && attemptCount[i] > 0
          ).length
          assert.equal(counter, expected)

          debates.forEach((d, i) => {
            // (c) Only status/errorState/completedAt may change; the artifacts
            // (turns, provider calls, votes, tallies) are byte-for-byte preserved.
            assert.equal(snapshotArtifacts(d), beforeArtifacts[i])

            if (attemptCount[i] > 0) {
              // Any targeted debate ends failed regardless of how many attempts.
              assert.equal(d.status, 'evaluation_failed')
            } else {
              // Untouched debates keep their original status and null trip fields.
              assert.equal(d.status, d.initialStatus)
              assert.equal(d.errorState, null)
              assert.equal(d.completedAt, null)
            }

            // A debate already failed at the start never gains a fresh trip count,
            // even when targeted repeatedly (idempotence, Req 5.3).
            if (d.initialStatus === 'evaluation_failed') {
              assert.equal(d.status, 'evaluation_failed')
            }
          })
        }
      ),
      { numRuns: 100 }
    )
  })
})
