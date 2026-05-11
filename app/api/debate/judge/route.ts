/**
 * POST /api/debate/judge
 * 
 * Trigger AI judge evaluation for a completed debate.
 * Uses position bias mitigation by evaluating in both orders.
 * 
 * Requirements: 5, 15
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { debates, debateEvaluations } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { validateRequest, judgeRequestSchema } from '@/lib/middleware/validation'
import { rateLimitMiddleware, RATE_LIMITS } from '@/lib/middleware/rate-limit'
import { JudgeAgent, JudgeParseError } from '@/lib/agents/judge'
import { persistConsensusVerdict } from '@/lib/debate/executor'

export async function POST(request: NextRequest) {
  let requestedDebateId: string | undefined

  try {
    // Apply rate limiting
    const rateLimitResponse = await rateLimitMiddleware(request, RATE_LIMITS.api)
    if (rateLimitResponse) {
      return rateLimitResponse
    }
    
    // Validate request body
    const validation = await validateRequest(request, judgeRequestSchema)
    if (!validation.success) {
      return validation.response
    }
    
    const { debateId, judgeModel } = validation.data
    requestedDebateId = debateId
    
    // Check if debate exists and has a completed transcript
    const debate = await db.query.debates.findFirst({
      where: eq(debates.id, debateId),
      with: {
        turns: {
          orderBy: (turns, { asc }) => [asc(turns.roundNumber), asc(turns.createdAt)],
        },
        topic: true,
        proModel: true,
        conModel: true,
      },
    })
    
    if (!debate) {
      return NextResponse.json({
        error: 'Debate not found',
        message: `No debate found with ID ${debateId}`,
      }, { status: 404 })
    }
    
    if (!['completed', 'evaluation_failed'].includes(debate.status)) {
      return NextResponse.json({
        error: 'Debate not completed',
        message: 'Can only judge debates with a completed transcript',
      }, { status: 400 })
    }
    
    // Check if already judged
    const existingEvaluation = await db.query.debateEvaluations.findFirst({
      where: eq(debateEvaluations.debateId, debateId),
    })
    
    if (existingEvaluation) {
      return NextResponse.json({
        error: 'Already judged',
        message: 'This debate has already been evaluated by an AI judge',
        evaluation: {
          winner: existingEvaluation.winner,
          proScore: existingEvaluation.proScore,
          conScore: existingEvaluation.conScore,
          reasoning: existingEvaluation.reasoning,
        },
      }, { status: 409 })
    }
    
    const judgeProvider = (debate.judgeProvider || 'openai') as 'openai' | 'google' | 'anthropic' | 'xai' | 'openrouter'
    const resolvedJudgeModel = judgeModel || debate.judgeModel || process.env.AZURE_OPENAI_API_DEPLOYMENT_NAME || 'gpt-4o-mini'
    const judge = new JudgeAgent({
      provider: judgeProvider,
      model: resolvedJudgeModel,
      temperature: 0.3,
    })

    const toJudgeTurn = (turn: typeof debate.turns[number], side: 'pro' | 'con') => ({
      id: turn.id,
      debateId: turn.debateId,
      roundNumber: turn.roundNumber,
      side,
      modelId: turn.modelId,
      reflection: turn.reflection,
      critique: turn.critique,
      speech: turn.speech,
      wordCount: turn.wordCount,
      factChecksPassed: turn.factChecksPassed,
      factChecksFailed: turn.factChecksFailed,
      wasRejected: turn.wasRejected,
      retryCount: turn.retryCount,
      tokensUsed: turn.tokensUsed,
      latencyMs: turn.latencyMs,
      createdAt: turn.createdAt,
    })

    const verdict = await judge.evaluateWithOrderSwap({
      id: debate.id,
      topic: debate.topic.motion,
      pro_turns: debate.turns.filter(t => t.side === 'pro').map(t => toJudgeTurn(t, 'pro')),
      con_turns: debate.turns.filter(t => t.side === 'con').map(t => toJudgeTurn(t, 'con')),
      fact_check_summary: {
        pro_verified: debate.turns.filter(t => t.side === 'pro').reduce((sum, t) => sum + t.factChecksPassed, 0),
        pro_false: debate.turns.filter(t => t.side === 'pro').reduce((sum, t) => sum + t.factChecksFailed, 0),
        con_verified: debate.turns.filter(t => t.side === 'con').reduce((sum, t) => sum + t.factChecksPassed, 0),
        con_false: debate.turns.filter(t => t.side === 'con').reduce((sum, t) => sum + t.factChecksFailed, 0),
      },
    })

    await persistConsensusVerdict(debateId, verdict, judgeProvider, resolvedJudgeModel, debate.promptVersion)

    await db.update(debates)
      .set({
        status: 'completed',
        aiJudgeWinner: verdict.final_winner,
        winner: verdict.final_winner,
        completedAt: new Date(),
      })
      .where(eq(debates.id, debateId))

    const evaluation = await db.query.debateEvaluations.findFirst({
      where: eq(debateEvaluations.debateId, debateId),
      orderBy: (evaluations, { desc }) => [desc(evaluations.createdAt)],
    })
    
    return NextResponse.json({
      success: true,
      evaluation: {
        id: evaluation?.id,
        winner: verdict.final_winner,
        reasoning: evaluation?.reasoning,
        rubricScores: evaluation?.rubricScores,
        positionBiasDetected: evaluation?.positionBiasDetected,
        judgeProvider,
        judgeModel: resolvedJudgeModel,
        parseStatus: evaluation?.parseStatus,
      },
      message: 'Debate evaluated successfully',
    }, { status: 201 })
    
  } catch (error) {
    console.error('Error judging debate:', error)
    
    if (error instanceof Error) {
      if (requestedDebateId) {
        const isParseError = error instanceof JudgeParseError
        await db.insert(debateEvaluations).values({
          debateId: requestedDebateId,
          judgeProvider: 'unknown',
          judgeModel: 'unknown',
          evaluationOrder: isParseError ? error.evaluationOrder : 'consensus',
          winner: null,
          proScore: null,
          conScore: null,
          reasoning: error.message,
          rubricScores: {},
          positionBiasDetected: false,
          parseStatus: isParseError ? 'parse_failed' : 'error',
          rawResponse: isParseError ? error.rawResponse : null,
          errorMessage: error.message,
          schemaVersion: 'judge-v1',
        })

        await db.update(debates)
          .set({
            status: 'evaluation_failed',
            errorState: {
              stage: 'judge',
              parseStatus: isParseError ? 'parse_failed' : 'error',
              message: error.message,
            },
            completedAt: new Date(),
          })
            .where(eq(debates.id, requestedDebateId))
      }

      return NextResponse.json({
        error: 'Judge evaluation failed',
        message: error.message,
      }, { status: 400 })
    }
    
    return NextResponse.json({
      error: 'Internal server error',
      message: 'An unexpected error occurred during evaluation',
    }, { status: 500 })
  }
}

