/**
 * Judge Calibration System
 * Validates judge performance against Gold Standard dataset
 */

import { JudgeAgent, type JudgeVerdict, type CompletedDebate } from './judge';
import type { DebateWinner } from '@/types';

export interface GoldStandardDebate {
  id: string;
  debate: CompletedDebate;
  human_verdict: DebateWinner;
  human_scores: {
    logical_coherence: number;
    rebuttal_strength: number;
    factuality: number;
  };
  human_justification: string;
  grader_count: number; // Number of human graders who evaluated this
  agreement_rate: number; // Inter-rater agreement among human graders
  metadata: {
    created_at: Date;
    difficulty: 'easy' | 'medium' | 'hard';
    topic_category: string;
  };
}

export interface CalibrationResult {
  debate_id: string;
  human_winner: DebateWinner;
  judge_winner: DebateWinner;
  agreement: boolean;
  score_differences: {
    logical_coherence: number;
    rebuttal_strength: number;
    factuality: number;
    average: number;
  };
}

export interface CalibrationReport {
  judge_model: string;
  total_debates: number;
  agreement_rate: number; // Percentage of debates where judge agreed with humans
  average_score_difference: number;
  score_differences_by_rubric: {
    logical_coherence: number;
    rebuttal_strength: number;
    factuality: number;
  };
  results_by_difficulty: {
    easy: { agreement_rate: number; count: number };
    medium: { agreement_rate: number; count: number };
    hard: { agreement_rate: number; count: number };
  };
  results_by_category: Record<string, { agreement_rate: number; count: number }>;
  individual_results: CalibrationResult[];
  timestamp: Date;
  passes_threshold: boolean; // True if agreement_rate >= 80%
}

/**
 * Judge Calibration System
 */
export class JudgeCalibration {
  private goldStandardDataset: GoldStandardDebate[] = [];
  private agreementThreshold: number = 0.8; // 80% agreement required

  /**
   * Load Gold Standard dataset
   */
  loadGoldStandard(dataset: GoldStandardDebate[]): void {
    if (dataset.length < 50) {
      console.warn(
        `Gold Standard dataset has ${dataset.length} debates. Minimum 50 recommended for reliable calibration.`
      );
    }
    this.goldStandardDataset = dataset;
  }

  /**
   * Set agreement threshold (default 80%)
   */
  setAgreementThreshold(threshold: number): void {
    if (threshold < 0 || threshold > 1) {
      throw new Error('Agreement threshold must be between 0 and 1');
    }
    this.agreementThreshold = threshold;
  }

  /**
   * Validate judge against Gold Standard dataset
   */
  async validateJudge(judge: JudgeAgent): Promise<CalibrationReport> {
    if (this.goldStandardDataset.length === 0) {
      throw new Error('Gold Standard dataset not loaded. Call loadGoldStandard() first.');
    }

    const results: CalibrationResult[] = [];
    let totalAgreements = 0;
    let totalScoreDifference = 0;
    const scoreDifferencesByRubric = {
      logical_coherence: 0,
      rebuttal_strength: 0,
      factuality: 0,
    };

    // Track results by difficulty and category
    const resultsByDifficulty: Record<string, { agreements: number; total: number }> = {
      easy: { agreements: 0, total: 0 },
      medium: { agreements: 0, total: 0 },
      hard: { agreements: 0, total: 0 },
    };

    const resultsByCategory: Record<string, { agreements: number; total: number }> = {};

    // Evaluate each debate in the Gold Standard
    for (const goldDebate of this.goldStandardDataset) {
      try {
        // Get judge verdict (using single evaluation for calibration)
        const judgeVerdict = await judge.evaluateDebate(goldDebate.debate, 'pro_first');

        // Calculate agreement
        const agreement = judgeVerdict.winner === goldDebate.human_verdict;
        if (agreement) {
          totalAgreements++;
        }

        // Calculate score differences
        const scoreDiffs = {
          logical_coherence: Math.abs(
            judgeVerdict.scores.logical_coherence - goldDebate.human_scores.logical_coherence
          ),
          rebuttal_strength: Math.abs(
            judgeVerdict.scores.rebuttal_strength - goldDebate.human_scores.rebuttal_strength
          ),
          factuality: Math.abs(
            judgeVerdict.scores.factuality - goldDebate.human_scores.factuality
          ),
        };

        const avgScoreDiff =
          (scoreDiffs.logical_coherence + scoreDiffs.rebuttal_strength + scoreDiffs.factuality) / 3;

        totalScoreDifference += avgScoreDiff;
        scoreDifferencesByRubric.logical_coherence += scoreDiffs.logical_coherence;
        scoreDifferencesByRubric.rebuttal_strength += scoreDiffs.rebuttal_strength;
        scoreDifferencesByRubric.factuality += scoreDiffs.factuality;

        // Track by difficulty
        const difficulty = goldDebate.metadata.difficulty;
        resultsByDifficulty[difficulty].total++;
        if (agreement) {
          resultsByDifficulty[difficulty].agreements++;
        }

        // Track by category
        const category = goldDebate.metadata.topic_category;
        if (!resultsByCategory[category]) {
          resultsByCategory[category] = { agreements: 0, total: 0 };
        }
        resultsByCategory[category].total++;
        if (agreement) {
          resultsByCategory[category].agreements++;
        }

        // Store individual result
        results.push({
          debate_id: goldDebate.id,
          human_winner: goldDebate.human_verdict,
          judge_winner: judgeVerdict.winner,
          agreement,
          score_differences: {
            ...scoreDiffs,
            average: avgScoreDiff,
          },
        });
      } catch (error) {
        console.error(`Error evaluating debate ${goldDebate.id}:`, error);
        // Continue with other debates
      }
    }

    // Calculate final metrics
    const totalDebates = results.length;
    const agreementRate = totalAgreements / totalDebates;
    const avgScoreDifference = totalScoreDifference / totalDebates;

    const report: CalibrationReport = {
      judge_model: judge['config'].model, // Access private config
      total_debates: totalDebates,
      agreement_rate: agreementRate,
      average_score_difference: avgScoreDifference,
      score_differences_by_rubric: {
        logical_coherence: scoreDifferencesByRubric.logical_coherence / totalDebates,
        rebuttal_strength: scoreDifferencesByRubric.rebuttal_strength / totalDebates,
        factuality: scoreDifferencesByRubric.factuality / totalDebates,
      },
      results_by_difficulty: {
        easy: {
          agreement_rate:
            resultsByDifficulty.easy.total > 0
              ? resultsByDifficulty.easy.agreements / resultsByDifficulty.easy.total
              : 0,
          count: resultsByDifficulty.easy.total,
        },
        medium: {
          agreement_rate:
            resultsByDifficulty.medium.total > 0
              ? resultsByDifficulty.medium.agreements / resultsByDifficulty.medium.total
              : 0,
          count: resultsByDifficulty.medium.total,
        },
        hard: {
          agreement_rate:
            resultsByDifficulty.hard.total > 0
              ? resultsByDifficulty.hard.agreements / resultsByDifficulty.hard.total
              : 0,
          count: resultsByDifficulty.hard.total,
        },
      },
      results_by_category: Object.entries(resultsByCategory).reduce(
        (acc, [category, stats]) => {
          acc[category] = {
            agreement_rate: stats.total > 0 ? stats.agreements / stats.total : 0,
            count: stats.total,
          };
          return acc;
        },
        {} as Record<string, { agreement_rate: number; count: number }>
      ),
      individual_results: results,
      timestamp: new Date(),
      passes_threshold: agreementRate >= this.agreementThreshold,
    };

    return report;
  }

  /**
   * Calculate agreement rate for a set of results
   */
  calculateAgreementRate(results: CalibrationResult[]): number {
    if (results.length === 0) return 0;
    const agreements = results.filter((r) => r.agreement).length;
    return agreements / results.length;
  }

  /**
   * Generate calibration report as formatted text
   */
  generateReportText(report: CalibrationReport): string {
    const passStatus = report.passes_threshold ? '✓ PASS' : '✗ FAIL';
    const threshold = (this.agreementThreshold * 100).toFixed(0);

    let text = `
=== JUDGE CALIBRATION REPORT ===
Judge Model: ${report.judge_model}
Timestamp: ${report.timestamp.toISOString()}

OVERALL RESULTS:
- Total Debates Evaluated: ${report.total_debates}
- Agreement Rate: ${(report.agreement_rate * 100).toFixed(1)}% ${passStatus} (Threshold: ${threshold}%)
- Average Score Difference: ${report.average_score_difference.toFixed(2)} points

SCORE DIFFERENCES BY RUBRIC:
- Logical Coherence: ${report.score_differences_by_rubric.logical_coherence.toFixed(2)} points
- Rebuttal Strength: ${report.score_differences_by_rubric.rebuttal_strength.toFixed(2)} points
- Factuality: ${report.score_differences_by_rubric.factuality.toFixed(2)} points

RESULTS BY DIFFICULTY:
- Easy: ${(report.results_by_difficulty.easy.agreement_rate * 100).toFixed(1)}% (${report.results_by_difficulty.easy.count} debates)
- Medium: ${(report.results_by_difficulty.medium.agreement_rate * 100).toFixed(1)}% (${report.results_by_difficulty.medium.count} debates)
- Hard: ${(report.results_by_difficulty.hard.agreement_rate * 100).toFixed(1)}% (${report.results_by_difficulty.hard.count} debates)

RESULTS BY CATEGORY:
`;

    Object.entries(report.results_by_category).forEach(([category, stats]) => {
      text += `- ${category}: ${(stats.agreement_rate * 100).toFixed(1)}% (${stats.count} debates)\n`;
    });

    text += `\n`;

    if (report.passes_threshold) {
      text += `✓ Judge meets the ${threshold}% agreement threshold and is calibrated for production use.\n`;
    } else {
      text += `✗ Judge does not meet the ${threshold}% agreement threshold. Consider:\n`;
      text += `  - Adjusting the judge prompt\n`;
      text += `  - Using a different model\n`;
      text += `  - Reviewing disagreement cases for patterns\n`;
    }

    return text;
  }

  /**
   * Get debates where judge disagreed with humans (for analysis)
   */
  getDisagreements(report: CalibrationReport): CalibrationResult[] {
    return report.individual_results.filter((r) => !r.agreement);
  }

  /**
   * Get debates with largest score differences (for analysis)
   */
  getLargestScoreDifferences(report: CalibrationReport, topN: number = 10): CalibrationResult[] {
    return [...report.individual_results]
      .sort((a, b) => b.score_differences.average - a.score_differences.average)
      .slice(0, topN);
  }
}

/**
 * Factory function to create a calibration system
 */
export function createJudgeCalibration(agreementThreshold: number = 0.8): JudgeCalibration {
  const calibration = new JudgeCalibration();
  calibration.setAgreementThreshold(agreementThreshold);
  return calibration;
}

/**
 * Helper function to create a mock Gold Standard dataset for testing
 */
export function createMockGoldStandard(count: number = 50): GoldStandardDebate[] {
  const categories = ['technology', 'ethics', 'politics', 'science', 'philosophy'];
  const difficulties: Array<'easy' | 'medium' | 'hard'> = ['easy', 'medium', 'hard'];
  const winners: DebateWinner[] = ['pro', 'con', 'tie'];

  const mockDebates: GoldStandardDebate[] = [];

  for (let i = 0; i < count; i++) {
    const winner = winners[i % winners.length];
    const difficulty = difficulties[i % difficulties.length];
    const category = categories[i % categories.length];

    mockDebates.push({
      id: `gold-${i + 1}`,
      debate: {
        id: `debate-${i + 1}`,
        topic: `Mock debate topic ${i + 1}`,
        pro_turns: [
          {
            id: `turn-pro-${i}-1`,
            debateId: `debate-${i + 1}`,
            roundNumber: 1,
            side: 'pro',
            modelId: 'model-pro',
            reflection: 'Mock reflection',
            critique: 'Mock critique',
            speech: 'Mock pro speech for round 1',
            wordCount: 250,
            factChecksPassed: 2,
            factChecksFailed: 0,
            wasRejected: false,
            retryCount: 0,
            tokensUsed: 300,
            latencyMs: 1000,
            createdAt: new Date(),
          },
        ],
        con_turns: [
          {
            id: `turn-con-${i}-1`,
            debateId: `debate-${i + 1}`,
            roundNumber: 1,
            side: 'con',
            modelId: 'model-con',
            reflection: 'Mock reflection',
            critique: 'Mock critique',
            speech: 'Mock con speech for round 1',
            wordCount: 250,
            factChecksPassed: 1,
            factChecksFailed: 1,
            wasRejected: false,
            retryCount: 0,
            tokensUsed: 300,
            latencyMs: 1000,
            createdAt: new Date(),
          },
        ],
        fact_check_summary: {
          pro_verified: 2,
          pro_false: 0,
          con_verified: 1,
          con_false: 1,
        },
      },
      human_verdict: winner,
      human_scores: {
        logical_coherence: 7 + (i % 3),
        rebuttal_strength: 6 + (i % 4),
        factuality: 8 + (i % 2),
      },
      human_justification: `Human graders determined that the ${winner} side presented stronger arguments.`,
      grader_count: 3,
      agreement_rate: 0.8 + (i % 2) * 0.1,
      metadata: {
        created_at: new Date(),
        difficulty,
        topic_category: category,
      },
    });
  }

  return mockDebates;
}
