# API Quick Reference

## Endpoints

| Method | Endpoint | Purpose | Rate Limit |
|--------|----------|---------|------------|
| POST | `/api/debate/run` | Create debate | 10/hour |
| GET | `/api/debate/stream/[id]` | Stream progress | 100/hour |
| POST | `/api/debate/judge` | Evaluate debate | 100/hour |
| POST | `/api/debate/vote` | Submit vote | 20/hour |
| GET | `/api/leaderboard` | Get rankings | 100/hour |

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success (GET) |
| 201 | Created (POST) |
| 400 | Bad Request |
| 404 | Not Found |
| 409 | Conflict (duplicate) |
| 429 | Rate Limit Exceeded |
| 500 | Server Error |

## Common Requests

### Create Debate
```bash
POST /api/debate/run
{
  "proModelId": "uuid",
  "conModelId": "uuid",
  "topicSelection": "random"
}
```

### Vote
```bash
POST /api/debate/vote
{
  "debateId": "uuid",
  "vote": "pro|con|tie"
}
```

### Leaderboard
```bash
GET /api/leaderboard?sortBy=win_rate&limit=50
```

## Response Headers

| Header | Description |
|--------|-------------|
| `X-RateLimit-Limit` | Max requests allowed |
| `X-RateLimit-Remaining` | Requests remaining |
| `X-RateLimit-Reset` | Reset timestamp |
| `Retry-After` | Seconds until retry (429) |

## SSE Events

| Event | Description |
|-------|-------------|
| `debate-start` | Debate initialized |
| `turn-reflection` | RCR reflection phase |
| `turn-critique` | RCR critique phase |
| `turn-speech` | Final speech |
| `debate-complete` | Debate finished |

## Validation Rules

### UUIDs
- All IDs must be valid UUIDs
- Format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

### Debate Config
- `totalRounds`: 1-5 (default: 3)
- `wordLimitPerTurn`: 100-1000 (default: 500)
- `factCheckMode`: off | standard | strict

### Vote
- `vote`: pro | con | tie (required)
- `confidence`: 1-5 (optional)
- `reasoning`: max 500 chars (optional)

### Leaderboard
- `sortBy`: win_rate | crowd_rating | ai_quality_rating | total_debates | controversy_index
- `limit`: 1-100 (default: 50)
- `offset`: 0+ (default: 0)

## Error Response Format

```json
{
  "error": "Error type",
  "message": "Human-readable message",
  "details": [
    {
      "path": "field.name",
      "message": "Validation error"
    }
  ]
}
```

## Files Structure

```
app/api/
├── debate/
│   ├── run/route.ts          # Create debate
│   ├── vote/route.ts          # Submit vote
│   ├── judge/route.ts         # Evaluate
│   └── stream/[id]/route.ts   # SSE stream
├── leaderboard/route.ts       # Rankings
└── __tests__/                 # Tests

lib/
├── auth/session.ts            # Session mgmt
└── middleware/
    ├── rate-limit.ts          # Rate limiting
    └── validation.ts          # Validation
```

## Environment Variables

```env
DATABASE_URL=postgresql://...
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
NODE_ENV=development|production
```

## Testing Commands

```bash
# Run all tests
npm test

# Run API tests
npm test -- app/api/__tests__

# Test specific endpoint
curl -X POST http://localhost:3000/api/debate/run \
  -H "Content-Type: application/json" \
  -d '{"proModelId":"uuid1","conModelId":"uuid2"}'
```

## Common Issues

### 429 Rate Limit
- Wait for reset time
- Check `X-RateLimit-Reset` header
- Implement exponential backoff

### 409 Duplicate Vote
- User already voted on this debate
- Check session cookie
- Clear session to test

### 400 Validation Error
- Check UUID format
- Verify enum values
- Check numeric ranges

### 500 Server Error
- Check database connection
- Verify Redis connection
- Check server logs

## Next Steps

1. Test all endpoints locally
2. Verify rate limiting works
3. Test SSE streaming
4. Deploy to staging
5. Run load tests
6. Monitor metrics

