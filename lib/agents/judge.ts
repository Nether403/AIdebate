/**
 * Judge Agent
 * Evaluates completed debates using structured rubrics and mitigates position bias
 */

import { getLLMClient } from '@/lib/llm/client';
import type { LLMConfig, LLMMessage } from '@/types/llm';
import type { DebateTurn, DebateWinner, EvaluationOrder } from '@/types';

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
  type: FallacyType;
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
  };
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
      tiebreakerModel: config.tiebreakerModel || 'gpt-5.1',
      tiebreakerProvider: config.tiebreakerProvider || 'openai',
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
        },
      };
    } catch (error) {
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
      // Extract JSON from response (handle markdown code blocks)
      let jsonStr = response.trim();
      
      // Remove markdown code blocks if present
      if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      }

      const parsed = JSON.parse(jsonStr);

      // Validate required fields
      if (!parsed.winner || !parsed.scores || !parsed.justification) {
        throw new Error('Missing required fields in judge response');
      }

      // Validate winner value
      if (!['pro', 'con', 'tie'].includes(parsed.winner)) {
        throw new Error(`Invalid winner value: ${parsed.winner}`);
      }

      // Validate scores
      const scores = parsed.scores;
      if (
        typeof scores.logical_coherence !== 'number' ||
        typeof scores.rebuttal_strength !== 'number' ||
        typeof scores.factuality !== 'number'
      ) {
        throw new Error('Invalid score types');
      }

      // Ensure scores are in range 1-10
      const validateScore = (score: number, name: string) => {
        if (score < 1 || score > 10) {
          throw new Error(`${name} score must be between 1 and 10`);
        }
      };

      validateScore(scores.logical_coherence, 'Logical coherence');
      validateScore(scores.rebuttal_strength, 'Rebuttal strength');
      validateScore(scores.factuality, 'Factuality');

      // Validate justification length
      if (parsed.justification.length < 100) {
        throw new Error('Justification must be at least 100 characters');
      }

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
      
      // Return a default verdict in case of parsing error
      return {
        winner: 'tie',
        scores: {
          logical_coherence: 5,
          rebuttal_strength: 5,
          factuality: 5,
        },
        justification: `Unable to parse judge response. Error: ${error instanceof Error ? error.message : 'Unknown error'}. Raw response: ${response.substring(0, 200)}...`,
        flagged_fallacies: [],
      };
    }
  }
}

/**
 * Factory function to create a judge agent with default configuration
 */
export function createJudgeAgent(config?: Partial<JudgeConfig>): JudgeAgent {
  const defaultConfig: JudgeConfig = {
    model: 'gemini-3.0-pro',
    provider: 'google',
    temperature: 0.3,
    maxTokens: 2000,
    useTiebreaker: true,
    tiebreakerModel: 'gpt-5.1',
    tiebreakerProvider: 'openai',
  };

  return new JudgeAgent({ ...defaultConfig, ...config });
}
