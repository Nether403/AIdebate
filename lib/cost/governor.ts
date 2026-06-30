/**
 * Cost governor — DB shell over the pure cost-governance core.
 *
 * This module is the thin database layer that reads `llm_provider_calls` cost
 * rows and `benchmark_runs.config` ceilings, then delegates the actual decisions
 * to the pure functions in `aggregate.ts` / `ceiling.ts`. It holds no cost logic
 * of its own beyond wiring.
 *
 * Task 6.1 scope: read helpers only.
 *   - getRunCeilings   : read + validate ceilings from a run's `config` jsonb
 *   - isRunCostTripped : preventive gate — is the run already over its per-run ceiling
 *   - sumDebateCost / sumRunCost : aggregate Reported_Cost over llm_provider_calls
 *
 * Task 6.2 scope: reactive trip logic.
 *   - recomputeAndGovern : recompute debate/run cost and apply both ceilings
 *   - tripDebate / tripRunDebates : flip offending debates to evaluation_failed
 *
 * Requirements: 1.2, 1.4, 1.5, 2.2, 2.3, 2.4, 3.1, 3.4, 5.1, 5.2, 5.3
 */

import { and, eq, inArray, ne, sql } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { benchmarkRuns, debates, llmProviderCalls } from '@/lib/db/schema'
import { sumReportedCost, type CostSummary, type ReportedCost } from './aggregate'
import {
  evaluateCeiling,
  validateCostCeilings,
  type CeilingDecision,
  type CeilingValidationError,
} from './ceiling'
import { buildCostErrorState } from './error-state'

export interface RunCeilings {
  perDebateCostCeilingUsd: number | null
  perRunCostCeilingUsd: number | null
}

/**
 * Raised when a run's stored ceilings are out of range. Per Req 3.4, an invalid
 * ceiling that reaches cost evaluation must fail the run before dispatching any
 * further LLM call rather than being silently ignored. The runner catches this
 * to fail the run and record the reason.
 */
export class InvalidCostCeilingError extends Error {
  constructor(
    public readonly benchmarkRunId: string,
    public readonly errors: CeilingValidationError[]
  ) {
    const detail = errors.map((e) => `${e.field}: ${e.reason}`).join('; ')
    super(`Invalid cost ceiling(s) in run ${benchmarkRunId} config: ${detail}`)
    this.name = 'InvalidCostCeilingError'
  }
}

/** A configured ceiling is a finite number; anything absent normalizes to null. */
function toCeiling(value: unknown): number | null {
  return typeof value === 'number' ? value : null
}

/**
 * Read and validate the per-debate and per-run cost ceilings from a benchmark
 * run's `config` jsonb (Req 3.1). Absent ceilings normalize to `null`
 * (unconfigured). If a stored ceiling is present but out of range, throws
 * `InvalidCostCeilingError` so the run fails before dispatch (Req 3.4).
 */
export async function getRunCeilings(benchmarkRunId: string): Promise<RunCeilings> {
  const [run] = await db
    .select({ config: benchmarkRuns.config })
    .from(benchmarkRuns)
    .where(eq(benchmarkRuns.id, benchmarkRunId))
    .limit(1)

  if (!run) {
    throw new Error(`Benchmark run not found: ${benchmarkRunId}`)
  }

  const config = (run.config ?? {}) as Record<string, unknown>
  const candidate = {
    perDebateCostCeilingUsd: config.perDebateCostCeilingUsd,
    perRunCostCeilingUsd: config.perRunCostCeilingUsd,
  }

  const { valid, errors } = validateCostCeilings(candidate)
  if (!valid) {
    throw new InvalidCostCeilingError(benchmarkRunId, errors)
  }

  return {
    perDebateCostCeilingUsd: toCeiling(candidate.perDebateCostCeilingUsd),
    perRunCostCeilingUsd: toCeiling(candidate.perRunCostCeilingUsd),
  }
}

/** Fetch the Reported_Cost values for every provider call of a debate. */
async function fetchDebateCosts(debateId: string): Promise<ReportedCost[]> {
  const rows = await db
    .select({ cost: llmProviderCalls.costEstimate })
    .from(llmProviderCalls)
    .where(eq(llmProviderCalls.debateId, debateId))
  return rows.map((r) => r.cost)
}

/** Fetch the Reported_Cost values for every provider call of a benchmark run. */
async function fetchRunCosts(benchmarkRunId: string): Promise<ReportedCost[]> {
  const rows = await db
    .select({ cost: llmProviderCalls.costEstimate })
    .from(llmProviderCalls)
    .where(eq(llmProviderCalls.benchmarkRunId, benchmarkRunId))
  return rows.map((r) => r.cost)
}

/** Accumulated_Debate_Cost: normalized sum of Reported_Cost across a debate's calls. */
export async function sumDebateCost(debateId: string): Promise<CostSummary> {
  return sumReportedCost(await fetchDebateCosts(debateId))
}

/** Accumulated_Run_Cost: normalized sum of Reported_Cost across a run's calls. */
export async function sumRunCost(benchmarkRunId: string): Promise<CostSummary> {
  return sumReportedCost(await fetchRunCosts(benchmarkRunId))
}

/**
 * Preventive gate (Req 2.3): returns true when the run's accumulated cost has
 * already strictly exceeded its configured per-run ceiling, so the runner can
 * stop starting additional debates. A run without a configured per-run ceiling
 * is never tripped. Throws `InvalidCostCeilingError` (via `getRunCeilings`) if a
 * stored ceiling is out of range (Req 3.4).
 */
export async function isRunCostTripped(benchmarkRunId: string): Promise<boolean> {
  const { perRunCostCeilingUsd } = await getRunCeilings(benchmarkRunId)
  if (perRunCostCeilingUsd === null) return false

  const { total } = await sumRunCost(benchmarkRunId)
  return evaluateCeiling('per_run', total, perRunCostCeilingUsd).tripped
}

export interface GovernResult {
  /** True when this call transitioned the given debate into evaluation_failed. */
  debateTripped: boolean
  /** Ids of debates transitioned into evaluation_failed by the per-run trip. */
  runTrippedDebateIds: string[]
}

/** Statuses a debate may be in while still mutable by a cost trip (Req 2.2). */
const ACTIVE_STATUSES = ['running', 'pending'] as const

/**
 * The per-run trip selection rule (Req 2.2): a debate is cost-trippable iff its
 * status is `running` or `pending`. This predicate is the single source of truth
 * that the SQL filter in `tripRunDebates` encodes (`inArray(status,
 * ACTIVE_STATUSES)`). It is exported as a pure function so the selection rule can
 * be exercised directly in tests without a live database.
 */
export function isCostTrippable(status: string): boolean {
  return (ACTIVE_STATUSES as readonly string[]).includes(status)
}

/**
 * Pure projection of the per-run trip rule (Req 2.2): given a set of debates with
 * arbitrary statuses, return the ids of exactly those that are cost-trippable
 * (`running`/`pending`). Every other debate is excluded and therefore left
 * unchanged by a run trip. This mirrors the SQL filter applied by
 * `tripRunDebates`, so the in-memory rule and the persisted behavior agree.
 */
export function selectRunTripDebateIds(
  debateSet: { id: string; status: string }[]
): string[] {
  return debateSet.filter((d) => isCostTrippable(d.status)).map((d) => d.id)
}

/**
 * Trip a single debate to `evaluation_failed` for a per-debate ceiling breach.
 *
 * Only mutates `status`/`errorState`/`completedAt`; turns, provider calls, votes,
 * and tallies are left untouched (Req 5.1). The `status != evaluation_failed`
 * guard makes this idempotent: a debate already failed is not re-written and the
 * run counter is not re-incremented (Req 5.3). On a genuine transition the run's
 * `evaluationFailedDebates` counter is incremented by exactly 1 (Req 5.2).
 */
async function tripDebate(
  debateId: string,
  decision: CeilingDecision,
  benchmarkRunId: string
): Promise<boolean> {
  const updated = await db
    .update(debates)
    .set({
      status: 'evaluation_failed',
      errorState: buildCostErrorState(decision),
      completedAt: new Date(),
    })
    .where(and(eq(debates.id, debateId), ne(debates.status, 'evaluation_failed')))
    .returning({ id: debates.id })

  if (updated.length === 0) return false // already failed -> idempotent no-op

  await db
    .update(benchmarkRuns)
    .set({ evaluationFailedDebates: sql`${benchmarkRuns.evaluationFailedDebates} + 1` })
    .where(eq(benchmarkRuns.id, benchmarkRunId))

  return true
}

/**
 * Trip every `running`/`pending` debate of a run to `evaluation_failed` for a
 * per-run ceiling breach (Req 2.2). Debates in any other status (including those
 * already `evaluation_failed`) are left unchanged, so the run counter is
 * incremented by exactly the number of debates that actually transitioned
 * (Req 5.2, 5.3). Only `status`/`errorState`/`completedAt` change (Req 5.1).
 */
async function tripRunDebates(
  benchmarkRunId: string,
  decision: CeilingDecision
): Promise<string[]> {
  const updated = await db
    .update(debates)
    .set({
      status: 'evaluation_failed',
      errorState: buildCostErrorState(decision),
      completedAt: new Date(),
    })
    .where(
      and(
        eq(debates.benchmarkRunId, benchmarkRunId),
        inArray(debates.status, [...ACTIVE_STATUSES])
      )
    )
    .returning({ id: debates.id })

  if (updated.length > 0) {
    await db
      .update(benchmarkRuns)
      .set({
        evaluationFailedDebates: sql`${benchmarkRuns.evaluationFailedDebates} + ${updated.length}`,
      })
      .where(eq(benchmarkRuns.id, benchmarkRunId))
  }

  return updated.map((r) => r.id)
}

/**
 * Recompute accumulated debate + run cost from `llm_provider_calls` and apply the
 * per-debate and per-run ceilings, tripping offending debates to
 * `evaluation_failed` (Req 1.2, 2.2). Ceilings are sourced from the benchmark
 * run's `config` jsonb (Req 3.1); a debate with no associated run has no
 * configured ceiling and is therefore never tripped. Unconfigured ceilings never
 * trip (Req 1.6, 2.5).
 *
 * Idempotent: a debate already in `evaluation_failed` is left unchanged and does
 * not re-increment the run counter (Req 5.3). Only `status`/`errorState`/
 * `completedAt` are mutated; all artifacts are preserved (Req 5.1).
 *
 * May throw `InvalidCostCeilingError` (via `getRunCeilings`) when a stored
 * ceiling is out of range, so the run fails before dispatch (Req 3.4).
 */
export async function recomputeAndGovern(
  debateId: string | null,
  benchmarkRunId: string | null
): Promise<GovernResult> {
  const result: GovernResult = { debateTripped: false, runTrippedDebateIds: [] }

  // Ceilings live in the run config; without a run there is nothing to enforce.
  if (!benchmarkRunId) return result

  const { perDebateCostCeilingUsd, perRunCostCeilingUsd } = await getRunCeilings(benchmarkRunId)

  // Per-debate enforcement (Req 1.2).
  if (debateId && perDebateCostCeilingUsd !== null) {
    const { total } = await sumDebateCost(debateId)
    const decision = evaluateCeiling('per_debate', total, perDebateCostCeilingUsd)
    if (decision.tripped) {
      result.debateTripped = await tripDebate(debateId, decision, benchmarkRunId)
    }
  }

  // Per-run enforcement (Req 2.2).
  if (perRunCostCeilingUsd !== null) {
    const { total } = await sumRunCost(benchmarkRunId)
    const decision = evaluateCeiling('per_run', total, perRunCostCeilingUsd)
    if (decision.tripped) {
      result.runTrippedDebateIds = await tripRunDebates(benchmarkRunId, decision)
    }
  }

  return result
}
