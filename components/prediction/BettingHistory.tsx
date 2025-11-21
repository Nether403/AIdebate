'use client'

/**
 * Betting History Component
 * 
 * Displays user's betting history with outcomes and profits.
 * 
 * Requirements: 10
 */

import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, Minus, Clock } from 'lucide-react'

interface BetHistoryItem {
  id: string
  debateId: string
  topic: string
  vote: 'pro' | 'con' | 'tie'
  wagerAmount: number
  oddsAtBet: number
  payoutAmount: number
  wasCorrect: boolean | null
  profit: number
  createdAt: string
  debateStatus: string
}

export function BettingHistory() {
  const [history, setHistory] = useState<BetHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/prediction/stats')
      
      if (!response.ok) {
        throw new Error('Failed to fetch history')
      }
      
      const data = await response.json()
      setHistory(data.history)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold mb-4">Betting History</h3>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse">
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold mb-4">Betting History</h3>
        <p className="text-red-600">Failed to load history</p>
      </div>
    )
  }

  if (history.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold mb-4">Betting History</h3>
        <p className="text-gray-600 text-center py-8">
          No bets placed yet. Start betting to see your history!
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-bold mb-4">Betting History</h3>
      
      <div className="space-y-3">
        {history.map(bet => (
          <div
            key={bet.id}
            className="border rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <p className="font-medium text-gray-900 line-clamp-1">
                  {bet.topic}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                    {bet.vote.toUpperCase()}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(bet.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              
              {/* Outcome Badge */}
              {bet.wasCorrect !== null ? (
                <div className={`flex items-center gap-1 px-2 py-1 rounded ${
                  bet.wasCorrect 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {bet.wasCorrect ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  <span className="text-xs font-semibold">
                    {bet.wasCorrect ? 'Won' : 'Lost'}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1 px-2 py-1 rounded bg-gray-100 text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span className="text-xs font-semibold">Pending</span>
                </div>
              )}
            </div>

            {/* Bet Details */}
            <div className="grid grid-cols-3 gap-4 text-sm mt-3 pt-3 border-t">
              <div>
                <p className="text-gray-600 text-xs">Wagered</p>
                <p className="font-semibold text-gray-900">{bet.wagerAmount} pts</p>
              </div>
              <div>
                <p className="text-gray-600 text-xs">Odds</p>
                <p className="font-semibold text-gray-900">{bet.oddsAtBet?.toFixed(2)}x</p>
              </div>
              <div>
                <p className="text-gray-600 text-xs">Profit</p>
                <p className={`font-semibold ${
                  bet.profit > 0 ? 'text-green-600' : bet.profit < 0 ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {bet.profit > 0 ? '+' : ''}{bet.profit} pts
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
