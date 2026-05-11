# API Endpoints Documentation

This directory contains all API endpoints for the AI Debate Arena platform.

## Endpoints Overview

### Debate Management

#### POST /api/debate/run
Initialize and start a new debate between two models.

**Request Body:**
```json
{
  "proModelId": "uuid",
  "conModelId": "uuid",
  "topicId": "uuid (optional)",
  "topicSelection": "random | manual",
  "proPersonaId": "uuid (optional)",
  "conPersonaId": "uuid (optional)",
  "totalRounds": 3,
  "wordLimitPerTurn": 500,
  "factCheckMode": "off | standard | strict"
}
```

**Response:**
```json
{
  "success": true,
  "debate": {
    "id": "uuid",
    "status": "in_progress",
    "topicMotion": "string",
    "proModelId": "uuid",
    "conModelId": "uuid",
    "currentRound": 1,
    "totalRounds": 3,
    "startedAt": "ISO 8601 timestamp"
  },
  "message": "Debate initialized successfully"
}
```

**Rate Limit:** 10 requests per hour per IP

---

#### GET /api/debate/stream/[debateId]
Stream debate progress in real-time using Server-Sent Events (SSE).

**Events:**
- `debate-start`: Initial debate information
- `turn-reflection`: RCR reflection phase
- `turn-critique`: RCR critique phase
- `turn-speech`: Final speech with fact-check results
- `debate-complete`: Debate finished

**Example Event:**
```
event: turn-speech
data: {
  "turnId": "uuid",
  "roundNumber": 1,
  "side": "pro",
  "speech": "...",
  "wordCount": 450,
  "factChecksPassed": 3,
  "factChecksFailed": 0
}
```

**Rate Limit:** 100 requests per hour per IP

---

#### POST /api/debate/judge
Trigger AI judge evaluation for a completed debate.

**Request Body:**
```json
{
  "debateId": "uuid",
  "judgeModel": "gemini-3.0-pro (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "evaluation": {
    "id": "uuid",
    "winner": "pro | con | tie",
    "proScore": 7.5,
    "conScore": 6.8,
    "reasoning": "...",
    "rubricScores": {
      "logicalCoherence": { "pro": 8, "con": 7 },
      "rebuttalStrength": { "pro": 7, "con": 6 },
      "factuality": { "pro": 8, "con": 7 }
    },
    "positionBiasDetected": false,
    "judgeModel": "gemini-3.0-pro"
  }
}
```

**Rate Limit:** 100 requests per hour per IP

---

### Voting

#### POST /api/debate/vote
Submit a vote for a completed debate.

**Request Body:**
```json
{
  "debateId": "uuid",
  "vote": "pro | con | tie",
  "confidence": 4,
  "reasoning": "Optional explanation"
}
```

**Response:**
```json
{
  "success": true,
  "vote": {
    "id": "uuid",
    "vote": "pro",
    "createdAt": "ISO 8601 timestamp"
  },
  "modelIdentities": {
    "pro": {
      "id": "uuid",
      "name": "GPT-5.1",
      "provider": "openai"
    },
    "con": {
      "id": "uuid",
      "name": "Claude 4.5",
      "provider": "anthropic"
    }
  },
  "voteCount": {
    "pro": 45,
    "con": 32,
    "tie": 8
  }
}
```

**Rate Limit:** 20 votes per hour per IP

**Notes:**
- Duplicate votes from the same session are rejected (409 Conflict)
- Model identities are revealed only after voting
- Anonymous voting uses session cookies
- Authenticated users (future) will have higher limits

---

### Leaderboard

#### GET /api/leaderboard
Retrieve the model leaderboard with sorting and filtering.

**Query Parameters:**
- `sortBy`: `win_rate | crowd_rating | ai_quality_rating | total_debates | controversy_index` (default: `win_rate`)
- `filterControversial`: `true | false` (default: `false`)
- `limit`: `1-100` (default: `50`)
- `offset`: `0+` (default: `0`)

**Response:**
```json
{
  "success": true,
  "leaderboard": [
    {
      "rank": 1,
      "modelId": "uuid",
      "modelName": "GPT-5.1",
      "provider": "openai",
      "ratings": {
        "crowd": {
          "rating": 1650,
          "deviation": 120
        },
        "aiQuality": {
          "rating": 1680,
          "deviation": 110,
          "volatility": "0.055"
        }
      },
      "statistics": {
        "totalDebates": 150,
        "wins": 95,
        "losses": 40,
        "ties": 15,
        "winRate": "63.3%"
      },
      "controversy": {
        "index": 30,
        "isControversial": false
      }
    }
  ],
  "pagination": {
    "total": 25,
    "limit": 50,
    "offset": 0,
    "hasMore": false,
    "nextOffset": null
  },
  "metadata": {
    "sortBy": "win_rate",
    "filterControversial": false,
    "generatedAt": "ISO 8601 timestamp"
  }
}
```

**Rate Limit:** 100 requests per hour per IP

---

## Error Responses

All endpoints return consistent error responses:

```json
{
  "error": "Error type",
  "message": "Human-readable error message",
  "details": [] // Optional validation details
}
```

**Common Status Codes:**
- `200 OK`: Successful GET request
- `201 Created`: Successful POST request
- `400 Bad Request`: Invalid input data
- `404 Not Found`: Resource not found
- `409 Conflict`: Duplicate resource (e.g., duplicate vote)
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

---

## Rate Limiting

Rate limits are enforced per IP address using Redis:

| Endpoint | Limit | Window |
|----------|-------|--------|
| General API | 100 requests | 1 hour |
| Voting | 20 requests | 1 hour |
| Debate Creation | 10 requests | 1 hour |
| Authenticated Users | 500 requests | 1 hour |

Rate limit headers are included in all responses:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Requests remaining in window
- `X-RateLimit-Reset`: Unix timestamp when limit resets
- `Retry-After`: Seconds until retry (on 429 responses)

---

## Authentication

Currently, the API supports anonymous access with session-based tracking.

**Future Enhancement:**
- OAuth integration (Google, GitHub) via Stack Auth
- JWT tokens for authenticated users
- Higher rate limits for authenticated users
- User profiles and statistics

---

## Testing

Run API endpoint tests:

```bash
npm test -- app/api/__tests__/debate-endpoints.test.ts
```

Test coverage includes:
- Request validation
- Rate limiting enforcement
- Duplicate prevention
- Error handling
- Response formatting

---

## Security

### Implemented Measures:
- IP-based rate limiting
- Request validation with Zod schemas
- HTTP-only session cookies
- Duplicate vote prevention
- Input sanitization

### Future Enhancements:
- CORS configuration for production domain
- API key authentication for programmatic access
- Anomalous voting pattern detection
- Cost monitoring and daily spending caps

---

## Development

### Adding New Endpoints:

1. Create route file in appropriate directory
2. Implement request validation with Zod
3. Apply rate limiting middleware
4. Add error handling
5. Write tests
6. Update this documentation

### Middleware Usage:

```typescript
import { rateLimitMiddleware, RATE_LIMITS } from '@/lib/middleware/rate-limit'
import { validateRequest, yourSchema } from '@/lib/middleware/validation'

export async function POST(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = await rateLimitMiddleware(request, RATE_LIMITS.api)
  if (rateLimitResponse) return rateLimitResponse
  
  // Validate request
  const validation = await validateRequest(request, yourSchema)
  if (!validation.success) return validation.response
  
  // Your handler logic...
}
```

---

## Monitoring

### Metrics to Track:
- Request volume per endpoint
- Error rates
- Rate limit hits
- Response times
- Vote patterns
- Debate completion rates

### Logging:
All errors are logged with context:
- Endpoint path
- Request method
- Error message
- Stack trace (in development)
- User session ID (anonymized)

---

## Future API Endpoints

Planned for future releases:

- `GET /api/debate/[debateId]`: Get debate details
- `GET /api/model/[modelId]`: Get model statistics
- `GET /api/model/[modelId]/debates`: Get model debate history
- `POST /api/topic/generate`: Generate new debate topics
- `POST /api/topic/submit`: User topic submissions
- `GET /api/user/stats`: User statistics (authenticated)
- `GET /api/user/votes`: User voting history (authenticated)

