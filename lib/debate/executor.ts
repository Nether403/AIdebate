/**
 * Debate Executor
 * 
 * Bridges the gap between debate creation and LangGraph execution.
 * Compiles and runs the debate graph, saving turns to the database.
 */

import { compileDebateGraph, type DebateState } from '@/lib/agents/graph'
import { db } from '@/lib/db/client'
import { debateEvaluations, debates } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { JudgeParseError, type ConsensusVerdict, type JudgeVerdict } from '@/lib/agents/judge'

/**
 * Execute a debate using LangGraph
 */
export async function executeDebate(debateId: string): Promise<void> {
  try {
    console.log(`[Executor] Starting debate execution for ${debateId}`)
    
    // Fetch debate details
    console.log(`[Executor] Fetching debate details from database...`)
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
    
    console.log(`[Executor] Debate loaded: ${debate.topic.motion}`)
    console.log(`[Executor] Pro: ${debate.proModel.name}, Con: ${debate.conModel.name}`)
    
    // Initialize debate state
    const initialState: Partial<DebateState> = {
      debateId: debate.id,
      topicMotion: debate.topic.motion,
      proModelId: debate.proModelId,
      conModelId: debate.conModelId,
      proPersonaId: debate.proPersonaId,
      conPersonaId: debate.conPersonaId,
      currentRound: debate.currentRound,
      totalRounds: debate.totalRounds,
      currentSpeaker: 'pro',
      wordLimitPerTurn: debate.wordLimitPerTurn,
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
      metadata: {},
    }
    
    // Create and compile the graph with checkpointer
    console.log(`[Executor] Compiling LangGraph...`)
    const app = compileDebateGraph()
    console.log(`[Executor] Graph compiled successfully`)
    
    // Execute the graph
    const config = {
      configurable: {
        thread_id: debateId,
      },
    }
    
    console.log(`[Executor] Starting graph execution...`)
    
    // Stream the execution and collect final state
    let eventCount = 0
    
    for await (const event of await app.stream(initialState, config)) {
      eventCount++
      const nodeNames = Object.keys(event)
      console.log(`[Executor] Event ${eventCount}: ${nodeNames.join(', ')}`)
      
    }
    
    console.log(`[Executor] Graph execution completed with ${eventCount} events`)
    
    // Turns and fact checks are persisted by roundTransitionNode as each accepted turn completes.
    // Do not reinsert finalState.transcript here, or retries/resumes can create duplicate turns.
    console.log(`Debate ${debateId} transcript generation completed`)
    
    // Run AI judge evaluation
    console.log(`[Executor] Starting AI judge evaluation...`)
    try {
      const { JudgeAgent } = await import('@/lib/agents/judge')
      const judgeProvider = (debate.judgeProvider || 'openai') as 'openai' | 'google' | 'anthropic' | 'xai' | 'openrouter'
      const judgeModel = debate.judgeModel || process.env.AZURE_OPENAI_API_DEPLOYMENT_NAME || 'gpt-4o-mini'
      const judge = new JudgeAgent({
        model: judgeModel,
        provider: judgeProvider,
        temperature: 0.3,
      })
      
      // Fetch completed debate with turns
      const completedDebate = await db.query.debates.findFirst({
        where: eq(debates.id, debateId),
        with: {
          turns: true,
          topic: true,
          proModel: true,
          conModel: true,
        },
      })
      
      if (completedDebate && completedDebate.turns && completedDebate.turns.length > 0) {
        // Transform debate data to match judge's expected format
        const toJudgeTurn = (turn: typeof completedDebate.turns[number], side: 'pro' | 'con') => ({
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

        const proTurns = completedDebate.turns
          .filter(t => t.side === 'pro')
          .map(t => toJudgeTurn(t, 'pro'))
        const conTurns = completedDebate.turns
          .filter(t => t.side === 'con')
          .map(t => toJudgeTurn(t, 'con'))

        const judgeDebate = {
          id: completedDebate.id,
          topic: completedDebate.topic?.motion || 'Unknown topic',
          pro_turns: proTurns,
          con_turns: conTurns,
          fact_check_summary: {
            pro_verified: completedDebate.turns
              .filter(t => t.side === 'pro')
              .reduce((sum, t) => sum + (t.factChecksPassed || 0), 0),
            pro_false: completedDebate.turns
              .filter(t => t.side === 'pro')
              .reduce((sum, t) => sum + (t.factChecksFailed || 0), 0),
            con_verified: completedDebate.turns
              .filter(t => t.side === 'con')
              .reduce((sum, t) => sum + (t.factChecksPassed || 0), 0),
            con_false: completedDebate.turns
              .filter(t => t.side === 'con')
              .reduce((sum, t) => sum + (t.factChecksFailed || 0), 0),
          },
        }
        
        // Evaluate with order swap to mitigate position bias
        const verdict = await judge.evaluateWithOrderSwap(judgeDebate)
        await persistConsensusVerdict(debateId, verdict, judgeProvider, judgeModel, debate.promptVersion)
        
        // Update debate with judge verdict only after valid parsed judge output is persisted.
        if (verdict && verdict.final_winner) {
          await db.update(debates)
            .set({
              status: 'completed',
              aiJudgeWinner: verdict.final_winner,
              winner: verdict.final_winner, // Set overall winner to judge verdict initially
              completedAt: new Date(),
            })
            .where(eq(debates.id, debateId))
          
          console.log(`[Executor] AI Judge verdict: ${verdict.final_winner}`)
        } else {
          await db.update(debates)
            .set({
              status: 'evaluation_failed',
              errorState: {
                stage: 'judge',
                message: 'AI judge returned no final winner',
              },
              completedAt: new Date(),
            })
            .where(eq(debates.id, debateId))
          console.log(`[Executor] AI Judge returned no final winner`)
        }
      }
    } catch (judgeError) {
      console.error(`[Executor] Error running AI judge:`, judgeError)
      const isParseError = judgeError instanceof JudgeParseError
      await db.insert(debateEvaluations).values({
        debateId,
        judgeProvider: debate.judgeProvider || 'unknown',
        judgeModel: debate.judgeModel || process.env.AZURE_OPENAI_API_DEPLOYMENT_NAME || 'unknown',
        evaluationOrder: isParseError ? judgeError.evaluationOrder : 'consensus',
        winner: null,
        proScore: null,
        conScore: null,
        reasoning: judgeError instanceof Error ? judgeError.message : String(judgeError),
        rubricScores: {},
        positionBiasDetected: false,
        parseStatus: isParseError ? 'parse_failed' : 'error',
        rawResponse: isParseError ? judgeError.rawResponse : null,
        errorMessage: judgeError instanceof Error ? judgeError.message : String(judgeError),
        promptVersion: debate.promptVersion,
        schemaVersion: 'judge-v1',
        consensus: null,
        tiebreakerUsed: null,
      })

      await db.update(debates)
        .set({
          status: 'evaluation_failed',
          errorState: {
            stage: 'judge',
            parseStatus: isParseError ? 'parse_failed' : 'error',
            message: judgeError instanceof Error ? judgeError.message : String(judgeError),
          },
          completedAt: new Date(),
        })
        .where(eq(debates.id, debateId))
    }
    
  } catch (error) {
    console.error(`[Executor] ERROR executing debate ${debateId}:`)
    console.error(`[Executor] Error type: ${error?.constructor?.name}`)
    console.error(`[Executor] Error message: ${error instanceof Error ? error.message : String(error)}`)
    if (error instanceof Error && error.stack) {
      console.error(`[Executor] Stack trace:`, error.stack)
    }
    
    // Mark debate as failed
    await db.update(debates)
      .set({
        status: 'failed',
        errorState: {
          stage: 'execution',
          message: error instanceof Error ? error.message : String(error),
          name: error?.constructor?.name,
        },
        completedAt: new Date(),
      })
      .where(eq(debates.id, debateId))
    
    throw error
  }
}

function averageRubricScore(verdict: JudgeVerdict): number {
  const scores = verdict.scores
  return (scores.logical_coherence + scores.rebuttal_strength + scores.factuality) / 3
}

export async function persistJudgeVerdict(
  debateId: string,
  verdict: JudgeVerdict,
  judgeProvider: string,
  promptVersion: string | null,
  evaluationOrderOverride?: string
): Promise<void> {
  await db.insert(debateEvaluations).values({
    debateId,
    judgeProvider,
    judgeModel: verdict.metadata.judge_model,
    evaluationOrder: evaluationOrderOverride || verdict.metadata.evaluation_order,
    winner: verdict.winner,
    proScore: verdict.winner === 'pro' ? averageRubricScore(verdict) : null,
    conScore: verdict.winner === 'con' ? averageRubricScore(verdict) : null,
    reasoning: verdict.justification,
    rubricScores: {
      ...verdict.scores,
      flagged_fallacies: verdict.flagged_fallacies,
    },
    positionBiasDetected: false,
    parseStatus: 'parsed',
    rawResponse: null,
    errorMessage: null,
    promptVersion,
    schemaVersion: 'judge-v1',
    consensus: null,
    tiebreakerUsed: null,
  })
}

export async function persistConsensusVerdict(
  debateId: string,
  verdict: ConsensusVerdict,
  judgeProvider: string,
  judgeModel: string,
  promptVersion: string | null
): Promise<void> {
  await persistJudgeVerdict(debateId, verdict.pro_first_verdict, judgeProvider, promptVersion)
  await persistJudgeVerdict(debateId, verdict.con_first_verdict, judgeProvider, promptVersion)

  if (verdict.tiebreaker_verdict) {
    await persistJudgeVerdict(debateId, verdict.tiebreaker_verdict, judgeProvider, promptVersion, 'tiebreaker')
  }

  await db.insert(debateEvaluations).values({
    debateId,
    judgeProvider,
    judgeModel,
    evaluationOrder: 'consensus',
    winner: verdict.final_winner,
    proScore: null,
    conScore: null,
    reasoning: verdict.consensus
      ? `Consensus winner from pro-first and con-first evaluations: ${verdict.final_winner}`
      : `No dual-order consensus. ${verdict.tiebreaker_used ? 'Tiebreaker used.' : 'No tiebreaker used.'} Final winner: ${verdict.final_winner}`,
    rubricScores: {},
    positionBiasDetected: !verdict.consensus,
    parseStatus: 'parsed',
    rawResponse: null,
    errorMessage: null,
    promptVersion,
    schemaVersion: 'judge-v1',
    consensus: verdict.consensus,
    tiebreakerUsed: verdict.tiebreaker_used,
  })
}
