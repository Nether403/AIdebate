'use client'

import { useEffect, useState } from 'react'
import { Activity, Clock, Gauge, Server } from 'lucide-react'
import { useTopBar } from '@/components/layout/TopBarContext'
import { Card, CardHeader } from '@/components/ui/card'
import { Stat } from '@/components/app/Stat'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

/**
 * System health page (`/health`) — the navigation contract's "System health"
 * destination (NAV_ITEMS in lib/design-system/manifest.ts). `/api/health`
 * returns JSON only, so this minimal page fetches it client-side and renders
 * the status, avoiding server-base-URL resolution issues entirely.
 *
 * Presentation only (Requirement 7.4): the data fetching below is unchanged —
 * the page renders through the shared AppShell (single <h1>, no own nav or
 * background, Requirement 2.6), sets the top bar via `useTopBar`, and styles
 * exclusively via theme tokens through the shared primitives (Stat, Card,
 * Table). Severity is conveyed via a status dot + numeric value + text label,
 * never color alone (Requirement 9.4). Loading and error states are handled so
 * a fetch failure shows a clear message rather than a blank page.
 */

// The health route's response shape (app/api/health/route.ts). Treated as
// untrusted JSON at the trust boundary — every field is optional and the
// status is narrowed defensively before driving any styling.
interface ServiceCheck {
  status?: string
  latency_ms?: number
  healthy?: boolean
  error?: string
  [key: string]: unknown
}

interface HealthResponse {
  status?: string
  timestamp?: string
  uptime_seconds?: number
  response_time_ms?: number
  environment?: string
  version?: string
  services?: Record<string, ServiceCheck>
}

type Phase =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; data: HealthResponse }

interface StatusStyle {
  label: string
  /** Status-dot background color (severity is never color alone — paired with label + value). */
  dot: string
  /** Text color for the label. */
  text: string
}

/** Map the overall status to a token-aware dot + label + text color. */
function overallStatus(status: string | undefined): StatusStyle {
  switch (status) {
    case 'healthy':
      return { label: 'Operational', dot: 'bg-cyan-400', text: 'text-cyan-300' }
    case 'degraded':
      return { label: 'Degraded', dot: 'bg-amber-500', text: 'text-amber-400' }
    case 'unhealthy':
      return { label: 'Unhealthy', dot: 'bg-rose-500', text: 'text-rose-400' }
    default:
      return { label: status ?? 'Unknown', dot: 'bg-muted-foreground', text: 'text-muted-foreground' }
  }
}

/** Map a per-service check to a dot + label + text color. */
function serviceStatus(check: ServiceCheck): StatusStyle {
  if (check.healthy === false) {
    return { label: 'Down', dot: 'bg-rose-500', text: 'text-rose-400' }
  }
  return { label: 'OK', dot: 'bg-cyan-400', text: 'text-cyan-300' }
}

export default function HealthPage() {
  const [phase, setPhase] = useState<Phase>({ kind: 'loading' })

  useTopBar({ breadcrumb: [{ label: 'System health' }] })

  useEffect(() => {
    let active = true
    // /api/health returns 503 on "unhealthy", so a non-OK response can still
    // carry a valid body — only fall back to the error state when there is no
    // usable JSON payload at all.
    fetch('/api/health', { cache: 'no-store' })
      .then(async (res) => {
        const data = (await res.json()) as HealthResponse
        if (active) setPhase({ kind: 'ready', data })
      })
      .catch((err) => {
        if (active) {
          setPhase({
            kind: 'error',
            message: err instanceof Error ? err.message : 'Unable to reach the health endpoint.',
          })
        }
      })
    return () => {
      active = false
    }
  }, [])

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">System health</h1>
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Live status of the workbench&apos;s core services, read from the <code>/api/health</code>{' '}
          endpoint.
        </p>
      </div>

      {phase.kind === 'loading' && (
        <Card>
          <p className="px-5 py-4 text-sm text-muted-foreground">Checking system health…</p>
        </Card>
      )}

      {phase.kind === 'error' && (
        <Card>
          <CardHeader title="Health check unavailable" />
          <p className="border-t border-border px-5 py-4 text-sm text-rose-400">{phase.message}</p>
        </Card>
      )}

      {phase.kind === 'ready' && (
        <div className="space-y-8">
          <OverallStatus data={phase.data} />
          <ServiceTable services={phase.data.services} />
        </div>
      )}
    </div>
  )
}

function OverallStatus({ data }: { data: HealthResponse }) {
  const status = overallStatus(data.status)
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <Stat
        icon={Activity}
        iconClass={status.text}
        label="Overall status"
        value={status.label}
        sub={[data.environment && `env: ${data.environment}`, data.version && `v${data.version}`]
          .filter(Boolean)
          .join(' · ') || '—'}
        highlight={data.status === 'healthy'}
      />
      <Stat
        icon={Clock}
        iconClass="text-slate-400"
        label="Uptime"
        value={formatUptime(data.uptime_seconds)}
        sub="since last start"
      />
      <Stat
        icon={Gauge}
        iconClass="text-slate-400"
        label="Response time"
        value={typeof data.response_time_ms === 'number' ? `${data.response_time_ms} ms` : '—'}
        sub="health endpoint"
      />
      <Stat
        icon={Server}
        iconClass="text-slate-400"
        label="Checked"
        value={formatTimestamp(data.timestamp)}
        sub="last probe"
      />
    </div>
  )
}

function ServiceTable({ services }: { services?: Record<string, ServiceCheck> }) {
  const entries = services ? Object.entries(services) : []
  if (entries.length === 0) return null

  return (
    <Card>
      <CardHeader title="Services" hint={`${entries.length} checks`} />
      {/* Table renders inside its own overflow-x-auto container, so under 1024px
          only the table scrolls horizontally, not the page (Requirement 10.4). */}
      <Table>
        <TableHeader>
          <TableRow className="border-y border-border text-[11px] uppercase tracking-wider text-muted-foreground hover:bg-transparent">
            <TableHead className="px-5 py-2.5 text-left font-medium text-muted-foreground">
              Service
            </TableHead>
            <TableHead className="px-3 py-2.5 text-left font-medium text-muted-foreground">
              Status
            </TableHead>
            <TableHead className="px-3 py-2.5 text-right font-medium text-muted-foreground">
              Latency
            </TableHead>
            <TableHead className="px-5 py-2.5 text-left font-medium text-muted-foreground">
              Detail
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map(([name, check]) => {
            const s = serviceStatus(check)
            return (
              <TableRow key={name} className="border-b border-border last:border-0">
                <TableCell className="px-5 py-3 font-medium text-foreground">
                  {formatServiceName(name)}
                </TableCell>
                <TableCell className="px-3 py-3">
                  {/* Severity = dot + numeric value (latency col) + text label, never color alone (Req 9.4). */}
                  <span className="flex items-center gap-1.5">
                    <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} aria-hidden="true" />
                    <span className={`font-medium ${s.text}`}>{s.label}</span>
                  </span>
                </TableCell>
                <TableCell className="px-3 py-3 text-right font-mono tabular-nums text-muted-foreground">
                  {typeof check.latency_ms === 'number' ? `${check.latency_ms} ms` : '—'}
                </TableCell>
                <TableCell className="px-5 py-3 text-sm text-muted-foreground">
                  {check.error ? (
                    <span className="text-rose-400">{check.error}</span>
                  ) : (
                    check.status ?? '—'
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </Card>
  )
}

function formatUptime(seconds: number | undefined): string {
  if (typeof seconds !== 'number' || !Number.isFinite(seconds)) return '—'
  const total = Math.floor(seconds)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return h > 0 ? `${h}h ${m}m` : m > 0 ? `${m}m ${s}s` : `${s}s`
}

function formatTimestamp(ts: string | undefined): string {
  if (!ts) return '—'
  const d = new Date(ts)
  return Number.isNaN(d.getTime()) ? ts : d.toLocaleString()
}

function formatServiceName(name: string): string {
  return name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}
