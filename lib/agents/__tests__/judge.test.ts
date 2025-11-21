/**
 * Judge Agent Tests
 * Tests for debate evaluation, position bias mitigation, and consensus logic
 */

import { describe, it, beforeEach, mock } from 'node:test';
import assert from 'node:assert';
import { JudgeAgent, createJudgeAgent, type CompletedDebate, type JudgeConfig } from '../judge';
import { JudgeCalibration, createMockGoldStandard } from '../judge-calibration';
import type { DebateTurn } from '@/types';

describe('JudgeAgent', () => {
  let mockDebate: CompletedDebate;

  beforeEach(() => {
    // Create mock debate
    const proTurn: DebateTurn = {
      id: 'turn-pro-1',
      debateId: 'debate-1',
      roundNumber: 1,
      side: 'pro',
      modelId: 'model-pro',
      reflection: 'The opponent argues that AI will replace jobs, but this ignores historical precedent.',
      critique: 'Their argument commits the fallacy of assuming technology destroys rather than transforms employment.',
      speech: 'While automation does change the nature of work, history shows that technological advancement creates more jobs than it eliminates. The Industrial Revolution, for example, led to massive job creation in new sectors. Similarly, AI will create opportunities in AI development, maintenance, and new industries we cannot yet imagine. The key is ensuring workers have access to retraining and education.',
      wordCount: 250,
      factChecksPassed: 2,
      factChecksFailed: 0,
      wasRejected: false,
      retryCount: 0,
      tokensUsed: 300,
      latencyMs: 1000,
      createdAt: new Date(),
    };

    const conTurn: DebateTurn = {
      id: 'turn-con-1',
      debateId: 'debate-1',
      roundNumber: 1,
      side: 'con',
      modelId: 'model-con',
      reflection: 'The pro side makes a historical comparison, but modern AI is fundamentally different.',
      critique: 'They fail to account for the speed and scale of AI displacement, which is unprecedented.',
      speech: 'The comparison to the Industrial Revolution is flawed because AI can replace cognitive work at a pace never seen before. A study by Oxford University estimates that 47% of US jobs are at high risk of automation within the next two decades. Unlike previous technological shifts that took generations, AI can be deployed globally in months. The retraining argument assumes workers can adapt quickly enough, which is unrealistic for many demographics.',
      wordCount: 280,
      factChecksPassed: 1,
      factChecksFailed: 0,
      wasRejected: false,
      retryCount: 0,
      tokensUsed: 320,
      latencyMs: 1100,
      createdAt: new Date(),
    };

    mockDebate = {
      id: 'debate-1',
      topic: 'AI will create more jobs than it eliminates',
      pro_turns: [proTurn],
      con_turns: [conTurn],
      fact_check_summary: {
        pro_verified: 2,
        pro_false: 0,
        con_verified: 1,
        con_false: 0,
      },
    };
  });

  describe('Rubric Scoring', () => {
    it('should create judge agent with configuration', () => {
      const config: JudgeConfig = {
        model: 'gemini-3.0-pro',
        provider: 'google',
        temperature: 0.3,
        maxTokens: 2000,
      };
      const judge = new JudgeAgent(config);
      assert.ok(judge instanceof JudgeAgent);
    });

    it('should format transcript correctly', () => {
      const judge = createJudgeAgent();
      // Access private method through type assertion for testing
      const transcript = (judge as any).formatTranscript(mockDebate, 'pro_first');
      
      assert.ok(transcript.includes('DEBATE TOPIC:'));
      assert.ok(transcript.includes('AI will create more jobs than it eliminates'));
      assert.ok(transcript.includes('[PRO DEBATER]'));
      assert.ok(transcript.includes('[CON DEBATER]'));
      assert.ok(transcript.includes('FACT-CHECK SUMMARY'));
    });

    it('should parse valid judge response', () => {
      const judge = createJudgeAgent();
      const mockResponse = JSON.stringify({
        winner: 'pro',
        scores: {
          logical_coherence: 8,
          rebuttal_strength: 7,
          factuality: 9,
        },
        justification: 'The pro side presented a more coherent argument with strong historical evidence. While the con side raised valid concerns about the pace of change, they did not adequately address the historical precedent argument.',
        flagged_fallacies: [],
      });

      const verdict = (judge as any).parseJudgeResponse(mockResponse, 'pro_first');
      
      assert.strictEqual(verdict.winner, 'pro');
      assert.strictEqual(verdict.scores.logical_coherence, 8);
      assert.strictEqual(verdict.scores.rebuttal_strength, 7);
      assert.strictEqual(verdict.scores.factuality, 9);
      assert.ok(verdict.justification.length > 100);
    });

    it('should handle invalid JSON gracefully', () => {
      const judge = createJudgeAgent();
      const invalidResponse = 'This is not valid JSON';

      const verdict = (judge as any).parseJudgeResponse(invalidResponse, 'pro_first');
      
      // Should return default tie verdict on parse error
      assert.strictEqual(verdict.winner, 'tie');
      assert.strictEqual(verdict.scores.logical_coherence, 5);
      assert.ok(verdict.justification.includes('Unable to parse'));
    });

    it('should validate score ranges', () => {
      const judge = createJudgeAgent();
      const mockResponse = JSON.stringify({
        winner: 'con',
        scores: {
          logical_coherence: 6,
          rebuttal_strength: 7,
          factuality: 8,
        },
        justification: 'The con side provided more specific evidence and addressed the core weaknesses in the pro argument.',
        flagged_fallacies: [],
      });

      const verdict = (judge as any).parseJudgeResponse(mockResponse, 'con_first');
      
      assert.ok(verdict.scores.logical_coherence >= 1 && verdict.scores.logical_coherence <= 10);
      assert.ok(verdict.scores.rebuttal_strength >= 1 && verdict.scores.rebuttal_strength <= 10);
      assert.ok(verdict.scores.factuality >= 1 && verdict.scores.factuality <= 10);
    });
  });

  describe('Position Bias Detection', () => {
    it('should format transcript in different orders', () => {
      const judge = createJudgeAgent();
      
      const proFirstTranscript = (judge as any).formatTranscript(mockDebate, 'pro_first');
      const conFirstTranscript = (judge as any).formatTranscript(mockDebate, 'con_first');
      
      // Both should contain the same content
      assert.ok(proFirstTranscript.includes('[PRO DEBATER]'));
      assert.ok(proFirstTranscript.includes('[CON DEBATER]'));
      assert.ok(conFirstTranscript.includes('[PRO DEBATER]'));
      assert.ok(conFirstTranscript.includes('[CON DEBATER]'));
      
      // Order should be different (pro first vs con first)
      const proFirstProIndex = proFirstTranscript.indexOf('[PRO DEBATER]');
      const proFirstConIndex = proFirstTranscript.indexOf('[CON DEBATER]');
      const conFirstProIndex = conFirstTranscript.indexOf('[PRO DEBATER]');
      const conFirstConIndex = conFirstTranscript.indexOf('[CON DEBATER]');
      
      assert.ok(proFirstProIndex < proFirstConIndex, 'Pro should come before Con in pro_first order');
      assert.ok(conFirstConIndex < conFirstProIndex, 'Con should come before Pro in con_first order');
    });
  });

  describe('Factory Function', () => {
    it('should create judge with default configuration', () => {
      const judge = createJudgeAgent();
      assert.ok(judge instanceof JudgeAgent);
    });

    it('should create judge with custom configuration', () => {
      const customJudge = createJudgeAgent({
        model: 'gpt-5.1',
        provider: 'openai',
        temperature: 0.5,
      });
      assert.ok(customJudge instanceof JudgeAgent);
    });
  });

  describe('Judge Calibration', () => {
    it('should create calibration system', () => {
      const calibration = new JudgeCalibration();
      assert.ok(calibration instanceof JudgeCalibration);
    });

    it('should load Gold Standard dataset', () => {
      const calibration = new JudgeCalibration();
      const goldStandard = createMockGoldStandard(10);
      
      calibration.loadGoldStandard(goldStandard);
      // If no error thrown, loading was successful
      assert.ok(true);
    });

    it('should calculate agreement rate correctly', () => {
      const calibration = new JudgeCalibration();
      const results = [
        { 
          debate_id: '1', 
          human_winner: 'pro' as const, 
          judge_winner: 'pro' as const, 
          agreement: true, 
          score_differences: { logical_coherence: 1, rebuttal_strength: 1, factuality: 1, average: 1 } 
        },
        { 
          debate_id: '2', 
          human_winner: 'con' as const, 
          judge_winner: 'con' as const, 
          agreement: true, 
          score_differences: { logical_coherence: 1, rebuttal_strength: 1, factuality: 1, average: 1 } 
        },
        { 
          debate_id: '3', 
          human_winner: 'pro' as const, 
          judge_winner: 'con' as const, 
          agreement: false, 
          score_differences: { logical_coherence: 2, rebuttal_strength: 2, factuality: 2, average: 2 } 
        },
      ];

      const agreementRate = calibration.calculateAgreementRate(results);
      assert.ok(Math.abs(agreementRate - 0.667) < 0.01, 'Agreement rate should be approximately 0.667');
    });

    it('should set agreement threshold', () => {
      const calibration = new JudgeCalibration();
      calibration.setAgreementThreshold(0.85);
      // If no error thrown, threshold was set successfully
      assert.ok(true);
    });

    it('should reject invalid agreement threshold', () => {
      const calibration = new JudgeCalibration();
      assert.throws(() => {
        calibration.setAgreementThreshold(1.5);
      }, /Agreement threshold must be between 0 and 1/);
    });

    it('should create mock Gold Standard dataset', () => {
      const goldStandard = createMockGoldStandard(50);
      assert.strictEqual(goldStandard.length, 50);
      
      // Verify structure of first debate
      const firstDebate = goldStandard[0];
      assert.ok(firstDebate.id);
      assert.ok(firstDebate.debate);
      assert.ok(firstDebate.human_verdict);
      assert.ok(firstDebate.human_scores);
      assert.ok(firstDebate.metadata);
    });

    it('should generate calibration report text', () => {
      const calibration = new JudgeCalibration();
      const mockReport = {
        judge_model: 'gemini-3.0-pro',
        total_debates: 50,
        agreement_rate: 0.85,
        average_score_difference: 1.2,
        score_differences_by_rubric: {
          logical_coherence: 1.1,
          rebuttal_strength: 1.3,
          factuality: 1.2,
        },
        results_by_difficulty: {
          easy: { agreement_rate: 0.9, count: 15 },
          medium: { agreement_rate: 0.85, count: 20 },
          hard: { agreement_rate: 0.8, count: 15 },
        },
        results_by_category: {
          technology: { agreement_rate: 0.87, count: 10 },
          ethics: { agreement_rate: 0.83, count: 10 },
        },
        individual_results: [],
        timestamp: new Date(),
        passes_threshold: true,
      };

      const reportText = calibration.generateReportText(mockReport);
      
      assert.ok(reportText.includes('JUDGE CALIBRATION REPORT'));
      assert.ok(reportText.includes('gemini-3.0-pro'));
      assert.ok(reportText.includes('85.0%'));
      assert.ok(reportText.includes('✓ PASS'));
    });
  });
});
