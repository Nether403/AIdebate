/**
 * Cost Monitoring and Spending Caps
 * 
 * Tracks API usage and costs, enforces daily spending caps,
 * and provides alerts when thresholds are exceeded.
 * 
 * Requirements: 15
 */

import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

export interface CostEntry {
  timestamp: number
  provider: string
  model: string
  operation: string // 'debate', 'judge', 'fact-check', 'topic-generation'
  inputTokens: number
  outputTokens: number
  estimatedCost: number
  debateId?: string
}

export interface DailyCostSummary {
  date: string
  totalCost: number
  byProvider: Record<string, number>
  byOperation: Record<string, number>
  totalRequests: number
  capExceeded: boolean
  remainingBudget: number
}

/**
 * Get daily spending cap based on environment
 */
export function getDailySpendingCap(): number {
  const env = process.env.NODE_ENV || 'development'
  
  if (env === 'production') {
    return parseFloat(process.env.DAILY_SPENDING_CAP_PROD || '500')
  } else if (env === 'test') {
    return parseFloat(process.env.DAILY_SPENDING_CAP_DEV || '10')
  } else {
    // development or any other environment
    return parseFloat(process.env.DAILY_SPENDING_CAP_DEV || '10')
  }
}

/**
 * Log a cost entry
 */
export async function logCost(entry: CostEntry): Promise<void> {
  const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD
  const key = `costs:${today}`
  
  // Store entry in a sorted set with timestamp as score
  await redis.zadd(key, {
    score: entry.timestamp,
    member: JSON.stringify(entry),
  })
  
  // Set expiry to 90 days
  await redis.expire(key, 90 * 24 * 60 * 60)
  
  // Update daily total
  const totalKey = `costs:total:${today}`
  await redis.incrbyfloat(totalKey, entry.estimatedCost)
  await redis.expire(totalKey, 90 * 24 * 60 * 60)
}

/**
 * Get daily cost summary
 */
export async function getDailyCostSummary(date?: string): Promise<DailyCostSummary> {
  const targetDate = date || new Date().toISOString().split('T')[0]
  const key = `costs:${targetDate}`
  const totalKey = `costs:total:${targetDate}`
  
  // Get total cost
  const totalCost = parseFloat((await redis.get(totalKey) as string) || '0')
  
  // Get all entries for the day
  const entries = await redis.zrange(key, 0, -1)
  
  const byProvider: Record<string, number> = {}
  const byOperation: Record<string, number> = {}
  let totalRequests = 0
  
  for (const entryStr of entries) {
    try {
      const entry = JSON.parse(entryStr as string) as CostEntry
      totalRequests++
      
      // Aggregate by provider
      byProvider[entry.provider] = (byProvider[entry.provider] || 0) + entry.estimatedCost
      
      // Aggregate by operation
      byOperation[entry.operation] = (byOperation[entry.operation] || 0) + entry.estimatedCost
    } catch (error) {
      console.error('Error parsing cost entry:', error)
    }
  }
  
  const cap = getDailySpendingCap()
  const capExceeded = totalCost >= cap
  const remainingBudget = Math.max(0, cap - totalCost)
  
  return {
    date: targetDate,
    totalCost,
    byProvider,
    byOperation,
    totalRequests,
    capExceeded,
    remainingBudget,
  }
}

/**
 * Check if daily spending cap has been exceeded
 */
export async function checkSpendingCap(): Promise<{
  exceeded: boolean
  currentSpend: number
  cap: number
  remainingBudget: number
}> {
  const summary = await getDailyCostSummary()
  const cap = getDailySpendingCap()
  
  return {
    exceeded: summary.capExceeded,
    currentSpend: summary.totalCost,
    cap,
    remainingBudget: summary.remainingBudget,
  }
}

/**
 * Send cost alert (placeholder for email/webhook integration)
 */
export async function sendCostAlert(summary: DailyCostSummary): Promise<void> {
  console.warn('⚠️ COST ALERT ⚠️')
  console.warn(`Daily spending cap exceeded: $${summary.totalCost.toFixed(2)}`)
  console.warn(`Cap: $${getDailySpendingCap().toFixed(2)}`)
  console.warn(`Breakdown:`)
  console.warn(`  By Provider:`, summary.byProvider)
  console.warn(`  By Operation:`, summary.byOperation)
  
  // TODO: Integrate with email service (SendGrid, AWS SES, etc.)
  // TODO: Integrate with Slack/Discord webhook for real-time alerts
  
  // Store alert in Redis
  const alertKey = `alert:cost:${summary.date}`
  await redis.set(alertKey, JSON.stringify(summary), { ex: 30 * 24 * 60 * 60 })
}

/**
 * Get cost history for the last N days
 */
export async function getCostHistory(days: number = 30): Promise<DailyCostSummary[]> {
  const history: DailyCostSummary[] = []
  const today = new Date()
  
  for (let i = 0; i < days; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    
    const summary = await getDailyCostSummary(dateStr)
    history.push(summary)
  }
  
  return history
}

/**
 * Estimate cost for a debate before execution
 */
export function estimateDebateCost(config: {
  rounds: number
  factCheckingEnabled: boolean
  judgeModel: string
}): number {
  // Rough estimates based on typical token usage
  const DEBATER_COST_PER_TURN = 0.05 // ~2000 tokens per turn
  const FACT_CHECK_COST_PER_TURN = 0.02 // ~500 tokens per fact-check
  const JUDGE_COST = 0.15 // ~5000 tokens for evaluation
  
  const turnsPerRound = 2 // Pro and Con
  const totalTurns = config.rounds * turnsPerRound
  
  let estimatedCost = totalTurns * DEBATER_COST_PER_TURN
  
  if (config.factCheckingEnabled) {
    estimatedCost += totalTurns * FACT_CHECK_COST_PER_TURN
  }
  
  estimatedCost += JUDGE_COST
  
  // Add 20% buffer for variability
  estimatedCost *= 1.2
  
  return estimatedCost
}
