# Prediction Market Integration Guide

## Quick Start

This guide shows how to integrate the prediction market components into the existing debate viewing experience.

## Integration with VotingInterface

### Step 1: Update VotingInterface Component

Add the BettingInterface component to the voting flow:

```tsx
// components/debate/VotingInterface.tsx
import { BettingInterface } from '@/components/prediction'
import { useState, useEffect } from 'react'

export function VotingInterface({ debateId, onVote }: VotingInterfaceProps) {
  const [selectedVote, setSelectedVote] = useState<'pro' | 'con' | 'tie' | null>(null)
  const [wagerAmount, setWagerAmount] = useState(0)
  const [userBalance, setUserBalance] = useState(1000)
  const [showBetting, setShowBetting] = useState(false)

  // Fetch user balance
  useEffect(() => {
    fetch('/api/prediction/stats')
      .then(res => res.json())
      .then(data => {
        if (data.stats) {
          setUserBalance(data.stats.debatePoints)
        }
      })
  }, [])

  const handleVoteSubmit = async () => {
    const response = await fetch('/api/debate/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        debateId,
        vote: selectedVote,
        wagerAmount: showBetting ? wagerAmount : 0,
      }),
    })

    const data = await response.json()
    
    if (data.success) {
      onVote(data)
      setUserBalance(data.userBalance)
    }
  }

  return (
    <div className="space-y-6">
      {/* Existing vote buttons */}
      <div className="grid grid-cols-3 gap-4">
        <button
          onClick={() => setSelectedVote('pro')}
          className={selectedVote === 'pro' ? 'selected' : ''}
        >
          Vote Pro
        </button>
        <button
          onClick={() => setSelectedVote('con')}
          className={selectedVote === 'con' ? 'selected' : ''}
        >
          Vote Con
        </button>
        <button
          onClick={() => setSelectedVote('tie')}
          className={selectedVote === 'tie' ? 'selected' : ''}
        >
          Vote Tie
        </button>
      </div>

      {/* Toggle betting */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="enable-betting"
          checked={showBetting}
          onChange={(e) => setShowBetting(e.target.checked)}
        />
        <label htmlFor="enable-betting">
          Place a bet with this vote
        </label>
      </div>

      {/* Betting interface */}
      {showBetting && (
        <BettingInterface
          debateId={debateId}
          selectedVote={selectedVote}
          onWagerChange={setWagerAmount}
          userBalance={userBalance}
        />
      )}

      {/* Submit button */}
      <button
        onClick={handleVoteSubmit}
        disabled={!selectedVote}
        className="w-full py-3 bg-blue-600 text-white rounded-lg"
      >
        {showBetting ? `Vote & Bet ${wagerAmount} Points` : 'Submit Vote'}
      </button>
    </div>
  )
}
```

### Step 2: Add Balance Display to Header

Show user's DebatePoints balance in the navigation:

```tsx
// components/layout/Header.tsx
import { useEffect, useState } from 'react'
import { Coins } from 'lucide-react'
import Link from 'next/link'

export function Header() {
  const [balance, setBalance] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/prediction/stats')
      .then(res => res.json())
      .then(data => {
        if (data.stats) {
          setBalance(data.stats.debatePoints)
        }
      })
  }, [])

  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold">
          AI Debate Arena
        </Link>
        
        <nav className="flex items-center gap-6">
          <Link href="/leaderboard">Leaderboard</Link>
          <Link href="/debate/new">New Debate</Link>
          
          {balance !== null && (
            <Link 
              href="/dashboard"
              className="flex items-center gap-2 bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg hover:bg-yellow-200"
            >
              <Coins className="w-5 h-5" />
              <span className="font-semibold">{balance.toLocaleString()}</span>
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}
```

### Step 3: Add Dashboard Link

Update the main navigation to include the dashboard:

```tsx
// app/page.tsx or layout
<Link 
  href="/dashboard"
  className="text-blue-600 hover:text-blue-700"
>
  View Your Stats
</Link>
```

## Displaying Odds in Debate View

### Add Live Odds Display

Show current odds above the voting interface:

```tsx
// components/debate/DebateOddsDisplay.tsx
'use client'

import { useEffect, useState } from 'react'
import { TrendingUp } from 'lucide-react'

interface Odds {
  pro: number
  con: number
  tie: number
}

export function DebateOddsDisplay({ debateId }: { debateId: string }) {
  const [odds, setOdds] = useState<Odds | null>(null)

  useEffect(() => {
    const fetchOdds = async () => {
      const response = await fetch(`/api/prediction/odds?debateId=${debateId}`)
      const data = await response.json()
      if (data.success) {
        setOdds(data.odds)
      }
    }

    fetchOdds()
    const interval = setInterval(fetchOdds, 10000) // Update every 10s
    return () => clearInterval(interval)
  }, [debateId])

  if (!odds) return null

  return (
    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="w-5 h-5 text-purple-600" />
        <h3 className="font-semibold text-gray-900">Current Betting Odds</h3>
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <p className="text-sm text-gray-600">Pro</p>
          <p className="text-2xl font-bold text-blue-600">{odds.pro.toFixed(2)}x</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600">Con</p>
          <p className="text-2xl font-bold text-red-600">{odds.con.toFixed(2)}x</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600">Tie</p>
          <p className="text-2xl font-bold text-gray-600">{odds.tie.toFixed(2)}x</p>
        </div>
      </div>
    </div>
  )
}
```

## Post-Vote Experience

### Show Bet Confirmation

After voting with a bet, show confirmation:

```tsx
// components/prediction/BetConfirmation.tsx
export function BetConfirmation({ 
  vote, 
  wagerAmount, 
  oddsAtBet, 
  potentialPayout 
}: BetConfirmationProps) {
  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-6">
      <h3 className="text-xl font-bold text-green-800 mb-4">
        Bet Placed Successfully! 🎉
      </h3>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Your Prediction:</span>
          <span className="font-semibold">{vote.toUpperCase()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Wagered:</span>
          <span className="font-semibold">{wagerAmount} DebatePoints</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Odds:</span>
          <span className="font-semibold">{oddsAtBet.toFixed(2)}x</span>
        </div>
        <div className="flex justify-between border-t pt-2 mt-2">
          <span className="text-gray-600">Potential Payout:</span>
          <span className="font-bold text-green-700">{potentialPayout} DebatePoints</span>
        </div>
      </div>
      
      <p className="text-xs text-gray-500 mt-4">
        Your payout will be distributed when the debate is judged.
      </p>
    </div>
  )
}
```

## Leaderboard Integration

### Add Superforecaster Column

Update the leaderboard to show top predictors:

```tsx
// app/leaderboard/page.tsx
import { Trophy } from 'lucide-react'

// Add a "Top Predictors" section
<div className="mt-8">
  <h2 className="text-2xl font-bold mb-4">Top Predictors</h2>
  <div className="bg-white rounded-lg shadow">
    {/* Query top users by accuracy */}
    {topPredictors.map(user => (
      <div key={user.id} className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          {user.isSuperforecaster && (
            <Trophy className="w-5 h-5 text-yellow-600" />
          )}
          <span className="font-semibold">{user.displayName}</span>
        </div>
        <div className="text-right">
          <p className="font-bold">{user.accuracy.toFixed(1)}%</p>
          <p className="text-sm text-gray-500">{user.totalBets} bets</p>
        </div>
      </div>
    ))}
  </div>
</div>
```

## Mobile Responsiveness

### Collapsible Betting Interface

For mobile, make betting interface collapsible:

```tsx
// components/prediction/CollapsibleBettingInterface.tsx
'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { BettingInterface } from './BettingInterface'

export function CollapsibleBettingInterface(props: BettingInterfaceProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="border rounded-lg">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
      >
        <span className="font-semibold">Place a Bet</span>
        {isExpanded ? <ChevronUp /> : <ChevronDown />}
      </button>
      
      {isExpanded && (
        <div className="p-4 border-t">
          <BettingInterface {...props} />
        </div>
      )}
    </div>
  )
}
```

## Testing Integration

### Test Checklist

- [ ] User can see their balance in header
- [ ] User can toggle betting on/off
- [ ] Betting interface shows current odds
- [ ] Wager amount updates correctly
- [ ] Vote submission includes wager
- [ ] Balance updates after bet
- [ ] Confirmation shows bet details
- [ ] Dashboard link works
- [ ] Stats display correctly
- [ ] Betting history shows recent bets
- [ ] Superforecaster badge appears when qualified
- [ ] Mobile layout is responsive

### Example Test Flow

1. Navigate to a completed debate
2. Click "Vote Pro"
3. Enable betting
4. Select 100 DebatePoints wager
5. Submit vote
6. Verify balance decreased by 100
7. Verify bet appears in history
8. Wait for debate to be judged
9. Verify payout received
10. Check dashboard for updated stats

## Common Issues

### Issue: Balance not updating
**Solution:** Ensure you're fetching stats after vote submission

### Issue: Odds not displaying
**Solution:** Check that debate has status 'completed'

### Issue: Bet rejected
**Solution:** Verify user has sufficient balance and bet is within limits (10-500)

### Issue: Payout not received
**Solution:** Ensure debate has been judged and winner determined

## Performance Tips

1. **Cache user balance** - Fetch once per page load, update on actions
2. **Debounce odds updates** - Don't fetch more than once per 10 seconds
3. **Lazy load betting history** - Only fetch when dashboard is viewed
4. **Optimize queries** - Use indexes on session_id and debate_id

## Future Enhancements

- Real-time odds updates via WebSocket
- Push notifications for payout
- Bet slip (multiple bets at once)
- Betting analytics dashboard
- Social features (follow top predictors)
