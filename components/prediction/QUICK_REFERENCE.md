# Prediction Market - Quick Reference

## 🎯 Core Concepts

**DebatePoints**: Virtual currency (starting balance: 1000)
**Odds**: Payout multiplier (e.g., 2.5x means 250 points for 100 wagered)
**Superforecaster**: User with 80%+ accuracy and 10+ bets

## 📊 Odds Formula

```
odds = (totalPool × 0.95) / sideTotal
minimum odds = 1.1x
```

## 💰 Payout Formula

```
payout = wagerAmount × oddsAtBet
profit = payout - wagerAmount
```

## 🎲 Bet Limits

- **Minimum**: 10 DebatePoints
- **Maximum**: 500 DebatePoints
- **Must have**: Sufficient balance

## 📈 Statistics

```typescript
accuracy = (correctPredictions / totalBetsPlaced) × 100
roi = ((totalWon - totalWagered) / totalWagered) × 100
netProfit = totalWon - totalWagered
```

## 🏆 Superforecaster

**Requirements:**
- ✅ 10+ bets placed
- ✅ 80%+ accuracy

**Benefits:**
- Badge on profile
- Recognition in leaderboards

## 🔌 API Quick Reference

### Place Bet
```typescript
POST /api/debate/vote
{
  debateId: string
  vote: 'pro' | 'con' | 'tie'
  wagerAmount: number  // Optional, 10-500
}
```

### Get Odds
```typescript
GET /api/prediction/odds?debateId={id}
// Returns: { odds, pool }
```

### Get Stats
```typescript
GET /api/prediction/stats
// Returns: { stats, history }
```

## 🎨 Component Usage

### User Stats Card
```tsx
import { UserStatsCard } from '@/components/prediction'
<UserStatsCard />
```

### Betting Interface
```tsx
import { BettingInterface } from '@/components/prediction'
<BettingInterface
  debateId={id}
  selectedVote={vote}
  onWagerChange={setWager}
  userBalance={balance}
/>
```

### Betting History
```tsx
import { BettingHistory } from '@/components/prediction'
<BettingHistory />
```

## 🔍 Common Queries

### Get User Balance
```typescript
const response = await fetch('/api/prediction/stats')
const { stats } = await response.json()
const balance = stats.debatePoints
```

### Check Superforecaster Status
```typescript
const { stats } = await response.json()
const isSuperforecaster = stats.isSuperforecaster
```

### Get Current Odds
```typescript
const response = await fetch(`/api/prediction/odds?debateId=${id}`)
const { odds } = await response.json()
// odds.pro, odds.con, odds.tie
```

## 🧪 Testing

```bash
# Run all tests
npx vitest run lib/prediction/__tests__/market.test.ts

# Expected: 25 tests passing
```

## 📁 File Locations

**Backend:**
- `lib/prediction/market.ts` - Core logic
- `app/api/prediction/odds/route.ts` - Odds endpoint
- `app/api/prediction/stats/route.ts` - Stats endpoint

**Frontend:**
- `components/prediction/UserStatsCard.tsx`
- `components/prediction/BettingInterface.tsx`
- `components/prediction/BettingHistory.tsx`
- `app/dashboard/page.tsx`

**Database:**
- `lib/db/schema.ts` - user_profiles, user_votes

## 🚨 Common Issues

**"Insufficient balance"**
→ User doesn't have enough DebatePoints

**"Minimum bet is 10 pts"**
→ Wager amount too low

**"Maximum bet is 500 pts"**
→ Wager amount too high

**"Duplicate vote"**
→ User already voted on this debate

## 💡 Pro Tips

1. **Cache user balance** - Fetch once, update on actions
2. **Poll odds every 10s** - Don't overload the server
3. **Show potential payout** - Helps users make decisions
4. **Highlight Superforecasters** - Encourages engagement
5. **Display betting history** - Builds trust

## 🎯 Example Flow

```typescript
// 1. Get user balance
const { stats } = await fetch('/api/prediction/stats').then(r => r.json())
console.log(`Balance: ${stats.debatePoints}`)

// 2. Get current odds
const { odds } = await fetch(`/api/prediction/odds?debateId=${id}`).then(r => r.json())
console.log(`Pro odds: ${odds.pro}x`)

// 3. Place bet
const result = await fetch('/api/debate/vote', {
  method: 'POST',
  body: JSON.stringify({
    debateId: id,
    vote: 'pro',
    wagerAmount: 100
  })
}).then(r => r.json())

console.log(`New balance: ${result.userBalance}`)
console.log(`Odds locked at: ${result.vote.oddsAtBet}x`)

// 4. Wait for debate to be judged...

// 5. Check updated stats
const updated = await fetch('/api/prediction/stats').then(r => r.json())
console.log(`Payout received: ${updated.stats.debatePoints}`)
```

## 📚 Full Documentation

- **API Reference**: `lib/prediction/README.md`
- **Integration Guide**: `components/prediction/INTEGRATION_GUIDE.md`
- **Implementation Summary**: `.kiro/specs/debate-benchmark-platform/TASK_9_SUMMARY.md`
- **Status**: `.kiro/specs/debate-benchmark-platform/PREDICTION_MARKET_STATUS.md`
