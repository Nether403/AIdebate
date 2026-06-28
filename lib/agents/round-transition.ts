/**
 * Round Transition Node
 * 
 * Manages round completion, turn persistence, and debate termination logic.
 */

import { db } from '@/lib/db/client'
import { debateTurns, factChecks, debates } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import type { DebateState } from './graph'
import type { DebateSide } from '@/types'
import { v4 as uuidv4 } from 'uuid'

type PersistedTurn = typeof debateTurns.$inferSelect

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
  
  // The Round Transition node is called AFTER each fact-checker validation.
  // Persist the accepted turn and append it to the shared transcript so that
  // subsequent debater nodes (the opponent this round, and both sides in later
  // rounds) receive prior turns as rebuttal context.
  let transcriptUpdate: DebateState['transcript'] = []
  if (state.currentTurnDraft && !state.shouldRejectTurn) {
    const persisted = await persistTurn(state)
    transcriptUpdate = [
      {
        id: persisted.id,
        roundNumber: persisted.roundNumber,
        side: persisted.side as DebateSide,
        modelId: persisted.modelId,
        reflection: persisted.reflection,
        critique: persisted.critique,
        speech: persisted.speech,
        wordCount: persisted.wordCount,
        factChecksPassed: persisted.factChecksPassed,
        factChecksFailed: persisted.factChecksFailed,
        wasRejected: persisted.wasRejected,
        retryCount: persisted.retryCount,
      },
    ]
    console.log(`[Round Transition] Persisted ${state.currentSpeaker} turn for round ${state.currentRound}`)
  }
  
  // Check if round is complete (both Pro and Con have spoken in this round)
  const turnsInCurrentRound = await db.query.debateTurns.findMany({
    where: eq(debateTurns.debateId, state.debateId),
  })
  
  const currentRoundTurns = turnsInCurrentRound.filter(t => t.roundNumber === state.currentRound)
  const proTurns = currentRoundTurns.filter(t => t.side === 'pro')
  const conTurns = currentRoundTurns.filter(t => t.side === 'con')
  
  console.log(`[Round Transition] Current round has ${proTurns.length} pro turns and ${conTurns.length} con turns`)
  
  const isRoundComplete = proTurns.length > 0 && conTurns.length > 0
  
  if (!isRoundComplete) {
    console.log(`[Round Transition] Round ${state.currentRound} not complete, continuing`)
    return {
      transcript: transcriptUpdate,
      metadata: {
        ...state.metadata,
        roundStatus: 'in_progress',
      },
    }
  }
  
  console.log(`[Round Transition] Round ${state.currentRound} complete!`)
  
  // Check if this was the last round
  const isLastRound = state.currentRound >= state.totalRounds
  
  if (isLastRound) {
    console.log(`[Round Transition] Debate complete after ${state.totalRounds} rounds`)
    
    // Leave the debate in running state until the judge completes. A complete
    // transcript without a valid judge result is not a completed research artifact.
    
    return {
      isDebateComplete: true,
      transcript: transcriptUpdate,
      metadata: {
        ...state.metadata,
        debateCompletedAt: new Date().toISOString(),
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
    transcript: transcriptUpdate,
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
async function persistTurn(state: DebateState): Promise<PersistedTurn> {
  if (!state.currentTurnDraft) {
    throw new Error('Cannot persist turn without a current turn draft')
  }
  
  const turn = state.currentTurnDraft
  const side = state.currentSpeaker
  const modelId = side === 'pro' ? state.proModelId : state.conModelId
  
  console.log(`[Round Transition] Persisting ${side} turn for round ${state.currentRound}`)
  
  try {
    const existingTurn = await db.query.debateTurns.findFirst({
      where: and(
        eq(debateTurns.debateId, state.debateId),
        eq(debateTurns.roundNumber, state.currentRound),
        eq(debateTurns.side, side),
        eq(debateTurns.wasRejected, false)
      ),
    })

    if (existingTurn) {
      console.warn(`[Round Transition] Accepted ${side} turn already exists for debate ${state.debateId} round ${state.currentRound}; skipping duplicate persistence`)
      return existingTurn
    }

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
      tokensUsed: turn.tokensUsed || null,
      latencyMs: turn.latencyMs || null,
      provider: turn.provider || null,
      actualModelId: turn.actualModelId || null,
      costEstimate: turn.costEstimate || null,
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
          sources: result.sources || [],
          reasoning: result.reasoning,
        }))
      )
    }
    
    console.log(`[Round Transition] Turn persisted with ID: ${insertedTurn.id}`)
    return insertedTurn
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
      tokensUsed: turn.tokensUsed || null,
      latencyMs: turn.latencyMs || null,
      provider: turn.provider || null,
      actualModelId: turn.actualModelId || null,
      costEstimate: turn.costEstimate || null,
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

