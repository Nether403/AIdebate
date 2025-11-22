import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { debates, debateTurns, factChecks, debateEvaluations, topics, models, personas } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

/**
 * GET /api/debates/[id]/export
 * Export complete debate transcript with all metadata
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: debateId } = await params

    // Fetch debate with all related data
    const debate = await db.query.debates.findFirst({
      where: eq(debates.id, debateId),
      with: {
        topic: true,
        proModel: true,
        conModel: true,
        proPersona: true,
        conPersona: true,
        turns: {
          with: {
            model: true,
            factChecks: true,
          },
          orderBy: (turns, { asc }) => [asc(turns.roundNumber), asc(turns.createdAt)],
        },
        evaluations: true,
      },
    })

    if (!debate) {
      return NextResponse.json(
        { error: 'Debate not found' },
        { status: 404 }
      )
    }

    // Format the export data
    const exportData = {
      debate: {
        id: debate.id,
        status: debate.status,
        topic: {
          motion: debate.topic.motion,
          category: debate.topic.category,
          difficulty: debate.topic.difficulty,
        },
        participants: {
          pro: {
            model: {
              name: debate.proModel.name,
              provider: debate.proModel.provider,
              modelId: debate.proModel.modelId,
            },
            persona: debate.proPersona ? {
              name: debate.proPersona.name,
              description: debate.proPersona.description,
            } : null,
          },
          con: {
            model: {
              name: debate.conModel.name,
              provider: debate.conModel.provider,
              modelId: debate.conModel.modelId,
            },
            persona: debate.conPersona ? {
              name: debate.conPersona.name,
              description: debate.conPersona.description,
            } : null,
          },
        },
        configuration: {
          totalRounds: debate.totalRounds,
          factCheckMode: debate.factCheckMode,
        },
        results: {
          winner: debate.winner,
          crowdWinner: debate.crowdWinner,
          aiJudgeWinner: debate.aiJudgeWinner,
          crowdVotes: {
            pro: debate.crowdVotesProCount,
            con: debate.crowdVotesConCount,
            tie: debate.crowdVotesTieCount,
          },
        },
        timestamps: {
          created: debate.createdAt,
          started: debate.startedAt,
          completed: debate.completedAt,
        },
      },
      transcript: debate.turns.map(turn => ({
        round: turn.roundNumber,
        side: turn.side,
        model: turn.model.name,
        content: {
          reflection: turn.reflection,
          critique: turn.critique,
          speech: turn.speech,
        },
        metadata: {
          wordCount: turn.wordCount,
          tokensUsed: turn.tokensUsed,
          latencyMs: turn.latencyMs,
          wasRejected: turn.wasRejected,
          retryCount: turn.retryCount,
        },
        factChecks: turn.factChecks.map(fc => ({
          claim: fc.claim,
          verdict: fc.verdict,
          confidence: fc.confidence,
          sources: fc.sources,
          reasoning: fc.reasoning,
        })),
        timestamp: turn.createdAt,
      })),
      evaluations: debate.evaluations.map(evaluation => ({
        judgeModel: evaluation.judgeModel,
        evaluationOrder: evaluation.evaluationOrder,
        winner: evaluation.winner,
        scores: {
          pro: evaluation.proScore,
          con: evaluation.conScore,
        },
        rubricScores: evaluation.rubricScores,
        reasoning: evaluation.reasoning,
        positionBiasDetected: evaluation.positionBiasDetected,
        timestamp: evaluation.createdAt,
      })),
      exportMetadata: {
        exportedAt: new Date().toISOString(),
        version: '1.0',
        format: 'json',
      },
    }

    // Set headers for file download
    const filename = `debate-${debateId}-${Date.now()}.json`
    
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error exporting debate:', error)
    return NextResponse.json(
      { error: 'Failed to export debate' },
      { status: 500 }
    )
  }
}
