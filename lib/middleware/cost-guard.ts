/**
 * Cost Guard Middleware
 *
 * Prevents debate creation when the daily spending cap would be exceeded.
 * Spend is computed from real recorded `llm_provider_calls.cost_estimate` over
 * the current UTC calendar day, normalized with the same 0/null -> 0 rule as the
 * cost engine. The guard fails closed: if spend cannot be computed, the request
 * is denied rather than allowed.
 *
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6
 */

import { NextResponse } from 'next/server'
import { and, gte, lte } from 'drizzle-orm'
import { estimateDebateCost as estimateInfrastructureCost } from '@/lib/llm/model-config'
import { db } from '@/lib/db/client'
import { llmProviderCalls } from '@/lib/db/schema'
import { sumReportedCost } from '@/lib/cost/aggregate'

export interface DebateConfig {
  rounds: number
  factCheckingEnabled: boolean
  judgeModel: string
}

/** Minimal shape of a provider-call row needed to compute current-day spend. */
export interface ProviderCallCostRow {
  createdAt: Date
  costEstimate: number | null
}

/**
 * Compute the current UTC calendar-day window [00:00:00.000, 23:59:59.999] that
 * bounds Current_Day_Spend (Req 6.1).
 */
function utcDayWindow(now: Date): { dayStart: Date; dayEnd: Date } {
  const dayStart = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    0, 0, 0, 0
  ))
  const dayEnd = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    23, 59, 59, 999
  ))
  return { dayStart, dayEnd }
}

/**
 * Pure window+normalization core of the daily spend rule (Req 6.1, 6.5).
 *
 * Filters `rows` to exactly those whose `createdAt` falls within the current UTC
 * calendar day window [00:00:00.000, 23:59:59.999] and returns the normalized sum
 * of their `cost_estimate` (via `sumReportedCost`, so `0`/`null` → `0`). Pure and
 * total: no DB access, never throws. This is the testable core that
 * `computeCurrentDaySpend` wraps around a DB fetch.
 */
export function sumSpendInDayWindow(
  rows: ProviderCallCostRow[],
  now: Date = new Date()
): number {
  const { dayStart, dayEnd } = utcDayWindow(now)
  const inWindow = rows.filter(
    (r) => r.createdAt >= dayStart && r.createdAt <= dayEnd
  )
  return sumReportedCost(inWindow.map((r) => r.costEstimate)).total
}

/**
 * Sum `cost_estimate` for every provider call created within the current UTC
 * calendar day window [00:00:00.000, 23:59:59.999]. Fetches the in-window rows
 * then delegates the window+normalization rule to `sumSpendInDayWindow` so
 * `0`/`null`/absent costs contribute exactly 0 (Req 6.5). Throws if the query
 * cannot be executed — callers must fail closed (Req 6.6).
 */
export async function computeCurrentDaySpend(now: Date = new Date()): Promise<number> {
  const { dayStart, dayEnd } = utcDayWindow(now)

  const rows = await db
    .select({
      createdAt: llmProviderCalls.createdAt,
      costEstimate: llmProviderCalls.costEstimate,
    })
    .from(llmProviderCalls)
    .where(and(
      gte(llmProviderCalls.createdAt, dayStart),
      lte(llmProviderCalls.createdAt, dayEnd)
    ))

  return sumSpendInDayWindow(rows, now)
}

export interface CostGuardDecision {
  allowed: boolean
  reason?: string
  currentSpend: number
  cap: number
  estimatedCost: number
}

/**
 * Pure daily-cap decision. Denies iff `currentSpend + estimatedCost > cap`
 * (strict) — so exact equality (`currentSpend + estimatedCost === cap`) is
 * ALLOWED. Echoes the `currentSpend`/`cap`/`estimatedCost` trio in the result so
 * a denial always reports them (Req 6.3). This helper performs no IO and
 * initiates no provider call; the denial decision is itself the gate (Req 6.4).
 *
 * Requirements: 6.2, 6.3, 6.4
 */
export function decideCostGuard(
  currentSpend: number,
  estimatedCost: number,
  cap: number
): CostGuardDecision {
  const allowed = currentSpend + estimatedCost <= cap
  return {
    allowed,
    reason: allowed ? undefined : 'Daily spending cap would be exceeded',
    currentSpend,
    cap,
    estimatedCost,
  }
}

/**
 * Check if a debate can be created without exceeding the daily spending cap.
 * Denies iff `currentSpend + estimatedCost > cap` (strict). Fails closed: if the
 * spend query throws, returns `allowed: false, error: true` (Req 6.6).
 */
export async function checkCostGuard(config: DebateConfig): Promise<{
  allowed: boolean
  reason?: string
  currentSpend: number
  cap: number
  estimatedCost: number
  error?: boolean
}> {
  const cap = Number(process.env.DAILY_SPENDING_CAP_USD || '25')
  const estimate = estimateInfrastructureCost(
    config.rounds,
    2,
    400,
    config.factCheckingEnabled ? 3 : 0
  )
  const estimatedCost = estimate.totalInfrastructureCost

  let currentSpend: number
  try {
    currentSpend = await computeCurrentDaySpend()
  } catch {
    // Fail closed: spend could not be computed, so deny rather than allow
    // unbounded spend (Req 6.6).
    return {
      allowed: false,
      reason: 'Unable to compute current daily spend; denying to fail closed',
      currentSpend: 0,
      cap,
      estimatedCost,
      error: true,
    }
  }

  return decideCostGuard(currentSpend, estimatedCost, cap)
}

/**
 * Middleware function for API routes
 */
export async function costGuardMiddleware(config: DebateConfig): Promise<NextResponse | null> {
  const result = await checkCostGuard(config)

  if (!result.allowed) {
    return NextResponse.json(
      {
        error: result.error ? 'Cost guard error' : 'Spending cap exceeded',
        message: result.reason,
        currentSpend: result.currentSpend,
        cap: result.cap,
        estimatedCost: result.estimatedCost,
      },
      { status: 429 }
    )
  }

  return null // Continue to next middleware/handler
}
