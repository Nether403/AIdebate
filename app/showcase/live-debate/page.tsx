'use client'

import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import { Gavel, ShieldCheck, Scale } from 'lucide-react'
import { DebateTranscript } from '@/components/debate'
import { ShowcaseShell } from '@/components/showcase/ShowcaseShell'
import { BackToHub } from '@/components/showcase/BackToHub'
import { GlassPanel } from '@/components/showcase/GlassPanel'
import { SectionHeading } from '@/components/showcase/SectionHeading'
import { JudgeSignalLabel } from '@/components/showcase/JudgeSignalLabel'
import { SampleDataLabel } from '@/components/showcase/SampleDataLabel'
import { SimulatorControls, initialPlaying } from '@/components/showcase/SimulatorControls'
import { EmbedNote } from '@/components/showcase/EmbedNote'
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

export default function LiveDebateDemo() {
  const consensus = sampleEvaluations.find((e) => e.order === 'consensus')!
  const winnerModel = consensus.winner === 'pro' ? sampleProModel : sampleConModel

  // The auto-advancing sequence is the progressive reveal of transcript turns.
  // The parent owns the timer (Requirement 9.3); SimulatorControls is a pure
  // controlled pause/resume button.
  const reducedMotion = useReducedMotion() ?? false
  const totalTurns = sampleTurns.length

  const [visibleTurns, setVisibleTurns] = useState(1)
  const [playing, setPlaying] = useState(true)
  // Once the visitor takes control we stop overriding their choice with the
  // reduced-motion default.
  const [userControlled, setUserControlled] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  // Start paused under reduced motion (Requirement 9.7). useReducedMotion
  // resolves after mount, so honor it until the visitor interacts.
  useEffect(() => {
    if (!userControlled) setPlaying(initialPlaying(reducedMotion))
  }, [reducedMotion, userControlled])

  // The timer lives entirely in the parent. Pausing tears it down via the
  // effect cleanup, and the synchronous clearTimer() in the toggle handler
  // guarantees the advance stops well within 100ms (Requirement 9.4).
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
        // Synchronous stop on pause — do not wait for the effect cleanup.
        clearTimer()
      } else if (visibleTurns >= totalTurns) {
        // Resuming after the sequence finished replays it from the top.
        setVisibleTurns(1)
      }
      return next
    })
  }

  const sequenceComplete = visibleTurns >= totalTurns

  return (
    <ShowcaseShell
      title={SAMPLE_MOTION}
      intro="A bias-aware judge decides a fact-checked, two-sided debate. Watch the transcript build turn by turn, then inspect the verdict, the persuasion-vs-truth signal, and every cited source."
    >
      <div className="flex flex-wrap items-center gap-[var(--space-md)]">
        <BackToHub />
        <SampleDataLabel />
      </div>

      {/* Matchup */}
      <section className="grid grid-cols-1 gap-[var(--space-md)] sm:grid-cols-2">
        <GlassPanel className="rounded-card p-[var(--space-lg)]">
          <p className="text-caption font-semibold uppercase tracking-wide text-accent-primary">Pro</p>
          <p className="text-body font-semibold text-text">{sampleProModel.name}</p>
          <p className="text-caption text-text-muted">{sampleProModel.modelId}</p>
        </GlassPanel>
        <GlassPanel className="rounded-card p-[var(--space-lg)]">
          <p className="text-caption font-semibold uppercase tracking-wide text-accent-3">Con</p>
          <p className="text-body font-semibold text-text">{sampleConModel.name}</p>
          <p className="text-caption text-text-muted">{sampleConModel.modelId}</p>
        </GlassPanel>
      </section>

      {/* Judge verdict */}
      <GlassPanel className="rounded-card p-[var(--space-lg)]">
        <div className="mb-[var(--space-lg)] flex flex-wrap items-center gap-[var(--space-sm)]">
          <Gavel className="h-5 w-5 text-accent-2" aria-hidden="true" />
          <SectionHeading level={2} className="!text-h3">
            Judge verdict
          </SectionHeading>
          <JudgeSignalLabel className="ml-auto" />
        </div>
        <div className="mb-[var(--space-lg)] grid grid-cols-1 gap-[var(--space-sm)] sm:grid-cols-3">
          {sampleEvaluations.map((e) => (
            <div key={e.order} className="rounded-card border border-border bg-surface-raised p-[var(--space-md)]">
              <p className="mb-[var(--space-xs)] text-caption text-text-muted">
                {e.order === 'pro_first' ? 'Pro-first pass' : e.order === 'con_first' ? 'Con-first pass' : 'Consensus'}
              </p>
              <p className="text-body font-semibold capitalize text-text">Winner: {e.winner}</p>
              <p className="mt-[var(--space-xs)] text-caption text-text-muted">
                Pro {e.proScore.toFixed(1)} · Con {e.conScore.toFixed(1)}
              </p>
            </div>
          ))}
        </div>
        <div className="flex items-start gap-[var(--space-sm)] text-body text-text-muted">
          <Scale className="mt-0.5 h-4 w-4 shrink-0 text-text-muted" aria-hidden="true" />
          <p>
            <span className="font-medium capitalize text-text">
              {winnerModel.name} (the {consensus.winner} side) wins
            </span>{' '}
            by consensus across both argument orders — no position bias, no tiebreaker needed. {consensus.reasoning}
          </p>
        </div>
      </GlassPanel>

      {/* Persuasion vs truth */}
      <GlassPanel className="rounded-card p-[var(--space-lg)]">
        <div className="mb-[var(--space-sm)] flex flex-wrap items-center gap-[var(--space-sm)]">
          <ShieldCheck className="h-5 w-5 text-accent-4" aria-hidden="true" />
          <SectionHeading level={2} className="!text-h3">
            Persuasion vs. truth
          </SectionHeading>
          <span className="ml-auto rounded-pill border border-accent-4/40 bg-accent-4/10 px-[var(--space-sm)] py-[var(--space-xs)] text-caption font-medium uppercase tracking-wide text-accent-4">
            {sampleDivergence.divergence}
          </span>
        </div>
        <div className="mb-[var(--space-sm)] grid grid-cols-1 gap-[var(--space-sm)] text-body sm:grid-cols-2">
          <div className="rounded-card border border-border bg-surface-raised p-[var(--space-md)]">
            <p className="mb-[var(--space-xs)] text-caption text-text-muted">Judged winner (persuasion)</p>
            <p className="font-semibold capitalize text-text">{sampleDivergence.judgedWinner}</p>
          </div>
          <div className="rounded-card border border-border bg-surface-raised p-[var(--space-md)]">
            <p className="mb-[var(--space-xs)] text-caption text-text-muted">Factuality-favored side</p>
            <p className="font-semibold capitalize text-text">{sampleDivergence.factualityWinner}</p>
          </div>
        </div>
        <p className="text-body leading-relaxed text-text-muted">{sampleDivergence.note}</p>
      </GlassPanel>

      {/* Telemetry strip */}
      <div className="flex flex-wrap gap-x-[var(--space-lg)] gap-y-[var(--space-xs)] text-caption text-text-muted">
        <span>{sampleTelemetry.rounds} rounds</span>
        <span>fact-check: {sampleTelemetry.factCheckMode}</span>
        <span>{sampleTelemetry.factChecks} claims checked</span>
        <span>{sampleTelemetry.factCheckSources} sources retained</span>
        <span>{sampleTelemetry.totalTokens.toLocaleString()} tokens</span>
      </div>

      {/* Transcript — the auto-advancing sequence */}
      <section className="space-y-[var(--space-md)]">
        <div className="flex flex-wrap items-center gap-x-[var(--space-lg)] gap-y-[var(--space-sm)]">
          <SectionHeading level={2} className="!text-h3">
            Transcript
          </SectionHeading>
          <SimulatorControls playing={playing} onToggle={handleToggle} className="ml-auto" />
          <span className="text-caption text-text-muted" role="status" aria-live="polite">
            {sequenceComplete ? `All ${totalTurns} turns shown` : `Turn ${visibleTurns} of ${totalTurns}`}
          </span>
        </div>
        <p className="text-body text-text-muted">
          Turns reveal automatically — pause any time. Expand a turn to read the model&apos;s reflect / critique
          reasoning, and click a fact-check to see its verdict and sources.
        </p>
        <DebateTranscript
          turns={sampleTurns.slice(0, visibleTurns)}
          proModel={sampleProModel}
          conModel={sampleConModel}
          factCheckMode="standard"
        />
      </section>

      <EmbedNote
        description="Headless first: kick off a debate and poll for the completed artifact. The same JSON drives this viewer, your own UI, or a dataset export."
        snippet={`POST /api/debate/run
{
  "proModelId": "<uuid>", "conModelId": "<uuid>",
  "topicId": "<uuid>", "totalRounds": 3,
  "factCheckMode": "standard"
}
-> { "debateId": "..." }

GET /api/debate/{debateId}   // transcript, fact-checks, judge verdict, telemetry`}
      />
    </ShowcaseShell>
  )
}
