# Judge Agent System

## Overview

The Judge Agent system provides automated evaluation of debate quality using structured rubrics and position bias mitigation. It's a core component of the AI Debate Arena benchmark platform.

## Components

### 1. JudgeAgent (`judge.ts`)

The main judge agent class that evaluates completed debates.

**Key Features:**
- Structured rubric evaluation (Logical Coherence, Rebuttal Strength, Factuality)
- Position bias mitigation through dual-order evaluation
- Tiebreaker judge for disagreement cases
- JSON output parsing with validation
- Fallacy detection and flagging

**Usage:**

```typescript
import { createJudgeAgent } from '@/lib/agents/judge';

// Create judge with default configuration (Gemini 3.0 Pro)
const judge = createJudgeAgent();

// Or with custom configuration
const customJudge = createJudgeAgent({
  model: 'gpt-5.1',
  provider: 'openai',
  temperature: 0.3,
  useTiebreaker: true,
  tiebreakerModel: 'claude-4.5-sonnet',
  tiebreakerProvider: 'anthropic',
});

// Evaluate a debate with position bias mitigation
const verdict = await judge.evaluateWithOrderSwap(completedDebate);

console.log(`Winner: ${verdict.final_winner}`);
console.log(`Consensus: ${verdict.consensus}`);
console.log(`Tiebreaker used: ${verdict.tiebreaker_used}`);
```

### 2. Judge Calibration System (`judge-calibration.ts`)

Validates judge performance against Gold Standard human-graded debates.

**Key Features:**
- Gold Standard dataset management
- Agreement rate calculation
- Score difference analysis
- Results breakdown by difficulty and category
- Calibration report generation

**Usage:**

```typescript
import { createJudgeCalibration, createMockGoldStandard } from '@/lib/agents/judge-calibration';
import { createJudgeAgent } from '@/lib/agents/judge';

// Create calibration system with 80% agreement threshold
const calibration = createJudgeCalibration(0.8);

// Load Gold Standard dataset (minimum 50 debates recommended)
const goldStandard = loadGoldStandardFromDatabase(); // Your implementation
calibration.loadGoldStandard(goldStandard);

// Validate judge
const judge = createJudgeAgent();
const report = await calibration.validateJudge(judge);

// Check if judge passes threshold
if (report.passes_threshold) {
  console.log('✓ Judge is calibrated for production use');
  console.log(`Agreement rate: ${(report.agreement_rate * 100).toFixed(1)}%`);
} else {
  console.log('✗ Judge needs improvement');
  console.log(calibration.generateReportText(report));
}

// Analyze disagreements
const disagreements = calibration.getDisagreements(report);
console.log(`Found ${disagreements.length} disagreements to review`);
```

## Evaluation Rubric

The judge evaluates debates on three dimensions (1-10 scale):

### 1. Logical Coherence (1-10)
- Internal consistency of arguments
- Absence of contradictions
- Sound reasoning structure
- Valid logical connections

### 2. Rebuttal Strength (1-10)
- Direct engagement with opponent's points
- Effective counter-arguments
- Addressing strongest opposing claims
- Quality of clash and engagement

### 3. Factuality (1-10)
- Accuracy of factual claims
- Use of evidence and sources
- Avoidance of false information
- Refer to fact-check summary when provided

## Position Bias Mitigation

Position bias occurs when judges favor the first argument they read. The system mitigates this by:

1. **Dual Evaluation**: Evaluate debate in both orders (Pro first, Con first)
2. **Consensus Check**: Compare verdicts from both evaluations
3. **Tiebreaker**: If verdicts disagree, invoke a tiebreaker judge
4. **Default to Tie**: If tiebreaker disabled, default to tie verdict

**Example:**

```typescript
const verdict = await judge.evaluateWithOrderSwap(debate);

if (verdict.consensus) {
  console.log(`Both evaluations agreed: ${verdict.final_winner} wins`);
} else {
  console.log('Position bias detected - verdicts disagreed');
  console.log(`Pro-first verdict: ${verdict.pro_first_verdict.winner}`);
  console.log(`Con-first verdict: ${verdict.con_first_verdict.winner}`);
  
  if (verdict.tiebreaker_used) {
    console.log(`Tiebreaker decided: ${verdict.final_winner}`);
  } else {
    console.log('Defaulted to tie');
  }
}
```

## Model Configuration

### Default Configuration (Cost-Optimized)

- **Primary Judge**: Gemini 3.0 Pro (~$0.11 per debate)
- **Tiebreaker**: GPT-5.1 (~$0.30 per debate)
- **Temperature**: 0.3 (consistent judgments)
- **Max Tokens**: 2000

### Championship Configuration (Premium)

For high-stakes debates between top-10 models:

```typescript
const championshipJudge = createJudgeAgent({
  model: 'gpt-5.1',
  provider: 'openai',
  temperature: 0.2,
  tiebreakerModel: 'claude-4.5-sonnet',
  tiebreakerProvider: 'anthropic',
});
```

## Fallacy Detection

The judge automatically detects and flags logical fallacies:

**Supported Fallacies:**
- Ad Hominem
- Strawman
- False Dichotomy
- Appeal to Authority
- Slippery Slope
- Circular Reasoning
- Hasty Generalization
- Red Herring
- Appeal to Emotion
- False Cause
- Bandwagon
- Tu Quoque

**Example Output:**

```typescript
{
  flagged_fallacies: [
    {
      type: 'strawman',
      description: 'Misrepresented opponent\'s argument about AI safety',
      location: 'Pro, Round 2',
      severity: 'moderate'
    }
  ]
}
```

## Gold Standard Dataset

A Gold Standard dataset consists of human-graded debates used for calibration.

**Structure:**

```typescript
interface GoldStandardDebate {
  id: string;
  debate: CompletedDebate;
  human_verdict: DebateWinner;
  human_scores: {
    logical_coherence: number;
    rebuttal_strength: number;
    factuality: number;
  };
  human_justification: string;
  grader_count: number;
  agreement_rate: number; // Inter-rater agreement
  metadata: {
    created_at: Date;
    difficulty: 'easy' | 'medium' | 'hard';
    topic_category: string;
  };
}
```

**Requirements:**
- Minimum 50 debates (recommended)
- Multiple human graders per debate (3+ recommended)
- High inter-rater agreement (>0.7)
- Diverse topics and difficulty levels
- Balanced winner distribution

## Testing

Run judge tests:

```bash
npx tsx lib/agents/__tests__/run-judge-tests.ts
```

**Test Coverage:**
- Rubric scoring with known debates
- Position bias detection
- Consensus logic
- Tiebreaker invocation
- JSON parsing and validation
- Calibration system
- Agreement rate calculation

## Integration with Debate System

The Judge Agent integrates with the debate system through the evaluation pipeline:

```typescript
import { createJudgeAgent } from '@/lib/agents/judge';
import { db } from '@/lib/db';

async function evaluateDebate(debateId: string) {
  // 1. Fetch completed debate
  const debate = await db.getCompletedDebate(debateId);
  
  // 2. Create judge
  const judge = createJudgeAgent();
  
  // 3. Evaluate with position bias mitigation
  const verdict = await judge.evaluateWithOrderSwap(debate);
  
  // 4. Store evaluation results
  await db.storeEvaluation({
    debateId,
    winner: verdict.final_winner,
    proFirstVerdict: verdict.pro_first_verdict,
    conFirstVerdict: verdict.con_first_verdict,
    consensus: verdict.consensus,
    tiebreakerUsed: verdict.tiebreaker_used,
  });
  
  // 5. Update model ratings
  await updateModelRatings(debate, verdict);
  
  return verdict;
}
```

## Performance Considerations

**Latency:**
- Single evaluation: ~2-5 seconds
- Dual evaluation: ~4-10 seconds
- With tiebreaker: ~6-15 seconds

**Cost:**
- Development: ~$0.15 per debate (Gemini + GPT-4o-mini)
- Production: ~$0.25 per debate (Gemini + GPT-5.1)
- Championship: ~$0.45 per debate (GPT-5.1 + Claude 4.5)

**Optimization Tips:**
- Use Gemini 3.0 Pro for primary judge (cost-effective)
- Enable tiebreaker only for important debates
- Cache judge prompts to reduce token usage
- Batch evaluations when possible

## Error Handling

The judge system includes robust error handling:

```typescript
try {
  const verdict = await judge.evaluateWithOrderSwap(debate);
} catch (error) {
  if (error.message.includes('API timeout')) {
    // Retry with exponential backoff
    await retryEvaluation(debate);
  } else if (error.message.includes('Invalid JSON')) {
    // Log for manual review
    await flagForManualReview(debate);
  } else {
    // Unknown error
    console.error('Judge evaluation failed:', error);
  }
}
```

## Future Enhancements

**Planned Features:**
- Multi-judge consensus (3+ judges)
- Specialized judges for different topics
- Judge ensemble methods
- Real-time evaluation streaming
- Judge explanation generation
- Automated prompt optimization

## References

- Requirements: `.kiro/specs/debate-benchmark-platform/requirements.md` (Requirement 5)
- Design: `.kiro/specs/debate-benchmark-platform/design.md` (Section 5)
- Tests: `lib/agents/__tests__/judge.test.ts`
