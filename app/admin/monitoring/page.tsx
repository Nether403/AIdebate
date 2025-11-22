'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@stackframe/stack'

interface HealthStatus {
  status: string
  timestamp: string
  uptime_seconds: number
  response_time_ms: number
  services: {
    database: { status: string; latency_ms: number; healthy: boolean }
    cache: { status: string; latency_ms?: number; healthy: boolean }
    api_keys: { configured: Record<string, boolean>; missing: string[]; healthy: boolean }
    authentication: { stack_auth: boolean; healthy: boolean }
  }
  environment: string
  version: string
}

interface Metrics {
  timestamp: string
  time_range: string
  metrics: {
    debates: { total: number; completed: number; active: number; failed: number }
    votes: { total: number; recent: number }
    predictions: { total: number; totalWagered: number; avgWager: number }
    performance: {
      avg_debate_duration_seconds: number
      debates_per_hour: number
      votes_per_hour: number
      completion_rate: string
      failure_rate: string
    }
  }
  health: {
    debates_healthy: boolean
    performance_healthy: boolean
    activity_healthy: boolean
  }
}

interface CostMetrics {
  timestamp: string
  time_range: string
  summary: {
    total_cost: number
    total_calls: number
    spending_rate_per_hour: number
    projected_daily_cost: number
    projected_monthly_cost: number
  }
  spending_cap: {
    daily_limit: number
    current_daily_spending: number
    percentage_used: string
    remaining: number
  }
  alerts: Array<{ level: string; message: string }>
}

export default function MonitoringDashboard() {
  const user = useUser({ or: 'redirect' })
  const [health, setHealth] = useState<HealthStatus | null>(null)
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [costs, setCosts] = useState<CostMetrics | null>(null)
  const [timeRange, setTimeRange] = useState('24h')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [timeRange])

  async function fetchData() {
    try {
      setLoading(true)
      setError(null)

      const [healthRes, metricsRes, costsRes] = await Promise.all([
        fetch('/api/health'),
        fetch(`/api/monitoring/metrics?range=${timeRange}`),
        fetch(`/api/monitoring/costs?range=${timeRange}`),
      ])

      if (!healthRes.ok || !metricsRes.ok || !costsRes.ok) {
        throw new Error('Failed to fetch monitoring data')
      }

      const [healthData, metricsData, costsData] = await Promise.all([
        healthRes.json(),
        metricsRes.json(),
        costsRes.json(),
      ])

      setHealth(healthData)
      setMetrics(metricsData)
      setCosts(costsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  if (loading && !health) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">System Monitoring</h1>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">System Monitoring</h1>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">Error: {error}</p>
            <button
              onClick={fetchData}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">System Monitoring</h1>
          <div className="flex gap-2">
            {['1h', '24h', '7d', '30d'].map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded ${
                  timeRange === range
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        {/* Health Status */}
        {health && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">System Health</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatusCard
                title="Overall Status"
                status={health.status}
                value={health.status.toUpperCase()}
              />
              <StatusCard
                title="Database"
                status={health.services.database.healthy ? 'healthy' : 'unhealthy'}
                value={`${health.services.database.latency_ms}ms`}
              />
              <StatusCard
                title="Cache"
                status={health.services.cache.healthy ? 'healthy' : 'unhealthy'}
                value={health.services.cache.latency_ms ? `${health.services.cache.latency_ms}ms` : 'N/A'}
              />
              <StatusCard
                title="Uptime"
                status="healthy"
                value={`${Math.floor(health.uptime_seconds / 3600)}h ${Math.floor((health.uptime_seconds % 3600) / 60)}m`}
              />
            </div>
          </div>
        )}

        {/* Cost Alerts */}
        {costs && costs.alerts.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Alerts</h2>
            <div className="space-y-2">
              {costs.alerts.map((alert, i) => (
                <div
                  key={i}
                  className={`p-4 rounded-lg border ${
                    alert.level === 'critical'
                      ? 'bg-red-50 border-red-200 text-red-800'
                      : 'bg-yellow-50 border-yellow-200 text-yellow-800'
                  }`}
                >
                  <p className="font-semibold">{alert.level.toUpperCase()}</p>
                  <p>{alert.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Metrics */}
        {metrics && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Performance Metrics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                title="Total Debates"
                value={metrics.metrics.debates.total}
                subtitle={`${metrics.metrics.debates.completed} completed`}
              />
              <MetricCard
                title="Active Debates"
                value={metrics.metrics.debates.active}
                subtitle={`${metrics.metrics.debates.failed} failed`}
              />
              <MetricCard
                title="Total Votes"
                value={metrics.metrics.votes.total}
                subtitle={`${metrics.metrics.votes.recent} recent`}
              />
              <MetricCard
                title="Avg Duration"
                value={`${metrics.metrics.performance.avg_debate_duration_seconds}s`}
                subtitle={`${metrics.metrics.performance.completion_rate}% completion`}
              />
            </div>
          </div>
        )}

        {/* Cost Metrics */}
        {costs && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Cost Monitoring</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                title="Total Cost"
                value={`$${costs.summary.total_cost.toFixed(2)}`}
                subtitle={`${costs.summary.total_calls} API calls`}
              />
              <MetricCard
                title="Hourly Rate"
                value={`$${costs.summary.spending_rate_per_hour.toFixed(2)}/h`}
                subtitle={`$${costs.summary.projected_daily_cost.toFixed(2)}/day`}
              />
              <MetricCard
                title="Monthly Projection"
                value={`$${costs.summary.projected_monthly_cost.toFixed(2)}`}
                subtitle="Based on current rate"
              />
              <MetricCard
                title="Daily Budget"
                value={`${costs.spending_cap.percentage_used}%`}
                subtitle={`$${costs.spending_cap.remaining.toFixed(2)} remaining`}
              />
            </div>
          </div>
        )}

        <div className="text-sm text-muted-foreground">
          Last updated: {new Date().toLocaleString()}
        </div>
      </div>
    </div>
  )
}

function StatusCard({ title, status, value }: { title: string; status: string; value: string }) {
  const statusColors = {
    healthy: 'bg-green-50 border-green-200 text-green-800',
    degraded: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    unhealthy: 'bg-red-50 border-red-200 text-red-800',
  }

  return (
    <div className={`p-4 rounded-lg border ${statusColors[status as keyof typeof statusColors] || 'bg-gray-50 border-gray-200'}`}>
      <p className="text-sm font-medium mb-1">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  )
}

function MetricCard({ title, value, subtitle }: { title: string; value: string | number; subtitle: string }) {
  return (
    <div className="p-4 rounded-lg border bg-card">
      <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
      <p className="text-2xl font-bold mb-1">{value}</p>
      <p className="text-sm text-muted-foreground">{subtitle}</p>
    </div>
  )
}
