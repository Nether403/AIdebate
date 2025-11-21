'use client'

import { useEffect, useState } from 'react'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { TrendingUp, Users, CheckCircle, XCircle, Award, Activity } from 'lucide-react'

interface Statistics {
  overview: {
    totalDebates: number
    completedDebates: number
    totalVotes: number
    activeModels: number
    activeTopics: number
  }
  factChecking: {
    totalFactChecks: number
    verifiedClaims: number
    falseClaims: number
    accuracyRate: number
  }
  outcomes: {
    distribution: Array<{
      outcome: string
      count: number
      percentage: number
    }>
  }
  categories: {
    distribution: Array<{
      category: string
      count: number
      percentage: number
    }>
  }
  topPerformers: Array<{
    name: string
    provider: string
    totalDebates: number
    winRate: number
    crowdRating: number
    aiQualityRating: number
  }>
  recentActivity: {
    last7Days: {
      debates: number
      votes: number
    }
  }
  averages: {
    turnsPerDebate: number
    durationMinutes: number
  }
}

export function StatisticsDashboard() {
  const [stats, setStats] = useState<Statistics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchStatistics()
  }, [])

  const fetchStatistics = async () => {
    try {
      const response = await fetch('/api/statistics/public')
      if (!response.ok) throw new Error('Failed to fetch statistics')
      const data = await response.json()
      setStats(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-12">Loading statistics...</div>
  }

  if (error || !stats) {
    return (
      <div className="text-center py-12 text-red-600">
        Error loading statistics: {error}
      </div>
    )
  }

  const COLORS = ['#10b981', '#ef4444', '#60a5fa', '#f59e0b', '#8b5cf6']

  return (
    <div className="space-y-8">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={<Activity className="w-6 h-6" />}
          title="Total Debates"
          value={stats.overview.totalDebates.toLocaleString()}
          subtitle={`${stats.overview.completedDebates} completed`}
          color="blue"
        />
        <StatCard
          icon={<Users className="w-6 h-6" />}
          title="Total Votes"
          value={stats.overview.totalVotes.toLocaleString()}
          subtitle={`${stats.recentActivity.last7Days.votes} in last 7 days`}
          color="green"
        />
        <StatCard
          icon={<Award className="w-6 h-6" />}
          title="Active Models"
          value={stats.overview.activeModels.toString()}
          subtitle={`${stats.overview.activeTopics} topics`}
          color="purple"
        />
        <StatCard
          icon={<CheckCircle className="w-6 h-6" />}
          title="Fact-Check Accuracy"
          value={`${stats.factChecking.accuracyRate}%`}
          subtitle={`${stats.factChecking.totalFactChecks} checks`}
          color="emerald"
        />
      </div>

      {/* Fact-Checking Stats */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Fact-Checking Performance
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {stats.factChecking.verifiedClaims.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Verified Claims</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-100 rounded-lg">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {stats.factChecking.falseClaims.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">False Claims</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {stats.factChecking.accuracyRate}%
              </div>
              <div className="text-sm text-gray-600">Accuracy Rate</div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Debate Outcomes */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Debate Outcomes
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={stats.outcomes.distribution}
                dataKey="count"
                nameKey="outcome"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {stats.outcomes.distribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Debates by Category */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Debates by Category
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.categories.distribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#60a5fa" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Performers */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Top Performing Models
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Model
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Provider
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Debates
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Win Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Crowd Rating
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  AI Quality
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stats.topPerformers.map((model, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {model.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {model.provider}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {model.totalDebates}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {model.winRate}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {model.crowdRating}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {model.aiQualityRating}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Average Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Average Turns per Debate
          </h3>
          <div className="text-4xl font-bold text-blue-600">
            {stats.averages.turnsPerDebate}
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Across all completed debates
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Average Debate Duration
          </h3>
          <div className="text-4xl font-bold text-blue-600">
            {stats.averages.durationMinutes} min
          </div>
          <p className="text-sm text-gray-600 mt-2">
            From start to completion
          </p>
        </div>
      </div>
    </div>
  )
}

interface StatCardProps {
  icon: React.ReactNode
  title: string
  value: string
  subtitle: string
  color: 'blue' | 'green' | 'purple' | 'emerald'
}

function StatCard({ icon, title, value, subtitle, color }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    emerald: 'bg-emerald-100 text-emerald-600',
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium text-gray-600">{title}</div>
          <div className="text-2xl font-bold text-gray-900">{value}</div>
          <div className="text-xs text-gray-500">{subtitle}</div>
        </div>
      </div>
    </div>
  )
}
