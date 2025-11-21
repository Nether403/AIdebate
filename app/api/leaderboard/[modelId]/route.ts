/**
 * GET /api/leaderboard/[modelId]
 * 
 * Retrieve detailed information about a specific model including:
 * - Complete statistics
 * - Recent debate history
 * - Per-topic performance breakdown
 * - Rating progress over time
 * 
 * Requirements: 8, 14
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { models, debates, debateTurns, topics } from '@/lib/db/schema'
import { eq, desc, and, or, sql } from 'drizzle-orm'
import { rateLimitMiddleware, RATE_LIMITS } from '@/lib/middleware/rate-limit'

export async function GET(
  request: NextRequest,
  { params }: { params: { modelId: string } }
) {
  try {
    // Apply rate limiting
    const rateLimitResponse = await rateLimitMiddleware(request, RATE_LIMITS.api)
    if (rateLimitResponse) {
      return rateLimitResponse
    }

    const { modelId } = params

    // Fetch model details
    const model = await db.query.models.findFirst({
      where: eq(models.id, modelId),
    })

    if (!model) {
      return NextResponse.json(
        {
          error: 'Model not found',
          message: `No model found with ID: ${modelId}`,
        },
        { status: 404 }
      )
    }

    // Fetch recent debates (last 10)
    const recentDebatesData = await db
      .select({
        id: debates.id,
        topicId: debates.topicId,
        proModelId: debates.proModelId,
        conModelId: debates.conModelId,
        winner: debates.winner,
        crowdWinner: debates.crowdWinner,
        aiJudgeWinner: debates.aiJudgeWinner,
        crowdVotesProCount: debates.crowdVotesProCount,
        crowdVotesConCount: debates.crowdVotesConCount,
        completedAt: debates.completedAt,
        topicMotion: topics.motion,
      })
      .from(debates)
      .leftJoin(topics, eq(debates.topicId, topics.id))
      .where(
        and(
          eq(debates.status, 'completed'),
          or(eq(debates.proModelId, modelId), eq(debates.conModelId, modelId))
        )
      )
      .orderBy(desc(debates.completedAt))
      .limit(10)

    // Get opponent model names
    const opponentIds = recentDebatesData.map((d) =>
      d.proModelId === modelId ? d.conModelId : d.proModelId
    )
    const opponents = await db.query.models.findMany({
      where: sql`${models.id} IN ${opponentIds}`,
    })
    const opponentMap = new Map(opponents.map((o) => [o.id, o.name]))

    // Format recent debates
    const recentDebates = recentDebatesData.map((debate) => {
      const isProSide = debate.proModelId === modelId
      const opponentId = isProSide ? debate.conModelId : debate.proModelId
      
      let result: 'win' | 'loss' | 'tie' = 'tie'
      if (debate.crowdWinner) {
        if (
          (isProSide && debate.crowdWinner === 'pro') ||
          (!isProSide && debate.crowdWinner === 'con')
        ) {
          result = 'win'
        } else if (debate.crowdWinner !== 'tie') {
          result = 'loss'
        }
      }

      return {
        id: debate.id,
        topicMotion: debate.topicMotion || 'Unknown Topic',
        opponent: opponentMap.get(opponentId) || 'Unknown',
        result,
        side: isProSide ? ('pro' as const) : ('con' as const),
        crowdVotes: isProSide
          ? debate.crowdVotesProCount
          : debate.crowdVotesConCount,
        aiScore: 0, // TODO: Calculate from judge evaluations
        completedAt: debate.completedAt?.toISOString() || new Date().toISOString(),
      }
    })

    // Fetch topic performance
    const topicPerformanceData = await db
      .select({
        category: topics.category,
        totalDebates: sql<number>`COUNT(*)`,
        wins: sql<number>`SUM(CASE 
          WHEN (${debates.proModelId} = ${modelId} AND ${debates.crowdWinner} = 'pro') 
            OR (${debates.conModelId} = ${modelId} AND ${debates.crowdWinner} = 'con') 
          THEN 1 ELSE 0 END)`,
        losses: sql<number>`SUM(CASE 
          WHEN (${debates.proModelId} = ${modelId} AND ${debates.crowdWinner} = 'con') 
            OR (${debates.conModelId} = ${modelId} AND ${debates.crowdWinner} = 'pro') 
          THEN 1 ELSE 0 END)`,
        ties: sql<number>`SUM(CASE WHEN ${debates.crowdWinner} = 'tie' THEN 1 ELSE 0 END)`,
      })
      .from(debates)
      .leftJoin(topics, eq(debates.topicId, topics.id))
      .where(
        and(
          eq(debates.status, 'completed'),
          or(eq(debates.proModelId, modelId), eq(debates.conModelId, modelId))
        )
      )
      .groupBy(topics.category)

    const topicPerformance = topicPerformanceData.map((tp) => ({
      category: tp.category || 'Unknown',
      debates: Number(tp.totalDebates),
      wins: Number(tp.wins),
      losses: Number(tp.losses),
      ties: Number(tp.ties),
      winRate: Number(tp.totalDebates) > 0 
        ? Number(tp.wins) / Number(tp.totalDebates) 
        : 0,
    }))

    // Generate mock rating history (TODO: Implement actual rating history tracking)
    const ratingHistory = generateMockRatingHistory(
      model.crowdRating,
      model.aiQualityRating,
      model.totalDebates
    )

    // Calculate controversy index
    const controversyIndex = Math.abs(model.crowdRating - model.aiQualityRating)
    const isControversial = controversyIndex > 150

    return NextResponse.json({
      success: true,
      model: {
        modelId: model.id,
        modelName: model.name,
        provider: model.provider,
        isActive: model.isActive,
        ratings: {
          crowd: {
            rating: Math.round(model.crowdRating),
            deviation: Math.round(model.crowdRatingDeviation),
          },
          aiQuality: {
            rating: Math.round(model.aiQualityRating),
            deviation: Math.round(model.aiQualityRatingDeviation),
            volatility: model.aiQualityVolatility,
          },
        },
        statistics: {
          totalDebates: model.totalDebates,
          wins: model.wins,
          losses: model.losses,
          ties: model.ties,
          winRate: model.totalDebates > 0 ? model.wins / model.totalDebates : 0,
        },
        controversy: {
          index: Math.round(controversyIndex),
          isControversial,
        },
        recentDebates,
        topicPerformance,
        ratingHistory,
      },
    })
  } catch (error) {
    console.error('Error fetching model details:', error)

    if (error instanceof Error) {
      return NextResponse.json(
        {
          error: 'Model details fetch failed',
          message: error.message,
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'An unexpected error occurred while fetching model details',
      },
      { status: 500 }
    )
  }
}

// Helper function to generate mock rating history
// TODO: Replace with actual rating history from database
function generateMockRatingHistory(
  currentCrowdRating: number,
  currentAiRating: number,
  totalDebates: number
) {
  const history = []
  const dataPoints = Math.min(totalDebates, 20) // Show up to 20 data points

  if (dataPoints === 0) {
    return []
  }

  const startCrowdRating = 1500
  const startAiRating = 1500

  for (let i = 0; i <= dataPoints; i++) {
    const progress = i / dataPoints
    const date = new Date()
    date.setDate(date.getDate() - (dataPoints - i) * 7) // Weekly intervals

    history.push({
      date: date.toISOString(),
      crowdRating: Math.round(
        startCrowdRating + (currentCrowdRating - startCrowdRating) * progress
      ),
      aiQualityRating: Math.round(
        startAiRating + (currentAiRating - startAiRating) * progress
      ),
    })
  }

  return history
}
