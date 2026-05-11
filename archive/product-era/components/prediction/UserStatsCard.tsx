'use client'

/**
 * User Statistics Card Component
 * 
 * Displays user's DebatePoints balance, prediction accuracy, and Superforecaster badge.
 * 
 * Requirements: 10
 */

import { useEffect, useState } from 'react'
import { Trophy, TrendingUp, Target, Coins } from 'lucide-react'

interface UserStats {
  debatePoints: number
  totalVotes: number
  totalBetsPlaced: number
  totalBetsWon: number
  correctPredictions: number
  accuracy: number
  roi: number
  isSuperforecaster: boolean
  totalPointsWagered: number
  totalPointsWon: number
  netProfit: number
}

export function UserStatsCard() {
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/prediction/stats')
      
      if (!response.ok) {
        throw new Error('Failed to fetch stats')
      }
      
      const data = await response.json()
      setStats(data.stats)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-red-600">Failed to load statistics</p>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-lg p-6 border border-blue-100">
      {/* Header with Superforecaster Badge */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Your Stats</h2>
        {stats.isSuperforecaster && (
          <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white px-4 py-2 rounded-full shadow-md">
            <Trophy className="w-5 h-5" />
            <span className="font-semibold">Superforecaster</span>
          </div>
        )}
      </div>

      {/* DebatePoints Balance */}
      <div className="bg-white rounded-xl p-5 mb-4 shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl shadow-md">
              <Coins className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">DebatePoints Balance</p>
              <p className="text-4xl font-bold text-gray-900 mt-1">{stats.debatePoints.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Prediction Accuracy */}
        <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-2 mb-3">
            <div className="bg-green-100 p-2 rounded-lg">
              <Target className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-sm font-semibold text-gray-700">Accuracy</p>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.accuracy.toFixed(1)}%</p>
          <p className="text-xs text-gray-500 mt-2">
            {stats.correctPredictions} / {stats.totalBetsPlaced} correct
          </p>
        </div>

        {/* ROI */}
        <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-2 mb-3">
            <div className="bg-purple-100 p-2 rounded-lg">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-sm font-semibold text-gray-700">ROI</p>
          </div>
          <p className={`text-3xl font-bold ${stats.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {stats.roi >= 0 ? '+' : ''}{stats.roi.toFixed(1)}%
          </p>
          <p className="text-xs text-gray-500 mt-2">
            {stats.netProfit >= 0 ? '+' : ''}{stats.netProfit.toLocaleString()} points
          </p>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="bg-white rounded-xl p-5 shadow-md border border-gray-100">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="p-2">
            <p className="text-gray-600 font-medium">Total Votes</p>
            <p className="font-bold text-gray-900 text-lg mt-1">{stats.totalVotes}</p>
          </div>
          <div className="p-2">
            <p className="text-gray-600 font-medium">Bets Placed</p>
            <p className="font-bold text-gray-900 text-lg mt-1">{stats.totalBetsPlaced}</p>
          </div>
          <div className="p-2">
            <p className="text-gray-600 font-medium">Bets Won</p>
            <p className="font-bold text-gray-900 text-lg mt-1">{stats.totalBetsWon}</p>
          </div>
          <div className="p-2">
            <p className="text-gray-600 font-medium">Total Wagered</p>
            <p className="font-bold text-gray-900 text-lg mt-1">{stats.totalPointsWagered.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Superforecaster Progress */}
      {!stats.isSuperforecaster && stats.totalBetsPlaced > 0 && (
        <div className="mt-4 bg-yellow-50 rounded-lg p-4 border border-yellow-200">
          <p className="text-sm font-medium text-yellow-800 mb-2">
            Superforecaster Progress
          </p>
          <div className="w-full bg-yellow-200 rounded-full h-2 mb-2">
            <div
              className="bg-yellow-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(stats.accuracy, 100)}%` }}
            ></div>
          </div>
          <p className="text-xs text-yellow-700">
            {stats.accuracy >= 80 
              ? `${10 - stats.totalBetsPlaced} more bets needed to qualify!`
              : `Reach 80% accuracy with 10+ bets to earn the badge`
            }
          </p>
        </div>
      )}
    </div>
  )
}
