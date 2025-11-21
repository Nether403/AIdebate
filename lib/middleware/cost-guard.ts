/**
 * Cost Guard Middleware
 * 
 * Prevents debate creation when daily spending cap is exceeded
 * 
 * Requirements: 15
 */

import { NextResponse } from 'next/server'
import { checkSpendingCap, estimateDebateCost, sendCostAlert, getDailyCostSummary } from '@/lib/security/cost-monitoring'

export interface DebateConfig {
  rounds: number
  factCheckingEnabled: boolean
  judgeModel: string
}

/**
 * Check if debate can be created without exceeding spending cap
 */
export async function checkCostGuard(config: DebateConfig): Promise<{
  allowed: boolean
  reason?: string
  currentSpend: number
  cap: number
  estimatedCost: number
}> {
  const spendingStatus = await checkSpendingCap()
  const estimatedCost = estimateDebateCost(config)
  
  // Check if adding this debate would exceed the cap
  const projectedSpend = spendingStatus.currentSpend + estimatedCost
  const allowed = projectedSpend <= spendingStatus.cap
  
  // Send alert if we're at 90% of cap
  if (spendingStatus.currentSpend >= spendingStatus.cap * 0.9 && !spendingStatus.exceeded) {
    const summary = await getDailyCostSummary()
    await sendCostAlert(summary)
  }
  
  return {
    allowed,
    reason: allowed ? undefined : 'Daily spending cap would be exceeded',
    currentSpend: spendingStatus.currentSpend,
    cap: spendingStatus.cap,
    estimatedCost,
  }
}

/**
 * Middleware function for API routes
 */
export async function costGuardMiddleware(config: DebateConfig): Promise<NextResponse | null> {
  const result = await checkCostGuard(config)
  
  if (!result.allowed) {
    return NextResponse.json(
      {
        error: 'Spending cap exceeded',
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
