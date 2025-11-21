/**
 * Round Transition Node
 * 
 * Manages round completion, turn persistence, and debate termination logic.
 */

import { db } from '@/lib/db/client'
import { debateTurns, factChecks, debates } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import type { DebateState } from './graph'
import { v4 as uuidv4 } from 'uuid'

/**
 * Round Transition Node
 * 
 * Responsibilities:
 * - Check if both Pro and Con have spoken in current round
 * - Persist completed turns to database
 * - Persist fact-check results to database
 * - Advance to next round or end debate
 * - Update debate status in database
 */
export async function roundTransitionNode(state: DebateState): Promise<Partial<DebateState>> {
  console.log(`[Round Transition] Processing round ${state.currentRound}`)
  
  // Check if current turn draft exists and should be persisted
  if (state.currentTurnDraft && !state.shouldRejectTurn) {
    await persistTurn(state)
  }
  
  // Check if round is complete (both Pro and Con have spoken)
  const isRoundComplete = checkRoundComplete(state)
  
  if (!isRoundComplete) {
    console.log(`[Round Transition] Round ${state.currentRound} not complete, continuing`)
    return {
      metadata: {
        ...state.metadata,
        roundStatus: 'in_progress',
      },
    }
  }
  
  console.log(`[Round Transition] Round ${state.currentRound} complete`)
  
  // Check if this was the last round
  const isLastRound = state.currentRound >= state.totalRounds
  
  if (isLastRound) {
    console.log(`[Round Transition] Debate complete after ${state.totalRounds} rounds`)
    
    // Update debate status to completed
    await db.update(debates)
      .set({
        status: 'completed',
        completedAt: new Date(),
      })
      .where(eq(debates.id, state.debateId))
    
    return {
      isDebateComplete: true,
      metadata: {
        ...state.metadata,
        debateCompletedAt: new Date().toISOString(),
        totalTurns: state.transcript.length,
      },
    }
  }
  
  // Advance to next round
  const nextRound = state.currentRound + 1
  console.log(`[Round Transition] Advancing to round ${nextRound}`)
  
  // Update debate current round in database
  await db.update(debates)
    .set({
      currentRound: nextRound,
    })
    .where(eq(debates.id, state.debateId))
  
  return {
    currentRound: nextRound,
    isDebateComplete: false,
    metadata: {
      ...state.metadata,
      lastRoundCompleted: state.currentRound,
      nextRoundStarting: nextRound,
      transitionTime: new Date().toISOString(),
    },
  }
}

/**
 * Check if current round is complete
 * 
 * A round is complete when both Pro and Con have spoken
 */
function checkRoundComplete(state: DebateState): boolean {
  // Count turns in current round
  const currentRoundTurns = state.transcript.filter(
    turn => turn.roundNumber === state.currentRound
  )
  
  const proTurns = currentRoundTurns.filter(turn => turn.side === 'pro')
  const conTurns = currentRoundTurns.filter(turn => turn.side === 'con')
  
  // Round is complete if both sides have spoken
  return proTurns.length > 0 && conTurns.length > 0
}

/**
 * Persist current turn to database
 */
async function persistTurn(state: DebateState): Promise<void> {
  if (!state.currentTurnDraft) {
    return
  }
  
  const turn = state.currentTurnDraft
  const side = state.currentSpeaker
  const modelId = side === 'pro' ? state.proModelId : state.conModelId
  
  console.log(`[Round Transition] Persisting ${side} turn for round ${state.currentRound}`)
  
  try {
    // Calculate fact-check stats
    const factChecksPassed = state.currentFactCheckResults.filter(
      r => r.verdict === 'true'
    ).length
    
    const factChecksFailed = state.currentFactCheckResults.filter(
      r => r.verdict === 'false'
    ).length
    
    // Insert turn into database
    const [insertedTurn] = await db.insert(debateTurns).values({
      id: uuidv4(),
      debateId: state.debateId,
      roundNumber: state.currentRound,
      side,
      modelId,
      reflection: turn.reflection || null,
      critique: turn.critique || null,
      speech: turn.speech,
      wordCount: turn.wordCount,
      factChecksPassed,
      factChecksFailed,
      wasRejected: false,
      retryCount: state.retryCount,
      tokensUsed: null, // Will be updated if available
      latencyMs: null, // Will be updated if available
    }).returning()
    
    // Insert fact-check results
    if (state.currentFactCheckResults.length > 0) {
      await db.insert(factChecks).values(
        state.currentFactCheckResults.map(result => ({
          id: uuidv4(),
          debateTurnId: insertedTurn.id,
          claim: result.claim,
          verdict: result.verdict,
          confidence: result.confidence,
          sources: [], // Sources would be included if available
          reasoning: result.reasoning,
        }))
      )
    }
    
    console.log(`[Round Transition] Turn persisted with ID: ${insertedTurn.id}`)
  } catch (error) {
    console.error('[Round Transition] Error persisting turn:', error)
    throw error
  }
}

/**
 * Persist rejected turn to database (for analytics)
 */
export async function persistRejectedTurn(state: DebateState): Promise<void> {
  if (!state.currentTurnDraft) {
    return
  }
  
  const turn = state.currentTurnDraft
  const side = state.currentSpeaker
  const modelId = side === 'pro' ? state.proModelId : state.conModelId
  
  console.log(`[Round Transition] Persisting rejected ${side} turn`)
  
  try {
    const factChecksFailed = state.currentFactCheckResults.filter(
      r => r.verdict === 'false'
    ).length
    
    // Insert rejected turn (for analytics and debugging)
    await db.insert(debateTurns).values({
      id: uuidv4(),
      debateId: state.debateId,
      roundNumber: state.currentRound,
      side,
      modelId,
      reflection: turn.reflection || null,
      critique: turn.critique || null,
      speech: turn.speech,
      wordCount: turn.wordCount,
      factChecksPassed: 0,
      factChecksFailed,
      wasRejected: true,
      retryCount: state.retryCount,
      tokensUsed: null,
      latencyMs: null,
    })
  } catch (error) {
    console.error('[Round Transition] Error persisting rejected turn:', error)
  }
}

/**
 * Calculate debate statistics
 */
export function calculateDebateStats(state: DebateState): {
  totalTurns: number
  proTurns: number
  conTurns: number
  totalWords: number
  avgWordsPerTurn: number
  totalFactChecks: number
  factChecksPassed: number
  factChecksFailed: number
} {
  const totalTurns = state.transcript.length
  const proTurns = state.transcript.filter(t => t.side === 'pro').length
  const conTurns = state.transcript.filter(t => t.side === 'con').length
  
  const totalWords = state.transcript.reduce((sum, t) => sum + t.wordCount, 0)
  const avgWordsPerTurn = totalTurns > 0 ? totalWords / totalTurns : 0
  
  const totalFactChecks = state.transcript.reduce(
    (sum, t) => sum + t.factChecksPassed + t.factChecksFailed,
    0
  )
  
  const factChecksPassed = state.transcript.reduce(
    (sum, t) => sum + t.factChecksPassed,
    0
  )
  
  const factChecksFailed = state.transcript.reduce(
    (sum, t) => sum + t.factChecksFailed,
    0
  )
  
  return {
    totalTurns,
    proTurns,
    conTurns,
    totalWords,
    avgWordsPerTurn,
    totalFactChecks,
    factChecksPassed,
    factChecksFailed,
  }
}

