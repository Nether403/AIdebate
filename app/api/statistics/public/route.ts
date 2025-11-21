import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { debates, models, topics, userVotes, debateTurns, factChecks } from '@/lib/db/schema'
import { eq, sql, and, gte } from 'drizzle-orm'

export const dynamic = 'force-dynamic'
export const revalidate = 300 // Cache for 5 minutes

/**
 * GET /api/statistics/public
 * Public statistics dashboard data
 */
export async function GET(request: NextRequest) {
  try {
    // Get overall statistics
    const [totalDebatesResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(debates)

    const [completedDebatesResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(debates)
      .where(eq(debates.status, 'completed'))

    const [totalVotesResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(userVotes)

    const [activeModelsResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(models)
      .where(eq(models.isActive, true))

    const [activeTopicsResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(topics)
      .where(eq(topics.isActive, true))

    // Get fact-checking statistics
    const [totalFactChecksResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(factChecks)

    const [verifiedClaimsResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(factChecks)
      .where(eq(factChecks.verdict, 'true'))

    const [falseClaimsResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(factChecks)
      .where(eq(factChecks.verdict, 'false'))

    // Get debate outcomes distribution
    const outcomeDistribution = await db
      .select({
        winner: debates.winner,
        count: sql<number>`count(*)::int`,
      })
      .from(debates)
      .where(eq(debates.status, 'completed'))
      .groupBy(debates.winner)

    // Get debates by category
    const debatesByCategory = await db
      .select({
        category: topics.category,
        count: sql<number>`count(*)::int`,
      })
      .from(debates)
      .innerJoin(topics, eq(debates.topicId, topics.id))
      .where(eq(debates.status, 'completed'))
      .groupBy(topics.category)

    // Get top models by win rate (minimum 5 debates)
    const topModels = await db
      .select({
        id: models.id,
        name: models.name,
        provider: models.provider,
        totalDebates: models.totalDebates,
        wins: models.wins,
        losses: models.losses,
        ties: models.ties,
        crowdRating: models.crowdRating,
        aiQualityRating: models.aiQualityRating,
      })
      .from(models)
      .where(and(
        eq(models.isActive, true),
        gte(models.totalDebates, 5)
      ))
      .orderBy(sql`(${models.wins}::float / NULLIF(${models.totalDebates}, 0)) DESC`)
      .limit(10)

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const [recentDebatesResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(debates)
      .where(gte(debates.createdAt, sevenDaysAgo))

    const [recentVotesResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(userVotes)
      .where(gte(userVotes.createdAt, sevenDaysAgo))

    // Calculate average debate metrics
    const avgMetrics = await db
      .select({
        avgTurns: sql<number>`AVG((SELECT COUNT(*) FROM ${debateTurns} WHERE ${debateTurns.debateId} = ${debates.id}))::float`,
        avgDuration: sql<number>`AVG(EXTRACT(EPOCH FROM (${debates.completedAt} - ${debates.startedAt})))::float`,
      })
      .from(debates)
      .where(and(
        eq(debates.status, 'completed'),
        sql`${debates.startedAt} IS NOT NULL`,
        sql`${debates.completedAt} IS NOT NULL`
      ))

    const statistics = {
      overview: {
        totalDebates: totalDebatesResult.count,
        completedDebates: completedDebatesResult.count,
        totalVotes: totalVotesResult.count,
        activeModels: activeModelsResult.count,
        activeTopics: activeTopicsResult.count,
      },
      factChecking: {
        totalFactChecks: totalFactChecksResult.count,
        verifiedClaims: verifiedClaimsResult.count,
        falseClaims: falseClaimsResult.count,
        accuracyRate: totalFactChecksResult.count > 0
          ? Math.round((verifiedClaimsResult.count / totalFactChecksResult.count) * 100)
          : 0,
      },
      outcomes: {
        distribution: outcomeDistribution.map(o => ({
          outcome: o.winner || 'pending',
          count: o.count,
          percentage: completedDebatesResult.count > 0
            ? Math.round((o.count / completedDebatesResult.count) * 100)
            : 0,
        })),
      },
      categories: {
        distribution: debatesByCategory.map(c => ({
          category: c.category,
          count: c.count,
          percentage: completedDebatesResult.count > 0
            ? Math.round((c.count / completedDebatesResult.count) * 100)
            : 0,
        })),
      },
      topPerformers: topModels.map(m => ({
        name: m.name,
        provider: m.provider,
        totalDebates: m.totalDebates,
        winRate: m.totalDebates > 0
          ? Math.round((m.wins / m.totalDebates) * 100)
          : 0,
        crowdRating: Math.round(m.crowdRating),
        aiQualityRating: Math.round(m.aiQualityRating),
      })),
      recentActivity: {
        last7Days: {
          debates: recentDebatesResult.count,
          votes: recentVotesResult.count,
        },
      },
      averages: {
        turnsPerDebate: avgMetrics[0]?.avgTurns ? Math.round(avgMetrics[0].avgTurns) : 0,
        durationMinutes: avgMetrics[0]?.avgDuration ? Math.round(avgMetrics[0].avgDuration / 60) : 0,
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        cacheExpiry: 300, // seconds
      },
    }

    return NextResponse.json(statistics, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    })
  } catch (error) {
    console.error('Error generating public statistics:', error)
    return NextResponse.json(
      { error: 'Failed to generate statistics' },
      { status: 500 }
    )
  }
}
