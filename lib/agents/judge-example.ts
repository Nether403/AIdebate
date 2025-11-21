/**
 * Judge Agent Usage Examples
 * Demonstrates how to use the Judge Agent system
 */

import { createJudgeAgent, type CompletedDebate } from './judge';
import { createJudgeCalibration, createMockGoldStandard } from './judge-calibration';
import type { DebateTurn } from '@/types';

/**
 * Example 1: Basic Judge Evaluation
 */
async function basicEvaluation() {
  console.log('=== Example 1: Basic Judge Evaluation ===\n');

  // Create a mock debate
  const mockDebate: CompletedDebate = {
    id: 'debate-001',
    topic: 'Universal Basic Income should be implemented globally',
    pro_turns: [
      {
        id: 'turn-pro-1',
        debateId: 'debate-001',
        roundNumber: 1,
        side: 'pro',
        modelId: 'gpt-5.1',
        reflection: 'I need to establish the economic benefits of UBI.',
        critique: null,
        speech: 'Universal Basic Income provides economic security and reduces poverty. Studies in Finland and Kenya show positive outcomes including improved mental health and increased entrepreneurship. By guaranteeing basic needs, UBI allows people to pursue education, start businesses, and contribute more meaningfully to society.',
        wordCount: 250,
        factChecksPassed: 2,
        factChecksFailed: 0,
        wasRejected: false,
        retryCount: 0,
        tokensUsed: 300,
        latencyMs: 1200,
        createdAt: new Date(),
      },
    ],
    con_turns: [
      {
        id: 'turn-con-1',
        debateId: 'debate-001',
        roundNumber: 1,
        side: 'con',
        modelId: 'claude-4.5-sonnet',
        reflection: 'The pro side cites studies, but I need to address the cost concerns.',
        critique: 'They ignore the massive fiscal burden and potential inflation.',
        speech: 'While UBI sounds appealing, the economic reality is prohibitive. Implementing UBI globally would cost trillions annually, requiring massive tax increases or deficit spending. This could trigger inflation, negating any benefits. Additionally, UBI may reduce work incentives, leading to labor shortages in essential sectors.',
        wordCount: 280,
        factChecksPassed: 1,
        factChecksFailed: 0,
        wasRejected: false,
        retryCount: 0,
        tokensUsed: 320,
        latencyMs: 1300,
        createdAt: new Date(),
      },
    ],
    fact_check_summary: {
      pro_verified: 2,
      pro_false: 0,
      con_verified: 1,
      con_false: 0,
    },
  };

  // Create judge with default configuration
  const judge = createJudgeAgent();

  // Evaluate debate with position bias mitigation
  const verdict = await judge.evaluateWithOrderSwap(mockDebate);

  console.log('Evaluation Results:');
  console.log(`Final Winner: ${verdict.final_winner}`);
  console.log(`Consensus: ${verdict.consensus ? 'Yes' : 'No'}`);
  console.log(`Tiebreaker Used: ${verdict.tiebreaker_used ? 'Yes' : 'No'}`);
  console.log('\nPro-First Evaluation:');
  console.log(`  Winner: ${verdict.pro_first_verdict.winner}`);
  console.log(`  Scores: LC=${verdict.pro_first_verdict.scores.logical_coherence}, RS=${verdict.pro_first_verdict.scores.rebuttal_strength}, F=${verdict.pro_first_verdict.scores.factuality}`);
  console.log('\nCon-First Evaluation:');
  console.log(`  Winner: ${verdict.con_first_verdict.winner}`);
  console.log(`  Scores: LC=${verdict.con_first_verdict.scores.logical_coherence}, RS=${verdict.con_first_verdict.scores.rebuttal_strength}, F=${verdict.con_first_verdict.scores.factuality}`);
}

/**
 * Example 2: Custom Judge Configuration
 */
async function customConfiguration() {
  console.log('\n=== Example 2: Custom Judge Configuration ===\n');

  // Create judge with custom configuration for championship rounds
  const championshipJudge = createJudgeAgent({
    model: 'gpt-5.1',
    provider: 'openai',
    temperature: 0.2, // Lower temperature for more consistent judgments
    maxTokens: 3000,
    useTiebreaker: true,
    tiebreakerModel: 'claude-4.5-sonnet',
    tiebreakerProvider: 'anthropic',
  });

  console.log('Championship judge created with:');
  console.log('  Primary: GPT-5.1 (OpenAI)');
  console.log('  Tiebreaker: Claude 4.5 Sonnet (Anthropic)');
  console.log('  Temperature: 0.2');
  console.log('  Max Tokens: 3000');
}

/**
 * Example 3: Single Order Evaluation
 */
async function singleOrderEvaluation() {
  console.log('\n=== Example 3: Single Order Evaluation ===\n');

  const mockDebate: CompletedDebate = {
    id: 'debate-002',
    topic: 'Social media does more harm than good',
    pro_turns: [],
    con_turns: [],
  };

  const judge = createJudgeAgent();

  // Evaluate with specific order (useful for testing or when position bias is not a concern)
  const proFirstVerdict = await judge.evaluateDebate(mockDebate, 'pro_first');
  const conFirstVerdict = await judge.evaluateDebate(mockDebate, 'con_first');

  console.log('Pro-First Verdict:', proFirstVerdict.winner);
  console.log('Con-First Verdict:', conFirstVerdict.winner);
  console.log('Position Bias Detected:', proFirstVerdict.winner !== conFirstVerdict.winner);
}

/**
 * Example 4: Judge Calibration
 */
async function judgeCalibration() {
  console.log('\n=== Example 4: Judge Calibration ===\n');

  // Create calibration system with 80% agreement threshold
  const calibration = createJudgeCalibration(0.8);

  // Create mock Gold Standard dataset (50 debates)
  const goldStandard = createMockGoldStandard(50);
  calibration.loadGoldStandard(goldStandard);

  console.log(`Loaded ${goldStandard.length} Gold Standard debates`);

  // Create judge to validate
  const judge = createJudgeAgent();

  // Run calibration (this would take several minutes with real API calls)
  console.log('Running calibration validation...');
  // const report = await calibration.validateJudge(judge);

  // In production, you would:
  // 1. Check if judge passes threshold
  // 2. Analyze disagreements
  // 3. Review score differences
  // 4. Generate calibration report

  console.log('Calibration complete!');
  console.log('(Actual validation commented out to avoid API calls in example)');
}

/**
 * Example 5: Analyzing Fallacies
 */
async function analyzeFallacies() {
  console.log('\n=== Example 5: Analyzing Fallacies ===\n');

  const mockDebate: CompletedDebate = {
    id: 'debate-003',
    topic: 'Climate change is the most urgent global issue',
    pro_turns: [
      {
        id: 'turn-pro-1',
        debateId: 'debate-003',
        roundNumber: 1,
        side: 'pro',
        modelId: 'gpt-5.1',
        reflection: null,
        critique: null,
        speech: 'Climate change threatens human civilization. Scientists agree we must act now. Anyone who denies this is either ignorant or corrupt.',
        wordCount: 150,
        factChecksPassed: 1,
        factChecksFailed: 0,
        wasRejected: false,
        retryCount: 0,
        tokensUsed: 200,
        latencyMs: 1000,
        createdAt: new Date(),
      },
    ],
    con_turns: [
      {
        id: 'turn-con-1',
        debateId: 'debate-003',
        roundNumber: 1,
        side: 'con',
        modelId: 'claude-4.5-sonnet',
        reflection: null,
        critique: null,
        speech: 'While climate change is important, poverty and disease kill millions today. We should prioritize immediate threats over long-term concerns.',
        wordCount: 160,
        factChecksPassed: 0,
        factChecksFailed: 0,
        wasRejected: false,
        retryCount: 0,
        tokensUsed: 210,
        latencyMs: 1100,
        createdAt: new Date(),
      },
    ],
  };

  const judge = createJudgeAgent();
  const verdict = await judge.evaluateWithOrderSwap(mockDebate);

  console.log('Flagged Fallacies:');
  if (verdict.pro_first_verdict.flagged_fallacies.length > 0) {
    verdict.pro_first_verdict.flagged_fallacies.forEach((fallacy) => {
      console.log(`  - ${fallacy.type} (${fallacy.severity})`);
      console.log(`    Location: ${fallacy.location}`);
      console.log(`    Description: ${fallacy.description}`);
    });
  } else {
    console.log('  No fallacies detected');
  }
}

/**
 * Example 6: Handling Disagreements
 */
async function handleDisagreements() {
  console.log('\n=== Example 6: Handling Disagreements ===\n');

  const judge = createJudgeAgent({
    model: 'gemini-3.0-pro',
    provider: 'google',
    useTiebreaker: true,
  });

  // Simulate a debate where position bias might occur
  const mockDebate: CompletedDebate = {
    id: 'debate-004',
    topic: 'Remote work is more productive than office work',
    pro_turns: [],
    con_turns: [],
  };

  const verdict = await judge.evaluateWithOrderSwap(mockDebate);

  if (!verdict.consensus) {
    console.log('⚠️  Position bias detected!');
    console.log(`Pro-first evaluation: ${verdict.pro_first_verdict.winner}`);
    console.log(`Con-first evaluation: ${verdict.con_first_verdict.winner}`);
    
    if (verdict.tiebreaker_used) {
      console.log(`\n✓ Tiebreaker invoked: ${verdict.final_winner}`);
      console.log(`Tiebreaker model: ${verdict.tiebreaker_verdict?.metadata.judge_model}`);
    } else {
      console.log('\n→ Defaulted to tie (no tiebreaker configured)');
    }
  } else {
    console.log('✓ Consensus reached');
    console.log(`Both evaluations agreed: ${verdict.final_winner}`);
  }
}

/**
 * Example 7: Calibration Report Analysis
 */
function calibrationReportAnalysis() {
  console.log('\n=== Example 7: Calibration Report Analysis ===\n');

  const calibration = createJudgeCalibration(0.8);

  // Mock calibration report
  const mockReport = {
    judge_model: 'gemini-3.0-pro',
    total_debates: 50,
    agreement_rate: 0.86,
    average_score_difference: 1.3,
    score_differences_by_rubric: {
      logical_coherence: 1.2,
      rebuttal_strength: 1.5,
      factuality: 1.2,
    },
    results_by_difficulty: {
      easy: { agreement_rate: 0.93, count: 15 },
      medium: { agreement_rate: 0.85, count: 20 },
      hard: { agreement_rate: 0.77, count: 15 },
    },
    results_by_category: {
      technology: { agreement_rate: 0.90, count: 10 },
      ethics: { agreement_rate: 0.85, count: 10 },
      politics: { agreement_rate: 0.80, count: 10 },
      science: { agreement_rate: 0.88, count: 10 },
      philosophy: { agreement_rate: 0.82, count: 10 },
    },
    individual_results: [],
    timestamp: new Date(),
    passes_threshold: true,
  };

  // Generate and display report
  const reportText = calibration.generateReportText(mockReport);
  console.log(reportText);

  // Analyze performance
  console.log('\nKey Insights:');
  console.log(`✓ Judge passes 80% threshold with ${(mockReport.agreement_rate * 100).toFixed(1)}% agreement`);
  console.log(`✓ Performs best on easy debates (${(mockReport.results_by_difficulty.easy.agreement_rate * 100).toFixed(1)}%)`);
  console.log(`⚠️  Struggles with hard debates (${(mockReport.results_by_difficulty.hard.agreement_rate * 100).toFixed(1)}%)`);
  console.log(`✓ Most accurate on technology topics (${(mockReport.results_by_category.technology.agreement_rate * 100).toFixed(1)}%)`);
}

/**
 * Run all examples
 */
async function runAllExamples() {
  try {
    // Note: Most examples are commented out to avoid actual API calls
    // Uncomment when you want to test with real API keys
    
    // await basicEvaluation();
    customConfiguration();
    // await singleOrderEvaluation();
    judgeCalibration();
    // await analyzeFallacies();
    // await handleDisagreements();
    calibrationReportAnalysis();
    
    console.log('\n=== All Examples Complete ===');
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Run examples if this file is executed directly
if (require.main === module) {
  runAllExamples();
}

export {
  basicEvaluation,
  customConfiguration,
  singleOrderEvaluation,
  judgeCalibration,
  analyzeFallacies,
  handleDisagreements,
  calibrationReportAnalysis,
};
