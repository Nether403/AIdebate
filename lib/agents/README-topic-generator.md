# Topic Generator Agent

The Topic Generator Agent is responsible for creating balanced, engaging debate topics and maintaining a healthy pool of topics for the AI Debate Arena.

## Features

### 1. Automated Topic Generation
- Generates debate motions using LLM (GPT-4o-mini by default)
- Ensures topics are side-balanced (neither Pro nor Con has >60% advantage)
- Categorizes topics across 10 domains
- Assigns difficulty levels (easy, medium, hard)
- Validates balance before accepting topics

### 2. Balance Validation
- Uses LLM to assess if a topic is side-balanced
- Calculates Pro advantage score (-1.0 to 1.0)
- Provides reasoning for balance assessment
- Confidence scoring for validation quality

### 3. Topic Pool Management
- Maintains target pool of 100 active topics
- Automatically replenishes when pool drops below 80
- Tracks usage count per topic
- Supports topic retirement for unbalanced motions

### 4. Admin Interface
- Web UI for reviewing and managing topics
- Validate topics on-demand
- Approve/retire topics manually
- Generate new topics in batches

### 5. User Submissions
- Public API for topic suggestions
- Automatic balance validation
- Auto-approval for balanced topics (configurable)

## Usage

### Generate Topics Programmatically

```typescript
import { getTopicGenerator } from '@/lib/agents/topic-generator';

const generator = getTopicGenerator();

// Generate 10 topics
const topics = await generator.generateTopics({
  count: 10,
  categories: ['technology', 'ethics'],
  difficulties: ['medium', 'hard'],
});

// Store in database
await generator.storeTopics(topics);
```

### Validate Topic Balance

```typescript
const validation = await generator.validateTopicBalance(
  'This house believes that AI will benefit humanity'
);

console.log(validation.isBalanced); // true/false
console.log(validation.proAdvantage); // -1.0 to 1.0
console.log(validation.reasoning); // Explanation
```

### Check and Replenish Pool

```typescript
// Check if replenishment is needed
const status = await generator.checkPoolStatus();
console.log(status.needsReplenishment); // true/false
console.log(status.activeCount); // Current active topics

// Automatically replenish if needed
const result = await generator.replenishPoolIfNeeded();
console.log(result.replenished); // true/false
console.log(result.topicsAdded); // Number of topics added
```

### Retire Unbalanced Topics

```typescript
await generator.retireTopic(
  topicId,
  'Topic shows consistent bias toward Pro side'
);
```

## API Endpoints

### Admin Endpoints

**GET /api/admin/topics**
- List all topics with filtering
- Query params: `status` (active/inactive/all), `category`, `difficulty`

**POST /api/admin/topics**
- Generate new topics
- Body: `{ count: 10, categories?: [], difficulties?: [] }`

**GET /api/admin/topics/[id]**
- Get specific topic details

**PATCH /api/admin/topics/[id]**
- Update topic (retire, activate, modify)
- Body: `{ action: 'retire'|'activate', reason?: string }`

**DELETE /api/admin/topics/[id]**
- Permanently delete topic

**POST /api/admin/topics/validate**
- Validate topic balance
- Body: `{ motion: string }`

### Public Endpoints

**POST /api/topics/submit**
- Submit topic suggestion
- Body: `{ motion: string, category?: string, difficulty?: string }`

## Testing

### Unit Tests
```bash
npm run test:topics:unit
```

Tests core functionality:
- Topic generation structure
- Balance validation
- Pool status checking
- Category diversity

### Manual Topic Review
```bash
npm run test:topics
```

Generates 50 topics and outputs them for manual review with:
- Balance scores
- Category distribution
- Difficulty distribution
- Reasoning for each topic

### Replenishment Logic
```bash
npm run test:replenishment
```

Tests automatic pool replenishment:
- Initial pool status
- Replenishment trigger
- Topic retirement
- Final pool status

## Configuration

### LLM Configuration

Default configuration uses GPT-4o-mini for cost-effectiveness:

```typescript
const DEFAULT_LLM_CONFIG: LLMConfig = {
  provider: 'openai',
  model: 'gpt-4o-mini',
  temperature: 0.9, // High for creative generation
  maxTokens: 2000,
};
```

For balance validation, temperature is lowered to 0.3 for analytical precision.

### Balance Threshold

Topics must have less than 60-40 advantage for either side:

```typescript
const BALANCE_THRESHOLD = 0.6;
```

### Pool Management

```typescript
const TARGET_POOL_SIZE = 100;
const REPLENISHMENT_THRESHOLD = 80;
```

## Topic Categories

1. **Technology** - AI, software, digital platforms
2. **Ethics** - Moral dilemmas, philosophical questions
3. **Politics** - Governance, policy, democracy
4. **Science** - Research, discoveries, methodology
5. **Education** - Learning, pedagogy, access
6. **Economics** - Markets, trade, inequality
7. **Health** - Medicine, public health, wellness
8. **Environment** - Climate, sustainability, conservation
9. **Culture** - Arts, media, social norms
10. **Philosophy** - Metaphysics, epistemology, logic

## Difficulty Levels

- **Easy**: Clear positions, common knowledge, straightforward arguments
- **Medium**: Requires some domain knowledge, nuanced positions
- **Hard**: Complex topics, specialized knowledge, subtle distinctions

## Balance Validation Criteria

A topic is considered **balanced** if:
- Neither Pro nor Con has >60% inherent advantage
- Both sides can construct valid, evidence-based arguments
- The motion doesn't rely on subjective preferences
- The motion isn't settled by overwhelming consensus

A topic is considered **unbalanced** if:
- One side has overwhelming factual evidence
- One side has clear moral high ground
- The motion is a false dichotomy
- The motion requires accepting false premises

## Best Practices

### For Topic Generation
1. Generate topics in batches of 10-20 for efficiency
2. Review generated topics manually before deploying to production
3. Monitor balance scores - aim for <0.2 (20% advantage)
4. Ensure diversity across categories and difficulties

### For Topic Management
1. Retire topics that consistently show bias in actual debates
2. Track usage patterns to identify popular categories
3. Replenish pool during off-peak hours
4. Keep at least 80 active topics at all times

### For User Submissions
1. Validate all submissions automatically
2. Consider manual review for borderline cases
3. Provide feedback on why topics are rejected
4. Encourage users to refine and resubmit

## Troubleshooting

### Topics are consistently unbalanced
- Lower temperature for generation (try 0.7)
- Add more examples in system prompt
- Use a more capable model (GPT-4 instead of GPT-4o-mini)

### Generation is too slow
- Reduce count per batch
- Use faster model (GPT-4o-mini)
- Implement caching for common patterns

### Pool depletes too quickly
- Increase TARGET_POOL_SIZE
- Lower REPLENISHMENT_THRESHOLD
- Schedule regular replenishment jobs

### Categories are not diverse
- Explicitly request category distribution in prompt
- Generate topics per category separately
- Review and adjust category weights

## Future Enhancements

1. **Machine Learning Balance Predictor**: Train a model on debate outcomes to predict balance
2. **Topic Clustering**: Group similar topics to avoid redundancy
3. **Trending Topics**: Generate topics based on current events
4. **User Voting**: Let users vote on topic quality
5. **A/B Testing**: Test different generation prompts
6. **Multi-Language Support**: Generate topics in multiple languages
7. **Topic Templates**: Pre-defined templates for common debate formats
8. **Difficulty Calibration**: Adjust difficulty based on actual debate complexity

## Related Files

- `lib/agents/topic-generator.ts` - Main agent implementation
- `app/api/admin/topics/` - Admin API endpoints
- `app/api/topics/submit/` - User submission endpoint
- `app/admin/topics/page.tsx` - Admin UI
- `components/topics/TopicSubmissionForm.tsx` - User submission form
- `scripts/test-topic-generation.ts` - Manual testing script
- `scripts/test-replenishment.ts` - Replenishment testing script
