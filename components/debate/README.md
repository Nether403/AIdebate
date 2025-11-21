# Debate Components

This directory contains all the frontend components for the AI Debate Arena debate viewer and configuration system.

## Components Overview

### 1. DebateOrchestrator
**File:** `DebateOrchestrator.tsx`

The main orchestrator component that manages the entire debate viewing experience.

**Features:**
- Fetches debate data from API
- Handles real-time streaming updates via Server-Sent Events (SSE)
- Displays debate header with topic, models, and status
- Shows debate transcript
- Displays winner information when debate completes

**Props:**
```typescript
interface DebateOrchestratorProps {
  debateId: string
}
```

**Usage:**
```tsx
import { DebateOrchestrator } from '@/components/debate'

<DebateOrchestrator debateId="debate-uuid" />
```

---

### 2. DebateTranscript
**File:** `DebateTranscript.tsx`

Displays the complete debate transcript with turn-by-turn breakdown.

**Features:**
- Shows each turn with speaker identification (Pro/Con)
- Collapsible RCR (Reflect-Critique-Refine) thinking sections
- Fact-check indicator badges (Verified, Red Flag, Unverifiable)
- Turn metadata (tokens used, latency, retries)
- Color-coded by side (blue for Pro, red for Con)

**Props:**
```typescript
interface DebateTranscriptProps {
  turns: DebateTurn[]
  proModel: Model
  conModel: Model
  factCheckMode: string
}
```

**Usage:**
```tsx
import { DebateTranscript } from '@/components/debate'

<DebateTranscript
  turns={debate.turns}
  proModel={debate.proModel}
  conModel={debate.conModel}
  factCheckMode="standard"
/>
```

---

### 3. DebateConfigForm
**File:** `DebateConfigForm.tsx`

Form component for configuring and starting new debates.

**Features:**
- Model selection (Pro and Con)
- Persona selection (optional)
- Topic selection (random or manual)
- Debate settings (rounds, fact-checking mode)
- Validation to prevent same model on both sides

**Props:**
```typescript
interface DebateConfigFormProps {
  onSubmit: (config: DebateConfig) => void
  isLoading?: boolean
}

interface DebateConfig {
  proModelId: string
  conModelId: string
  topicId: string | null
  proPersonaId: string | null
  conPersonaId: string | null
  totalRounds: number
  factCheckMode: 'off' | 'standard' | 'strict'
}
```

**Usage:**
```tsx
import { DebateConfigForm } from '@/components/debate'

<DebateConfigForm
  onSubmit={(config) => startDebate(config)}
  isLoading={isStarting}
/>
```

---

### 4. VotingInterface
**File:** `VotingInterface.tsx`

Anonymous voting interface that prevents brand bias.

**Features:**
- Displays models as "Model A" and "Model B" (randomly assigned)
- Three voting options: A, B, or Tie
- Reveals model identities only after vote submission
- Vote confirmation feedback
- Prevents duplicate votes via session tracking

**Props:**
```typescript
interface VotingInterfaceProps {
  debateId: string
  proModel: Model
  conModel: Model
  onVoteSubmitted?: () => void
}
```

**Usage:**
```tsx
import { VotingInterface } from '@/components/debate'

<VotingInterface
  debateId={debate.id}
  proModel={debate.proModel}
  conModel={debate.conModel}
  onVoteSubmitted={() => refreshDebate()}
/>
```

---

### 5. ProbabilityGraph
**File:** `ProbabilityGraph.tsx`

Live probability chart showing predicted winner as debate progresses.

**Features:**
- Real-time line chart using Recharts
- Probability calculation based on fact-checks and turn quality
- Current odds display for both sides
- Responsive design
- Prediction market integration ready

**Props:**
```typescript
interface ProbabilityGraphProps {
  turns: DebateTurn[]
  proModel: Model
  conModel: Model
  currentOdds?: {
    pro: number
    con: number
    tie: number
  }
}
```

**Usage:**
```tsx
import { ProbabilityGraph } from '@/components/debate'

<ProbabilityGraph
  turns={debate.turns}
  proModel={debate.proModel}
  conModel={debate.conModel}
  currentOdds={{ pro: 52, con: 48, tie: 0 }}
/>
```

---

## Supporting API Endpoints

The components rely on these API endpoints:

### GET `/api/debate/[debateId]`
Fetches complete debate data including turns, fact-checks, and related entities.

### GET `/api/debate/stream/[debateId]`
Server-Sent Events endpoint for real-time debate updates.

### POST `/api/debate/run`
Starts a new debate with the provided configuration.

### POST `/api/debate/vote`
Submits a user vote for a completed debate.

### GET `/api/models`
Fetches all active models for selection.

### GET `/api/topics`
Fetches all active topics for selection.

### GET `/api/personas`
Fetches all active personas for selection.

---

## Example Pages

### `/debate/new`
Page for creating new debates using DebateConfigForm.

### `/debate/[debateId]`
Page for viewing a specific debate using DebateOrchestrator.

### `/debate/example`
Demo page showing all components with mock data.

---

## Styling

All components use:
- **Tailwind CSS** for styling
- **Dark theme** (slate-900/slate-800 background)
- **Color coding:**
  - Blue for Pro position
  - Red for Con position
  - Green for verified facts
  - Red for false claims
  - Yellow for warnings/ties

---

## Dependencies

- `react` - Core React library
- `next` - Next.js framework
- `lucide-react` - Icon library
- `recharts` - Charting library for probability graph
- `framer-motion` - Animation library (optional, for future enhancements)

---

## Future Enhancements

1. **Real-time animations** - Add Framer Motion animations for turn transitions
2. **Audio narration** - TTS for debate speeches
3. **Mobile optimization** - Improved responsive design
4. **Accessibility** - ARIA labels and keyboard navigation
5. **Social sharing** - Share debate cards for social media
6. **Debate comparison** - Side-by-side comparison of multiple debates
7. **Advanced filtering** - Filter turns by fact-check results, word count, etc.

---

## Testing

To test the components:

1. **With mock data:**
   ```bash
   # Visit the example page
   http://localhost:3000/debate/example
   ```

2. **With real data:**
   ```bash
   # Ensure database is seeded
   npm run db:seed
   
   # Start a debate via API or UI
   # Then visit the debate page
   http://localhost:3000/debate/[debateId]
   ```

---

## Troubleshooting

### Components not rendering
- Check that all required props are provided
- Verify API endpoints are returning correct data structure
- Check browser console for errors

### Streaming not working
- Ensure SSE endpoint is properly configured
- Check that debate status is 'in_progress'
- Verify EventSource is supported in browser

### Voting not working
- Check that session tracking is enabled
- Verify vote API endpoint is accessible
- Ensure debate is in 'completed' status

---

## Contributing

When adding new components:
1. Follow the existing naming conventions
2. Add TypeScript interfaces for all props
3. Include JSDoc comments for complex functions
4. Update this README with component documentation
5. Add example usage in `/debate/example` page
