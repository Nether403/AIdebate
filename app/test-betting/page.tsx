/**
 * Test Betting Interface Page
 * 
 * For testing the betting flow with Chrome DevTools
 */

'use client'

import { useState } from 'react'
import { BettingInterface } from '@/components/prediction/BettingInterface'

export default function TestBettingPage() {
  const [selectedVote, setSelectedVote] = useState<'pro' | 'con' | 'tie' | null>(null)
  const [wagerAmount, setWagerAmount] = useState(0)
  const [userBalance, setUserBalance] = useState(1000)
  const [betResult, setBetResult] = useState<any>(null)

  // Mock debate ID for testing
  const mockDebateId = 'test-debate-123'

  const handlePlaceBet = async () => {
    if (!selectedVote || wagerAmount === 0) {
      alert('Please select a vote and wager amount')
      return
    }

    try {
      const response = await fetch('/api/debate/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          debateId: mockDebateId,
          vote: selectedVote,
          wagerAmount,
        }),
      })

      const data = await response.json()
      
      if (data.success) {
        setBetResult(data)
        setUserBalance(data.userBalance)
        alert(`Bet placed successfully! New balance: ${data.userBalance}`)
      } else {
        alert(`Error: ${data.message}`)
      }
    } catch (error) {
      alert(`Error: ${error}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Test Betting Interface</h1>
        <p className="text-gray-600 mb-8">Test the prediction market betting flow</p>

        {/* Vote Selection */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">1. Select Your Prediction</h2>
          <div className="grid grid-cols-3 gap-4">
            <button
              onClick={() => setSelectedVote('pro')}
              className={`p-4 rounded-lg border-2 font-semibold transition-all ${
                selectedVote === 'pro'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 hover:border-blue-300'
              }`}
            >
              Vote Pro
            </button>
            <button
              onClick={() => setSelectedVote('con')}
              className={`p-4 rounded-lg border-2 font-semibold transition-all ${
                selectedVote === 'con'
                  ? 'border-red-500 bg-red-50 text-red-700'
                  : 'border-gray-300 hover:border-red-300'
              }`}
            >
              Vote Con
            </button>
            <button
              onClick={() => setSelectedVote('tie')}
              className={`p-4 rounded-lg border-2 font-semibold transition-all ${
                selectedVote === 'tie'
                  ? 'border-gray-500 bg-gray-50 text-gray-700'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              Vote Tie
            </button>
          </div>
        </div>

        {/* Betting Interface */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">2. Place Your Bet</h2>
          <BettingInterface
            debateId={mockDebateId}
            selectedVote={selectedVote}
            onWagerChange={setWagerAmount}
            userBalance={userBalance}
          />
        </div>

        {/* Submit Button */}
        <button
          onClick={handlePlaceBet}
          disabled={!selectedVote || wagerAmount === 0}
          className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Place Bet: {wagerAmount} DebatePoints
        </button>

        {/* Result Display */}
        {betResult && (
          <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-6">
            <h3 className="text-xl font-bold text-green-800 mb-4">Bet Placed Successfully! 🎉</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Your Prediction:</span>
                <span className="font-semibold">{betResult.vote.vote.toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Wagered:</span>
                <span className="font-semibold">{betResult.vote.wagerAmount} DebatePoints</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Odds:</span>
                <span className="font-semibold">{betResult.vote.oddsAtBet?.toFixed(2)}x</span>
              </div>
              <div className="flex justify-between border-t pt-2 mt-2">
                <span className="text-gray-600">New Balance:</span>
                <span className="font-bold text-green-700">{betResult.userBalance} DebatePoints</span>
              </div>
            </div>
          </div>
        )}

        {/* Info */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> This is a test page. The debate ID is mocked, so the bet won't actually be placed in a real debate.
            Use this to test the betting interface and flow.
          </p>
        </div>
      </div>
    </div>
  )
}
