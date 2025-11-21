import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { debates } from '@/lib/db/schema'
import { eq, and, sql, desc } from 'drizzle-orm'

export const dynamic = 'force-dynamic'
export const revalidate = 3600 // Cache for 1 hour

/**
 * GET /api/debates/featured
 * Get the "Debate of the Day" - a high-quality, interesting debate
 * Selection criteria:
 * - Completed debates only
 * - High engagement (vote count)
 * - Close outcomes (controversial)
 * - Recent (within last 30 days preferred)
 * - Involves SOTA models
 */
export async function GET(request: NextRequest) {
  try {
    // Get today's date for deterministic selection
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const daysSinceEpoch = Math.floor(today.getTime() / (1000 * 60 * 60 * 24))

    // Get completed debates with engagement metrics
    const featuredDebates = await db.query.debates.findMany({
      where: eq(debates.status, 'completed'),
      with: {
        topic: true,
        proModel: true,
        conModel: true,
        proPersona: true,
        conPersona: true,
        turns: {
          orderBy: (turns, { asc }) => [asc(turns.roundNumber)],
        },
        evaluations: true,
      },
      orderBy: (debates, { desc }) => [
        // Prioritize debates with votes
        desc(sql`${debates.crowdVotesProCount} + ${debates.crowdVotesConCount} + ${debates.crowdVotesTieCount}`),
      ],
      limit: 50, // Get top 50 candidates
    })

    if (featuredDebates.length === 0) {
      return NextResponse.json(
        { error: 'No completed debates available' },
        { status: 404 }
      )
    }

    // Score each debate for "interestingness"
    const scoredDebates = featuredDebates.map(debate => {
      const totalVotes = debate.crowdVotesProCount + debate.crowdVotesConCount + debate.crowdVotesTieCount
      
      // Calculate controversy score (how close the vote was)
      const maxVotes = Math.max(debate.crowdVotesProCount, debate.crowdVotesConCount, debate.crowdVotesTieCount)
      const controversyScore = totalVotes > 0 
        ? 1 - (maxVotes / totalVotes) // Higher when votes are evenly split
        : 0

      // Calculate recency score (prefer recent debates)
      const ageInDays = (Date.now() - debate.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      const recencyScore = Math.max(0, 1 - (ageInDays / 30)) // Decay over 30 days

      // Calculate engagement score
      const engagementScore = Math.min(1, totalVotes / 50) // Normalize to 50 votes

      // Check if both models are active (SOTA)
      const sotaScore = (debate.proModel.isActive && debate.conModel.isActive) ? 1 : 0.5

      // Check if personas were used
      const personaScore = (debate.proPersonaId && debate.conPersonaId) ? 1 : 0.8

      // Calculate total score
      const totalScore = 
        controversyScore * 0.3 +
        recencyScore * 0.2 +
        engagementScore * 0.3 +
        sotaScore * 0.1 +
        personaScore * 0.1

      return {
        debate,
        score: totalScore,
        metrics: {
          controversy: controversyScore,
          recency: recencyScore,
          engagement: engagementScore,
          sota: sotaScore,
          persona: personaScore,
        },
      }
    })

    // Sort by score and use deterministic selection based on day
    scoredDebates.sort((a, b) => b.score - a.score)
    
    // Select debate based on day (rotates through top debates)
    const selectedIndex = daysSinceEpoch % Math.min(scoredDebates.length, 7) // Rotate through top 7
    const selected = scoredDebates[selectedIndex]

    // Format the response
    const featuredDebate = {
      id: selected.debate.id,
      title: `Debate of the Day: ${selected.debate.topic.motion}`,
      topic: {
        motion: selected.debate.topic.motion,
        category: selected.debate.topic.category,
        difficulty: selected.debate.topic.difficulty,
      },
      participants: {
        pro: {
          model: {
            name: selected.debate.proModel.name,
            provider: selected.debate.proModel.provider,
          },
          persona: selected.debate.proPersona ? {
            name: selected.debate.proPersona.name,
            description: selected.debate.proPersona.description,
          } : null,
        },
        con: {
          model: {
            name: selected.debate.conModel.name,
            provider: selected.debate.conModel.provider,
          },
          persona: selected.debate.conPersona ? {
            name: selected.debate.conPersona.name,
            description: selected.debate.conPersona.description,
          } : null,
        },
      },
      results: {
        winner: selected.debate.winner,
        crowdWinner: selected.debate.crowdWinner,
        aiJudgeWinner: selected.debate.aiJudgeWinner,
        votes: {
          pro: selected.debate.crowdVotesProCount,
          con: selected.debate.crowdVotesConCount,
          tie: selected.debate.crowdVotesTieCount,
          total: selected.debate.crowdVotesProCount + selected.debate.crowdVotesConCount + selected.debate.crowdVotesTieCount,
        },
      },
      highlights: {
        totalRounds: selected.debate.totalRounds,
        totalTurns: selected.debate.turns.length,
        factCheckMode: selected.debate.factCheckMode,
        hasEvaluations: selected.debate.evaluations.length > 0,
      },
      metrics: {
        interestScore: Math.round(selected.score * 100),
        controversy: Math.round(selected.metrics.controversy * 100),
        engagement: Math.round(selected.metrics.engagement * 100),
      },
      timestamps: {
        created: selected.debate.createdAt,
        started: selected.debate.startedAt,
        completed: selected.debate.completedAt,
      },
      shareUrl: `/debate/${selected.debate.id}`,
    }

    return NextResponse.json(featuredDebate, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
      },
    })
  } catch (error) {
    console.error('Error fetching featured debate:', error)
    return NextResponse.json(
      { error: 'Failed to fetch featured debate' },
      { status: 500 }
    )
  }
}
