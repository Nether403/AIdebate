# Debate Components Integration Guide

## Quick Start

### 1. View the Example Page
The fastest way to see all components in action:

```bash
npm run dev
# Visit http://localhost:3000/debate/example
```

This shows all components with mock data, no database required.

---

## Integration with Backend

### Step 1: Ensure Database is Seeded

```bash
npm run db:seed
```

This creates:
- Sample models (GPT-5.1, Claude 4.5, Gemini 3.0, etc.)
- Sample topics (100 debate motions)
- Sample personas (10 characters)

### Step 2: Start a Debate

**Option A: Via UI**
1. Visit `http://localhost:3000/debate/new`
2. Select models, personas, and topic
3. Click "Start Debate"
4. You'll be redirected to the debate viewer

**Option B: Via API**
```bash
curl -X POST http://localhost:3000/api/debate/run \
  -H "Content-Type: application/json" \
  -d '{
    "proModelId": "model-uuid-1",
    "conModelId": "model-uuid-2",
    "topicId": null,
    "proPersonaId": null,
    "conPersonaId": null,
    "totalRounds": 3,
    "factCheckMode": "standard"
  }'
```

### Step 3: View the Debate

Visit `http://localhost:3000/debate/[debateId]` where `[debateId]` is the ID returned from the API.

---

## Component Usage Examples

### Using DebateOrchestrator (Simplest)

```tsx
import { DebateOrchestrator } from '@/components/debate'

export default function DebatePage({ params }: { params: { debateId: string } }) {
  return <DebateOrchestrator debateId={params.debateId} />
}
```

This single component handles everything:
- Fetching debate data
- Streaming updates
- Displaying transcript
- Showing winner

---

### Using Individual Components (Advanced)

```tsx
'use client'

import { useState, useEffect } from 'react'
import {
  DebateTranscript,
  VotingInterface,
  ProbabilityGraph
} from '@/components/debate'

export default function CustomDebatePage({ debateId }: { debateId: string }) {
  const [debate, setDebate] = useState(null)

  useEffect(() => {
    fetch(`/api/debate/${debateId}`)
      .then(res => res.json())
      .then(setDebate)
  }, [debateId])

  if (!debate) return <div>Loading...</div>

  return (
    <div>
      {/* Custom header */}
      <h1>{debate.topic.motion}</h1>

      {/* Probability graph */}
      <ProbabilityGraph
        turns={debate.turns}
        proModel={debate.proModel}
        conModel={debate.conModel}
      />

      {/* Transcript */}
      <DebateTranscript
        turns={debate.turns}
        proModel={debate.proModel}
        conModel={debate.conModel}
        factCheckMode={debate.factCheckMode}
      />

      {/* Voting (only if completed) */}
      {debate.status === 'completed' && (
        <VotingInterface
          debateId={debate.id}
          proModel={debate.proModel}
          conModel={debate.conModel}
        />
      )}
    </div>
  )
}
```

---

## API Integration

### Required Endpoints

The components expect these endpoints to exist:

#### 1. GET `/api/debate/[debateId]`
Returns debate with all related data:
```typescript
{
  id: string
  topic: Topic
  proModel: Model
  conModel: Model
  proPersona: Persona | null
  conPersona: Persona | null
  turns: DebateTurn[]
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  // ... other fields
}
```

#### 2. GET `/api/debate/stream/[debateId]`
Server-Sent Events endpoint for real-time updates:
```typescript
// Event types:
{ type: 'turn', turn: DebateTurn }
{ type: 'status', status: string, winner?: string, completedAt?: Date }
```

#### 3. POST `/api/debate/run`
Starts a new debate:
```typescript
// Request body:
{
  proModelId: string
  conModelId: string
  topicId: string | null  // null for random
  proPersonaId: string | null
  conPersonaId: string | null
  totalRounds: number
  factCheckMode: 'off' | 'standard' | 'strict'
}

// Response:
{
  debateId: string
  status: string
}
```

#### 4. POST `/api/debate/vote`
Submits a user vote:
```typescript
// Request body:
{
  debateId: string
  vote: 'pro' | 'con' | 'tie'
}

// Response:
{
  success: boolean
}
```

#### 5. GET `/api/models`
Returns all active models:
```typescript
Model[]
```

#### 6. GET `/api/topics`
Returns all active topics:
```typescript
Topic[]
```

#### 7. GET `/api/personas`
Returns all active personas:
```typescript
Persona[]
```

---

## Streaming Setup

### Backend (Next.js API Route)

```typescript
// app/api/debate/stream/[debateId]/route.ts
import { NextRequest } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { debateId: string } }
) {
  const encoder = new TextEncoder()
  
  const stream = new ReadableStream({
    async start(controller) {
      // Send initial connection message
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: 'connected' })}\n\n`)
      )

      // Subscribe to debate updates (implementation depends on your setup)
      // Example: poll database or use pub/sub
      const interval = setInterval(async () => {
        const turn = await getLatestTurn(params.debateId)
        if (turn) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'turn', turn })}\n\n`)
          )
        }
      }, 1000)

      // Cleanup
      request.signal.addEventListener('abort', () => {
        clearInterval(interval)
        controller.close()
      })
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
```

### Frontend (Already Implemented)

The DebateOrchestrator component automatically connects to the SSE endpoint when a debate is in progress.

---

## Styling Customization

### Theme Colors

The components use these Tailwind classes:

```typescript
// Backgrounds
'bg-slate-900'  // Main background
'bg-slate-800'  // Card background
'bg-slate-700'  // Input background

// Borders
'border-slate-700'  // Default border
'border-blue-500'   // Pro side
'border-red-500'    // Con side

// Text
'text-white'        // Primary text
'text-slate-300'    // Secondary text
'text-slate-400'    // Tertiary text

// Accents
'text-blue-400'     // Pro accent
'text-red-400'      // Con accent
'text-green-400'    // Verified
'text-yellow-400'   // Warning
```

### Custom Styling

To customize, wrap components in a div with custom classes:

```tsx
<div className="custom-debate-theme">
  <DebateOrchestrator debateId={debateId} />
</div>
```

Then add custom CSS:

```css
.custom-debate-theme {
  /* Override Tailwind classes */
  --color-pro: #your-color;
  --color-con: #your-color;
}
```

---

## Error Handling

### Component-Level Errors

All components handle errors gracefully:

```tsx
// DebateOrchestrator shows error state
if (error) {
  return (
    <div>
      <p>Error: {error}</p>
      <button onClick={retry}>Retry</button>
    </div>
  )
}
```

### API-Level Errors

Wrap API calls in try-catch:

```tsx
try {
  const response = await fetch('/api/debate/run', { ... })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error)
  }
} catch (error) {
  console.error('Failed to start debate:', error)
  setError(error.message)
}
```

---

## Performance Optimization

### 1. Lazy Loading

For large debates, consider lazy loading turns:

```tsx
import dynamic from 'next/dynamic'

const DebateTranscript = dynamic(
  () => import('@/components/debate').then(mod => mod.DebateTranscript),
  { loading: () => <p>Loading transcript...</p> }
)
```

### 2. Memoization

For expensive calculations:

```tsx
import { useMemo } from 'react'

const probabilityData = useMemo(() => {
  return calculateProbabilities(turns)
}, [turns])
```

### 3. Virtual Scrolling

For debates with 100+ turns, consider react-window:

```bash
npm install react-window
```

---

## Testing

### Unit Tests

```typescript
import { render, screen } from '@testing-library/react'
import { DebateTranscript } from '@/components/debate'

test('renders debate turns', () => {
  render(
    <DebateTranscript
      turns={mockTurns}
      proModel={mockProModel}
      conModel={mockConModel}
      factCheckMode="standard"
    />
  )
  
  expect(screen.getByText(/Round 1/i)).toBeInTheDocument()
})
```

### Integration Tests

```typescript
import { render, waitFor } from '@testing-library/react'
import { DebateOrchestrator } from '@/components/debate'

test('fetches and displays debate', async () => {
  render(<DebateOrchestrator debateId="test-id" />)
  
  await waitFor(() => {
    expect(screen.getByText(/AI development/i)).toBeInTheDocument()
  })
})
```

---

## Troubleshooting

### Issue: Components not rendering

**Solution:**
1. Check browser console for errors
2. Verify API endpoints are accessible
3. Check that data structure matches TypeScript interfaces

### Issue: Streaming not working

**Solution:**
1. Verify SSE endpoint returns correct headers
2. Check that debate status is 'in_progress'
3. Test SSE endpoint directly: `curl http://localhost:3000/api/debate/stream/[id]`

### Issue: Voting not working

**Solution:**
1. Check that debate status is 'completed'
2. Verify session tracking is enabled
3. Check browser cookies are enabled

### Issue: Probability graph not displaying

**Solution:**
1. Verify recharts is installed: `npm list recharts`
2. Check that turns array has data
3. Verify chart container has height

---

## Production Checklist

Before deploying to production:

- [ ] Test all components with real data
- [ ] Verify streaming works in production environment
- [ ] Test voting with multiple users
- [ ] Check mobile responsiveness
- [ ] Test with slow network connections
- [ ] Verify error handling for all edge cases
- [ ] Add loading skeletons for better UX
- [ ] Implement proper error boundaries
- [ ] Add analytics tracking
- [ ] Test accessibility with screen readers

---

## Support

For issues or questions:
1. Check the component README: `components/debate/README.md`
2. Review the example page: `/debate/example`
3. Check the task summary: `.kiro/specs/debate-benchmark-platform/TASK_8_SUMMARY.md`
