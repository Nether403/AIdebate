# LangGraph Multi-Agent Debate Orchestration

This module implements the core debate orchestration system using LangGraph for stateful, cyclic multi-agent workflows with conditional routing and checkpointing.

## Architecture

### Graph Structure

```
START
  ↓
Moderator (announces round, enforces rules)
  ↓
Pro Debater (generates RCR turn)
  ↓
Fact Checker
  ↓ (if strict mode + false claim + retries < 3)
  ↻ Loop back to Pro Debater
  ↓ (otherwise)
Con Debater (generates RCR turn)
  ↓
Fact Checker
  ↓ (if strict mode + false claim + retries < 3)
  ↻ Loop back to Con Debater
  ↓ (otherwise)
Round Transition (persist turns, check completion)
  ↓ (if more rounds)
  ↻ Loop back to Moderator
  ↓ (if complete)
END
```

## Nodes

### 1. Moderator Node (`moderator.ts`)

**Responsibilities:**
- Announce current round and debate rules
- Enforce word count limits (200-500 words)
- Validate turn structure
- Reset turn-specific state

**Key Functions:**
- `moderatorNode(state)` - Main node function
- `validateDebateConfig(state)` - Validate debate configuration
- `enforceWordLimit(text, limit)` - Truncate text to word limit

### 2. Debater Nodes (`debater.ts`)

**Responsibilities:**
- Generate debate turns using RCR (Reflect-Critique-Refine) methodology
- Apply persona system prompts if configured
- Parse LLM responses into structured phases
- Track token usage and latency

**Key Functions:**
- `proDebaterNode(state)` - Pro debater node
- `conDebaterNode(state)` - Con debater node
- `generateDebaterTurn(state, side)` - Core turn generation logic
- `streamDebaterTurn(state, side)` - Streaming version (future)

**RCR Prompt Structure:**
```
PHASE 1 - REFLECTION:
Analyze the current state of the debate and opponent's argument.

PHASE 2 - CRITIQUE:
Identify weaknesses, fallacies, and counterarguments.

PHASE 3 - REFINEMENT:
Construct the final speech targeting identified weaknesses.
```

### 3. Fact-Checker Node (`fact-checker.ts`)

**Responsibilities:**
- Extract verifiable claims from debate turns
- Verify claims using Tavily Search API
- Determine verdict: true, false, or unverifiable
- Reject turns in strict mode if false claims detected

**Key Functions:**
- `factCheckerNode(state)` - Main node function
- `extractClaims(text)` - Extract claims using LLM
- `verifyClaim(claim)` - Verify claim against search results
- `calculateFactualityScore(results)` - Calculate factuality score

**Fact-Check Modes:**
- `off` - No fact-checking
- `standard` - Flag false claims but allow turn
- `strict` - Reject turn and loop back if false claim detected

### 4. Round Transition Node (`round-transition.ts`)

**Responsibilities:**
- Check if round is complete (both Pro and Con have spoken)
- Persist completed turns to database
- Persist fact-check results to database
- Advance to next round or end debate
- Update debate status

**Key Functions:**
- `roundTransitionNode(state)` - Main node function
- `persistTurn(state)` - Save turn to database
- `persistRejectedTurn(state)` - Save rejected turn for analytics
- `calculateDebateStats(state)` - Calculate debate statistics

## State Management

### Shared Debate State

The `DebateState` is shared across all nodes and includes:

**Core Identifiers:**
- `debateId` - Unique debate identifier
- `topicMotion` - Debate topic/motion
- `proModelId`, `conModelId` - Model identifiers
- `proPersonaId`, `conPersonaId` - Optional persona identifiers

**Progress Tracking:**
- `currentRound` - Current round number (1-based)
- `totalRounds` - Total number of rounds
- `currentSpeaker` - Current speaker ('pro' or 'con')

**Configuration:**
- `wordLimitPerTurn` - Maximum words per turn (200-1000)
- `factCheckMode` - Fact-checking mode ('off', 'standard', 'strict')

**Transcript:**
- `transcript` - Array of completed turns with RCR phases
- `factCheckLogs` - Array of fact-check results

**Current Turn:**
- `currentTurnDraft` - Turn being processed
- `currentFactCheckResults` - Fact-check results for current turn
- `shouldRejectTurn` - Flag to reject turn (strict mode)
- `retryCount` - Number of retries for current turn

**Control Flags:**
- `isDebateComplete` - Debate completion flag
- `metadata` - Additional metadata

### State Reducers

- **Transcript:** Appends new turns to array
- **Fact-check logs:** Appends new results to array
- **Scratchpads:** Replaces with new value
- **Metadata:** Merges with existing metadata

## Conditional Routing

### Fact-Checker Routing

After fact-checking, the graph routes based on:

1. **Loop back to Pro Debater** if:
   - Fact-check mode is 'strict'
   - Current speaker is 'pro'
   - Turn should be rejected (false claim detected)
   - Retry count < 3

2. **Loop back to Con Debater** if:
   - Fact-check mode is 'strict'
   - Current speaker is 'con'
   - Turn should be rejected (false claim detected)
   - Retry count < 3

3. **Continue to Con Debater** if:
   - Current speaker is 'pro' and turn accepted

4. **Continue to Round Transition** if:
   - Current speaker is 'con' and turn accepted

### Round Transition Routing

After round transition, the graph routes based on:

1. **Continue to Moderator** if:
   - Debate is not complete (more rounds remaining)

2. **End** if:
   - Debate is complete (all rounds finished)

## Usage

### Initialize and Run a Debate

```typescript
import { runDebate, initializeDebateState } from '@/lib/agents'
import type { DebateConfig } from '@/lib/debate/config'

const config: DebateConfig = {
  proModelId: 'model-pro-123',
  conModelId: 'model-con-456',
  topicSelection: 'manual',
  topicId: 'topic-123',
  totalRounds: 3,
  wordLimitPerTurn: 500,
  factCheckMode: 'standard',
}

// Run complete debate
const finalState = await runDebate('debate-123', config)

console.log('Debate complete!')
console.log('Total turns:', finalState.transcript.length)
console.log('Winner:', finalState.metadata.winner)
```

### Stream a Debate (Real-time Updates)

```typescript
import { streamDebate } from '@/lib/agents'

for await (const state of streamDebate('debate-123', config)) {
  console.log('Current round:', state.currentRound)
  console.log('Current speaker:', state.currentSpeaker)
  
  if (state.currentTurnDraft) {
    console.log('Speech:', state.currentTurnDraft.speech)
  }
}
```

### Validate Configuration

```typescript
import { validateDebateConfig } from '@/lib/agents'

const errors = validateDebateConfig(state)

if (errors.length > 0) {
  console.error('Invalid configuration:', errors)
}
```

## Testing

Run the test suite:

```bash
npx tsx lib/agents/__tests__/run-tests.ts
```

Tests cover:
- ✓ Debate configuration validation
- ✓ State annotation structure
- ✓ Conditional routing logic
- ✓ Transcript accumulation
- ✓ Metadata updates
- ✓ Strict mode loop-back behavior
- ✓ Max retries enforcement

## Environment Variables

Required for fact-checking:

```env
TAVILY_API_KEY=tvly-...
```

Required for LLM providers:

```env
OPENAI_API_KEY=sk-...
GOOGLE_API_KEY=...
```

## Error Handling

### Retry Logic

- **Fact-checker errors:** Don't reject turn, log error in metadata
- **LLM errors:** Propagate to caller for handling
- **Database errors:** Propagate to caller for handling

### Max Retries

In strict mode, if a turn is rejected 3 times, the graph continues anyway to prevent infinite loops.

## Performance Considerations

### Token Usage

- **Moderator:** Minimal (no LLM calls)
- **Debater:** ~1000-2000 tokens per turn
- **Fact-checker:** ~500-1000 tokens per claim (3-5 claims per turn)
- **Total per round:** ~5000-10000 tokens

### Latency

- **Moderator:** <10ms
- **Debater:** 5-15 seconds (depends on LLM)
- **Fact-checker:** 10-30 seconds (depends on Tavily + LLM)
- **Round transition:** 100-500ms (database writes)
- **Total per round:** 30-60 seconds

### Cost Optimization

- Use GPT-4o-mini for claim extraction (cheaper)
- Use GPT-5.1 for evidence analysis (more accurate)
- Limit to 5 claims per turn to control costs
- Cache frequently used prompts

## Future Enhancements

### Phase 2
- [ ] Streaming support for real-time UI updates
- [ ] Parallel fact-checking for multiple claims
- [ ] Checkpoint recovery from database
- [ ] Debate pause/resume functionality

### Phase 3
- [ ] Multi-model debates (3+ participants)
- [ ] Dynamic round adjustment based on quality
- [ ] Automatic topic generation integration
- [ ] Advanced persona consistency checking

## References

- [LangGraph Documentation](https://langchain-ai.github.io/langgraph/)
- [Tavily Search API](https://tavily.com/)
- [RCR Prompting Methodology](../debate/README.md)

