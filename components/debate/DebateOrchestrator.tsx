'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { DebateTranscript } from './DebateTranscript'
import { useTopBar } from '@/components/layout/TopBarContext'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { Debate, DebateTurn, Model, Topic, Persona, DebateEvaluation } from '@/types'
import { Gavel, Scale, ShieldAlert, Download } from 'lucide-react'

interface DebateOrchestratorProps {
  debateId: string
}

interface DebateData extends Debate {
  topic: Topic
  proModel: Model
  conModel: Model
  proPersona: Persona | null
  conPersona: Persona | null
  turns: DebateTurn[]
  evaluations: DebateEvaluation[]
}

export function DebateOrchestrator({ debateId }: DebateOrchestratorProps) {
  const [debate, setDebate] = useState<DebateData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)

  // Keep the latest debate in a ref so the export handler stays stable and current.
  const debateRef = useRef<DebateData | null>(null)
  debateRef.current = debate

  useEffect(() => {
    fetchDebate()

    const pollInterval = setInterval(() => {
      if (debate?.status === 'running') {
        console.log('[Orchestrator] Polling for updates...')
        fetchDebate()
      }
    }, 2000)

    return () => clearInterval(pollInterval)
  }, [debateId, debate?.status])

  const fetchDebate = async () => {
    try {
      console.log(`[Orchestrator] Fetching debate ${debateId}...`)
      const response = await fetch(`/api/debate/${debateId}`)

      if (!response.ok) {
        throw new Error('Failed to fetch debate')
      }

      const data = await response.json()
      console.log(`[Orchestrator] Debate data received:`, {
        status: data.status,
        currentRound: data.currentRound,
        totalRounds: data.totalRounds,
        turnsCount: data.turns?.length || 0,
      })
      setDebate(data)

      if (data.status === 'running' && !isStreaming) {
        console.log('[Orchestrator] Starting SSE stream...')
        startStreaming()
      }
    } catch (err) {
      console.error('[Orchestrator] Error fetching debate:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  const startStreaming = () => {
    setIsStreaming(true)
    const eventSource = new EventSource(`/api/debate/stream/${debateId}`)

    eventSource.addEventListener('debate-start', (event) => {
      console.log('[Stream] Debate started:', event.data)
    })

    eventSource.addEventListener('turn-speech', (event) => {
      setTimeout(() => {
        fetchDebate()
      }, 500)
    })

    eventSource.addEventListener('turn-reflection', (event) => {
      // Reflections handled in speech events
    })

    eventSource.addEventListener('turn-critique', (event) => {
      // Critiques handled in speech events
    })

    eventSource.addEventListener('debate-complete', (event) => {
      const data = JSON.parse(event.data)
      console.log('[Stream] Debate completed:', data)

      setDebate((prev) => {
        if (!prev) return null
        return {
          ...prev,
          status: data.status,
          winner: data.winner,
          completedAt: data.completedAt,
        }
      })

      eventSource.close()
      setIsStreaming(false)
      fetchDebate()
    })

    eventSource.addEventListener('error', (event) => {
      console.error('[Stream] Error event:', event)
    })

    eventSource.onerror = (error) => {
      console.error('[Stream] Connection error:', error)
      eventSource.close()
      setIsStreaming(false)
      fetchDebate()
    }

    return () => {
      eventSource.close()
    }
  }

  const downloadJsonExport = useCallback(() => {
    const current = debateRef.current
    if (!current) return
    const dataStr =
      'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(current, null, 2))
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute('href', dataStr)
    downloadAnchor.setAttribute('download', `debate-run-${debateId}.json`)
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
  }, [debateId])

  useTopBar({
    breadcrumb: [
      { label: 'Benchmark runs', href: '/debate/new' },
      { label: 'Transcript' },
    ],
    contextPill: debate ? debate.status.replace('_', ' ') : undefined,
  })

  if (isLoading && !debate) {
    return (
      <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6">
        <div className="space-y-4 rounded-xl border border-border bg-card p-6 backdrop-blur-sm">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-8 w-3/4" />
          <div className="grid gap-5 md:grid-cols-2">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
        </div>
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    )
  }

  if (error || !debate) {
    return (
      <div className="mx-auto flex w-full max-w-6xl items-center justify-center px-4 py-8 sm:px-6">
        <Card className="w-full max-w-md p-8 text-center">
          <ShieldAlert className="mx-auto h-12 w-12 text-[var(--status-high)]" aria-hidden="true" />
          <h1 className="mt-4 text-lg font-semibold text-card-foreground">Execution aborted</h1>
          <p className="mt-2 text-xs text-[var(--status-high)]">
            {error || 'Adversarial graph context not initialized.'}
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <Button onClick={fetchDebate} variant="outline" className="min-h-11">
              Retry connection
            </Button>
            <Button asChild className="min-h-11">
              <Link href="/debate/new">Configure new run</Link>
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  const isCompleted = debate.status === 'completed'
  const consensusEval = debate.evaluations?.find((e) => e.evaluationOrder === 'consensus')
  const proFirstEval = debate.evaluations?.find((e) => e.evaluationOrder === 'pro_first')
  const conFirstEval = debate.evaluations?.find((e) => e.evaluationOrder === 'con_first')

  const statusTone = isCompleted
    ? 'border-emerald-500/35 bg-emerald-500/10 text-emerald-300'
    : debate.status === 'running'
      ? 'border-primary/35 bg-primary/10 text-primary'
      : debate.status === 'evaluation_failed'
        ? 'border-amber-500/35 bg-amber-500/10 text-amber-300'
        : 'border-[var(--status-high)]/35 bg-[var(--status-high)]/10 text-[var(--status-high)]'

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      {/* Motion banner */}
      <Card className="space-y-6 p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <span className="inline-block rounded-md border border-border bg-card px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Active benchmark motion
            </span>
            <h1 className="text-2xl font-semibold leading-snug tracking-tight text-card-foreground sm:text-3xl">
              {debate.topic.motion}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold uppercase tracking-wider ${statusTone}`}
            >
              {debate.status.replace('_', ' ')}
            </span>
            <Button onClick={downloadJsonExport} variant="outline" size="sm">
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              Export JSON
            </Button>
          </div>
        </div>

        {/* Model matchup */}
        <div className="grid items-stretch gap-5 md:grid-cols-2">
          <div className="flex flex-col justify-between rounded-xl border border-primary/20 bg-primary/[0.04] p-4">
            <div className="space-y-1">
              <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-primary">
                Affirmative
              </span>
              <h3 className="text-lg font-semibold text-card-foreground">{debate.proModel.name}</h3>
              <span className="block font-mono text-[10px] text-muted-foreground">
                {debate.proModel.modelId}
              </span>
            </div>
            {debate.proPersona && (
              <div className="mt-3 border-t border-primary/10 pt-2 text-xs italic text-muted-foreground">
                Persona: {debate.proPersona.name}
              </div>
            )}
          </div>

          <div className="flex flex-col justify-between rounded-xl border border-border bg-foreground/[0.02] p-4">
            <div className="space-y-1">
              <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Negative
              </span>
              <h3 className="text-lg font-semibold text-card-foreground">{debate.conModel.name}</h3>
              <span className="block font-mono text-[10px] text-muted-foreground">
                {debate.conModel.modelId}
              </span>
            </div>
            {debate.conPersona && (
              <div className="mt-3 border-t border-border pt-2 text-xs italic text-muted-foreground">
                Persona: {debate.conPersona.name}
              </div>
            )}
          </div>
        </div>

        {/* Telemetry metadata */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-border pt-4 font-mono text-[11px] text-muted-foreground">
          <span>
            Rounds: {debate.currentRound} / {debate.totalRounds}
          </span>
          <span>Category: {debate.topic.category}</span>
          <span>Difficulty: {debate.topic.difficulty}</span>
          {debate.factCheckMode !== 'off' && (
            <span className="text-primary">Fact-checking: {debate.factCheckMode}</span>
          )}
        </div>

        {/* Running status bar */}
        {debate.status === 'running' && (
          <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
            <span className="h-2 w-2 animate-ping rounded-full bg-primary" aria-hidden="true" />
            <p className="text-xs text-foreground">
              <span className="font-semibold text-primary">Live execution active:</span> spawning
              adversarial agents, evaluating drafts, and writing telemetry logs…
            </p>
          </div>
        )}
      </Card>

      {/* Judge consensus panel (judge output → model-based-signal badge, Req 7.2) */}
      {isCompleted && (
        <Card>
          <div className="flex flex-wrap items-center gap-3 border-b border-border px-5 py-3.5">
            <Gavel className="h-5 w-5 text-violet-400" aria-hidden="true" />
            <h2 className="text-sm font-semibold text-card-foreground">Oversight consensus report</h2>
            <Badge tone="accent">Model-based signal · not ground truth</Badge>
            <span className="ml-auto font-mono text-[10px] text-muted-foreground">
              Judge: {debate.judgeModel || 'Infrastructure default'}
            </span>
          </div>

          <div className="space-y-6 px-5 py-5">
            <div className="grid gap-4 sm:grid-cols-3">
              {proFirstEval && (
                <div className="space-y-1 rounded-xl border border-border bg-card p-4">
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Pro-first pass
                  </span>
                  <p className="text-sm font-semibold capitalize text-card-foreground">
                    Winner: {proFirstEval.winner}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Pro: {proFirstEval.proScore} · Con: {proFirstEval.conScore}
                  </p>
                </div>
              )}

              {conFirstEval && (
                <div className="space-y-1 rounded-xl border border-border bg-card p-4">
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Con-first pass
                  </span>
                  <p className="text-sm font-semibold capitalize text-card-foreground">
                    Winner: {conFirstEval.winner}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Pro: {conFirstEval.proScore} · Con: {conFirstEval.conScore}
                  </p>
                </div>
              )}

              {consensusEval && (
                <div className="space-y-1 rounded-xl border border-violet-500/20 bg-violet-500/5 p-4">
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-violet-300">
                    Consensus
                  </span>
                  <p className="text-sm font-semibold capitalize text-card-foreground">
                    Winner: {consensusEval.winner}
                  </p>
                  <p className="mt-1 text-xs text-violet-300/70">
                    Consensus: {consensusEval.consensus ? 'REACHED' : 'BIAS DETECTED'}
                  </p>
                </div>
              )}
            </div>

            {consensusEval && (
              <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 text-sm text-foreground">
                <Scale className="mt-0.5 h-5 w-5 shrink-0 text-violet-400" aria-hidden="true" />
                <div className="space-y-2">
                  <p className="font-semibold text-card-foreground">
                    {consensusEval.winner === 'pro'
                      ? debate.proModel.name
                      : consensusEval.winner === 'con'
                        ? debate.conModel.name
                        : 'Tie'}
                    {consensusEval.winner !== 'tie'
                      ? ' wins the benchmark debate.'
                      : ' results in a tie.'}
                  </p>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {consensusEval.reasoning}
                  </p>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Debate transcript */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-2">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            Adversarial transcript
          </h2>
          <span className="text-xs text-muted-foreground">
            Click headers to expand thinking traces
          </span>
        </div>
        <DebateTranscript
          turns={debate.turns}
          proModel={debate.proModel}
          conModel={debate.conModel}
          factCheckMode={debate.factCheckMode}
        />
      </section>
    </div>
  )
}
