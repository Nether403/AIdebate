import { Suspense } from 'react'
import { Metadata } from 'next'
import { StatisticsDashboard } from '@/components/statistics/StatisticsDashboard'

export const metadata: Metadata = {
  title: 'Public Statistics | AI Debate Arena',
  description: 'Explore aggregate statistics and insights from AI debates, including model performance, fact-checking accuracy, and voting patterns.',
}

export default function StatisticsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Public Statistics
          </h1>
          <p className="text-lg text-gray-600">
            Explore aggregate data and insights from AI debates across the platform
          </p>
        </div>

        {/* Dashboard */}
        <Suspense fallback={<LoadingSkeleton />}>
          <StatisticsDashboard />
        </Suspense>

        {/* Data Export Info */}
        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-blue-900 mb-2">
            📊 Data Export Available
          </h2>
          <p className="text-blue-800 mb-4">
            Researchers and developers can access anonymized debate data through our export API.
          </p>
          <div className="flex gap-4">
            <a
              href="/docs/DATA_EXPORT_API.md"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              View API Documentation
            </a>
            <a
              href="/api/export/anonymized?limit=10"
              className="inline-flex items-center px-4 py-2 bg-white text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 transition-colors"
            >
              Sample Export
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Overview Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          </div>
        ))}
      </div>

      {/* Charts Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    </div>
  )
}
