// Feature: cost-governor, Task 9.4: fail-closed behavior when the spend query throws
//
// Req 6.6: IF the Cost_Guard cannot retrieve Provider_Call_Records to compute
// Current_Day_Spend, THEN it SHALL deny the debate request and return an error
// indication rather than allowing the request by default (fail closed).
//
// Deterministic, hermetic strategy (no live DB): `checkCostGuard` computes
// Current_Day_Spend via `computeCurrentDaySpend()`, which reads `db.select(...)`
// from `@/lib/db/client`. That `db` is a lazy proxy whose first property access
// calls `neon(getDatabaseUrl())`, and `getDatabaseUrl()` throws when
// `DATABASE_URL` is unset. By deleting `DATABASE_URL` for this test we force the
// spend query to throw exactly as Req 6.6 describes, with no network and no
// reliance on ambient env (`npm run test:unit` runs without --env-file, and the
// db connection is lazy so the proxy is uninitialized in this isolated process).
import { describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { checkCostGuard, type DebateConfig } from '../cost-guard'

describe('checkCostGuard - fail-closed when spend cannot be computed (Req 6.6)', () => {
  let savedDatabaseUrl: string | undefined

  before(() => {
    savedDatabaseUrl = process.env.DATABASE_URL
    // Force the current-day spend query to throw on first db access.
    delete process.env.DATABASE_URL
  })

  after(() => {
    if (savedDatabaseUrl === undefined) delete process.env.DATABASE_URL
    else process.env.DATABASE_URL = savedDatabaseUrl
  })

  it('denies with allowed:false, error:true when the spend query throws, and still reports cap/estimatedCost', async () => {
    const config: DebateConfig = {
      rounds: 3,
      factCheckingEnabled: true,
      judgeModel: 'gemini-3.1-flash-lite',
    }

    const result = await checkCostGuard(config)

    // Fail closed: denied with an explicit error indication (Req 6.6).
    assert.equal(result.allowed, false, 'must deny when spend cannot be computed')
    assert.equal(result.error, true, 'must flag that spend could not be computed')

    // The decision is a denial, so no caller proceeds to initiate a provider call.
    // (checkCostGuard itself dispatches no provider calls; the fail-closed denial
    // is what prevents any downstream provider call from being initiated.)

    // The denial payload still includes the cap and the estimated cost so the
    // caller can surface a coherent 429 body.
    assert.equal(typeof result.cap, 'number')
    assert.ok(Number.isFinite(result.cap), 'cap must be a finite number')
    assert.equal(typeof result.estimatedCost, 'number')
    assert.ok(Number.isFinite(result.estimatedCost), 'estimatedCost must be finite')
    assert.ok(result.estimatedCost >= 0, 'estimatedCost must be >= 0')

    // A non-empty reason explains the fail-closed denial.
    assert.equal(typeof result.reason, 'string')
    assert.ok((result.reason as string).length > 0)
  })
})
