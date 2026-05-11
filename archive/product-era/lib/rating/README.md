# Rating Engine

This module implements the dual scoring system for the AI Debate Arena using the Glicko-2 rating algorithm.

## Overview

The Rating Engine maintains two independent rating systems:

1. **Crowd Score**: Based on user votes (measures persuasiveness)
2. **AI Quality Score**: Based on AI judge evaluations (measures logical rigor)

## Glicko-2 Algorithm

Glicko-2 is an advanced rating system that improves upon Elo by tracking:

- **Rating (r)**: Player's skill level (starts at 1500)
- **Rating Deviation (RD)**: Uncertainty in the rating (starts at 350)
- **Volatility (σ)**: Expected fluctuation in rating (starts at 0.06)

### Key Features

- Handles rating uncertainty better than Elo
- Accounts for rating volatility over time
- Increases RD for inactive players
- Converges to true skill faster

### Configuration

- **τ (tau)**: 0.5 - System constant that constrains volatility
- **Initial Rating**: 1500
- **Initial RD**: 350
- **Initial Volatility**: 0.06
- **Rating Period**: 24 hours (batch updates)

## Usage

### Initialize Rating for New Model

```typescript
import { ratingEngine } from '@/lib/rating/engine'

await ratingEngine.initializeModelRating(modelId)
```

### Get Current Rating

```typescript
const rating = await ratingEngine.getRating(modelId, 'crowd')
// or
const rating = await ratingEngine.getRating(modelId, 'ai_quality')
```

### Update Ratings (Batch Mode)

```typescript
const results: DebateResult[] = [
  {
    debateId: 'debate-1',
    modelAId: 'model-a',
    modelBId: 'model-b',
    winner: 'pro',
    resultType: 'crowd',
    timestamp: new Date(),
  },
  // ... more results
]

await ratingEngine.updateRatings(results)
```

### Get Leaderboard

```typescript
// Get leaderboard sorted by win rate
const leaderboard = await ratingEngine.getLeaderboard('win_rate')

// Get only controversial models
const controversial = await ratingEngine.getLeaderboard('controversy_index', true)

// Sort options: 'win_rate', 'crowd_rating', 'ai_quality_rating', 'total_debates', 'controversy_index'
```

### Run Batch Update (Scheduled Task)

```typescript
// Should be called every 24 hours via cron job or scheduler
await ratingEngine.runBatchUpdate()
```

## Controversy Index

The Controversy Index measures the divergence between crowd appeal and AI-judged quality:

```
Controversy Index = |Crowd Rating - AI Quality Rating|
```

Models with a controversy index > 150 (15 point difference) are flagged as "controversial".

## Charismatic Liar Index

The Charismatic Liar Index identifies models that are persuasive but logically weak:

```
Charismatic Liar Index = Normalized Crowd Score - Normalized AI Quality Score
```

High values indicate models that win crowd votes but lose AI judge evaluations.

## Leaderboard Caching

Leaderboard results are cached in Redis for 1 hour to improve performance:

- Cache key format: `leaderboard:{sortBy}:{filterControversial}`
- Cache invalidated on rating updates
- TTL: 3600 seconds (1 hour)

## Database Schema

### Models Table (Rating Fields)

```sql
crowdRating REAL DEFAULT 1500
crowdRatingDeviation REAL DEFAULT 350
aiQualityRating REAL DEFAULT 1500
aiQualityRatingDeviation REAL DEFAULT 350
aiQualityVolatility REAL DEFAULT 0.06
totalDebates INTEGER DEFAULT 0
wins INTEGER DEFAULT 0
losses INTEGER DEFAULT 0
ties INTEGER DEFAULT 0
```

### Model Ratings Table (History)

```sql
CREATE TABLE model_ratings (
  id UUID PRIMARY KEY,
  modelId UUID REFERENCES models(id),
  ratingType TEXT, -- 'crowd' or 'ai_quality'
  rating REAL,
  ratingDeviation REAL,
  volatility REAL, -- Only for ai_quality
  debatesCount INTEGER,
  createdAt TIMESTAMP
)
```

## Testing

See `__tests__/rating.test.ts` for comprehensive test coverage including:

- Glicko-2 algorithm correctness
- Rating initialization
- Rating updates with various scenarios
- Controversy index calculation
- Leaderboard sorting and filtering

## References

- [Glicko-2 Rating System](http://www.glicko.net/glicko/glicko2.pdf) by Mark Glickman
- [Requirements Document](../../.kiro/specs/debate-benchmark-platform/requirements.md) - Requirements 6, 8
- [Design Document](../../.kiro/specs/debate-benchmark-platform/design.md) - Rating Engine section
