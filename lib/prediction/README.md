# Prediction Market System

This module implements the DebatePoints virtual currency and prediction market for the AI Debate Arena.

## Overview

The prediction market allows users to:
- Place bets on debate outcomes using DebatePoints
- Earn payouts based on dynamic odds
- Track their prediction accuracy
- Earn Superforecaster badges for 80%+ accuracy with 10+ bets

## Architecture

### Parimutuel Betting System

The system uses a parimutuel betting model where:
- All bets go into a shared pool
- Odds are determined by the distribution of bets
- Winners split the pool proportionally
- A 5% house edge is applied

### Odds Calculation

```typescript
odds = (totalPool * 0.95) / sideTotal
```

- Minimum odds: 1.1x
- Default odds (no bets): Pro 2.0x, Con 2.0x, Tie 3.0x
- Odds update dynamically as bets are placed

## Core Functions

### `calculateOdds(pool: BetPool): Odds`

Calculates current odds based on the bet pool.

**Example:**
```typescript
const pool = {
  proTotal: 1000,
  conTotal: 500,
  tieTotal: 100,
  totalPool: 1600
}

const odds = calculateOdds(pool)
// { pro: 1.52, con: 3.04, tie: 15.2 }
```

### `placeBet(debateId, sessionId, vote, wagerAmount, userId?): Promise<BetResult>`

Places a bet on a debate outcome.

**Validation:**
- Minimum bet: 10 DebatePoints
- Maximum bet: 500 DebatePoints
- User must have sufficient balance

**Returns:**
```typescript
{
  success: boolean
  newBalance: number
  payout: number
  odds: Odds
  message: string
}
```

### `distributePayout(debateId, winner): Promise<void>`

Distributes payouts to winners when a debate is judged.

**Process:**
1. Identifies all bets on the winning side
2. Calculates payout: `wagerAmount * oddsAtBet`
3. Updates user balances
4. Updates user statistics
5. Checks for Superforecaster qualification

### `getUserStats(sessionId): Promise<UserStats>`

Retrieves user statistics and performance metrics.

**Returns:**
```typescript
{
  debatePoints: number
  totalVotes: number
  totalBetsPlaced: number
  totalBetsWon: number
  correctPredictions: number
  accuracy: number  // Percentage
  roi: number       // Return on investment %
  isSuperforecaster: boolean
  netProfit: number
}
```

### `getBettingHistory(sessionId, limit?): Promise<BetHistoryItem[]>`

Retrieves user's betting history.

## Database Schema

### `user_profiles` Table

Stores user statistics and DebatePoints balance.

```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  session_id TEXT UNIQUE NOT NULL,
  debate_points INTEGER DEFAULT 1000,
  total_votes INTEGER DEFAULT 0,
  correct_predictions INTEGER DEFAULT 0,
  total_bets_placed INTEGER DEFAULT 0,
  total_bets_won INTEGER DEFAULT 0,
  total_points_wagered INTEGER DEFAULT 0,
  total_points_won INTEGER DEFAULT 0,
  is_superforecaster BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)
```

### `user_votes` Table (Extended)

Stores votes with betting information.

```sql
CREATE TABLE user_votes (
  id UUID PRIMARY KEY,
  debate_id UUID REFERENCES debates(id),
  user_id TEXT,
  session_id TEXT NOT NULL,
  vote TEXT NOT NULL,
  wager_amount INTEGER DEFAULT 0,
  odds_at_bet REAL,
  payout_amount INTEGER DEFAULT 0,
  was_correct BOOLEAN,
  created_at TIMESTAMP DEFAULT NOW()
)
```

## API Endpoints

### `POST /api/debate/vote`

Submit a vote with optional bet.

**Request:**
```json
{
  "debateId": "uuid",
  "vote": "pro" | "con" | "tie",
  "wagerAmount": 100  // Optional
}
```

**Response:**
```json
{
  "success": true,
  "vote": {
    "id": "uuid",
    "vote": "pro",
    "wagerAmount": 100,
    "oddsAtBet": 2.5
  },
  "currentOdds": {
    "pro": 2.5,
    "con": 1.8,
    "tie": 5.0
  },
  "userBalance": 900
}
```

### `GET /api/prediction/odds?debateId=xxx`

Get current odds for a debate.

**Response:**
```json
{
  "success": true,
  "debateId": "uuid",
  "odds": {
    "pro": 2.5,
    "con": 1.8,
    "tie": 5.0
  },
  "pool": {
    "proTotal": 1000,
    "conTotal": 1500,
    "tieTotal": 200,
    "totalPool": 2700
  }
}
```

### `GET /api/prediction/stats`

Get user statistics and betting history.

**Response:**
```json
{
  "success": true,
  "stats": {
    "debatePoints": 1250,
    "totalVotes": 15,
    "totalBetsPlaced": 10,
    "totalBetsWon": 8,
    "accuracy": 80.0,
    "roi": 25.0,
    "isSuperforecaster": true,
    "netProfit": 250
  },
  "history": [...]
}
```

## Components

### `<UserStatsCard />`

Displays user's DebatePoints balance, accuracy, ROI, and Superforecaster badge.

**Usage:**
```tsx
import { UserStatsCard } from '@/components/prediction'

<UserStatsCard />
```

### `<BettingHistory />`

Shows user's betting history with outcomes and profits.

**Usage:**
```tsx
import { BettingHistory } from '@/components/prediction'

<BettingHistory />
```

### `<BettingInterface />`

Interactive betting interface with odds display and wager selection.

**Props:**
```typescript
{
  debateId: string
  selectedVote: 'pro' | 'con' | 'tie' | null
  onWagerChange: (amount: number) => void
  userBalance?: number
}
```

**Usage:**
```tsx
import { BettingInterface } from '@/components/prediction'

<BettingInterface
  debateId={debate.id}
  selectedVote={vote}
  onWagerChange={setWager}
  userBalance={1000}
/>
```

## Superforecaster System

Users earn the Superforecaster badge by:
1. Placing at least 10 bets
2. Achieving 80%+ prediction accuracy

**Benefits:**
- Visual badge on profile
- Recognition in leaderboards
- Potential future rewards

**Calculation:**
```typescript
const accuracy = (correctPredictions / totalBetsPlaced) * 100
const isSuperforecaster = totalBetsPlaced >= 10 && accuracy >= 80
```

## Testing

Run tests with:
```bash
npx vitest run lib/prediction/__tests__/market.test.ts
```

**Test Coverage:**
- ✅ Odds calculation (9 tests)
- ✅ Payout calculations (4 tests)
- ✅ Accuracy calculations (4 tests)
- ✅ ROI calculations (4 tests)
- ✅ Balance management (4 tests)

**Total: 25 tests, all passing**

## Example Workflow

### 1. User Places Bet

```typescript
// User selects "Pro" and wagers 100 points
const result = await placeBet(
  debateId,
  sessionId,
  'pro',
  100
)

// Result: { success: true, newBalance: 900, odds: { pro: 2.5, ... } }
```

### 2. Debate Completes

```typescript
// AI judge determines winner
await judgeDebate(debateId)
// Winner: 'pro'
```

### 3. Payouts Distributed

```typescript
// Automatically called by judge endpoint
await distributePayout(debateId, 'pro')

// User's bet: 100 points at 2.5x odds
// Payout: 250 points
// Profit: 150 points
// New balance: 1050 points
```

### 4. User Checks Stats

```typescript
const stats = await getUserStats(sessionId)

// {
//   debatePoints: 1050,
//   totalBetsPlaced: 1,
//   totalBetsWon: 1,
//   accuracy: 100.0,
//   roi: 50.0,
//   netProfit: 150
// }
```

## Future Enhancements

### Phase 2
- Real-time odds updates via WebSocket
- Bet cancellation (before debate starts)
- Partial cash-out options
- Leaderboards for top predictors

### Phase 3
- Bet on specific rounds
- Prop bets (e.g., "Will there be a fact-check failure?")
- Betting pools for tournaments
- Social betting (follow other users' bets)

## Notes

- All monetary values are in DebatePoints (virtual currency)
- Starting balance: 1000 DebatePoints
- House edge: 5% (industry standard)
- Minimum odds: 1.1x (ensures some return)
- Payouts are floored to nearest integer
