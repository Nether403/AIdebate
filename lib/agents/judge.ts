/**
 * Judge Agent
 * Evaluates completed debates using structured rubrics and mitigates position bias
 */

import { getLLMClient } from '@/lib/llm/client';
import type { LLMConfig, LLMMessage } from '@/types/llm';
import type { DebateTurn, DebateWinner, EvaluationOrder } from '@/types';
import { z } from 'zod';

const logicalFallacySchema = z.object({
  // Judges routinely emit fallacy labels outside any fixed list. This is
  // descriptive metadata, so accept any label and tolerate missing fields rather
  // than failing the whole verdict.
  type: z.string().catch(''),
  description: z.string().catch(''),
  location: z.string().catch(''),
  severity: z.enum(['minor', 'moderate', 'severe']).catch('moderate'),
})

// Coerce a score to a number in [0,10]; missing/NaN -> 0. Tolerates models that
// emit numeric strings ("8"), out-of-range values, or "8/10"-style fractions.
const scoreSchema = z.preprocess((v) => {
  let n: number
  if (typeof v === 'number') n = v
  else if (typeof v === 'string') n = parseFloat(v.replace(/[^0-9.\-].*$/, '')) // "8/10" -> 8
  else n = NaN
  if (Number.isNaN(n)) return 0
  return Math.max(0, Math.min(10, n))
}, z.number().min(0).max(10))

// Normalize the winner across casing / decoration ("Pro", "CON.", "tie (...)").
const winnerSchema = z.preprocess((v) => {
  if (typeof v !== 'string') return v
  const s = v.trim().toLowerCase()
  if (s.startsWith('pro')) return 'pro'
  if (s.startsWith('con')) return 'con'
  if (s.startsWith('tie') || s.startsWith('draw') || s.startsWith('neither')) return 'tie'
  return s
}, z.enum(['pro', 'con', 'tie']))

const judgeResponseSchema = z.preprocess((raw: any) => {
  // Tolerate scores flattened to the top level instead of nested under `scores`.
  if (raw && typeof raw === 'object' && !raw.scores &&
    (raw.logical_coherence != null || raw.rebuttal_strength != null || raw.factuality != null)) {
    return {
      ...raw,
      scores: {
        logical_coherence: raw.logical_coherence,
        rebuttal_strength: raw.rebuttal_strength,
        factuality: raw.factuality,
      },
    }
  }
  return raw
}, z.object({
  winner: winnerSchema,
  scores: z.object({
    logical_coherence: scoreSchema,
    rebuttal_strength: scoreSchema,
    factuality: scoreSchema,
  }),
  // Require a non-empty justification but do not gate on length (model-dependent).
  justification: z.string().min(1),
  // Accept missing/null/non-array as an empty list.
  flagged_fallacies: z.preprocess((v) => (Array.isArray(v) ? v : []), z.array(logicalFallacySchema)).default([]),
}))

/**
 * Extract a JSON object string from a (possibly decorated) model response.
 * Handles markdown code fences and surrounding prose by taking the outermost
 * `{ ... }` span. Returns the trimmed input unchanged if no braces are found.
 */
export function extractJsonObject(response: string): string {
  let s = (response ?? '').trim()
  if (s.includes('```')) {
    s = s.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim()
  }
  const start = s.indexOf('{')
  const end = s.lastIndexOf('}')
  if (start >= 0 && end > start) {
    return s.slice(start, end + 1)
  }
  return s
}

// Logical fallacy types
export type FallacyType =
  | 'ad_hominem'
  | 'strawman'
  | 'false_dichotomy'
  | 'appeal_to_authority'
  | 'slippery_slope'
  | 'circular_reasoning'
  | 'hasty_generalization'
  | 'red_herring'
  | 'appeal_to_emotion'
  | 'false_cause'
  | 'bandwagon'
  | 'tu_quoque';

export interface LogicalFallacy {
  type: string;
  description: string;
  location: string; // Which turn/speech contained the fallacy
  severity: 'minor' | 'moderate' | 'severe';
}

export interface RubricScores {
  logical_coherence: number; // 1-10
  rebuttal_strength: number; // 1-10
  factuality: number; // 1-10
}

export interface JudgeVerdict {
  winner: DebateWinner;
  scores: RubricScores;
  justification: string;
  flagged_fallacies: LogicalFallacy[];
  metadata: {
    judge_model: string;
    evaluation_order: EvaluationOrder;
    timestamp: Date;
    // Provider-call telemetry for the LLM call that produced this verdict.
    tokens_used?: { input: number; output: number; total: number };
    cost?: number;
    latency_ms?: number;
    provider?: string;
    actual_model?: string;
  };
}

export class JudgeParseError extends Error {
  rawResponse: string;
  evaluationOrder: EvaluationOrder;

  constructor(message: string, rawResponse: string, evaluationOrder: EvaluationOrder) {
    super(message);
    this.name = 'JudgeParseError';
    this.rawResponse = rawResponse;
    this.evaluationOrder = evaluationOrder;
  }
}

export interface ConsensusVerdict {
  final_winner: DebateWinner;
  pro_first_verdict: JudgeVerdict;
  con_first_verdict: JudgeVerdict;
  consensus: boolean;
  tiebreaker_used: boolean;
  tiebreaker_verdict?: JudgeVerdict;
}

export interface CompletedDebate {
  id: string;
  topic: string;
  pro_turns: DebateTurn[];
  con_turns: DebateTurn[];
  fact_check_summary?: {
    pro_verified: number;
    pro_false: number;
    con_verified: number;
    con_false: number;
  };
}

export interface JudgeConfig {
  model: string;
  provider: 'openai' | 'google' | 'anthropic' | 'xai' | 'openrouter';
  temperature?: number;
  maxTokens?: number;
  useTiebreaker?: boolean;
  tiebreakerModel?: string;
  tiebreakerProvider?: 'openai' | 'google' | 'anthropic' | 'xai' | 'openrouter';
}

/**
 * Judge Agent class for evaluating debates
 */
export class JudgeAgent {
  private config: JudgeConfig;
  private llmClient = getLLMClient();

  constructor(config: JudgeConfig) {
    this.config = {
      temperature: 0.3, // Lower temperature for more consistent judgments
      maxTokens: 2000,
      useTiebreaker: true,
      // Default the tiebreaker to the primary judge model/provider so it always
      // points at a working model. Override explicitly to use a stronger or
      // different tiebreaker for genuine disagreement resolution.
      tiebreakerModel: config.tiebreakerModel || config.model,
      tiebreakerProvider: config.tiebreakerProvider || config.provider,
      ...config,
    };
  }

  /**
   * Evaluate a debate with a single order
   */
  async evaluateDebate(
    debate: CompletedDebate,
    order: EvaluationOrder = 'pro_first'
  ): Promise<JudgeVerdict> {
    const transcript = this.formatTranscript(debate, order);
    const systemPrompt = this.buildSystemPrompt(debate);
    const userPrompt = this.buildEvaluationPrompt(transcript, debate);

    const llmConfig: LLMConfig = {
      provider: this.config.provider,
      model: this.config.model,
      temperature: this.config.temperature,
      maxTokens: this.config.maxTokens,
    };

    const messages: LLMMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];

    try {
      const response = await this.llmClient.generate(messages, llmConfig);
      const verdict = this.parseJudgeResponse(response.content, order);
      
      return {
        ...verdict,
        metadata: {
          judge_model: this.config.model,
          evaluation_order: order,
          timestamp: new Date(),
          tokens_used: response.tokensUsed,
          cost: response.cost,
          latency_ms: response.latencyMs,
          provider: response.provider,
          actual_model: response.model,
        },
      };
    } catch (error) {
      if (error instanceof JudgeParseError) {
        throw error;
      }

      console.error('Error evaluating debate:', error);
      throw new Error(`Judge evaluation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Evaluate debate with position bias mitigation (dual order evaluation)
   */
  async evaluateWithOrderSwap(debate: CompletedDebate): Promise<ConsensusVerdict> {
    // Evaluate with Pro first
    const proFirstVerdict = await this.evaluateDebate(debate, 'pro_first');
    
    // Evaluate with Con first
    const conFirstVerdict = await this.evaluateDebate(debate, 'con_first');

    // Check for consensus
    const consensus = proFirstVerdict.winner === conFirstVerdict.winner;

    let finalWinner: DebateWinner = 'tie';
    let tiebreakerUsed = false;
    let tiebreakerVerdict: JudgeVerdict | undefined;

    if (consensus) {
      finalWinner = proFirstVerdict.winner;
    } else {
      // No consensus - use tiebreaker if enabled
      if (this.config.useTiebreaker && this.config.tiebreakerModel) {
        tiebreakerVerdict = await this.invokeTiebreaker(debate);
        finalWinner = tiebreakerVerdict.winner;
        tiebreakerUsed = true;
      } else {
        // Default to tie if no tiebreaker
        finalWinner = 'tie';
      }
    }

    return {
      final_winner: finalWinner,
      pro_first_verdict: proFirstVerdict,
      con_first_verdict: conFirstVerdict,
      consensus,
      tiebreaker_used: tiebreakerUsed,
      tiebreaker_verdict: tiebreakerVerdict,
    };
  }

  /**
   * Invoke tiebreaker judge for disagreement cases
   */
  private async invokeTiebreaker(debate: CompletedDebate): Promise<JudgeVerdict> {
    const tiebreakerConfig: LLMConfig = {
      provider: this.config.tiebreakerProvider!,
      model: this.config.tiebreakerModel!,
      temperature: 0.2, // Even lower temperature for tiebreaker
      maxTokens: this.config.maxTokens,
    };

    // Use neutral order (pro_first) for tiebreaker
    const transcript = this.formatTranscript(debate, 'pro_first');
    const systemPrompt = this.buildSystemPrompt(debate, true);
    const userPrompt = this.buildEvaluationPrompt(transcript, debate);

    const messages: LLMMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];

    const response = await this.llmClient.generate(messages, tiebreakerConfig);
    const verdict = this.parseJudgeResponse(response.content, 'pro_first');

    return {
      ...verdict,
      metadata: {
        judge_model: this.config.tiebreakerModel!,
        evaluation_order: 'pro_first',
        timestamp: new Date(),
        tokens_used: response.tokensUsed,
        cost: response.cost,
        latency_ms: response.latencyMs,
        provider: response.provider,
        actual_model: response.model,
      },
    };
  }

  /**
   * Format debate transcript in specified order
   */
  private formatTranscript(debate: CompletedDebate, order: EvaluationOrder): string {
    const turns: Array<{ side: 'pro' | 'con'; turn: DebateTurn }> = [];

    // Combine and sort turns by round
    debate.pro_turns.forEach((turn) => turns.push({ side: 'pro', turn }));
    debate.con_turns.forEach((turn) => turns.push({ side: 'con', turn }));
    turns.sort((a, b) => a.turn.roundNumber - b.turn.roundNumber);

    let transcript = `DEBATE TOPIC: ${debate.topic}\n\n`;

    // Group by rounds
    const rounds = new Map<number, Array<{ side: 'pro' | 'con'; turn: DebateTurn }>>();
    turns.forEach((item) => {
      if (!rounds.has(item.turn.roundNumber)) {
        rounds.set(item.turn.roundNumber, []);
      }
      rounds.get(item.turn.roundNumber)!.push(item);
    });

    // Format each round
    rounds.forEach((roundTurns, roundNum) => {
      transcript += `=== ROUND ${roundNum} ===\n\n`;

      // Sort turns within round based on evaluation order
      const sortedTurns = roundTurns.sort((a, b) => {
        if (order === 'pro_first') {
          return a.side === 'pro' ? -1 : 1;
        } else {
          return a.side === 'con' ? -1 : 1;
        }
      });

      sortedTurns.forEach(({ side, turn }) => {
        const label = side.toUpperCase();
        transcript += `[${label} DEBATER]\n`;
        
        if (turn.reflection) {
          transcript += `Reflection: ${turn.reflection}\n\n`;
        }
        
        if (turn.critique) {
          transcript += `Critique: ${turn.critique}\n\n`;
        }
        
        transcript += `Speech: ${turn.speech}\n\n`;
        transcript += `---\n\n`;
      });
    });

    // Add fact-check summary if available
    if (debate.fact_check_summary) {
      transcript += `\n=== FACT-CHECK SUMMARY ===\n`;
      transcript += `Pro Debater: ${debate.fact_check_summary.pro_verified} verified, ${debate.fact_check_summary.pro_false} false\n`;
      transcript += `Con Debater: ${debate.fact_check_summary.con_verified} verified, ${debate.fact_check_summary.con_false} false\n`;
    }

    return transcript;
  }

  /**
   * Build system prompt for judge
   */
  private buildSystemPrompt(debate: CompletedDebate, isTiebreaker: boolean = false): string {
    const role = isTiebreaker ? 'tiebreaker judge' : 'impartial debate adjudicator';
    
    return `You are an ${role} with expertise in formal argumentation and critical thinking.

Your task is to evaluate this debate objectively and determine the winner based on the quality of arguments presented.

EVALUATION RUBRIC:
1. Logical Coherence (1-10): 
   - Internal consistency of arguments
   - Absence of contradictions
   - Sound reasoning structure
   - Valid logical connections

2. Rebuttal Strength (1-10):
   - Direct engagement with opponent's points
   - Effective counter-arguments
   - Addressing strongest opposing claims
   - Quality of clash and engagement

3. Factuality (1-10):
   - Accuracy of factual claims
   - Use of evidence and sources
   - Avoidance of false information
   - Refer to fact-check summary when provided

CRITICAL INSTRUCTIONS:
- Do NOT use your own knowledge to fill gaps for debaters
- Focus ONLY on what was actually argued, not what could have been argued
- Penalize logical fallacies heavily (ad hominem, strawman, false dichotomy, etc.)
- Reward direct clash and substantive engagement
- Consider the debate holistically across all rounds
- Be strict but fair in your evaluation
- A tie is acceptable if both debaters performed equally well

${isTiebreaker ? '\nNOTE: You are serving as a tiebreaker judge. Previous evaluations disagreed on the winner. Provide your independent assessment.' : ''}`;
  }

  /**
   * Build evaluation prompt
   */
  private buildEvaluationPrompt(transcript: string, debate: CompletedDebate): string {
    return `${transcript}

Please evaluate this debate and provide your verdict in the following JSON format:

{
  "winner": "pro" | "con" | "tie",
  "scores": {
    "logical_coherence": <1-10>,
    "rebuttal_strength": <1-10>,
    "factuality": <1-10>
  },
  "justification": "<At least 100 words explaining your decision, referencing specific arguments and moments from the debate>",
  "flagged_fallacies": [
    {
      "type": "<fallacy type>",
      "description": "<what the fallacy was>",
      "location": "<which debater and round>",
      "severity": "minor" | "moderate" | "severe"
    }
  ]
}

Provide your evaluation now:`;
  }

  /**
   * Parse judge response into structured verdict
   */
  private parseJudgeResponse(response: string, order: EvaluationOrder): Omit<JudgeVerdict, 'metadata'> {
    try {
      const jsonStr = extractJsonObject(response);

      const parsed = judgeResponseSchema.parse(JSON.parse(jsonStr));
      const scores = parsed.scores;

      return {
        winner: parsed.winner as DebateWinner,
        scores: {
          logical_coherence: scores.logical_coherence,
          rebuttal_strength: scores.rebuttal_strength,
          factuality: scores.factuality,
        },
        justification: parsed.justification,
        flagged_fallacies: parsed.flagged_fallacies || [],
      };
    } catch (error) {
      console.error('Error parsing judge response:', error);
      console.error('Raw response:', response);

      throw new JudgeParseError(
        `Unable to parse judge response: ${error instanceof Error ? error.message : 'Unknown error'}`,
        response,
        order
      );
    }
  }
}

/**
 * Factory function to create a judge agent with default configuration
 * Uses hybrid architecture: Gemini 3.0 Pro direct API with OpenRouter fallback
 */
export function createJudgeAgent(config?: Partial<JudgeConfig>): JudgeAgent {
  const defaultConfig: JudgeConfig = {
    model: 'gemini-3-pro-preview',
    provider: 'google',
    temperature: 0.3,
    maxTokens: 2000,
    useTiebreaker: true,
    tiebreakerModel: process.env.AZURE_OPENAI_API_DEPLOYMENT_NAME || 'gpt-4o-mini',
    tiebreakerProvider: 'openai',
  };

  return new JudgeAgent({ ...defaultConfig, ...config });
}

/**
 * Create judge agent using model configuration
 */
export function createJudgeAgentFromConfig(): JudgeAgent {
  // Import here to avoid circular dependency
  const { getModelConfig } = require('@/lib/llm/model-config');
  const judgeConfig = getModelConfig('judge');
  
  return createJudgeAgent({
    model: judgeConfig.model,
    provider: judgeConfig.provider,
  });
}
