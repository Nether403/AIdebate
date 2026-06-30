'use client'

import { useEffect, useState } from 'react'
import { ShowcaseShell } from '@/components/showcase/ShowcaseShell'
import { GlassPanel } from '@/components/showcase/GlassPanel'
import { SectionHeading } from '@/components/showcase/SectionHeading'

/**
 * System health page (`/health`) — the navigation contract's "System health"
 * destination (NAV_ITEMS in lib/design-system/manifest.ts). `/api/health`
 * returns JSON only, so this minimal page fetches it client-side and renders
 * the status, avoiding server-base-URL resolution issues entirely
 * (Requirements 5.2, 6.4).
 *
 * It renders through the shared ShowcaseShell (single <h1>, no own background,
 * Requirement 4.3) and styles exclusively via @theme tokens. Loading and error
 * states are handled so a fetch failure shows a clear message rather than a
 * blank page (Requirement 5.5 spirit).
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

/** Map the overall status to a token-based accent + label. */
function statusPresentation(status: string | undefined): { label: string; className: string } {
  switch (status) {
    case 'healthy':
      return { label: 'Operational', className: 'text-accent-primary border-accent-primary' }
    case 'degraded':
      return { label: 'Degraded', className: 'text-accent-4 border-accent-4' }
    case 'unhealthy':
      return { label: 'Unhealthy', className: 'text-accent-3 border-accent-3' }
    default:
      return { label: status ?? 'Unknown', className: 'text-text-muted border-border' }
  }
}

export default function HealthPage() {
  const [phase, setPhase] = useState<Phase>({ kind: 'loading' })

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
    <ShowcaseShell
      title="System health"
      intro="Live status of the workbench's core services, read from the /api/health endpoint."
    >
      {phase.kind === 'loading' && (
        <GlassPanel className="rounded-card p-[var(--space-lg)] text-body text-text-muted">
          Checking system health…
        </GlassPanel>
      )}

      {phase.kind === 'error' && (
        <GlassPanel className="rounded-card border-accent-3 p-[var(--space-lg)] space-y-[var(--space-sm)]">
          <SectionHeading level={2}>Health check unavailable</SectionHeading>
          <p className="text-body text-text-muted">{phase.message}</p>
        </GlassPanel>
      )}

      {phase.kind === 'ready' && (
        <div className="space-y-[var(--space-lg)]">
          <OverallStatus data={phase.data} />
          <ServiceList services={phase.data.services} />
        </div>
      )}
    </ShowcaseShell>
  )
}

function OverallStatus({ data }: { data: HealthResponse }) {
  const { label, className } = statusPresentation(data.status)
  return (
    <GlassPanel className="rounded-card p-[var(--space-lg)] space-y-[var(--space-md)]">
      <div className="flex flex-wrap items-center gap-[var(--space-md)]">
        <span
          className={`inline-flex items-center rounded-pill border px-[var(--space-md)] py-[var(--space-xs)] text-body font-semibold ${className}`}
        >
          {label}
        </span>
        {data.environment && (
          <span className="text-caption text-text-muted">env: {data.environment}</span>
        )}
        {data.version && (
          <span className="text-caption text-text-muted">version: {data.version}</span>
        )}
      </div>
      <dl className="grid grid-cols-1 gap-[var(--space-sm)] sm:grid-cols-3">
        <Stat label="Uptime" value={formatUptime(data.uptime_seconds)} />
        <Stat
          label="Response time"
          value={typeof data.response_time_ms === 'number' ? `${data.response_time_ms} ms` : '—'}
        />
        <Stat label="Checked" value={formatTimestamp(data.timestamp)} />
      </dl>
    </GlassPanel>
  )
}

function ServiceList({ services }: { services?: Record<string, ServiceCheck> }) {
  const entries = services ? Object.entries(services) : []
  if (entries.length === 0) return null

  return (
    <section className="space-y-[var(--space-md)]">
      <SectionHeading level={2}>Services</SectionHeading>
      <div className="grid grid-cols-1 gap-[var(--space-md)] sm:grid-cols-2">
        {entries.map(([name, check]) => (
          <GlassPanel key={name} className="rounded-card p-[var(--space-md)] space-y-[var(--space-xs)]">
            <div className="flex items-center justify-between gap-[var(--space-sm)]">
              <span className="text-body font-medium text-text">{formatServiceName(name)}</span>
              <span
                className={`text-caption font-semibold ${
                  check.healthy === false ? 'text-accent-3' : 'text-accent-primary'
                }`}
              >
                {check.healthy === false ? 'Down' : 'OK'}
              </span>
            </div>
            {check.status && (
              <p className="text-caption text-text-muted">status: {check.status}</p>
            )}
            {typeof check.latency_ms === 'number' && (
              <p className="text-caption text-text-muted">latency: {check.latency_ms} ms</p>
            )}
            {check.error && <p className="text-caption text-accent-3">{check.error}</p>}
          </GlassPanel>
        ))}
      </div>
    </section>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-caption text-text-muted">{label}</dt>
      <dd className="text-body text-text">{value}</dd>
    </div>
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
