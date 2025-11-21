# Debate Engine

Core debate orchestration system for the AI Debate Arena platform.

## Overview

The Debate Engine manages the complete lifecycle of debates between LLM models, including:

- Debate initialization and configuration
- State management and persistence
- Transcript recording and export
- Checkpoint/recovery system for crash resilience

## Components

### DebateEngine

Main orchestrator for debate lifecycle management.

```typescript
import { createDebateEngine } from '@/lib/debate'

const engine = createDebateEngine()

// Initialize a new debate
const session = await engine.initializeDebate(config)

// Start the debate
await engine.startDebate(session.id)

// Advance through rounds
await engine.advanceRound(session.id)

// Complete the debate
await engine.completeDebate(session.id)

// Recover from crash
const recovered = await engine.recoverDebate(session.id)
```

### DebateConfigBuilder

Fluent interface for constructing debate configurations with validation.

```typescript
import { createDebateConfig } from '@/lib/debate'

const config = createDebateConfig()
  .withModels(modelAId, modelBId)  // Random position assignment
  .withTopic(topicId)               // Or .withRandomTopic()
  .withPersonas(personaAId, personaBId)
  .withRounds(3)
  .withWordLimit(500)
  .withFactCheckMode('strict')
  .build()
```

### DebateTranscriptManager

Handles storage, retrieval, and formatting of debate transcripts.

```typescript
import { createTranscriptManager } from '@/lib/debate'

const transcript = createTranscriptManager(debateId)

// Store a turn
await transcript.storeTurn({
  roundNumber: 1,
  side: 'pro',
  modelId: modelId,
  reflection: '...',
  critique: '...',
  speech: '...',
  wordCount: 450,
})

// Get full transcript
const full = await transcript.getFullTranscript()

// Export in different formats
const json = await transcript.exportTranscript('json')
const markdown = await transcript.exportTranscript('markdown')
const text = await transcript.exportTranscript('text')

// Get statistics
const stats = await transcript.getStatistics()
```

## Configuration Options

### DebateConfig

```typescript
interface DebateConfig {
  // Model selection (required)
  proModelId: string
  conModelId: string
  
  // Persona assignment (optional)
  proPersonaId?: string | null
  conPersonaId?: string | null
  
  // Topic selection
  topicId?: string
  topicSelection: 'random' | 'manual'
  
  // Debate parameters
  totalRounds: number        // Default: 3
  wordLimitPerTurn: number   // Default: 500
  
  // Fact-checking
  factCheckMode: 'standard' | 'strict' | 'off'  // Default: 'standard'
}
```

### Fact-Check Modes

- **standard**: Flags false claims but allows debate to continue
- **strict**: Rejects turns with false claims and forces retry
- **off**: No fact-checking performed

## State Management

### DebateState

```typescript
interface DebateState {
  id: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  currentRound: number
  totalRounds: number
  topicId: string
  topicMotion: string
  proModelId: string
  conModelId: string
  proPersonaId: string | null
  conPersonaId: string | null
  factCheckMode: string
  wordLimitPerTurn: number
  startedAt: Date | null
  completedAt: Date | null
  lastCheckpoint: Date
}
```

### Checkpoint/Recovery

The engine automatically creates checkpoints after state changes:

- Debate initialization
- Debate start
- Round advancement
- Debate completion

To recover from a crash:

```typescript
const session = await engine.recoverDebate(debateId)
// Session is restored to last checkpoint
```

## Transcript Format

### TranscriptEntry

```typescript
interface TranscriptEntry {
  turn: DebateTurn
  modelName: string
  personaName?: string
  roundLabel: string      // e.g., "Round 1"
  sideLabel: string       // "Pro" or "Con"
}
```

### Export Formats

**JSON**: Complete structured data
```json
{
  "debateId": "...",
  "topic": "...",
  "entries": [...]
}
```

**Markdown**: Human-readable with formatting
```markdown
# Debate Transcript

**Topic:** ...

## Round 1 - Pro
...
```

**Text**: Plain text for simple consumption
```
DEBATE TRANSCRIPT
=================

Topic: ...
```

## Testing

Run the debate engine tests:

```bash
npm run test:debate
```

Or run specific test files:

```bash
tsx lib/debate/__tests__/run-tests.ts
```

## Requirements Mapping

This module implements:

- **Requirement 1**: Core Debate Execution
  - Three-round debate structure
  - Word count enforcement (200-500 words)
  - Complete transcript storage
  - Random position assignment
  - Simultaneous debate support

- **Requirement 2**: Persona-Driven Debate System
  - Persona selection and assignment
  - Persona usage tracking

- **Requirement 3**: Real-Time LLM Integration
  - Checkpoint/recovery system for crash resilience
  - State persistence

- **Requirement 9**: Data Persistence and Transparency
  - Complete transcript storage
  - Multiple export formats
  - Anonymized data export capability

- **Requirement 12**: Topic Selection and Diversity
  - Random and manual topic selection
  - Topic usage tracking

## Next Steps

This module provides the foundation for:

1. **LangGraph Integration** (Task 4): Multi-agent orchestration
2. **API Endpoints** (Task 7): REST API for debate management
3. **Frontend Integration** (Task 8): Real-time debate viewing

## Architecture Notes

- Uses Drizzle ORM for type-safe database operations
- Implements builder pattern for configuration
- Supports fluent API for ease of use
- Validates all inputs with Zod schemas
- Provides comprehensive error handling
- Designed for horizontal scaling (stateless operations)
