'use client'

/**
 * Betting Interface Component
 * 
 * Allows users to place bets on debate outcomes with dynamic odds display.
 * 
 * Requirements: 10
 */

import { useState, useEffect } from 'react'
import { TrendingUp, Coins, AlertCircle } from 'lucide-react'

interface Odds {
  pro: number
  con: number
  tie: number
}

interface BetPool {
  proTotal: number
  conTotal: number
  tieTotal: number
  totalPool: number
}

interface BettingInterfaceProps {
  debateId: string
  selectedVote: 'pro' | 'con' | 'tie' | null
  onWagerChange: (amount: number) => void
  userBalance?: number
}

export function BettingInterface({ 
  debateId, 
  selectedVote, 
  onWagerChange,
  userBalance = 1000 
}: BettingInterfaceProps) {
  const [odds, setOdds] = useState<Odds>({ pro: 2.0, con: 2.0, tie: 3.0 })
  const [pool, setPool] = useState<BetPool>({ proTotal: 0, conTotal: 0, tieTotal: 0, totalPool: 0 })
  const [wagerAmount, setWagerAmount] = useState(50)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchOdds()
    // Refresh odds every 10 seconds
    const interval = setInterval(fetchOdds, 10000)
    return () => clearInterval(interval)
  }, [debateId])

  useEffect(() => {
    onWagerChange(wagerAmount)
  }, [wagerAmount, onWagerChange])

  const fetchOdds = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/prediction/odds?debateId=${debateId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch odds')
      }
      
      const data = await response.json()
      setOdds(data.odds)
      setPool(data.pool)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const currentOdds = selectedVote === 'pro' ? odds.pro : selectedVote === 'con' ? odds.con : odds.tie
  const potentialPayout = Math.floor(wagerAmount * currentOdds)
  const potentialProfit = potentialPayout - wagerAmount

  const presetAmounts = [10, 25, 50, 100, 250, 500]

  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-6 border-2 border-purple-200">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-purple-600" />
        <h3 className="text-lg font-bold text-gray-900">Place Your Bet</h3>
      </div>

      {/* Current Odds Display */}
      <div className="bg-white rounded-lg p-4 mb-4 shadow-sm">
        <p className="text-sm text-gray-600 mb-2">Current Odds</p>
        <div className="grid grid-cols-3 gap-2">
          <div className={`text-center p-2 rounded ${selectedVote === 'pro' ? 'bg-blue-100 border-2 border-blue-500' : 'bg-gray-50'}`}>
            <p className="text-xs text-gray-600">Pro</p>
            <p className="text-lg font-bold text-gray-900">{odds.pro.toFixed(2)}x</p>
          </div>
          <div className={`text-center p-2 rounded ${selectedVote === 'con' ? 'bg-red-100 border-2 border-red-500' : 'bg-gray-50'}`}>
            <p className="text-xs text-gray-600">Con</p>
            <p className="text-lg font-bold text-gray-900">{odds.con.toFixed(2)}x</p>
          </div>
          <div className={`text-center p-2 rounded ${selectedVote === 'tie' ? 'bg-gray-200 border-2 border-gray-500' : 'bg-gray-50'}`}>
            <p className="text-xs text-gray-600">Tie</p>
            <p className="text-lg font-bold text-gray-900">{odds.tie.toFixed(2)}x</p>
          </div>
        </div>
      </div>

      {/* Bet Pool Info */}
      {pool.totalPool > 0 && (
        <div className="bg-white rounded-lg p-3 mb-4 text-sm">
          <p className="text-gray-600 mb-1">Total Pool: <span className="font-semibold">{pool.totalPool.toLocaleString()} pts</span></p>
          <div className="flex gap-4 text-xs text-gray-500">
            <span>Pro: {pool.proTotal}</span>
            <span>Con: {pool.conTotal}</span>
            <span>Tie: {pool.tieTotal}</span>
          </div>
        </div>
      )}

      {/* Wager Amount Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Wager Amount
        </label>
        
        {/* Preset Buttons */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          {presetAmounts.map(amount => (
            <button
              key={amount}
              onClick={() => setWagerAmount(amount)}
              disabled={amount > userBalance}
              className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                wagerAmount === amount
                  ? 'bg-purple-600 text-white'
                  : amount > userBalance
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-purple-100 border border-gray-300'
              }`}
            >
              {amount} pts
            </button>
          ))}
        </div>

        {/* Custom Amount Input */}
        <div className="relative">
          <input
            type="number"
            min="10"
            max={Math.min(500, userBalance)}
            value={wagerAmount}
            onChange={(e) => setWagerAmount(Math.max(10, Math.min(500, parseInt(e.target.value) || 10)))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <span className="absolute right-3 top-2 text-gray-500 text-sm">pts</span>
        </div>
        
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Min: 10 pts</span>
          <span>Max: 500 pts</span>
        </div>
      </div>

      {/* Balance Display */}
      <div className="bg-white rounded-lg p-3 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Coins className="w-4 h-4 text-yellow-600" />
          <span className="text-sm text-gray-600">Your Balance:</span>
        </div>
        <span className="font-bold text-gray-900">{userBalance.toLocaleString()} pts</span>
      </div>

      {/* Potential Payout */}
      {selectedVote && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-700">Potential Payout:</span>
            <span className="text-xl font-bold text-green-700">{potentialPayout.toLocaleString()} pts</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-700">Potential Profit:</span>
            <span className="text-lg font-semibold text-green-600">+{potentialProfit.toLocaleString()} pts</span>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            At {currentOdds.toFixed(2)}x odds
          </p>
        </div>
      )}

      {/* Warnings */}
      {wagerAmount > userBalance && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">
            Insufficient balance. You have {userBalance} DebatePoints.
          </p>
        </div>
      )}

      {!selectedVote && (
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-700">
            Select your prediction (Pro, Con, or Tie) to place a bet.
          </p>
        </div>
      )}

      {/* Info */}
      <div className="mt-4 text-xs text-gray-500 space-y-1">
        <p>• Odds update dynamically based on the bet pool</p>
        <p>• Payouts are distributed when the debate is judged</p>
        <p>• Reach 80% accuracy with 10+ bets to become a Superforecaster</p>
      </div>
    </div>
  )
}
