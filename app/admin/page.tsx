/**
 * Admin Dashboard
 * 
 * Displays real-time metrics, cost monitoring, and suspicious activity
 * 
 * Requirements: 15
 */

'use client'

import { useEffect, useState } from 'react'

interface Metrics {
  debates: {
    total: number
    last24h: number
    last7d: number
    completed: number
    inProgress: number
    failed: number
    avgDurationMs: number
    recent: Array<{
      id: string
      topic: string
      proModel: string
      conModel: string
      status: string
      winner: string | null
      createdAt: string
      completedAt: string | null
    }>
  }
  votes: {
    total: number
    last24h: number
    last7d: number
    uniqueVoters: number
    uniqueVotersLast24h: number
  }
  factChecks: {
    total: number
    verified: number
    false: number
    accuracyRate: number
  }
}

interface CostData {
  current: {
    exceeded: boolean
    currentSpend: number
    cap: number
    remainingBudget: number
    breakdown: {
      byProvider: Record<string, number>
      byOperation: Record<string, number>
    }
    totalRequests: number
  }
  history: Array<{
    date: string
    totalCost: number
    totalRequests: number
    capExceeded: boolean
  }>
}

interface SuspiciousSession {
  sessionId: string
  userId: string | null
  totalVotes: number
  votesInLastHour: number
  votesInLastDay: number
  providerBias: Record<string, number>
  alwaysVotesSameWay: boolean
  rapidVoting: boolean
  suspiciousIpActivity: boolean
  anomalyScore: number
  flags: string[]
}

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [costs, setCosts] = useState<CostData | null>(null)
  const [suspiciousSessions, setSuspiciousSessions] = useState<SuspiciousSession[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'costs' | 'security'>('overview')

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  async function fetchData() {
    try {
      const [metricsRes, costsRes, sessionsRes] = await Promise.all([
        fetch('/api/admin/metrics'),
        fetch('/api/admin/costs?days=7'),
        fetch('/api/admin/suspicious-sessions?threshold=50'),
      ])

      if (!metricsRes.ok || !costsRes.ok || !sessionsRes.ok) {
        throw new Error('Failed to fetch admin data')
      }

      const [metricsData, costsData, sessionsData] = await Promise.all([
        metricsRes.json(),
        costsRes.json(),
        sessionsRes.json(),
      ])

      setMetrics(metricsData)
      setCosts(costsData)
      setSuspiciousSessions(sessionsData.sessions || [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  async function flagSession(sessionId: string, reason: string) {
    try {
      const res = await fetch('/api/admin/suspicious-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          reason,
          flaggedBy: 'admin',
        }),
      })

      if (!res.ok) {
        throw new Error('Failed to flag session')
      }

      alert(`Session ${sessionId} has been flagged`)
      fetchData()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to flag session')
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading admin dashboard...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong className="font-bold">Error: </strong>
          <span>{error}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <button 
          onClick={fetchData}
          className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
        >
          Refresh
        </button>
      </div>

      {costs?.current.exceeded && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong className="font-bold">Daily Spending Cap Exceeded</strong>
          <p>Current spend: ${costs.current.currentSpend.toFixed(2)} / ${costs.current.cap.toFixed(2)}</p>
        </div>
      )}

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {(['overview', 'costs', 'security'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-sm font-medium text-gray-500">Total Debates</div>
              <div className="text-2xl font-bold mt-2">{metrics?.debates.total}</div>
              <p className="text-xs text-gray-500 mt-1">+{metrics?.debates.last24h} in last 24h</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-sm font-medium text-gray-500">Total Votes</div>
              <div className="text-2xl font-bold mt-2">{metrics?.votes.total}</div>
              <p className="text-xs text-gray-500 mt-1">+{metrics?.votes.last24h} in last 24h</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-sm font-medium text-gray-500">Unique Voters</div>
              <div className="text-2xl font-bold mt-2">{metrics?.votes.uniqueVoters}</div>
              <p className="text-xs text-gray-500 mt-1">{metrics?.votes.uniqueVotersLast24h} active today</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-sm font-medium text-gray-500">Fact Check Accuracy</div>
              <div className="text-2xl font-bold mt-2">{metrics?.factChecks.accuracyRate.toFixed(1)}%</div>
              <p className="text-xs text-gray-500 mt-1">{metrics?.factChecks.verified} verified / {metrics?.factChecks.false} false</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Recent Debates</h3>
            <div className="space-y-2">
              {metrics?.debates.recent.map((debate) => (
                <div key={debate.id} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{debate.topic}</div>
                    <div className="text-xs text-gray-500">{debate.proModel} vs {debate.conModel}</div>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded ${
                    debate.status === 'completed' ? 'bg-green-100 text-green-800' :
                    debate.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {debate.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'costs' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Current Spending</h3>
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="text-2xl font-bold">${costs?.current.currentSpend.toFixed(2)}</div>
                <p className="text-sm text-gray-500">of ${costs?.current.cap.toFixed(2)} daily cap</p>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold text-green-600">${costs?.current.remainingBudget.toFixed(2)}</div>
                <p className="text-sm text-gray-500">remaining</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">By Provider</h4>
                {Object.entries(costs?.current.breakdown.byProvider || {}).map(([provider, cost]) => (
                  <div key={provider} className="flex justify-between text-sm py-1">
                    <span className="capitalize">{provider}</span>
                    <span className="font-mono">${cost.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div>
                <h4 className="font-medium mb-2">By Operation</h4>
                {Object.entries(costs?.current.breakdown.byOperation || {}).map(([operation, cost]) => (
                  <div key={operation} className="flex justify-between text-sm py-1">
                    <span className="capitalize">{operation}</span>
                    <span className="font-mono">${cost.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Cost History (Last 7 Days)</h3>
            <div className="space-y-2">
              {costs?.history.slice(0, 7).map((day) => (
                <div key={day.date} className="flex items-center justify-between p-2 border rounded">
                  <span className="text-sm">{day.date}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm">${day.totalCost.toFixed(2)}</span>
                    {day.capExceeded && (
                      <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded">Cap Exceeded</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Suspicious Sessions</h3>
          <p className="text-sm text-gray-500 mb-4">Sessions with anomalous voting patterns (threshold: 50)</p>
          {suspiciousSessions.length === 0 ? (
            <p className="text-sm text-gray-500">No suspicious sessions detected</p>
          ) : (
            <div className="space-y-4">
              {suspiciousSessions.map((session) => (
                <div key={session.sessionId} className="p-4 border rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-mono text-sm">{session.sessionId}</div>
                      <div className="text-xs text-gray-500">{session.totalVotes} total votes</div>
                    </div>
                    <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded">
                      Score: {session.anomalyScore}
                    </span>
                  </div>

                  <div className="space-y-1">
                    {session.flags.map((flag, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-sm">
                        <span className="text-red-500">⚠</span>
                        <span>{flag}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => {
                      const reason = prompt('Enter reason for flagging:')
                      if (reason) {
                        flagSession(session.sessionId, reason)
                      }
                    }}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100"
                  >
                    Flag Session
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
