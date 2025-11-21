/**
 * User Dashboard Page
 * 
 * Displays user statistics, DebatePoints balance, and betting history.
 * 
 * Requirements: 10
 */

import { UserStatsCard } from '@/components/prediction/UserStatsCard'
import { BettingHistory } from '@/components/prediction/BettingHistory'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-gray-900">Your Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Track your predictions, earnings, and progress toward Superforecaster status
          </p>
        </div>

        {/* Stats and History Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User Stats Card - Takes 1 column */}
          <div className="lg:col-span-1">
            <UserStatsCard />
          </div>

          {/* Betting History - Takes 2 columns */}
          <div className="lg:col-span-2">
            <BettingHistory />
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
          <h2 className="text-2xl font-bold mb-2">Ready to Predict?</h2>
          <p className="mb-4 opacity-90">
            Watch debates, make predictions, and earn DebatePoints!
          </p>
          <Link
            href="/debate/new"
            className="inline-block bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Start a New Debate
          </Link>
        </div>
      </div>
    </div>
  )
}
