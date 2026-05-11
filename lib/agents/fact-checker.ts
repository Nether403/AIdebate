/**
 * Fact-Checker Agent
 * 
 * Validates factual claims using Tavily Search API and LLM reasoning.
 * Acts as a "hallucination firewall" to prevent false claims from winning debates.
 */

import { getLLMClient } from '@/lib/llm/client'
import type { DebateState } from './graph'
import type { FactCheckVerdict } from '@/types'
import type { LLMConfig } from '@/types/llm'
import { getModelConfig } from '@/lib/llm/model-config'
import { recordLLMProviderCall } from '@/lib/llm/telemetry'

export interface Claim {
  text: string
  type: 'statistical' | 'historical' | 'scientific' | 'definitional' | 'general'
  confidence: number
}

export interface FactCheckResult {
  claim: string
  verdict: FactCheckVerdict
  confidence: number
  sources: Array<{ url: string; snippet: string; title?: string }>
  reasoning: string
}

/**
 * Fact-Checker Node
 * 
 * Responsibilities:
 * - Extract verifiable claims from current turn
 * - Verify claims against Tavily Search API
 * - Determine if turn should be rejected (strict mode)
 * - Store fact-check results
 */
export async function factCheckerNode(state: DebateState): Promise<Partial<DebateState>> {
  console.log(`[Fact Checker] Checking facts for ${state.currentSpeaker} turn`)
  
  // Get current turn draft
  if (!state.currentTurnDraft) {
    console.warn('[Fact Checker] No current turn draft to check')
    return {
      currentFactCheckResults: [],
      shouldRejectTurn: false,
    }
  }
  
  // FIRST: Validate word count (always enforced, regardless of fact-check mode)
  const actualWordCount = countWords(state.currentTurnDraft.speech)
  const wordLimit = state.wordLimitPerTurn
  
  if (actualWordCount > wordLimit) {
    const retryCount = state.retryCount + 1
    
    console.warn(`[Fact Checker] Word limit exceeded: ${actualWordCount} words (max: ${wordLimit})`)
    console.warn(`[Fact Checker] Retry attempt ${retryCount}/3`)
    
    // After 3 retries, truncate instead of rejecting
    if (retryCount >= 3) {
      console.warn(`[Fact Checker] Max retries reached. Truncating speech to ${wordLimit} words.`)
      const truncated = truncateToWordLimit(state.currentTurnDraft.speech, wordLimit)
      
      return {
        currentTurnDraft: {
          ...state.currentTurnDraft,
          speech: truncated,
          wordCount: countWords(truncated),
        },
        currentFactCheckResults: [],
        shouldRejectTurn: false,
        retryCount: 0,
        metadata: {
          ...state.metadata,
          wordLimitEnforced: true,
          originalWordCount: actualWordCount,
        },
      }
    }
    
    // Reject and retry
    return {
      currentFactCheckResults: [],
      shouldRejectTurn: true,
      retryCount,
      metadata: {
        ...state.metadata,
        wordLimitViolation: true,
        actualWordCount,
        wordLimit,
      },
    }
  }
  
  // Skip fact-checking if mode is 'off'
  if (state.factCheckMode === 'off') {
    console.log('[Fact Checker] Fact-checking disabled, skipping')
    return {
      currentFactCheckResults: [],
      shouldRejectTurn: false,
    }
  }
  
  const speech = state.currentTurnDraft.speech
  
  try {
    // Extract claims from speech
    const claims = await extractClaims(speech, state.debateId)
    
    console.log(`[Fact Checker] Extracted ${claims.length} claims`)
    
    // Verify each claim
    const results: FactCheckResult[] = []
    let hasFalseClaim = false
    
    for (const claim of claims) {
      const result = await verifyClaim(claim, state.debateId)
      results.push(result)
      
      if (result.verdict === 'false') {
        hasFalseClaim = true
        console.warn(`[Fact Checker] False claim detected: "${claim.text}"`)
      }
    }
    
    // Determine if turn should be rejected (strict mode only)
    const shouldReject = state.factCheckMode === 'strict' && hasFalseClaim
    
    if (shouldReject) {
      console.log(`[Fact Checker] Rejecting turn due to false claim (strict mode)`)
    }
    
    return {
      currentFactCheckResults: results.map(r => ({
        claim: r.claim,
        verdict: r.verdict,
        confidence: r.confidence,
        sources: r.sources,
        reasoning: r.reasoning,
      })),
      shouldRejectTurn: shouldReject,
      retryCount: shouldReject ? state.retryCount + 1 : state.retryCount,
    }
  } catch (error) {
    console.error('[Fact Checker] Error during fact-checking:', error)
    
    // On error, don't reject the turn but log the issue
    return {
      currentFactCheckResults: [],
      shouldRejectTurn: false,
      metadata: {
        ...state.metadata,
        factCheckError: String(error),
      },
    }
  }
}

/**
 * Extract verifiable claims from text using LLM
 */
async function extractClaims(text: string, debateId?: string): Promise<Claim[]> {
  const llmClient = getLLMClient()
  const factCheckerConfig = getModelConfig('fact-checker')

  const config: LLMConfig = {
    provider: factCheckerConfig.provider,
    model: factCheckerConfig.model,
    temperature: 0.3,
    maxTokens: 1000,
  }
  
  const prompt = `
You are a fact-checking assistant. Extract all verifiable factual claims from the following text.

TEXT:
${text}

INSTRUCTIONS:
- Identify claims that can be verified against external sources
- Focus on statistical data, historical facts, scientific claims, and definitions
- Ignore opinions, predictions, and subjective statements
- Classify each claim by type: statistical, historical, scientific, definitional, or general

OUTPUT FORMAT (JSON array):
[
  {
    "text": "The exact claim text",
    "type": "statistical|historical|scientific|definitional|general",
    "confidence": 0.0-1.0
  }
]

If no verifiable claims are found, return an empty array: []
`
  
  try {
    const response = await llmClient.generate(
      [{ role: 'user', content: prompt }],
      config
    )

    await recordLLMProviderCall({
      debateId,
      stage: 'fact-check-claim-extraction',
      config,
      response,
      promptVersion: 'fact-check-v1',
    })
    
    // Parse JSON response
    const jsonMatch = response.content.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      console.warn('[Fact Checker] No JSON array found in claim extraction response')
      return []
    }
    
    const claims = JSON.parse(jsonMatch[0]) as Claim[]
    
    // Limit to top 5 claims to avoid excessive API calls
    return claims.slice(0, 5)
  } catch (error) {
    await recordLLMProviderCall({
      debateId,
      stage: 'fact-check-claim-extraction',
      config,
      promptVersion: 'fact-check-v1',
      status: 'error',
      error,
    })
    console.error('[Fact Checker] Error extracting claims:', error)
    return []
  }
}

/**
 * Verify a claim using Tavily Search API and LLM reasoning
 */
async function verifyClaim(claim: Claim, debateId?: string): Promise<FactCheckResult> {
  // Search for evidence using Tavily
  const searchResults = await searchTavily(claim.text)
  
  if (searchResults.length === 0) {
    return {
      claim: claim.text,
      verdict: 'unverifiable',
      confidence: 0.5,
      sources: [],
      reasoning: 'No relevant sources found to verify this claim.',
    }
  }
  
  // Use LLM to analyze search results and determine verdict
  const verdict = await analyzeEvidence(claim, searchResults, debateId)
  
  return verdict
}

/**
 * Search Tavily API for evidence
 */
async function searchTavily(query: string): Promise<Array<{ url: string; snippet: string; title?: string }>> {
  const tavilyApiKey = process.env.TAVILY_API_KEY
  
  if (!tavilyApiKey) {
    console.warn('[Fact Checker] TAVILY_API_KEY not configured, skipping search')
    return []
  }
  
  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: tavilyApiKey,
        query,
        search_depth: 'basic',
        max_results: 3,
        include_answer: false,
      }),
    })
    
    if (!response.ok) {
      console.error('[Fact Checker] Tavily API error:', response.statusText)
      return []
    }
    
    const data = await response.json()
    
    return (data.results || []).map((result: any) => ({
      url: result.url,
      snippet: result.content || result.snippet || '',
      title: result.title,
    }))
  } catch (error) {
    console.error('[Fact Checker] Error calling Tavily API:', error)
    return []
  }
}

/**
 * Analyze evidence and determine verdict using LLM
 * Uses the configured Azure OpenAI deployment for high precision
 */
async function analyzeEvidence(
  claim: Claim,
  searchResults: Array<{ url: string; snippet: string; title?: string }>,
  debateId?: string
): Promise<FactCheckResult> {
  const llmClient = getLLMClient()
  const factCheckerConfig = getModelConfig('fact-checker')
  
  const config: LLMConfig = {
    provider: factCheckerConfig.provider,
    model: factCheckerConfig.model,
    temperature: 0.2,
    maxTokens: 500,
  }
  
  const evidenceText = searchResults
    .map((result, i) => `[Source ${i + 1}] ${result.title || result.url}\n${result.snippet}`)
    .join('\n\n')
  
  const prompt = `
You are a fact-checking expert. Analyze the following claim against the provided evidence.

CLAIM:
"${claim.text}"

EVIDENCE FROM SEARCH:
${evidenceText}

TASK:
Determine if the claim is TRUE, FALSE, or UNVERIFIABLE based on the evidence.

GUIDELINES:
- TRUE: The evidence clearly supports the claim
- FALSE: The evidence clearly contradicts the claim
- UNVERIFIABLE: The evidence is insufficient or ambiguous

OUTPUT FORMAT (JSON):
{
  "verdict": "true|false|unverifiable",
  "confidence": 0.0-1.0,
  "reasoning": "Brief explanation of your verdict"
}
`
  
  try {
    const response = await llmClient.generate(
      [{ role: 'user', content: prompt }],
      config
    )

    await recordLLMProviderCall({
      debateId,
      stage: 'fact-check-evidence-analysis',
      config,
      response,
      promptVersion: 'fact-check-v1',
    })
    
    // Parse JSON response
    const jsonMatch = response.content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No JSON found in response')
    }
    
    const analysis = JSON.parse(jsonMatch[0])
    
    return {
      claim: claim.text,
      verdict: analysis.verdict as FactCheckVerdict,
      confidence: analysis.confidence,
      sources: searchResults,
      reasoning: analysis.reasoning,
    }
  } catch (error) {
    await recordLLMProviderCall({
      debateId,
      stage: 'fact-check-evidence-analysis',
      config,
      promptVersion: 'fact-check-v1',
      status: 'error',
      error,
    })
    console.error('[Fact Checker] Error analyzing evidence:', error)
    
    // Fallback to unverifiable
    return {
      claim: claim.text,
      verdict: 'unverifiable',
      confidence: 0.5,
      sources: searchResults,
      reasoning: 'Error analyzing evidence.',
    }
  }
}

/**
 * Calculate factuality score for a turn
 */
export function calculateFactualityScore(results: FactCheckResult[]): number {
  if (results.length === 0) {
    return 1.0 // No claims = perfect score
  }
  
  const trueCount = results.filter(r => r.verdict === 'true').length
  const falseCount = results.filter(r => r.verdict === 'false').length
  const totalVerifiable = trueCount + falseCount
  
  if (totalVerifiable === 0) {
    return 1.0 // No verifiable claims
  }
  
  return trueCount / totalVerifiable
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
 * Truncate text to word limit
 */
function truncateToWordLimit(text: string, wordLimit: number): string {
  const words = text.trim().split(/\s+/)
  
  if (words.length <= wordLimit) {
    return text
  }
  
  // Truncate to word limit and add ellipsis
  return words.slice(0, wordLimit).join(' ') + '...'
}

