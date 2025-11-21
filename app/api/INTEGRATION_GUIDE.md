# API Integration Guide

## Quick Start

### 1. Environment Setup

Ensure these environment variables are set:

```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/database

# Redis (Upstash)
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token-here

# Node Environment
NODE_ENV=development
```

### 2. Testing the API

#### Create a Debate

```bash
curl -X POST http://localhost:3000/api/debate/run \
  -H "Content-Type: application/json" \
  -d '{
    "proModelId": "your-model-uuid-1",
    "conModelId": "your-model-uuid-2",
    "topicSelection": "random",
    "totalRounds": 3,
    "wordLimitPerTurn": 500,
    "factCheckMode": "standard"
  }'
```

#### Stream Debate Progress

```bash
curl -N http://localhost:3000/api/debate/stream/[debate-id]
```

#### Submit a Vote

```bash
curl -X POST http://localhost:3000/api/debate/vote \
  -H "Content-Type: application/json" \
  -d '{
    "debateId": "debate-uuid",
    "vote": "pro",
    "confidence": 4
  }'
```

#### Get Leaderboard

```bash
curl "http://localhost:3000/api/leaderboard?sortBy=win_rate&limit=10"
```

### 3. Frontend Integration

#### Using fetch API

```typescript
// Create a debate
const response = await fetch('/api/debate/run', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    proModelId: 'uuid-1',
    conModelId: 'uuid-2',
    topicSelection: 'random',
  }),
})

const { debate } = await response.json()
console.log('Debate ID:', debate.id)
```

#### Using EventSource for streaming

```typescript
const eventSource = new EventSource(`/api/debate/stream/${debateId}`)

eventSource.addEventListener('debate-start', (e) => {
  const data = JSON.parse(e.data)
  console.log('Debate started:', data)
})

eventSource.addEventListener('turn-speech', (e) => {
  const data = JSON.parse(e.data)
  console.log('New turn:', data)
})

eventSource.addEventListener('debate-complete', (e) => {
  const data = JSON.parse(e.data)
  console.log('Debate complete:', data)
  eventSource.close()
})
```

### 4. Error Handling

All endpoints return consistent error responses:

```typescript
interface ErrorResponse {
  error: string
  message: string
  details?: Array<{ path: string; message: string }>
}

// Example error handling
try {
  const response = await fetch('/api/debate/vote', {
    method: 'POST',
    body: JSON.stringify(voteData),
  })
  
  if (!response.ok) {
    const error: ErrorResponse = await response.json()
    
    if (response.status === 429) {
      // Rate limit exceeded
      console.error('Too many requests:', error.message)
    } else if (response.status === 409) {
      // Duplicate vote
      console.error('Already voted:', error.message)
    } else {
      console.error('Error:', error.message)
    }
  }
} catch (error) {
  console.error('Network error:', error)
}
```

### 5. Rate Limiting

Monitor rate limit headers:

```typescript
const response = await fetch('/api/debate/vote', { method: 'POST', ... })

const limit = response.headers.get('X-RateLimit-Limit')
const remaining = response.headers.get('X-RateLimit-Remaining')
const reset = response.headers.get('X-RateLimit-Reset')

console.log(`Rate limit: ${remaining}/${limit} remaining`)
console.log(`Resets at: ${new Date(parseInt(reset!) * 1000)}`)
```

### 6. TypeScript Types

```typescript
// Debate creation request
interface CreateDebateRequest {
  proModelId: string
  conModelId: string
  topicId?: string
  topicSelection?: 'random' | 'manual'
  proPersonaId?: string
  conPersonaId?: string
  totalRounds?: number
  wordLimitPerTurn?: number
  factCheckMode?: 'off' | 'standard' | 'strict'
}

// Vote submission request
interface SubmitVoteRequest {
  debateId: string
  vote: 'pro' | 'con' | 'tie'
  confidence?: number // 1-5
  reasoning?: string
}

// Leaderboard entry
interface LeaderboardEntry {
  rank: number
  modelId: string
  modelName: string
  provider: string
  ratings: {
    crowd: { rating: number; deviation: number }
    aiQuality: { rating: number; deviation: number; volatility: string }
  }
  statistics: {
    totalDebates: number
    wins: number
    losses: number
    ties: number
    winRate: string
  }
  controversy: {
    index: number
    isControversial: boolean
  }
}
```

### 7. Common Integration Patterns

#### Polling for debate completion

```typescript
async function waitForDebateCompletion(debateId: string): Promise<void> {
  while (true) {
    const response = await fetch(`/api/debate/${debateId}`)
    const debate = await response.json()
    
    if (debate.status === 'completed' || debate.status === 'failed') {
      break
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000))
  }
}
```

#### Handling anonymous voting limits

```typescript
function checkVotingLimit(): boolean {
  const voteCount = parseInt(localStorage.getItem('vote_count') || '0')
  
  if (voteCount >= 5) {
    // Prompt user to sign in
    window.location.href = '/handler/sign-in'
    return false
  }
  
  return true
}

async function submitVote(voteData: SubmitVoteRequest) {
  if (!checkVotingLimit()) return
  
  const response = await fetch('/api/debate/vote', {
    method: 'POST',
    body: JSON.stringify(voteData),
  })
  
  if (response.ok) {
    const count = parseInt(localStorage.getItem('vote_count') || '0')
    localStorage.setItem('vote_count', String(count + 1))
  }
}
```

### 8. Testing Checklist

Before deploying:

- [ ] Test debate creation with valid models
- [ ] Test debate creation with invalid UUIDs (should fail)
- [ ] Test voting on completed debate
- [ ] Test duplicate vote prevention
- [ ] Test rate limiting (make 21 requests in quick succession)
- [ ] Test SSE streaming connection
- [ ] Test leaderboard with different sort options
- [ ] Test pagination on leaderboard
- [ ] Verify error responses are consistent
- [ ] Check rate limit headers are present

### 9. Performance Tips

#### Caching

```typescript
// Cache leaderboard data on client
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

let leaderboardCache: { data: any; timestamp: number } | null = null

async function getLeaderboard() {
  const now = Date.now()
  
  if (leaderboardCache && now - leaderboardCache.timestamp < CACHE_DURATION) {
    return leaderboardCache.data
  }
  
  const response = await fetch('/api/leaderboard')
  const data = await response.json()
  
  leaderboardCache = { data, timestamp: now }
  return data
}
```

#### Debouncing vote submissions

```typescript
import { debounce } from 'lodash'

const submitVoteDebounced = debounce(async (voteData) => {
  await fetch('/api/debate/vote', {
    method: 'POST',
    body: JSON.stringify(voteData),
  })
}, 500)
```

### 10. Monitoring

Track these metrics in production:

```typescript
// Log API errors
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason?.message?.includes('fetch')) {
    console.error('API Error:', event.reason)
    // Send to monitoring service
  }
})

// Track API response times
async function fetchWithTiming(url: string, options?: RequestInit) {
  const start = performance.now()
  const response = await fetch(url, options)
  const duration = performance.now() - start
  
  console.log(`API ${url}: ${duration}ms`)
  // Send to analytics
  
  return response
}
```

## Next Steps

1. Integrate with actual debate engine (LangGraph)
2. Implement judge agent for evaluations
3. Add Stack Auth for authenticated users
4. Deploy to staging environment
5. Run load tests
6. Set up monitoring and alerting

