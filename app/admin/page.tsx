/**
 * Admin Dashboard
 *
 * Displays real-time metrics, cost monitoring, and suspicious activity.
 *
 * Presentation only (Requirement 7.4): all data fetching (metrics/costs/
 * suspicious-sessions), the 30s refresh interval, and the flag-session mutation
 * are unchanged from the original. Only the markup/styling was ported to the
 * unified design language — the page renders through the shared AppShell (no own
 * nav or background, single <h1>, Requirement 2.6 / 9.2), sets the top bar via
 * `useTopBar`, uses the shared Stat/Card/Badge/Button/Table primitives, and the
 * wide "recent debates" table scrolls within its own overflow-x-auto container
 * under 1024px (Requirement 10.4). Severity is conveyed via dot + value + label,
 * never color alone (Requirement 9.4).
 *
 * Requirements: 15
 */

'use client'

import { useEffect, useState } from 'react'
import { Activity, Vote, Users, ShieldCheck, RefreshCw, AlertTriangle } from 'lucide-react'
import { useTopBar } from '@/components/layout/TopBarContext'
import { Card, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Stat } from '@/components/app/Stat'

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

/** Map a debate status to a status dot + text label (never color alone, Req 9.4). */
function statusStyle(status: string): { dot: string; text: string } {
  switch (status) {
    case 'completed':
      return { dot: 'bg-cyan-400', text: 'text-cyan-300' }
    case 'running':
      return { dot: 'bg-sky-400', text: 'text-sky-300' }
    case 'evaluation_failed':
      return { dot: 'bg-amber-500', text: 'text-amber-400' }
    default:
      return { dot: 'bg-rose-500', text: 'text-rose-400' }
  }
}

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [costs, setCosts] = useState<CostData | null>(null)
  const [suspiciousSessions, setSuspiciousSessions] = useState<SuspiciousSession[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'costs' | 'security'>('overview')

  useTopBar({ breadcrumb: [{ label: 'Admin' }], contextPill: metrics ? `${metrics.debates.total} debates` : undefined })

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

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Admin dashboard</h1>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Real-time metrics, cost monitoring, and suspicious-activity review.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
          Refresh
        </Button>
      </div>

      {loading && (
        <Card>
          <p className="px-5 py-4 text-sm text-muted-foreground">Loading admin dashboard…</p>
        </Card>
      )}

      {!loading && error && (
        <Card>
          <CardHeader title="Failed to load dashboard" />
          <p className="border-t border-border px-5 py-4 text-sm text-rose-400">{error}</p>
        </Card>
      )}

      {!loading && !error && (
        <div className="space-y-6">
          {costs?.current.exceeded && (
            <Card className="border-rose-500/30 bg-rose-500/10">
              <div className="flex items-start gap-3 px-5 py-4">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-400" aria-hidden="true" />
                <div>
                  <p className="font-semibold text-rose-300">Daily spending cap exceeded</p>
                  <p className="text-sm text-rose-200/80">
                    Current spend: ${costs.current.currentSpend.toFixed(2)} / $
                    {costs.current.cap.toFixed(2)}
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Tabs */}
          <div className="flex gap-2 border-b border-border">
            {(['overview', 'costs', 'security'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`-mb-px border-b-2 px-3 py-2.5 text-sm font-medium capitalize transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                  activeTab === tab
                    ? 'border-primary text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <Stat
                  icon={Activity}
                  iconClass="text-cyan-300"
                  label="Total debates"
                  value={String(metrics?.debates.total ?? '—')}
                  sub={`+${metrics?.debates.last24h ?? 0} in last 24h`}
                  highlight
                />
                <Stat
                  icon={Vote}
                  iconClass="text-slate-400"
                  label="Total votes"
                  value={String(metrics?.votes.total ?? '—')}
                  sub={`+${metrics?.votes.last24h ?? 0} in last 24h`}
                />
                <Stat
                  icon={Users}
                  iconClass="text-slate-400"
                  label="Unique voters"
                  value={String(metrics?.votes.uniqueVoters ?? '—')}
                  sub={`${metrics?.votes.uniqueVotersLast24h ?? 0} active today`}
                />
                <Stat
                  icon={ShieldCheck}
                  iconClass="text-slate-400"
                  label="Fact-check accuracy"
                  value={`${metrics?.factChecks.accuracyRate.toFixed(1) ?? '—'}%`}
                  sub={`${metrics?.factChecks.verified ?? 0} verified / ${metrics?.factChecks.false ?? 0} false`}
                />
              </div>

              <Card>
                <CardHeader title="Recent debates" hint={`${metrics?.debates.recent.length ?? 0} shown`} />
                <Table>
                  <TableHeader>
                    <TableRow className="border-y border-border text-[11px] uppercase tracking-wider hover:bg-transparent">
                      <TableHead className="px-5 py-2.5 font-medium text-muted-foreground">Topic</TableHead>
                      <TableHead className="px-3 py-2.5 font-medium text-muted-foreground">Matchup</TableHead>
                      <TableHead className="px-5 py-2.5 font-medium text-muted-foreground">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {metrics?.debates.recent.map((debate) => {
                      const s = statusStyle(debate.status)
                      return (
                        <TableRow key={debate.id} className="border-b border-border last:border-0">
                          <TableCell className="px-5 py-3 font-medium text-foreground">
                            {debate.topic}
                          </TableCell>
                          <TableCell className="px-3 py-3 text-sm text-muted-foreground">
                            {debate.proModel} vs {debate.conModel}
                          </TableCell>
                          <TableCell className="px-5 py-3">
                            <span className="flex items-center gap-1.5">
                              <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} aria-hidden="true" />
                              <span className={`text-sm font-medium ${s.text}`}>{debate.status}</span>
                            </span>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </Card>
            </div>
          )}

          {activeTab === 'costs' && (
            <div className="space-y-6">
              <Card>
                <CardHeader title="Current spending" />
                <div className="space-y-6 border-t border-border px-5 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-semibold tabular-nums text-foreground">
                        ${costs?.current.currentSpend.toFixed(2)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        of ${costs?.current.cap.toFixed(2)} daily cap
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold tabular-nums text-cyan-300">
                        ${costs?.current.remainingBudget.toFixed(2)}
                      </div>
                      <p className="text-sm text-muted-foreground">remaining</p>
                    </div>
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2">
                    <div>
                      <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        By provider
                      </h3>
                      {Object.entries(costs?.current.breakdown.byProvider || {}).map(([provider, cost]) => (
                        <div key={provider} className="flex justify-between py-1 text-sm">
                          <span className="capitalize text-foreground">{provider}</span>
                          <span className="font-mono tabular-nums text-muted-foreground">${cost.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>

                    <div>
                      <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        By operation
                      </h3>
                      {Object.entries(costs?.current.breakdown.byOperation || {}).map(([operation, cost]) => (
                        <div key={operation} className="flex justify-between py-1 text-sm">
                          <span className="capitalize text-foreground">{operation}</span>
                          <span className="font-mono tabular-nums text-muted-foreground">${cost.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>

              <Card>
                <CardHeader title="Cost history" hint="Last 7 days" />
                <Table>
                  <TableHeader>
                    <TableRow className="border-y border-border text-[11px] uppercase tracking-wider hover:bg-transparent">
                      <TableHead className="px-5 py-2.5 font-medium text-muted-foreground">Date</TableHead>
                      <TableHead className="px-3 py-2.5 text-right font-medium text-muted-foreground">Cost</TableHead>
                      <TableHead className="px-5 py-2.5 font-medium text-muted-foreground">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {costs?.history.slice(0, 7).map((day) => (
                      <TableRow key={day.date} className="border-b border-border last:border-0">
                        <TableCell className="px-5 py-3 text-sm text-foreground">{day.date}</TableCell>
                        <TableCell className="px-3 py-3 text-right font-mono tabular-nums text-muted-foreground">
                          ${day.totalCost.toFixed(2)}
                        </TableCell>
                        <TableCell className="px-5 py-3">
                          {day.capExceeded ? (
                            <Badge className="border-rose-500/30 bg-rose-500/10 text-rose-400">Cap exceeded</Badge>
                          ) : (
                            <span className="text-sm text-muted-foreground">Within cap</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </div>
          )}

          {activeTab === 'security' && (
            <Card>
              <CardHeader title="Suspicious sessions" hint="threshold: 50" />
              <div className="border-t border-border px-5 py-4">
                <p className="mb-4 text-sm text-muted-foreground">
                  Sessions with anomalous voting patterns.
                </p>
                {suspiciousSessions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No suspicious sessions detected</p>
                ) : (
                  <div className="space-y-4">
                    {suspiciousSessions.map((session) => (
                      <div key={session.sessionId} className="space-y-2 rounded-lg border border-border bg-background/40 p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-mono text-sm text-foreground">{session.sessionId}</div>
                            <div className="text-xs text-muted-foreground">{session.totalVotes} total votes</div>
                          </div>
                          <Badge className="border-rose-500/30 bg-rose-500/10 text-rose-400">
                            Score: {session.anomalyScore}
                          </Badge>
                        </div>

                        <div className="space-y-1">
                          {session.flags.map((flag, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-400" aria-hidden="true" />
                              <span>{flag}</span>
                            </div>
                          ))}
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const reason = prompt('Enter reason for flagging:')
                            if (reason) {
                              flagSession(session.sessionId, reason)
                            }
                          }}
                        >
                          Flag session
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
