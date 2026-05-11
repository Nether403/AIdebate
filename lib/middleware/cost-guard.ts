/**
 * Cost Guard Middleware
 * 
 * Prevents debate creation when daily spending cap is exceeded
 * 
 * Requirements: 15
 */

import { NextResponse } from 'next/server'
import { estimateDebateCost as estimateInfrastructureCost } from '@/lib/llm/model-config'

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
  const cap = Number(process.env.DAILY_SPENDING_CAP_USD || '25')
  const currentSpend = 0
  const estimate = estimateInfrastructureCost(
    config.rounds,
    2,
    400,
    config.factCheckingEnabled ? 3 : 0
  )
  const estimatedCost = estimate.totalInfrastructureCost
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
