import { NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { debates, userVotes } from '@/lib/db/schema'
import { sql, desc, count } from 'drizzle-orm'

/**
 * Monitoring metrics endpoint
 * Provides operational metrics for dashboards and alerting
 * 
 * Metrics include:
 * - Debate statistics (total, active, completed)
 * - Vote statistics (total, recent)
 * - Prediction market statistics
 * - API usage and costs
 * - Performance metrics
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('range') || '24h' // 1h, 24h, 7d, 30d

    // Calculate time threshold
    const now = new Date()
    const thresholds: Record<string, Date> = {
      '1h': new Date(now.getTime() - 60 * 60 * 1000),
      '24h': new Date(now.getTime() - 24 * 60 * 60 * 1000),
      '7d': new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      '30d': new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
    }
    const since = thresholds[timeRange] || thresholds['24h']

    // Debate metrics
    const debateMetrics = await db
      .select({
        total: count(),
        completed: sql<number>`COUNT(CASE WHEN status = 'completed' THEN 1 END)`,
        active: sql<number>`COUNT(CASE WHEN status = 'active' THEN 1 END)`,
        failed: sql<number>`COUNT(CASE WHEN status = 'failed' THEN 1 END)`,
      })
      .from(debates)
      .where(sql`created_at >= ${since}`)

    // Vote metrics
    const voteMetrics = await db
      .select({
        total: count(),
        recent: sql<number>`COUNT(CASE WHEN created_at >= ${since} THEN 1 END)`,
      })
      .from(userVotes)

    // Betting metrics (from user votes with wagers)
    const bettingMetrics = await db
      .select({
        total: count(),
        totalWagered: sql<number>`COALESCE(SUM(wager_amount), 0)`,
        avgWager: sql<number>`COALESCE(AVG(wager_amount), 0)`,
      })
      .from(userVotes)
      .where(sql`created_at >= ${since} AND wager_amount > 0`)

    // Recent debates (for monitoring)
    const recentDebates = await db
      .select({
        id: debates.id,
        status: debates.status,
        createdAt: debates.createdAt,
        completedAt: debates.completedAt,
        duration: sql<number>`EXTRACT(EPOCH FROM (completed_at - created_at))`,
      })
      .from(debates)
      .where(sql`created_at >= ${since}`)
      .orderBy(desc(debates.createdAt))
      .limit(10)

    // Calculate average debate duration
    const avgDuration = recentDebates
      .filter(d => d.duration)
      .reduce((sum, d) => sum + (d.duration || 0), 0) / 
      (recentDebates.filter(d => d.duration).length || 1)

    // Performance metrics
    const performance = {
      avg_debate_duration_seconds: Math.round(avgDuration),
      debates_per_hour: debateMetrics[0]?.total || 0,
      votes_per_hour: voteMetrics[0]?.recent || 0,
      completion_rate: debateMetrics[0]?.total 
        ? ((debateMetrics[0]?.completed || 0) / debateMetrics[0].total * 100).toFixed(2)
        : 0,
      failure_rate: debateMetrics[0]?.total
        ? ((debateMetrics[0]?.failed || 0) / debateMetrics[0].total * 100).toFixed(2)
        : 0,
    }

    // System health indicators
    const health = {
      debates_healthy: (debateMetrics[0]?.failed || 0) < (debateMetrics[0]?.total || 1) * 0.05, // < 5% failure rate
      performance_healthy: avgDuration < 300, // < 5 minutes average
      activity_healthy: (debateMetrics[0]?.total || 0) > 0, // At least some activity
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      time_range: timeRange,
      metrics: {
        debates: debateMetrics[0],
        votes: voteMetrics[0],
        betting: bettingMetrics[0],
        performance,
      },
      health,
      recent_debates: recentDebates.map(d => ({
        id: d.id,
        status: d.status,
        created_at: d.createdAt,
        duration_seconds: d.duration,
      })),
    })
  } catch (error) {
    console.error('Metrics endpoint error:', error)
    
    return NextResponse.json(
      {
        error: 'Failed to fetch metrics',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
