/**
 * Agents Module - LangGraph Multi-Agent Debate Orchestration
 * 
 * This module exports the debate graph and helper functions for running debates.
 */

export { createDebateGraph, DebateStateAnnotation, type DebateState } from './graph'
export { moderatorNode, validateDebateConfig, enforceWordLimit } from './moderator'
export { proDebaterNode, conDebaterNode, streamDebaterTurn, type DebaterTurn } from './debater'
export { factCheckerNode, calculateFactualityScore, type Claim, type FactCheckResult } from './fact-checker'
export { roundTransitionNode, persistRejectedTurn, calculateDebateStats } from './round-transition'

import { createDebateGraph, type DebateState } from './graph'
import { validateDebateConfig } from './moderator'
import type { DebateConfig } from '@/lib/debate/config'
import { db } from '@/lib/db/client'
import { debates, topics, models, personas } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

/**
 * Initialize debate state from configuration
 */
export async function initializeDebateState(
  debateId: string,
  config: DebateConfig
): Promise<DebateState> {
  // Fetch debate details from database
  const debate = await db.query.debates.findFirst({
    where: eq(debates.id, debateId),
    with: {
      topic: true,
      proModel: true,
      conModel: true,
      proPersona: true,
      conPersona: true,
    },
  })
  
  if (!debate) {
    throw new Error(`Debate ${debateId} not found`)
  }
  
  // Build initial state
  const initialState: DebateState = {
    debateId: debate.id,
    topicMotion: debate.topic.motion,
    proModelId: debate.proModelId,
    conModelId: debate.conModelId,
    proPersonaId: debate.proPersonaId,
    conPersonaId: debate.conPersonaId,
    currentRound: 1,
    totalRounds: debate.totalRounds,
    currentSpeaker: 'pro',
    wordLimitPerTurn: config.wordLimitPerTurn,
    factCheckMode: debate.factCheckMode as any,
    transcript: [],
    factCheckLogs: [],
    proScratchpad: '',
    conScratchpad: '',
    currentTurnDraft: null,
    currentFactCheckResults: [],
    shouldRejectTurn: false,
    retryCount: 0,
    isDebateComplete: false,
    metadata: {
      debateStarted: new Date().toISOString(),
      proModelName: debate.proModel.name,
      conModelName: debate.conModel.name,
      proPersonaName: debate.proPersona?.name,
      conPersonaName: debate.conPersona?.name,
    },
  }
  
  // Validate configuration
  const errors = validateDebateConfig(initialState)
  if (errors.length > 0) {
    throw new Error(`Invalid debate configuration: ${errors.join(', ')}`)
  }
  
  return initialState
}

/**
 * Run a complete debate using LangGraph
 */
export async function runDebate(
  debateId: string,
  config: DebateConfig
): Promise<DebateState> {
  console.log(`[Debate Orchestrator] Starting debate ${debateId}`)
  
  // Initialize state
  const initialState = await initializeDebateState(debateId, config)
  
  // Create and compile the graph
  const graph = createDebateGraph()
  
  // Run the graph
  const result = await graph.invoke(initialState)
  
  console.log(`[Debate Orchestrator] Debate ${debateId} completed`)
  
  return result as DebateState
}

/**
 * Stream a debate execution (for real-time UI updates)
 * 
 * This returns an async generator that yields state updates as the debate progresses.
 * 
 * Note: Streaming implementation is a placeholder for future enhancement.
 * Currently returns the final state only.
 */
export async function* streamDebate(
  debateId: string,
  config: DebateConfig
): AsyncGenerator<DebateState> {
  console.log(`[Debate Orchestrator] Starting streamed debate ${debateId}`)
  
  // Initialize state
  const initialState = await initializeDebateState(debateId, config)
  
  // Create and compile the graph
  const graph = createDebateGraph()
  
  // For now, run the full debate and yield the final state
  // TODO: Implement true streaming with graph.stream() when LangGraph types are fixed
  const finalState = await graph.invoke(initialState)
  yield finalState as DebateState
  
  console.log(`[Debate Orchestrator] Streamed debate ${debateId} completed`)
}

