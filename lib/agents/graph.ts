/**
 * LangGraph Multi-Agent Debate Orchestration
 * 
 * This module defines the debate graph structure using LangGraph for stateful,
 * cyclic multi-agent orchestration with conditional routing and checkpointing.
 */

import { StateGraph, Annotation, END } from '@langchain/langgraph'
import type { DebateSide, FactCheckMode } from '@/types'
import { moderatorNode } from './moderator'
import { proDebaterNode, conDebaterNode } from './debater'
import { factCheckerNode } from './fact-checker'
import { roundTransitionNode } from './round-transition'

/**
 * Shared Debate State
 * 
 * This state is shared across all nodes in the debate graph and persisted
 * to the database for checkpoint recovery.
 */
export const DebateStateAnnotation = Annotation.Root({
  // Core debate identifiers
  debateId: Annotation<string>(),
  topicMotion: Annotation<string>(),
  
  // Model and persona configuration
  proModelId: Annotation<string>(),
  conModelId: Annotation<string>(),
  proPersonaId: Annotation<string | null>(),
  conPersonaId: Annotation<string | null>(),
  
  // Debate progress tracking
  currentRound: Annotation<number>(),
  totalRounds: Annotation<number>(),
  currentSpeaker: Annotation<DebateSide>(),
  
  // Configuration
  wordLimitPerTurn: Annotation<number>(),
  factCheckMode: Annotation<FactCheckMode>(),
  
  // Transcript and history
  transcript: Annotation<Array<{
    id: string
    roundNumber: number
    side: DebateSide
    modelId: string
    reflection: string | null
    critique: string | null
    speech: string
    wordCount: number
    factChecksPassed: number
    factChecksFailed: number
    wasRejected: boolean
    retryCount: number
  }>>({
    reducer: (current, update) => [...current, ...update],
    default: () => [],
  }),
  
  // Fact-checking logs
  factCheckLogs: Annotation<Array<{
    turnId: string
    claim: string
    verdict: 'true' | 'false' | 'unverifiable'
    confidence: number
    reasoning: string
  }>>({
    reducer: (current, update) => [...current, ...update],
    default: () => [],
  }),
  
  // Scratchpads for agent reasoning
  proScratchpad: Annotation<string>({
    reducer: (_, update) => update,
    default: () => '',
  }),
  conScratchpad: Annotation<string>({
    reducer: (_, update) => update,
    default: () => '',
  }),
  
  // Current turn being processed
  currentTurnDraft: Annotation<{
    reflection: string
    critique: string
    speech: string
    wordCount: number
  } | null>({
    reducer: (_, update) => update,
    default: () => null,
  }),
  
  // Fact-check results for current turn
  currentFactCheckResults: Annotation<Array<{
    claim: string
    verdict: 'true' | 'false' | 'unverifiable'
    confidence: number
    reasoning: string
  }>>({
    reducer: (_, update) => update,
    default: () => [],
  }),
  
  // Control flags
  shouldRejectTurn: Annotation<boolean>({
    reducer: (_, update) => update,
    default: () => false,
  }),
  retryCount: Annotation<number>({
    reducer: (_, update) => update,
    default: () => 0,
  }),
  isDebateComplete: Annotation<boolean>({
    reducer: (_, update) => update,
    default: () => false,
  }),
  
  // Metadata
  metadata: Annotation<Record<string, any>>({
    reducer: (current, update) => ({ ...current, ...update }),
    default: () => ({}),
  }),
})

export type DebateState = typeof DebateStateAnnotation.State

/**
 * Create the debate graph
 * 
 * Graph structure:
 * 1. START → Moderator
 * 2. Moderator → Pro Debater
 * 3. Pro Debater → Fact Checker (Pro)
 * 4. Fact Checker → (if strict mode and false claim) Pro Debater (loop back)
 * 5. Fact Checker → Con Debater (if Pro's turn accepted)
 * 6. Con Debater → Fact Checker (Con)
 * 7. Fact Checker → (if strict mode and false claim) Con Debater (loop back)
 * 8. Fact Checker → Round Transition (if Con's turn accepted)
 * 9. Round Transition → Moderator (if more rounds) OR END (if complete)
 */
export function createDebateGraph() {
  const graph = new StateGraph(DebateStateAnnotation)
  
  // Add all nodes
  graph.addNode('moderator', moderatorNode)
  graph.addNode('proDebater', proDebaterNode)
  graph.addNode('conDebater', conDebaterNode)
  graph.addNode('factChecker', factCheckerNode)
  graph.addNode('roundTransition', roundTransitionNode)
  
  // Set entry point - start with moderator
  graph.addEdge('__start__' as any, 'moderator' as any)
  
  // Moderator → Pro Debater (always)
  graph.addEdge('moderator' as any, 'proDebater' as any)
  
  // Pro Debater → Fact Checker (always)
  graph.addEdge('proDebater' as any, 'factChecker' as any)
  
  // Fact Checker → Conditional routing after Pro's turn
  // If strict mode and false claim detected, loop back to Pro Debater
  // Otherwise, continue to Con Debater
  graph.addConditionalEdges(
    'factChecker' as any,
    (state: DebateState) => {
      // Check if we should loop back to Pro
      if (
        state.factCheckMode === 'strict' &&
        state.currentSpeaker === 'pro' &&
        state.shouldRejectTurn &&
        state.retryCount < 3
      ) {
        return 'loopBackPro'
      }
      
      // Check if we should loop back to Con
      if (
        state.factCheckMode === 'strict' &&
        state.currentSpeaker === 'con' &&
        state.shouldRejectTurn &&
        state.retryCount < 3
      ) {
        return 'loopBackCon'
      }
      
      // Check if we should continue to Con or transition
      if (state.currentSpeaker === 'pro') {
        return 'toCon'
      }
      
      return 'toTransition'
    },
    {
      loopBackPro: 'proDebater' as any,
      loopBackCon: 'conDebater' as any,
      toCon: 'conDebater' as any,
      toTransition: 'roundTransition' as any,
    }
  )
  
  // Con Debater → Fact Checker (always)
  graph.addEdge('conDebater' as any, 'factChecker' as any)
  
  // Round Transition → Conditional routing
  // If debate is complete, end. Otherwise, continue to next round (moderator)
  graph.addConditionalEdges(
    'roundTransition' as any,
    (state: DebateState) => {
      return state.isDebateComplete ? 'end' : 'continue'
    },
    {
      continue: 'moderator' as any,
      end: END,
    }
  )
  
  return graph.compile()
}



// Moderator node is imported from ./moderator.ts
// Debater nodes are imported from ./debater.ts
// Fact-checker node is imported from ./fact-checker.ts
// Round transition node is imported from ./round-transition.ts

