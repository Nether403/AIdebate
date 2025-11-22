import { NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { debateTurns, debates } from '@/lib/db/schema'
import { sql, desc, count } from 'drizzle-orm'

/**
 * Cost monitoring endpoint
 * Tracks estimated API usage and spending based on debate activity
 * 
 * Note: This provides estimates based on debate turns and token usage.
 * For precise tracking, implement an API usage logging table.
 * 
 * Provides:
 * - Daily/weekly/monthly spending estimates
 * - Cost breakdown by model
 * - Token usage statistics
 * - Spending alerts
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('range') || '24h'

    // Calculate time threshold
    const now = new Date()
    const thresholds: Record<string, Date> = {
      '1h': new Date(now.getTime() - 60 * 60 * 1000),
      '24h': new Date(now.getTime() - 24 * 60 * 60 * 1000),
      '7d': new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      '30d': new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
    }
    const since = thresholds[timeRange] || thresholds['24h']

    // Get debate activity for cost estimation
    const debateActivity = await db
      .select({
        totalDebates: count(),
        completedDebates: sql<number>`COUNT(CASE WHEN status = 'completed' THEN 1 END)`,
      })
      .from(debates)
      .where(sql`created_at >= ${since}`)

    // Get token usage from debate turns
    const tokenUsage = await db
      .select({
        totalTurns: count(),
        totalTokens: sql<number>`COALESCE(SUM(tokens_used), 0)`,
        avgTokensPerTurn: sql<number>`COALESCE(AVG(tokens_used), 0)`,
      })
      .from(debateTurns)
      .where(sql`created_at >= ${since}`)

    // Estimate costs based on typical pricing
    // These are rough estimates - implement proper API usage logging for accuracy
    const avgTokensPerDebate = 15000 // Typical for 3-round debate
    const avgCostPerToken = 0.00002 // Average across models (~$0.02 per 1K tokens)
    
    const estimatedTotalTokens = Number(tokenUsage[0]?.totalTokens) || 
                                (debateActivity[0]?.completedDebates || 0) * avgTokensPerDebate
    const estimatedTotalCost = estimatedTotalTokens * avgCostPerToken

    // Calculate spending rate (per hour)
    const hoursInRange = {
      '1h': 1,
      '24h': 24,
      '7d': 168,
      '30d': 720,
    }[timeRange] || 24

    const spendingRate = estimatedTotalCost / hoursInRange

    // Get spending cap from environment
    const dailySpendingCap = Number(process.env.DAILY_SPENDING_CAP_PROD) || 500
    const currentDailySpending = timeRange === '24h' 
      ? estimatedTotalCost
      : spendingRate * 24

    // Alert thresholds
    const alerts = []
    if (currentDailySpending > dailySpendingCap * 0.8) {
      alerts.push({
        level: 'warning',
        message: `Approaching daily spending cap: $${currentDailySpending.toFixed(2)} / $${dailySpendingCap}`,
      })
    }
    if (currentDailySpending > dailySpendingCap) {
      alerts.push({
        level: 'critical',
        message: `Daily spending cap exceeded: $${currentDailySpending.toFixed(2)} / $${dailySpendingCap}`,
      })
    }

    // Projected monthly cost
    const projectedMonthlyCost = spendingRate * 24 * 30

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      time_range: timeRange,
      note: 'Cost estimates based on debate activity. Implement API usage logging for precise tracking.',
      summary: {
        total_cost: estimatedTotalCost,
        total_debates: debateActivity[0]?.totalDebates || 0,
        completed_debates: debateActivity[0]?.completedDebates || 0,
        total_turns: tokenUsage[0]?.totalTurns || 0,
        estimated_tokens: estimatedTotalTokens,
        avg_tokens_per_turn: Number(tokenUsage[0]?.avgTokensPerTurn) || 0,
        avg_cost_per_debate: debateActivity[0]?.completedDebates 
          ? estimatedTotalCost / debateActivity[0].completedDebates 
          : 0,
        spending_rate_per_hour: spendingRate,
        projected_daily_cost: spendingRate * 24,
        projected_monthly_cost: projectedMonthlyCost,
      },
      spending_cap: {
        daily_limit: dailySpendingCap,
        current_daily_spending: currentDailySpending,
        percentage_used: (currentDailySpending / dailySpendingCap * 100).toFixed(2),
        remaining: Math.max(0, dailySpendingCap - currentDailySpending),
      },
      alerts,
      recommendations: [
        'Implement API usage logging table for precise cost tracking',
        'Track costs per provider and model',
        'Monitor token usage patterns',
        'Set up real-time cost alerts',
      ],
    })
  } catch (error) {
    console.error('Cost monitoring error:', error)
    
    return NextResponse.json(
      {
        error: 'Failed to fetch cost metrics',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
