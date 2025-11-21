---
inclusion: always
---

# AI Debate Arena - Project Steering Guide

## Project Overview

This is the AI Debate Arena benchmark platform - a serious, scientifically rigorous LLM evaluation system that uses adversarial debates to bridge the gap between static benchmarks and real user experience.

**Key Innovation:** Dynamic, persona-driven debates with dual scoring (crowd votes + AI judge) to identify models that are persuasive vs. models that are logically rigorous.

## Core Architecture Principles

### 1. Multi-Agent Orchestration with LangGraph

This project uses **LangGraph** for stateful, cyclic debate orchestration. Key concepts:

- **Nodes** = Agents (Pro Debater, Con Debater, Fact-Checker, Judge, Moderator)
- **Edges** = Flow control with conditional routing
- **State** = Shared debate context persisted to Neon database
- **Checkpoints** = Recovery points for crash resilience

**Important:** Always use LangGraph for agent coordination, not simple linear chains.

### 2. Reflect-Critique-Refine (RCR) Prompting

All debater agents MUST use the three-phase RCR methodology:

1. **Reflection:** Analyze opponent's argument
2. **Critique:** Identify weaknesses and fallacies
3. **Refinement:** Construct targeted rebuttal

**Implementation:** Parse LLM responses for <reflection>, <critique>, and <speech> tags. Display reflection and critique in collapsible UI sections.

### 3. Fact-Checking as a Firewall

The Fact-Checker Agent acts as a "hallucination firewall":

- Intercepts turns before they reach the opponent
- Validates factual claims against Tavily Search API
- In **Strict Mode:** Rejects false claims and forces model to retry
- In **Standard Mode:** Flags claims but allows debate to continue

**Never skip fact-checking** - it's core to the benchmark's credibility.

### 4. Dual Scoring System

Maintain two independent rating systems:

- **Crowd Score:** Elo rating from user votes (measures persuasiveness)
- **AI Quality Score:** Glicko-2 rating from Judge Agent (measures logical rigor)

**Key Metric:** "Charismatic Liar Index" = High Crowd Score + Low AI Quality Score

### 5. Database: Neon PostgreSQL

Use **Neon** (not Supabase) for all database operations:

- Serverless PostgreSQL with branching support
- Use Drizzle ORM for type-safe queries
- Store all debate transcripts for transparency
- Use Neon's branching feature for testing schema changes

## Technology Stack

**Frontend:**
- Next.js 14+ with App Router
- TypeScript (strict mode)
- Tailwind CSS
- Framer Motion for animations
- Recharts for data visualization

**Backend:**
- Next.js API routes
- LangGraph + LangChain
- Neon PostgreSQL (via Drizzle ORM)
- Upstash Redis for caching

**External APIs:**
- OpenAI (GPT-5.1, GPT-4o-mini)
- Anthropic (Claude 4.5)
- Google (Gemini 3.0)
- xAI (Grok 4.1)
- Tavily Search API

## Code Style Guidelines

### TypeScript Standards

- Use strict TypeScript with no implicit any
- Define interfaces for all data structures
- Use Zod for runtime validation of API inputs
- Prefer type inference where obvious

### Component Structure

`	ypescript
// Good: Clear separation of concerns
interface DebateTranscriptProps {
  turns: Turn[]
  showFactChecks: boolean
  onTurnClick?: (turnId: string) => void
}

export function DebateTranscript({ turns, showFactChecks, onTurnClick }: DebateTranscriptProps) {
  // Component logic
}
`

### Error Handling

- Always use try-catch for async operations
- Implement exponential backoff for API retries (3 attempts)
- Log errors with context (debate_id, model_id, turn_number)
- Return user-friendly error messages

### Database Queries

`	ypescript
// Good: Use Drizzle ORM with type safety
const debate = await db.query.debates.findFirst({
  where: eq(debates.id, debateId),
  with: {
    turns: true,
    evaluations: true
  }
})

// Bad: Raw SQL strings (avoid unless necessary)
`

## Testing Requirements

### Unit Tests (Required for all core logic)

- Agent prompt generation
- Rating calculations (Glicko-2)
- Fact-check claim extraction
- Database operations

### Integration Tests (Required for workflows)

- End-to-end debate flow
- Judge evaluation with known transcripts
- Rating updates after batch of debates

### Performance Targets

- Debate completion: <5 minutes for 3 rounds
- Leaderboard query: <100ms
- Fact-check per claim: <10 seconds
- API response time: <200ms (excluding LLM calls)

## Security Best Practices

1. **Never commit API keys** - use environment variables
2. **Rate limit all endpoints** - 100 req/hour for anonymous, 500 for authenticated
3. **Validate all inputs** - use Zod schemas
4. **Sanitize user content** - especially topic submissions
5. **Implement CORS** - restrict to production domain
6. **Use JWT tokens** - with refresh token rotation

## Cost Management

### Token Usage Optimization

- Use GPT-4o-mini for Moderator (cheap, simple task)
- Use GPT-5.1 for Fact-Checker (needs precision)
- Use Claude 4.5 Sonnet or GPT-5.1 for Judge (needs reasoning)
- Cache frequently used prompts

### Daily Spending Caps

- Development: \/day
- Staging: \/day
- Production: \/day (with alerts at \)

### Cost Tracking

Log every API call with:
- Model used
- Tokens (input + output)
- Estimated cost
- Debate ID for attribution

## Common Pitfalls to Avoid

### ❌ Don't: Use simple chains for debate flow
**Why:** Debates are cyclic with conditional branching. Linear chains can't handle fact-check loop-backs or round transitions.
**Do:** Use LangGraph with proper state management.

### ❌ Don't: Skip position bias mitigation in judging
**Why:** Judges favor the first argument they read (position bias).
**Do:** Always evaluate debates in both orders (Pro first, then Con first) and check for consensus.

### ❌ Don't: Store API keys in code or database
**Why:** Security risk and makes key rotation difficult.
**Do:** Use environment variables and secret management.

### ❌ Don't: Allow unlimited API calls
**Why:** Cost overruns and potential abuse.
**Do:** Implement rate limiting and daily spending caps.

### ❌ Don't: Use Elo for ratings
**Why:** Elo doesn't handle rating uncertainty or volatility well for LLMs.
**Do:** Use Glicko-2 which tracks rating deviation and volatility.

## File Organization

`
/app
  /api
    /debate
      /run/route.ts
      /judge/route.ts
      /vote/route.ts
    /leaderboard/route.ts
  /(routes)
    /debate/[id]/page.tsx
    /leaderboard/page.tsx
/components
  /debate
    /DebateOrchestrator.tsx
    /DebateTranscript.tsx
    /FactCheckBadge.tsx
  /leaderboard
    /LeaderboardTable.tsx
    /ModelCard.tsx
/lib
  /agents
    /graph.ts
    /debater.ts
    /fact-checker.ts
    /judge.ts
    /moderator.ts
    /topic-generator.ts
  /debate
    /engine.ts
    /config.ts
  /llm
    /client.ts
    /providers/
  /rating
    /engine.ts
    /glicko2.ts
  /db
    /schema.ts
    /client.ts
/types
  /debate.ts
  /agent.ts
  /rating.ts
`

## Debugging Tips

### LangGraph State Issues

If debates get stuck or state is corrupted:
1. Check checkpoint table in Neon
2. Verify state schema matches SharedDebateState interface
3. Look for unhandled exceptions in node execution
4. Use LangGraph's built-in debugging tools

### Fact-Checker Timeouts

If fact-checking is slow:
1. Check Tavily API response times
2. Reduce number of claims extracted per turn
3. Implement parallel claim verification
4. Consider caching common claims

### Rating Calculation Errors

If leaderboard shows unexpected rankings:
1. Verify Glicko-2 parameters (τ=0.5, initial RD=350)
2. Check that batch updates run every 24 hours
3. Ensure rating_deviation decreases with more games
4. Validate that ties are handled correctly

## Environment Variables Required

`ash
# Database
DATABASE_URL=postgresql://...  # Neon connection string
REDIS_URL=redis://...          # Upstash Redis

# LLM Providers
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=...
XAI_API_KEY=...

# Search
TAVILY_API_KEY=tvly-...

# Auth
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...

# Monitoring
SENTRY_DSN=...  # Optional
`

## Reference Documents

Always refer to these documents when implementing features:

- **requirements.md** - What needs to be built (EARS format)
- **design.md** - How to build it (architecture, interfaces)
- **tasks.md** - Step-by-step implementation plan

## Getting Help

When stuck:
1. Check the design document for architecture guidance
2. Review requirements for acceptance criteria
3. Look at similar implementations in the codebase
4. Consult LangGraph documentation for agent orchestration
5. Check Neon docs for database-specific features
