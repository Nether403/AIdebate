import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { debates, debateTurns, factChecks, debateEvaluations } from '@/lib/db/schema'
import { eq, and, gte, lte } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

/**
 * GET /api/export/anonymized
 * Export anonymized debate data for research purposes
 * Query params:
 * - startDate: ISO date string (optional)
 * - endDate: ISO date string (optional)
 * - limit: number (default 100, max 1000)
 * - status: debate status filter (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 1000)
    const status = searchParams.get('status')

    // Build query conditions
    const conditions = []
    
    if (startDate) {
      conditions.push(gte(debates.createdAt, new Date(startDate)))
    }
    
    if (endDate) {
      conditions.push(lte(debates.createdAt, new Date(endDate)))
    }
    
    if (status) {
      conditions.push(eq(debates.status, status))
    }

    // Fetch debates with related data
    const debatesList = await db.query.debates.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      limit,
      with: {
        topic: true,
        proModel: true,
        conModel: true,
        turns: {
          with: {
            factChecks: true,
          },
          orderBy: (turns, { asc }) => [asc(turns.roundNumber)],
        },
        evaluations: true,
      },
      orderBy: (debates, { desc }) => [desc(debates.createdAt)],
    })

    // Anonymize the data
    const anonymizedData = debatesList.map((debate, index) => ({
      debateId: `debate_${index + 1}`, // Anonymized ID
      topic: {
        motion: debate.topic.motion,
        category: debate.topic.category,
        difficulty: debate.topic.difficulty,
      },
      participants: {
        modelA: {
          provider: debate.proModel.provider,
          // Anonymize specific model versions
          modelFamily: debate.proModel.name.split('-')[0], // e.g., "GPT" from "GPT-5.1"
        },
        modelB: {
          provider: debate.conModel.provider,
          modelFamily: debate.conModel.name.split('-')[0],
        },
      },
      configuration: {
        rounds: debate.totalRounds,
        factCheckMode: debate.factCheckMode,
      },
      results: {
        winner: debate.winner,
        aiJudgeWinner: debate.aiJudgeWinner,
        // Anonymize vote counts (only percentages)
        crowdVoteDistribution: {
          proPercentage: debate.crowdVotesProCount + debate.crowdVotesConCount + debate.crowdVotesTieCount > 0
            ? Math.round((debate.crowdVotesProCount / (debate.crowdVotesProCount + debate.crowdVotesConCount + debate.crowdVotesTieCount)) * 100)
            : 0,
          conPercentage: debate.crowdVotesProCount + debate.crowdVotesConCount + debate.crowdVotesTieCount > 0
            ? Math.round((debate.crowdVotesConCount / (debate.crowdVotesProCount + debate.crowdVotesConCount + debate.crowdVotesTieCount)) * 100)
            : 0,
          tiePercentage: debate.crowdVotesProCount + debate.crowdVotesConCount + debate.crowdVotesTieCount > 0
            ? Math.round((debate.crowdVotesTieCount / (debate.crowdVotesProCount + debate.crowdVotesConCount + debate.crowdVotesTieCount)) * 100)
            : 0,
        },
      },
      transcript: debate.turns.map(turn => ({
        round: turn.roundNumber,
        side: turn.side,
        speech: turn.speech,
        wordCount: turn.wordCount,
        factCheckSummary: {
          totalChecks: turn.factChecksPassed + turn.factChecksFailed,
          passed: turn.factChecksPassed,
          failed: turn.factChecksFailed,
        },
        wasRejected: turn.wasRejected,
      })),
      evaluations: debate.evaluations.map(evaluation => ({
        judgeModel: evaluation.judgeModel,
        winner: evaluation.winner,
        scores: {
          modelA: evaluation.evaluationOrder === 'pro_first' ? evaluation.proScore : evaluation.conScore,
          modelB: evaluation.evaluationOrder === 'pro_first' ? evaluation.conScore : evaluation.proScore,
        },
        rubricScores: evaluation.rubricScores,
        positionBiasDetected: evaluation.positionBiasDetected,
      })),
      timestamps: {
        year: debate.createdAt.getFullYear(),
        month: debate.createdAt.getMonth() + 1,
        // Omit exact dates for privacy
      },
    }))

    const exportData = {
      metadata: {
        exportedAt: new Date().toISOString(),
        version: '1.0',
        format: 'anonymized-json',
        totalDebates: anonymizedData.length,
        filters: {
          startDate: startDate || null,
          endDate: endDate || null,
          status: status || null,
        },
        privacyNote: 'This dataset has been anonymized for research purposes. Specific model versions, exact timestamps, and user data have been removed or aggregated.',
      },
      debates: anonymizedData,
    }

    const filename = `anonymized-debates-${Date.now()}.json`
    
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error exporting anonymized data:', error)
    return NextResponse.json(
      { error: 'Failed to export anonymized data' },
      { status: 500 }
    )
  }
}
