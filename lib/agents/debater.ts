/**
 * Debater Agent
 * 
 * Generates debate turns using Reflect-Critique-Refine (RCR) methodology
 * with persona injection and streaming support.
 */

import { getLLMClient } from '@/lib/llm/client'
import { db } from '@/lib/db/client'
import { models, personas } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import type { DebateState } from './graph'
import type { DebateSide } from '@/types'
import type { LLMConfig } from '@/types/llm'

export interface DebaterTurn {
  reflection: string
  critique: string
  speech: string
  wordCount: number
  tokensUsed?: number
  latencyMs?: number
}

/**
 * Pro Debater Node
 */
export async function proDebaterNode(state: DebateState): Promise<Partial<DebateState>> {
  console.log(`[Pro Debater] Generating turn for round ${state.currentRound}`)
  
  const turn = await generateDebaterTurn(state, 'pro')
  
  return {
    currentTurnDraft: turn,
    proScratchpad: `Round ${state.currentRound} - Pro turn generated at ${new Date().toISOString()}`,
    metadata: {
      ...state.metadata,
      lastProTurnGenerated: new Date().toISOString(),
    },
  }
}

/**
 * Con Debater Node
 */
export async function conDebaterNode(state: DebateState): Promise<Partial<DebateState>> {
  console.log(`[Con Debater] Generating turn for round ${state.currentRound}`)
  
  const turn = await generateDebaterTurn(state, 'con')
  
  return {
    currentTurnDraft: turn,
    conScratchpad: `Round ${state.currentRound} - Con turn generated at ${new Date().toISOString()}`,
    currentSpeaker: 'con', // Update current speaker
    metadata: {
      ...state.metadata,
      lastConTurnGenerated: new Date().toISOString(),
    },
  }
}

/**
 * Generate a debate turn using RCR methodology
 */
async function generateDebaterTurn(
  state: DebateState,
  side: DebateSide
): Promise<DebaterTurn> {
  const startTime = Date.now()
  
  // Get model and persona information
  const modelId = side === 'pro' ? state.proModelId : state.conModelId
  const personaId = side === 'pro' ? state.proPersonaId : state.conPersonaId
  
  const model = await db.query.models.findFirst({
    where: eq(models.id, modelId),
  })
  
  if (!model) {
    throw new Error(`Model ${modelId} not found`)
  }
  
  let persona = null
  if (personaId) {
    persona = await db.query.personas.findFirst({
      where: eq(personas.id, personaId),
    })
  }
  
  // Get opponent's last turn for context
  const opponentLastTurn = getOpponentLastTurn(state, side)
  
  // Generate RCR prompt
  const prompt = generateRCRPrompt(state, side, persona, opponentLastTurn)
  
  // Call LLM
  const llmClient = getLLMClient()
  
  const config: LLMConfig = {
    provider: model.provider as any,
    model: model.modelId,
    temperature: 0.7,
    maxTokens: 2000,
  }
  
  try {
    const response = await llmClient.generate(
      [{ role: 'user', content: prompt }],
      config
    )
    
    // Parse RCR phases from response
    const parsed = parseRCRResponse(response.content)
    
    // Count words in speech
    const wordCount = countWords(parsed.speech)
    
    const latencyMs = Date.now() - startTime
    
    return {
      reflection: parsed.reflection,
      critique: parsed.critique,
      speech: parsed.speech,
      wordCount,
      tokensUsed: response.tokensUsed.total,
      latencyMs,
    }
  } catch (error) {
    console.error(`[Debater] Error generating turn for ${side}:`, error)
    throw error
  }
}

/**
 * Generate RCR prompt for debater
 */
function generateRCRPrompt(
  state: DebateState,
  side: DebateSide,
  persona: any | null,
  opponentLastTurn: any | null
): string {
  const position = side === 'pro' ? 'FOR' : 'AGAINST'
  const roundType = getRoundType(state.currentRound, state.totalRounds)
  
  let systemPrompt = ''
  
  // Add persona if configured
  if (persona) {
    systemPrompt = persona.systemPrompt + '\n\n'
  }
  
  systemPrompt += `You are a skilled debater arguing ${position} the motion: "${state.topicMotion}"`
  
  let userPrompt = `
DEBATE CONTEXT:
- Motion: "${state.topicMotion}"
- Your Position: ${position}
- Round: ${state.currentRound} of ${state.totalRounds} (${roundType})
- Word Limit: ${state.wordLimitPerTurn} words

`
  
  // Add debate history
  if (state.transcript.length > 0) {
    userPrompt += `DEBATE HISTORY:\n`
    state.transcript.forEach(turn => {
      const speaker = turn.side === 'pro' ? 'PRO' : 'CON'
      userPrompt += `\n[Round ${turn.roundNumber} - ${speaker}]\n${turn.speech}\n`
    })
    userPrompt += '\n'
  }
  
  // Add opponent's last turn for rebuttal
  if (opponentLastTurn) {
    userPrompt += `OPPONENT'S LAST ARGUMENT:\n${opponentLastTurn.speech}\n\n`
  }
  
  userPrompt += `
TASK: Generate your debate turn using the Reflect-Critique-Refine (RCR) methodology.

PHASE 1 - REFLECTION:
Analyze the current state of the debate. If your opponent has spoken, analyze their argument.
Output your analysis in <reflection> tags.
- What is the central thesis (yours or your opponent's)?
- What evidence has been provided?
- What is the strongest point made so far?
- What is the current state of the debate?

PHASE 2 - CRITIQUE:
Identify weaknesses in your opponent's argument (if applicable) or anticipate counterarguments.
Output your critique in <critique> tags.
- Logical fallacies (strawman, false dichotomy, ad hominem, etc.)
- Factual inaccuracies or unsupported claims
- Internal contradictions
- Weak evidence or reasoning
- Anticipated counterarguments to your position

PHASE 3 - REFINEMENT:
Construct your ${roundType.toLowerCase()} argument.
Output your speech in <speech> tags.
- ${state.currentRound === 1 ? 'Present your opening argument with clear thesis and supporting evidence' : 'Address your opponent\'s strongest points directly'}
- Provide counter-evidence and reasoning
- ${state.currentRound === state.totalRounds ? 'Summarize your key points and make a compelling closing statement' : 'Build your case systematically'}
- Stay within ${state.wordLimitPerTurn} words
${persona ? `- Maintain your persona's voice and style: ${persona.description}` : ''}
- Focus on logical argumentation, not personal attacks
- Be persuasive and compelling

CONSTRAINTS:
- Your speech MUST be between 200 and ${state.wordLimitPerTurn} words
- Use clear, structured arguments
- Cite specific evidence when possible
- Maintain a professional, respectful tone
${persona ? `- Stay in character as ${persona.name}` : ''}

FORMAT YOUR RESPONSE EXACTLY AS:
<reflection>
[Your reflection here]
</reflection>

<critique>
[Your critique here]
</critique>

<speech>
[Your speech here - ${state.wordLimitPerTurn} words maximum]
</speech>
`
  
  return systemPrompt + '\n\n' + userPrompt
}

/**
 * Parse RCR response from LLM
 */
function parseRCRResponse(text: string): {
  reflection: string
  critique: string
  speech: string
} {
  // Extract content between XML-style tags
  const reflectionMatch = text.match(/<reflection>([\s\S]*?)<\/reflection>/i)
  const critiqueMatch = text.match(/<critique>([\s\S]*?)<\/critique>/i)
  const speechMatch = text.match(/<speech>([\s\S]*?)<\/speech>/i)
  
  if (!speechMatch) {
    // Fallback: if no tags found, treat entire response as speech
    console.warn('[Debater] No <speech> tags found, using entire response as speech')
    return {
      reflection: reflectionMatch ? reflectionMatch[1].trim() : '',
      critique: critiqueMatch ? critiqueMatch[1].trim() : '',
      speech: text.trim(),
    }
  }
  
  return {
    reflection: reflectionMatch ? reflectionMatch[1].trim() : '',
    critique: critiqueMatch ? critiqueMatch[1].trim() : '',
    speech: speechMatch[1].trim(),
  }
}

/**
 * Get opponent's last turn
 */
function getOpponentLastTurn(state: DebateState, side: DebateSide): any | null {
  const opponentSide = side === 'pro' ? 'con' : 'pro'
  
  // Find the most recent turn from opponent
  const opponentTurns = state.transcript.filter(turn => turn.side === opponentSide)
  
  if (opponentTurns.length === 0) {
    return null
  }
  
  return opponentTurns[opponentTurns.length - 1]
}

/**
 * Get round type label
 */
function getRoundType(currentRound: number, totalRounds: number): string {
  if (totalRounds === 1) {
    return 'Single Round Debate'
  }
  
  if (currentRound === 1) {
    return 'Opening Statement'
  }
  
  if (currentRound === totalRounds) {
    return 'Closing Argument'
  }
  
  return 'Rebuttal'
}

/**
 * Count words in text
 */
function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter(word => word.length > 0)
    .length
}

/**
 * Stream a debate turn (for real-time UI updates)
 * 
 * This is a placeholder for future streaming implementation.
 * Will use Server-Sent Events (SSE) to stream RCR phases to the frontend.
 */
export async function* streamDebaterTurn(
  state: DebateState,
  side: DebateSide
): AsyncGenerator<{ phase: 'reflection' | 'critique' | 'speech'; content: string }> {
  // TODO: Implement streaming with SSE
  // For now, generate the full turn and yield it in chunks
  
  const turn = await generateDebaterTurn(state, side)
  
  yield { phase: 'reflection', content: turn.reflection }
  yield { phase: 'critique', content: turn.critique }
  yield { phase: 'speech', content: turn.speech }
}

