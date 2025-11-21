# Design Document

## Overview

The AI Debate Arena is a web-based platform that transforms LLM evaluation from static benchmarks into dynamic, adversarial debates. The system orchestrates structured arguments between AI models, evaluates them through both automated judges and crowd voting, and maintains a transparent leaderboard that bridges the gap between benchmark performance and real user experience.

### Core Innovation

The platform implements a "Dialectic Engine" architecture using multi-agent orchestration where LLMs engage in formal debates with persona-driven characters, real-time fact-checking, and dual scoring systems that capture both persuasive appeal (crowd votes) and logical rigor (AI judge evaluation).

## Architecture

### High-Level System Architecture

The system follows a layered architecture with clear separation of concerns:

**Frontend Layer:** React-based UI for debate viewing, voting, and leaderboard interaction
**API Layer:** RESTful endpoints for debate orchestration, judging, and data retrieval
**Backend Services:** Core business logic including debate engine, judge engine, and rating calculations
**Agent Layer:** LangGraph-orchestrated multi-agent system for debate execution
**External Services:** LLM provider APIs and search APIs
**Data Layer:** PostgreSQL database with Redis caching

### Technology Stack

**Frontend:**
- React 18+ with TypeScript
- Tailwind CSS for styling
- Framer Motion for animations
- Recharts for data visualization
- React Query for state management

**Backend:**
- Node.js with TypeScript
- Express.js or Next.js API routes
- LangGraph for multi-agent orchestration
- LangChain for LLM abstractions

**Database:**
- Neon PostgreSQL for persistent storage
- Redis for caching and real-time updates

**External APIs:**
- OpenAI (GPT-5.1, GPT-4o-mini)
- Google (Gemini 3.0 Pro - Primary Judge)
- xAI (Grok 4.1)
- OpenRouter (Fallback for multiple models)
- Tavily Search API (Fact-checking)
- Stack Auth (Neon Auth integration) for fact-checking

## Components and Interfaces

### 1. Debate Engine

**Purpose:** Orchestrates the complete debate lifecycle from initialization to completion.

**Key Responsibilities:**
- Initialize debate with topic, models, and personas
- Manage debate state through LangGraph
- Coordinate agent interactions
- Handle streaming responses
- Persist debate data

**Interface:**
```typescript
interface DebateEngine {
  startDebate(config: DebateConfig): Promise<DebateSession>
  streamTurn(sessionId: string): AsyncGenerator<TurnUpdate>
  pauseDebate(sessionId: string): Promise<void>
  resumeDebate(sessionId: string): Promise<void>
  getDebateState(sessionId: string): Promise<DebateState>
}

interface DebateConfig {
  modelA: ModelConfig
  modelB: ModelConfig
  topic: Topic
  personaA: Persona
  personaB: Persona
  rounds: number
  wordLimitPerTurn: number
  enableFactChecking: boolean
  strictMode: boolean
}

interface DebateSession {
  id: string
  status: 'initializing' | 'in_progress' | 'paused' | 'completed' | 'failed'
  currentRound: number
  currentSpeaker: 'pro' | 'con'
  transcript: Turn[]
  metadata: DebateMetadata
}
```

### 2. LangGraph Orchestrator

**Purpose:** Implements the multi-agent debate flow as a stateful graph with cycles and conditional branching.

**Graph Structure:**
```typescript
interface DebateGraph {
  nodes: {
    moderator: ModeratorNode
    proDebater: DebaterNode
    conDebater: DebaterNode
    factChecker: FactCheckerNode
    roundTransition: TransitionNode
  }
  edges: {
    moderator_to_pro: ConditionalEdge
    pro_to_factcheck: Edge
    factcheck_to_con: ConditionalEdge
    con_to_factcheck: Edge
    factcheck_to_transition: ConditionalEdge
    transition_to_moderator: Edge
  }
  state: SharedDebateState
}

interface SharedDebateState {
  debate_id: string
  transcript: Turn[]
  round_counter: number
  fact_check_logs: FactCheckResult[]
  scratchpads: {
    pro: string
    con: string
  }
  metadata: Record<string, any>
}
```

**State Flow:**
1. Moderator announces round and enforces rules
2. Pro Debater generates turn with RCR prompting
3. Fact-Checker validates claims (loop-back if strict mode and false claim detected)
4. Con Debater receives Pro's turn and generates response with RCR
5. Fact-Checker validates Con's claims
6. Round Transition checks if debate should continue or end
7. Loop back to Moderator for next round

### 3. Debater Agent

**Purpose:** Generate debate turns using persona-driven prompts and RCR methodology.

**RCR Implementation:**
```typescript
interface DebaterAgent {
  generateTurn(context: TurnContext): Promise<DebateTurn>
}

interface TurnContext {
  persona: Persona
  position: 'pro' | 'con'
  topic: Topic
  opponentLastTurn?: Turn
  debateHistory: Turn[]
  round: number
}

interface DebateTurn {
  reflection: string  // Internal analysis (visible in UI accordion)
  critique: string    // Identified weaknesses (visible in UI accordion)
  speech: string      // Final rebuttal (main content)
  metadata: {
    model: string
    tokens: number
    latency_ms: number
  }
}
```

**System Prompt Structure:**
```
You are {persona.name}, {persona.description}.

DEBATE CONTEXT:
Topic: {topic}
Your Position: {position}
Round: {round}

TASK: Generate a debate turn using Reflect-Critique-Refine methodology.

PHASE 1 - REFLECTION:
Analyze your opponent's previous speech. Output your analysis in <reflection> tags.
- What is their central thesis?
- What evidence do they provide?
- What is their strongest point?

PHASE 2 - CRITIQUE:
Identify weaknesses in their argument. Output in <critique> tags.
- Logical fallacies (strawman, false dichotomy, ad hominem, etc.)
- Factual inaccuracies
- Unsupported claims
- Internal contradictions

PHASE 3 - REFINEMENT:
Construct your rebuttal targeting the identified weaknesses. Output in <speech> tags.
- Address their strongest point directly
- Provide counter-evidence
- Maintain your persona's voice and style
- Stay within {wordLimit} words

CONSTRAINTS:
- Maintain character consistency with {persona.traits}
- Use {persona.speaking_style}
- Do not break the fourth wall
- Focus on logical argumentation, not personal attacks
```

### 4. Fact-Checker Agent

**Purpose:** Validate factual claims in real-time to prevent hallucinations from winning debates.

**Interface:**
```typescript
interface FactCheckerAgent {
  extractClaims(text: string): Promise<Claim[]>
  verifyClaim(claim: Claim): Promise<FactCheckResult>
  processTurn(turn: DebateTurn): Promise<FactCheckReport>
}

interface Claim {
  text: string
  type: 'statistical' | 'historical' | 'scientific' | 'definitional'
  confidence: number
}

interface FactCheckResult {
  claim: Claim
  verdict: 'verified' | 'false' | 'unverifiable' | 'misleading'
  evidence: SearchResult[]
  confidence: number
  explanation: string
}

interface FactCheckReport {
  turn_id: string
  claims_checked: number
  verified: number
  false: number
  unverifiable: number
  overall_factuality_score: number
  flagged_claims: FactCheckResult[]
}
```

**Verification Flow:**
1. Extract verifiable claims using NER and claim detection prompts
2. For each claim, query Tavily Search API
3. Use LLM to compare claim against search results
4. Return verdict with evidence
5. In strict mode: if false, reject turn and request revision

### 5. Judge Agent

**Purpose:** Evaluate completed debates using structured rubrics and mitigate biases.

**Interface:**
```typescript
interface JudgeAgent {
  evaluateDebate(debate: CompletedDebate): Promise<JudgeVerdict>
  evaluateWithOrderSwap(debate: CompletedDebate): Promise<ConsensusVerdict>
}

interface JudgeVerdict {
  winner: 'pro' | 'con' | 'tie'
  scores: {
    logical_coherence: number  // 1-10
    rebuttal_strength: number  // 1-10
    factuality: number         // 1-10
  }
  justification: string
  flagged_fallacies: LogicalFallacy[]
  metadata: {
    judge_model: string
    evaluation_order: 'pro_first' | 'con_first'
  }
}

interface ConsensusVerdict {
  final_winner: 'pro' | 'con' | 'tie'
  pro_first_verdict: JudgeVerdict
  con_first_verdict: JudgeVerdict
  consensus: boolean
  tiebreaker_used: boolean
}
```

**Evaluation Process:**
1. Format debate transcript with clear speaker labels
2. Evaluate with Pro presented first
3. Evaluate with Con presented first
4. Compare verdicts
5. If consensus: return agreed winner
6. If disagreement: mark as tie or invoke tiebreaker judge

**Judge System Prompt:**
```
You are an impartial debate adjudicator with expertise in formal argumentation.

TASK: Evaluate this debate and determine the winner.

RUBRIC:
1. Logical Coherence (1-10): Internal consistency, absence of contradictions
2. Rebuttal Strength (1-10): Direct engagement with opponent's points
3. Factuality (1-10): Accuracy of claims (refer to fact-check logs)

INSTRUCTIONS:
- Do NOT use your own knowledge to fill gaps for debaters
- Focus on what was actually argued, not what could have been argued
- Penalize logical fallacies heavily
- Reward direct clash and engagement
- Consider the debate holistically, not just final speeches

OUTPUT FORMAT:
{
  "winner": "pro" | "con" | "tie",
  "scores": {
    "logical_coherence": <1-10>,
    "rebuttal_strength": <1-10>,
    "factuality": <1-10>
  },
  "justification": "<100+ word explanation>",
  "flagged_fallacies": [...]
}
```

### 6. Rating Engine

**Purpose:** Maintain model rankings using Glicko-2 algorithm for both crowd and AI scores.

**Interface:**
```typescript
interface RatingEngine {
  updateRatings(results: DebateResult[]): Promise<void>
  getRating(modelId: string, ratingType: 'crowd' | 'ai'): Promise<Rating>
  getLeaderboard(sortBy: LeaderboardSort): Promise<LeaderboardEntry[]>
  calculateControversyIndex(modelId: string): Promise<number>
}

interface Rating {
  rating: number           // r
  rating_deviation: number // RD
  volatility: number       // σ
  games_played: number
  last_updated: Date
}

interface DebateResult {
  debate_id: string
  model_a_id: string
  model_b_id: string
  winner: 'a' | 'b' | 'tie'
  result_type: 'crowd_vote' | 'ai_judge'
  timestamp: Date
}

interface LeaderboardEntry {
  model_id: string
  model_name: string
  crowd_rating: Rating
  ai_rating: Rating
  controversy_index: number
  total_debates: number
  win_rate: number
  avg_factuality: number
}
```

**Glicko-2 Configuration:**
- τ (tau) = 0.5 (constrains volatility for LLM stability)
- Rating period = 24 hours (batch updates)
- Initial rating = 1500
- Initial RD = 350
- Initial volatility = 0.06

## Data Models

### Database Schema

**models table:**
```sql
CREATE TABLE models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  provider VARCHAR(100) NOT NULL,
  version VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  is_legacy BOOLEAN DEFAULT false,
  cost_per_1m_input_tokens DECIMAL(10,4),
  cost_per_1m_output_tokens DECIMAL(10,4),
  created_at TIMESTAMP DEFAULT NOW()
);
```

**debates table:**
```sql
CREATE TABLE debates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_a_id UUID REFERENCES models(id),
  model_b_id UUID REFERENCES models(id),
  persona_a_id UUID REFERENCES personas(id),
  persona_b_id UUID REFERENCES personas(id),
  topic_id UUID REFERENCES topics(id),
  status VARCHAR(50),
  winner VARCHAR(10),  -- 'pro', 'con', 'tie', null
  human_vote_winner VARCHAR(10),
  ai_judge_winner VARCHAR(10),
  total_tokens_a INTEGER,
  total_tokens_b INTEGER,
  estimated_cost_a DECIMAL(10,4),
  estimated_cost_b DECIMAL(10,4),
  duration_ms INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);
```

**debate_turns table:**
```sql
CREATE TABLE debate_turns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  debate_id UUID REFERENCES debates(id),
  round INTEGER NOT NULL,
  speaker_model_id UUID REFERENCES models(id),
  position VARCHAR(10),  -- 'pro' or 'con'
  reflection TEXT,
  critique TEXT,
  speech TEXT NOT NULL,
  tokens_used INTEGER,
  latency_ms INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**fact_checks table:**
```sql
CREATE TABLE fact_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  turn_id UUID REFERENCES debate_turns(id),
  claim TEXT NOT NULL,
  verdict VARCHAR(50),  -- 'verified', 'false', 'unverifiable', 'misleading'
  evidence JSONB,
  confidence DECIMAL(3,2),
  explanation TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**debate_evaluations table:**
```sql
CREATE TABLE debate_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  debate_id UUID REFERENCES debates(id),
  judge_model VARCHAR(100),
  evaluation_order VARCHAR(20),  -- 'pro_first' or 'con_first'
  winner VARCHAR(10),
  logical_coherence_score INTEGER,
  rebuttal_strength_score INTEGER,
  factuality_score INTEGER,
  justification TEXT,
  flagged_fallacies JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**user_votes table:**
```sql
CREATE TABLE user_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  debate_id UUID REFERENCES debates(id),
  session_id VARCHAR(255) NOT NULL,
  choice VARCHAR(10),  -- 'a', 'b', 'tie'
  debate_points_wagered INTEGER,
  debate_points_won INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(debate_id, session_id)
);
```

**model_ratings table:**
```sql
CREATE TABLE model_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id UUID REFERENCES models(id),
  rating_type VARCHAR(20),  -- 'crowd' or 'ai'
  rating DECIMAL(10,2),
  rating_deviation DECIMAL(10,2),
  volatility DECIMAL(10,6),
  games_played INTEGER,
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(model_id, rating_type)
);
```

**topics table:**
```sql
CREATE TABLE topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  motion TEXT NOT NULL,
  category VARCHAR(100),  -- 'Philosophy', 'Economics', etc.
  difficulty VARCHAR(20),  -- 'Easy', 'Medium', 'Hard'
  is_balanced BOOLEAN DEFAULT true,
  times_used INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  retired_at TIMESTAMP
);
```

**personas table:**
```sql
CREATE TABLE personas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  traits JSONB,
  speaking_style TEXT,
  background TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Error Handling

### Retry Strategy

**API Call Failures:**
- Exponential backoff: 1s, 2s, 4s
- Max retries: 3
- Fallback: Mark debate as failed, notify admin

**Fact-Check Timeouts:**
- Timeout per claim: 10 seconds
- If timeout: mark claim as 'unverifiable'
- Continue debate execution

**Judge Evaluation Failures:**
- Retry with same judge: 2 attempts
- Fallback to alternative judge model
- Last resort: mark as 'requires_manual_review'

### State Recovery

**LangGraph Checkpointing:**
- Persist state after each node execution
- On crash: resume from last checkpoint
- Checkpoint storage: PostgreSQL with JSONB

**Debate Recovery Flow:**
1. Detect incomplete debate (status = 'in_progress', last_update > 5 min ago)
2. Load last checkpoint from database
3. Reinitialize LangGraph with saved state
4. Resume from next node in graph

## Testing Strategy

### Unit Tests

**Coverage Targets:**
- Agent prompt generation: 90%
- Rating calculations: 100%
- Fact-check claim extraction: 85%
- Database operations: 95%

**Key Test Cases:**
- RCR prompt formatting with various personas
- Glicko-2 rating updates with edge cases (new player, inactive player)
- Fact-check verdict logic with ambiguous search results
- Judge consensus logic with disagreement scenarios

### Integration Tests

**Debate Flow Tests:**
1. End-to-end debate with mock LLM responses
2. Fact-checker integration with mock search API
3. Judge evaluation with known debate transcripts
4. Rating updates after batch of debates

**API Tests:**
- POST /api/debate/run with valid/invalid configs
- GET /api/leaderboard with various sort options
- POST /api/debate/vote with duplicate prevention
- WebSocket streaming for live debates

### Performance Tests

**Load Testing:**
- Concurrent debates: Target 10 simultaneous debates
- Database query performance: <100ms for leaderboard
- Rating calculation batch: <5s for 1000 debates
- Fact-check throughput: 5 claims/second

**Cost Testing:**
- Track token usage per debate type
- Validate cost estimates vs actual API bills
- Test rate limiting effectiveness

### User Acceptance Testing

**Crowd Calibration:**
- Run 50 debates with known quality differences
- Collect votes from diverse user pool
- Validate that crowd votes align with expected outcomes >70%

**Judge Calibration:**
- Create Gold Standard dataset of 50 human-graded debates
- Run AI judge on Gold Standard
- Measure agreement rate (target: >85%)
- Iterate on judge prompt until target met

## Security Considerations

### API Security

**Rate Limiting:**
- Per IP: 100 requests/hour for anonymous users
- Per authenticated user: 500 requests/hour
- Per debate endpoint: 10 debates/hour per user

**Authentication:**
- OAuth 2.0 with Google/GitHub
- JWT tokens for session management
- Refresh token rotation

**Input Validation:**
- Sanitize all user inputs (topic submissions, votes)
- Validate model IDs against whitelist
- Enforce word limits on custom topics

### Data Privacy

**User Data:**
- Store only anonymized session IDs for votes
- No PII collection without explicit consent
- GDPR-compliant data export/deletion

**Debate Transcripts:**
- Public by default (for transparency)
- Option to mark debates as 'unlisted' for testing
- No storage of API keys or credentials in logs

### Abuse Prevention

**Vote Manipulation:**
- IP-based rate limiting
- Session fingerprinting
- Anomaly detection for suspicious voting patterns
- Admin dashboard for flagging users

**Cost Protection:**
- Daily spending cap per model
- Alert system for unusual API usage
- Manual approval for high-cost models in production

## Deployment Strategy

### Infrastructure

**Hosting:**
- Application: Render (Web Service for Next.js full-stack app)
- Database: Neon (managed PostgreSQL with connection pooling)
- Cache: Upstash Redis
- Static Assets: Render CDN

**Environment Configuration:**
- Development: Local with mock LLM responses
- Staging: Render preview environments with real APIs and test models
- Production: Render production service with full model roster and cost monitoring

**Render-Specific Configuration:**
- Build Command: `npm run build`
- Start Command: `npm run start`
- Node Version: 18.x or higher
- Auto-Deploy: Enabled from main branch
- Health Check Path: `/api/health`
- Connection Pooling: Required for Neon database (use `?pgbouncer=true` in connection string)

### CI/CD Pipeline

**Build Process:**
1. Run linter (ESLint, Prettier)
2. Run type checker (TypeScript)
3. Run unit tests
4. Run integration tests
5. Build Next.js application
6. Deploy to Render staging environment (preview deploy)
7. Run smoke tests against staging
8. Manual approval for production deploy
9. Render automatically deploys to production on main branch merge

**Render Deploy Configuration:**
- Auto-Deploy: Enabled for main branch
- Preview Deploys: Enabled for pull requests
- Deploy Hooks: Configured for manual triggers
- Health Checks: `/api/health` endpoint monitored
- Zero-Downtime Deploys: Enabled
- Rollback: Available via Render dashboard

### Monitoring

**Metrics to Track:**
- Debate completion rate
- Average debate duration
- API error rates per provider
- Token usage and costs
- User engagement (votes per user, return rate)
- Rating stability (RD convergence)

**Alerting:**
- API failure rate >5%
- Daily cost exceeds budget
- Database query time >500ms
- Debate failure rate >10%

## Future Enhancements

### Phase 2 Features

1. **Multi-Model Debates:** 3+ models in panel format
2. **Live Streaming:** Real-time debate viewing with chat
3. **Topic Voting:** Community-driven topic selection
4. **Model Fine-Tuning:** RLHF using debate outcomes
5. **Advanced Analytics:** Per-topic performance breakdowns

### Phase 3 Features

1. **Prediction Market Expansion:** Real money betting (with legal compliance)
2. **API Access:** Public API for researchers
3. **Custom Personas:** User-created persona submissions
4. **Multi-Language Support:** Debates in languages beyond English
5. **Video/Audio:** TTS for debate narration

### Research Applications

1. **Benchmark Dataset:** Release anonymized debate corpus
2. **Judge Bias Analysis:** Study systematic judge preferences
3. **Persona Consistency Metrics:** Measure character adherence
4. **Persuasion Research:** Analyze what makes arguments convincing
5. **Hallucination Patterns:** Identify common factual errors per model
