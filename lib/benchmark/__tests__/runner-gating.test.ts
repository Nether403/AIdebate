// Unit tests for runner cost-ceiling gating (cost-governor task 7.3).
//
// Scope (Requirements 3.1, 3.4): prove the two gating guarantees `runBenchmark`
// depends on, hermetically — without a live DB or LLM engine.
//
//   Req 3.1  Ceilings are READ BEFORE any debate launches.
//   Req 3.4  An invalid/out-of-range ceiling that reaches evaluation FAILS the
//            run before dispatching any debate.
//
// `runBenchmark` itself is heavily DB- and engine-dependent, and module mocking
// of the `@/` alias under tsx is unreliable, so a true end-to-end unit test is
// not feasible here. Instead we target the gate's decision logic that the runner
// relies on:
//
//   * Req 3.4 hinges on `getRunCeilings` validating stored ceilings and throwing
//     `InvalidCostCeilingError` on an out-of-range value. The runner catches
//     exactly that type to fail the run before dispatch. We prove the error is
//     produced for invalid ceilings and carries the offending field/reason the
//     runner needs to record a failure reason.
//   * Req 3.1 is the ordering guarantee. We assert it structurally over the
//     runner source: the `getRunCeilings(...)` read is awaited before the first
//     debate-dispatch call. This is deterministic and catches a regression that
//     reorders the read after dispatch.
//
// validateCostCeilings's full accept/reject range is already exhaustively
// property-tested (Property 10), so this file does not re-cover it.

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { validateCostCeilings } from '@/lib/cost/ceiling'
import { InvalidCostCeilingError } from '@/lib/cost/governor'
import { CEILING_MAX } from '@/lib/cost/ceiling'

// Reconstruct the exact failure `getRunCeilings` raises when a stored ceiling is
// out of range: validate the config, then wrap the errors in the error type the
// runner catches. This mirrors getRunCeilings without needing a DB read.
function ceilingErrorForConfig(
  runId: string,
  config: { perDebateCostCeilingUsd?: unknown; perRunCostCeilingUsd?: unknown }
): InvalidCostCeilingError | null {
  const { valid, errors } = validateCostCeilings(config)
  return valid ? null : new InvalidCostCeilingError(runId, errors)
}

describe('runner gating - Req 3.4: invalid ceiling fails the run before dispatch', () => {
  it('produces InvalidCostCeilingError for an out-of-range ceiling reaching evaluation', () => {
    // An out-of-range per-run ceiling (above CEILING_MAX) that slipped past
    // config validation and reached cost evaluation.
    const err = ceilingErrorForConfig('run-1', {
      perRunCostCeilingUsd: CEILING_MAX + 1,
    })

    assert.ok(err, 'an out-of-range ceiling must produce a ceiling error')
    // This is exactly the type the runner's `error instanceof InvalidCostCeilingError`
    // branch matches to fail the run before dispatch.
    assert.ok(err instanceof InvalidCostCeilingError)
    assert.ok(err instanceof Error)
    assert.equal(err.name, 'InvalidCostCeilingError')
  })

  it('carries the offending field, reason, and run id so the run can record why it failed', () => {
    const err = ceilingErrorForConfig('run-42', {
      perRunCostCeilingUsd: -5, // negative: below CEILING_MIN
    })

    assert.ok(err)
    assert.equal(err.benchmarkRunId, 'run-42')
    assert.equal(err.errors.length, 1)
    assert.equal(err.errors[0].field, 'perRunCostCeilingUsd')
    assert.ok(err.errors[0].reason.length > 0)
    // The message surfaces the offending field + reason for the failure log.
    assert.match(err.message, /run-42/)
    assert.match(err.message, /perRunCostCeilingUsd/)
  })

  it('names every offending ceiling field when both are invalid', () => {
    const err = ceilingErrorForConfig('run-7', {
      perDebateCostCeilingUsd: Number.NaN,
      perRunCostCeilingUsd: CEILING_MAX + 0.5,
    })

    assert.ok(err)
    const fields = err.errors.map((e) => e.field).sort()
    assert.deepEqual(fields, ['perDebateCostCeilingUsd', 'perRunCostCeilingUsd'])
  })

  it('does not produce an error for in-range or absent ceilings (run is allowed to start)', () => {
    // In-range ceilings and absent ceilings both pass: no failure before dispatch.
    assert.equal(
      ceilingErrorForConfig('run-ok', { perDebateCostCeilingUsd: 0, perRunCostCeilingUsd: CEILING_MAX }),
      null
    )
    assert.equal(ceilingErrorForConfig('run-ok', {}), null)
  })
})

describe('runner gating - Req 3.1: ceilings are read before any debate launches', () => {
  // Structural ordering proof over the runner source. The runner reads ceilings
  // via `getRunCeilings(...)`; dispatch begins at the first of these calls.
  const runnerSrc = readFileSync(
    fileURLToPath(new URL('../runner.ts', import.meta.url)),
    'utf8'
  )

  // Markers that represent "a debate is being dispatched / work is launched".
  const DISPATCH_MARKERS = [
    'engine.initializeDebate(',
    'engine.startDebate(',
    'executeDebate(',
    'persistModelSnapshots(',
  ]

  it('awaits getRunCeilings before the first dispatch call in runBenchmark', () => {
    // Anchor at runBenchmark so helper *definitions* earlier in the file (e.g.
    // `async function persistModelSnapshots(...)`) aren't mistaken for dispatch
    // call sites — we only care about ordering within runBenchmark's body.
    const runBenchmarkIdx = runnerSrc.indexOf('export async function runBenchmark')
    assert.ok(runBenchmarkIdx >= 0, 'runner must define runBenchmark')

    const ceilingReadIdx = runnerSrc.indexOf('getRunCeilings(', runBenchmarkIdx)
    assert.ok(ceilingReadIdx >= 0, 'runner must read ceilings via getRunCeilings')

    const firstDispatchIdx = Math.min(
      ...DISPATCH_MARKERS.map((m) => {
        const i = runnerSrc.indexOf(m, runBenchmarkIdx)
        return i === -1 ? Number.POSITIVE_INFINITY : i
      })
    )

    assert.ok(
      Number.isFinite(firstDispatchIdx),
      'runner must dispatch debates somewhere'
    )
    assert.ok(
      ceilingReadIdx < firstDispatchIdx,
      'getRunCeilings must be read before any debate dispatch (Req 3.1)'
    )
  })

  it('reads ceilings inside runBenchmark before the debate loop', () => {
    const runBenchmarkIdx = runnerSrc.indexOf('export async function runBenchmark')
    const ceilingReadIdx = runnerSrc.indexOf('getRunCeilings(', runBenchmarkIdx)
    const loopIdx = runnerSrc.indexOf('for (const debateConfig', runBenchmarkIdx)

    assert.ok(runBenchmarkIdx >= 0)
    assert.ok(ceilingReadIdx > runBenchmarkIdx, 'ceiling read lives in runBenchmark')
    assert.ok(loopIdx > runBenchmarkIdx, 'runBenchmark has a debate loop')
    assert.ok(ceilingReadIdx < loopIdx, 'ceilings read before the debate loop begins')
  })
})
