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
import { debates, debateEvaluations, models } from '@/lib/db/schema'
import { eq, sql } from 'drizzle-orm'
import { validateRequest, judgeRequestSchema } from '@/lib/middleware/validation'
import { rateLimitMiddleware, RATE_LIMITS } from '@/lib/middleware/rate-limit'
import { distributePayout } from '@/lib/prediction/market'

// Note: Judge agent implementation will be imported when available
// import { JudgeAgent } from '@/lib/agents/judge'

export async function POST(request: NextRequest) {
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
    
    // Check if debate exists and is completed
    const debate = await db.query.debates.findFirst({
      where: eq(debates.id, debateId),
      with: {
        turns: {
          orderBy: (turns, { asc }) => [asc(turns.roundNumber), asc(turns.createdAt)],
        },
        topic: true,
      },
    })
    
    if (!debate) {
      return NextResponse.json({
        error: 'Debate not found',
        message: `No debate found with ID ${debateId}`,
      }, { status: 404 })
    }
    
    if (debate.status !== 'completed') {
      return NextResponse.json({
        error: 'Debate not completed',
        message: 'Can only judge completed debates',
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
    
    // TODO: Implement actual judge evaluation
    // For now, return a placeholder response
    // When judge agent is implemented:
    // const judge = new JudgeAgent(judgeModel || 'gemini-3.0-pro')
    // const evaluation = await judge.evaluateDebate(debate)
    
    // Placeholder evaluation
    const placeholderEvaluation = {
      judgeModel: judgeModel || 'gemini-3.0-pro',
      evaluationOrder: 'pro_first',
      winner: 'pro' as const,
      proScore: 7.5,
      conScore: 6.8,
      reasoning: 'Judge evaluation will be implemented when judge agent is available.',
      rubricScores: {
        logicalCoherence: { pro: 8, con: 7 },
        rebuttalStrength: { pro: 7, con: 6 },
        factuality: { pro: 8, con: 7 },
      },
      positionBiasDetected: false,
    }
    
    // Store evaluation
    const [evaluation] = await db.insert(debateEvaluations).values({
      debateId,
      judgeModel: placeholderEvaluation.judgeModel,
      evaluationOrder: placeholderEvaluation.evaluationOrder,
      winner: placeholderEvaluation.winner,
      proScore: placeholderEvaluation.proScore,
      conScore: placeholderEvaluation.conScore,
      reasoning: placeholderEvaluation.reasoning,
      rubricScores: placeholderEvaluation.rubricScores,
      positionBiasDetected: placeholderEvaluation.positionBiasDetected,
    }).returning()
    
    // Update debate with AI judge winner
    await db.update(debates)
      .set({ 
        aiJudgeWinner: placeholderEvaluation.winner,
        winner: placeholderEvaluation.winner, // Overall winner
      })
      .where(eq(debates.id, debateId))
    
    // Distribute payouts to bettors
    await distributePayout(debateId, placeholderEvaluation.winner)
    
    // Update model statistics
    if (placeholderEvaluation.winner === 'pro') {
      await db.update(models)
        .set({ 
          wins: sql`${models.wins} + 1`,
          totalDebates: sql`${models.totalDebates} + 1`,
        })
        .where(eq(models.id, debate.proModelId))
      
      await db.update(models)
        .set({ 
          losses: sql`${models.losses} + 1`,
          totalDebates: sql`${models.totalDebates} + 1`,
        })
        .where(eq(models.id, debate.conModelId))
    } else if (placeholderEvaluation.winner === 'con') {
      await db.update(models)
        .set({ 
          losses: sql`${models.losses} + 1`,
          totalDebates: sql`${models.totalDebates} + 1`,
        })
        .where(eq(models.id, debate.proModelId))
      
      await db.update(models)
        .set({ 
          wins: sql`${models.wins} + 1`,
          totalDebates: sql`${models.totalDebates} + 1`,
        })
        .where(eq(models.id, debate.conModelId))
    } else {
      // Tie
      await db.update(models)
        .set({ 
          ties: sql`${models.ties} + 1`,
          totalDebates: sql`${models.totalDebates} + 1`,
        })
        .where(eq(models.id, debate.proModelId))
      
      await db.update(models)
        .set({ 
          ties: sql`${models.ties} + 1`,
          totalDebates: sql`${models.totalDebates} + 1`,
        })
        .where(eq(models.id, debate.conModelId))
    }
    
    return NextResponse.json({
      success: true,
      evaluation: {
        id: evaluation.id,
        winner: evaluation.winner,
        proScore: evaluation.proScore,
        conScore: evaluation.conScore,
        reasoning: evaluation.reasoning,
        rubricScores: evaluation.rubricScores,
        positionBiasDetected: evaluation.positionBiasDetected,
        judgeModel: evaluation.judgeModel,
      },
      message: 'Debate evaluated successfully',
    }, { status: 201 })
    
  } catch (error) {
    console.error('Error judging debate:', error)
    
    if (error instanceof Error) {
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

