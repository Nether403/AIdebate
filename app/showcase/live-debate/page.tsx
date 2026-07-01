'use client'

import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import {
  Gavel,
  Scale,
  ShieldCheck,
  ShieldAlert,
  HelpCircle,
  Check,
  Pause,
  Play,
  ChevronDown,
  Terminal,
  Hash,
  Clock,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react'
import { useTopBar } from '@/components/layout/TopBarContext'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CssBar, LegendDot, severity } from '@/components/app/CssBar'
import { CodeCard } from '@/components/app/CodeCard'
import type { DebateTurn, Model, FactCheck } from '@/types'
import {
  SAMPLE_MOTION,
  sampleProModel,
  sampleConModel,
  sampleTurns,
  sampleEvaluations,
  sampleDivergence,
  sampleTelemetry,
} from '@/lib/showcase/sample-data'

/** How long each transcript turn stays before the next is auto-revealed. */
const TURN_INTERVAL_MS = 2500

type TurnWithChecks = DebateTurn & { factChecks?: FactCheck[] }

/** "sample / demo data" — neutral honesty label for illustrative surfaces (Req 7.1). */
const SampleBadge = () => <Badge tone="neutral">Sample / demo data</Badge>
/** "model-based signal · not ground truth" — accent label for judge output (Req 7.2). */
const JudgeBadge = () => <Badge tone="accent">Model-based signal · not ground truth</Badge>

export default function LiveDebateDemo() {
  useTopBar({
    breadcrumb: [
      { label: 'Workbench', href: '/' },
      { label: 'Showcase', href: '/showcase' },
      { label: 'Live debate' },
    ],
    contextPill: `${sampleTelemetry.rounds} rounds`,
    primaryAction: { label: 'New run', href: '/debate/new' },
  })

  const consensus = sampleEvaluations.find((e) => e.order === 'consensus')!
  const winnerModel = consensus.winner === 'pro' ? sampleProModel : sampleConModel

  // The auto-advancing sequence is the progressive reveal of transcript turns.
  // The parent owns the timer (Req 9.3); the pause/resume control is presentational.
  const reducedMotion = useReducedMotion() ?? false
  const totalTurns = sampleTurns.length

  const [visibleTurns, setVisibleTurns] = useState(1)
  const [playing, setPlaying] = useState(true)
  const [userControlled, setUserControlled] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  // Start paused under reduced motion (Req 12.x). useReducedMotion resolves
  // after mount, so honor it until the visitor interacts.
  useEffect(() => {
    if (!userControlled) setPlaying(!reducedMotion)
  }, [reducedMotion, userControlled])

  // The timer lives entirely in the parent. Pausing tears it down via the effect
  // cleanup; the synchronous clearTimer() in the toggle stops the advance at once.
  useEffect(() => {
    if (!playing || visibleTurns >= totalTurns) {
      clearTimer()
      return
    }
    timerRef.current = setInterval(() => {
      setVisibleTurns((c) => Math.min(c + 1, totalTurns))
    }, TURN_INTERVAL_MS)
    return clearTimer
  }, [playing, visibleTurns, totalTurns])

  const handleToggle = () => {
    setUserControlled(true)
    setPlaying((prev) => {
      const next = !prev
      if (!next) {
        clearTimer()
      } else if (visibleTurns >= totalTurns) {
        setVisibleTurns(1)
      }
      return next
    })
  }

  const sequenceComplete = visibleTurns >= totalTurns

  // Per-side factuality breakdown for the persuasion-vs-truth comparison bars.
  const proTotal =
    sampleDivergence.proFactsTrue + sampleDivergence.proFactsFalse + sampleDivergence.proFactsUnverifiable
  const conTotal =
    sampleDivergence.conFactsTrue + sampleDivergence.conFactsFalse + sampleDivergence.conFactsUnverifiable
  const factMax = Math.max(proTotal, conTotal)

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      {/* Page heading + honesty label */}
      <div className="mb-6">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <SampleBadge />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{SAMPLE_MOTION}</h1>
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          A bias-aware judge decides a fact-checked, two-sided debate. Watch the transcript build turn by turn,
          then inspect the verdict, the persuasion-vs-truth signal, and every cited source.
        </p>
      </div>

      {/* Matchup */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <div className="px-5 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">Pro</p>
            <p className="mt-1 text-sm font-semibold text-card-foreground">{sampleProModel.name}</p>
            <p className="font-mono text-xs text-muted-foreground">{sampleProModel.modelId}</p>
          </div>
        </Card>
        <Card>
          <div className="px-5 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Con</p>
            <p className="mt-1 text-sm font-semibold text-card-foreground">{sampleConModel.name}</p>
            <p className="font-mono text-xs text-muted-foreground">{sampleConModel.modelId}</p>
          </div>
        </Card>
      </div>

      {/* Judge verdict — judge output AND illustrative, so both labels (Req 7.3) */}
      <Card className="mb-6">
        <div className="flex flex-wrap items-center gap-2 border-b border-border px-5 py-3.5">
          <Gavel className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-card-foreground">Judge verdict</h2>
          <span className="ml-auto flex flex-wrap items-center gap-2">
            <SampleBadge />
            <JudgeBadge />
          </span>
        </div>
        <div className="grid grid-cols-1 gap-3 px-5 py-4 sm:grid-cols-3">
          {sampleEvaluations.map((e) => (
            <div key={e.order} className="rounded-lg border border-border bg-foreground/[0.02] p-3">
              <p className="mb-1 text-[11px] uppercase tracking-wider text-muted-foreground">
                {e.order === 'pro_first' ? 'Pro-first pass' : e.order === 'con_first' ? 'Con-first pass' : 'Consensus'}
              </p>
              <p className="text-sm font-semibold capitalize text-card-foreground">Winner: {e.winner}</p>
            </div>
          ))}
        </div>
        <div className="flex items-start gap-2 border-t border-border px-5 py-4 text-sm text-muted-foreground">
          <Scale className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <p>
            <span className="font-medium capitalize text-card-foreground">
              {winnerModel.name} (the {consensus.winner} side) wins
            </span>{' '}
            by consensus across both argument orders — no position bias, no tiebreaker needed. {consensus.reasoning}
          </p>
        </div>
      </Card>

      {/* Persuasion vs. truth — derived from judge + fact-check signals (Req 7.2) */}
      <Card className="mb-6">
        <div className="flex flex-wrap items-center gap-2 border-b border-border px-5 py-3.5">
          <ShieldCheck className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-card-foreground">Persuasion vs. truth</h2>
          <span className="ml-auto flex flex-wrap items-center gap-2">
            <SampleBadge />
            <JudgeBadge />
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 px-5 py-4 sm:grid-cols-2">
          <div className="rounded-lg border border-border bg-foreground/[0.02] p-3">
            <p className="mb-1 text-[11px] uppercase tracking-wider text-muted-foreground">Judged winner (persuasion)</p>
            <p className="text-sm font-semibold capitalize text-card-foreground">{sampleDivergence.judgedWinner}</p>
          </div>
          <div className="rounded-lg border border-border bg-foreground/[0.02] p-3">
            <p className="mb-1 text-[11px] uppercase tracking-wider text-muted-foreground">Factuality-favored side</p>
            <p className="text-sm font-semibold capitalize text-card-foreground">{sampleDivergence.factualityWinner}</p>
          </div>
        </div>

        {/* Factuality comparison bars: verified claims per side. */}
        <div className="space-y-4 px-5 pb-4">
          {[
            { side: 'Pro', verified: sampleDivergence.proFactsTrue, total: proTotal },
            { side: 'Con', verified: sampleDivergence.conFactsTrue, total: conTotal },
          ].map((r) => (
            <div key={r.side}>
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="text-foreground/80">{r.side} — claims verified</span>
                <span className="font-mono font-medium tabular-nums text-foreground">
                  {r.verified}/{r.total}
                </span>
              </div>
              <CssBar value={r.verified} max={factMax} barClass={severity(0).bar} />
            </div>
          ))}
          <div className="flex flex-wrap items-center gap-4 pt-1 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
              persuasion vs. truth:
              <span className="font-medium capitalize text-foreground">{sampleDivergence.divergence}</span>
            </span>
            <LegendDot className="bg-gradient-to-r from-cyan-500 to-violet-500" label="verified-claim share" />
          </div>
        </div>

        <p className="border-t border-border px-5 py-3 text-xs leading-relaxed text-muted-foreground">
          {sampleDivergence.note}
        </p>
      </Card>

      {/* Telemetry strip */}
      <div className="mb-6 flex flex-wrap gap-x-6 gap-y-1.5 font-mono text-xs text-muted-foreground">
        <span>{sampleTelemetry.rounds} rounds</span>
        <span>fact-check: {sampleTelemetry.factCheckMode}</span>
        <span>{sampleTelemetry.factChecks} claims checked</span>
        <span>{sampleTelemetry.factCheckSources} sources retained</span>
        <span>{sampleTelemetry.totalTokens.toLocaleString()} tokens</span>
      </div>

      {/* Transcript — the auto-advancing sequence */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">Transcript</h2>
          <SampleBadge />
          <div className="ml-auto flex items-center gap-3">
            <button
              type="button"
              onClick={handleToggle}
              aria-pressed={!playing}
              aria-label={playing ? 'Pause auto-advancing sequence' : 'Resume auto-advancing sequence'}
              className="inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-medium text-foreground transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {playing ? <Pause className="h-4 w-4" aria-hidden="true" /> : <Play className="h-4 w-4" aria-hidden="true" />}
              <span>{playing ? 'Pause' : 'Resume'}</span>
            </button>
            {!playing && (
              <span role="status" aria-live="polite" className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-amber-500" aria-hidden="true" />
                Paused
              </span>
            )}
          </div>
          <span className="w-full text-xs text-muted-foreground sm:w-auto" role="status" aria-live="polite">
            {sequenceComplete ? `All ${totalTurns} turns shown` : `Turn ${visibleTurns} of ${totalTurns}`}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          Turns reveal automatically — pause any time. Expand a turn to read the model&apos;s reflect / critique
          reasoning, and expand a fact-check to see its verdict, confidence, and sources.
        </p>

        <div className="space-y-4">
          {(sampleTurns.slice(0, visibleTurns) as TurnWithChecks[]).map((turn) => (
            <TurnCard
              key={turn.id}
              turn={turn}
              model={turn.side === 'pro' ? sampleProModel : sampleConModel}
              factCheckMode={sampleTelemetry.factCheckMode}
            />
          ))}
        </div>
      </section>

      {/* Code / API card */}
      <section className="mt-6">
        <CodeCard
          label="debate API"
          code={`POST /api/debate/run
{ "proModelId": "<uuid>", "conModelId": "<uuid>",
  "topicId": "<uuid>", "totalRounds": 3,
  "factCheckMode": "standard" }
-> { "debateId": "..." }

GET /api/debate/{debateId}
→ transcript, fact-checks, judge verdict, telemetry`}
        />
      </section>
    </div>
  )
}

/** One transcript turn rendered as a Card: header, optional RCR trace, speech, fact-checks, telemetry. */
function TurnCard({
  turn,
  model,
  factCheckMode,
}: {
  turn: TurnWithChecks
  model: Model
  factCheckMode: string
}) {
  const [showRcr, setShowRcr] = useState(false)
  const isPro = turn.side === 'pro'
  const hasRcr = Boolean(turn.reflection || turn.critique)
  const checks = turn.factChecks ?? []

  return (
    <Card>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <Badge tone={isPro ? 'accent' : 'neutral'}>{turn.side.toUpperCase()}</Badge>
          <span className="truncate text-sm font-semibold text-card-foreground">{model.name}</span>
          <span className="font-mono text-xs text-muted-foreground">Round {turn.roundNumber}</span>
        </div>
        <div className="flex shrink-0 items-center gap-3 text-xs">
          {factCheckMode !== 'off' && turn.factChecksPassed > 0 && (
            <span className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              <span className="font-mono font-medium tabular-nums text-foreground">{turn.factChecksPassed}</span>
              <span className="text-muted-foreground">verified</span>
            </span>
          )}
          {factCheckMode !== 'off' && turn.factChecksFailed > 0 && (
            <span className="flex items-center gap-1.5">
              <ShieldAlert className="h-3.5 w-3.5 text-rose-400" aria-hidden="true" />
              <span className="font-mono font-medium tabular-nums text-rose-400">{turn.factChecksFailed}</span>
              <span className="text-muted-foreground">false</span>
            </span>
          )}
          {turn.wasRejected && (
            <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-rose-400">
              Rejected
            </span>
          )}
          <span className="font-mono text-muted-foreground">{turn.wordCount} words</span>
        </div>
      </div>

      {/* RCR diagnostics (collapsible) */}
      {hasRcr && (
        <div className="border-b border-border">
          <button
            type="button"
            onClick={() => setShowRcr((v) => !v)}
            aria-expanded={showRcr}
            className="flex min-h-11 w-full items-center justify-between px-5 text-left text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <span className="flex items-center gap-2 font-mono">
              <Terminal className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              {showRcr ? 'Hide reflect / critique reasoning' : 'Show reflect / critique reasoning'}
            </span>
            <ChevronDown className={`h-4 w-4 transition-transform ${showRcr ? 'rotate-180' : ''}`} aria-hidden="true" />
          </button>
          {showRcr && (
            <div className="space-y-4 border-t border-border bg-foreground/[0.02] px-5 py-4">
              {turn.reflection && (
                <div className="space-y-1.5">
                  <h4 className="text-[10px] font-semibold uppercase tracking-wider text-primary">Reflection</h4>
                  <p className="whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground">{turn.reflection}</p>
                </div>
              )}
              {turn.critique && (
                <div className="space-y-1.5">
                  <h4 className="text-[10px] font-semibold uppercase tracking-wider text-amber-400">Critique</h4>
                  <p className="whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground">{turn.critique}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Speech body */}
      <div className="space-y-5 px-5 py-4">
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-card-foreground">{turn.speech}</p>

        {/* Fact-check annotations */}
        {factCheckMode !== 'off' && checks.length > 0 && (
          <div className="space-y-2 border-t border-border pt-4">
            <h4 className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Fact-check annotations
            </h4>
            {checks.map((c) => (
              <FactCheckRow key={c.id} factCheck={c} />
            ))}
          </div>
        )}

        {/* Per-turn telemetry */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-border pt-4 font-mono text-[11px] text-muted-foreground">
          {turn.tokensUsed != null && (
            <span className="flex items-center gap-1.5">
              <Hash className="h-3.5 w-3.5" aria-hidden="true" />
              {turn.tokensUsed.toLocaleString()} tokens
            </span>
          )}
          {turn.latencyMs != null && (
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              {(turn.latencyMs / 1000).toFixed(2)}s latency
            </span>
          )}
          {turn.retryCount > 0 && (
            <span className="flex items-center gap-1.5 text-amber-400">
              <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
              {turn.retryCount} {turn.retryCount === 1 ? 'retry' : 'retries'}
            </span>
          )}
        </div>
      </div>
    </Card>
  )
}

/** Verdict styling stays within the palette: cyan accent (verified), rose status (false), muted (unverifiable). */
function verdictStyle(verdict: FactCheck['verdict']) {
  switch (verdict) {
    case 'true':
      return { Icon: ShieldCheck, text: 'text-primary', label: 'Verified' }
    case 'false':
      return { Icon: ShieldAlert, text: 'text-rose-400', label: 'False claim' }
    default:
      return { Icon: HelpCircle, text: 'text-muted-foreground', label: 'Unverifiable' }
  }
}

/** One fact-check: verdict + claim, expandable to reasoning, confidence bar, and sources. */
function FactCheckRow({ factCheck }: { factCheck: FactCheck }) {
  const [open, setOpen] = useState(false)
  const { Icon, text, label } = verdictStyle(factCheck.verdict)
  const confidencePct = Math.round(factCheck.confidence * 100)
  const sources = Array.isArray(factCheck.sources) ? factCheck.sources : []

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-foreground/[0.02]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex min-h-11 w-full items-center justify-between gap-3 px-4 text-left transition-colors hover:bg-foreground/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <span className="flex min-w-0 items-center gap-2.5">
          <Icon className={`h-4 w-4 shrink-0 ${text}`} aria-hidden="true" />
          <span className={`text-[10px] font-semibold uppercase tracking-wider ${text}`}>{label}</span>
          <span className="truncate text-xs text-muted-foreground">&ldquo;{factCheck.claim}&rdquo;</span>
        </span>
        <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      {open && (
        <div className="space-y-3 border-t border-border px-4 py-3 text-xs text-muted-foreground">
          <div className="space-y-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Reasoning</span>
            <p className="leading-relaxed">{factCheck.reasoning}</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Confidence</span>
              <span className="font-mono font-medium tabular-nums text-foreground">{confidencePct}%</span>
            </div>
            <CssBar value={confidencePct} max={100} barClass={severity(0).bar} />
          </div>

          {sources.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Retained sources
              </span>
              <ul className="space-y-1.5">
                {sources.map((source, idx) => (
                  <li key={idx} className="flex items-center gap-1.5 font-mono text-[11px]">
                    <span className="text-muted-foreground">{idx + 1}.</span>
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    >
                      <span className="truncate">{source.url.replace(/https?:\/\/(www\.)?/, '').slice(0, 48)}…</span>
                      <ExternalLink className="h-3 w-3 shrink-0" aria-hidden="true" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
