'use client'

import { useState } from 'react'
import { GitPullRequest, CheckCircle2, XCircle, Loader2, Play } from 'lucide-react'
import { ShowcaseShell } from '@/components/showcase/ShowcaseShell'
import { BackToHub } from '@/components/showcase/BackToHub'
import { GlassPanel } from '@/components/showcase/GlassPanel'
import { SampleDataLabel } from '@/components/showcase/SampleDataLabel'
import { JudgeSignalLabel } from '@/components/showcase/JudgeSignalLabel'
import { EmbedNote } from '@/components/showcase/EmbedNote'

type StepState = 'idle' | 'running' | 'done'

/** Delay between each simulated gate step (user-triggered, one-shot reveal). */
const STEP_INTERVAL_MS = 750

const steps = [
  'Detecting model change: openai/gpt-5.1 → openai/gpt-5.2',
  'Loading benchmark suite: alignment-smoke-v1 (12 debates)',
  'Running debates with both model versions...',
  'Judging with bias-swapped consensus...',
  'Computing win-rate delta and charismatic-liar flag...',
]

export default function RegressionGateDemo() {
  const [state, setState] = useState<StepState>('idle')
  const [activeStep, setActiveStep] = useState(-1)

  const run = () => {
    if (state === 'running') return
    setState('running')
    setActiveStep(0)
    let i = 0
    const tick = () => {
      i += 1
      if (i < steps.length) {
        setActiveStep(i)
        setTimeout(tick, STEP_INTERVAL_MS)
      } else {
        setActiveStep(steps.length)
        setState('done')
      }
    }
    setTimeout(tick, STEP_INTERVAL_MS)
  }

  const failed = state === 'done'

  return (
    <ShowcaseShell
      title="Catch persuasive-but-wrong regressions before they ship"
      intro={
        <>
          A CI check that runs a debate benchmark whenever you change the model behind a product, then blocks the merge
          if the new model wins more often by being <em>persuasive</em> rather than <em>correct</em>.
        </>
      }
    >
      <div className="flex flex-wrap items-center gap-[var(--space-md)]">
        <BackToHub />
        <SampleDataLabel />
      </div>

      {/* Mock PR / CI panel */}
      <GlassPanel className="overflow-hidden rounded-card">
        <div className="flex items-center gap-[var(--space-sm)] border-b border-border bg-surface-raised px-[var(--space-md)] py-[var(--space-sm)]">
          <GitPullRequest className="h-4 w-4 text-accent-primary" aria-hidden="true" />
          <span className="text-caption font-medium text-text">PR #482 · Bump assistant model to gpt-5.2</span>
          <span className="ml-auto text-caption text-text-muted">checks</span>
        </div>

        <div className="p-[var(--space-md)]">
          <div className="mb-[var(--space-md)] flex items-center justify-between gap-[var(--space-md)]">
            <div className="flex items-center gap-[var(--space-sm)]">
              {state === 'idle' && <span className="h-2.5 w-2.5 rounded-pill bg-text-muted" aria-hidden="true" />}
              {state === 'running' && <Loader2 className="h-4 w-4 animate-spin text-accent-4" aria-hidden="true" />}
              {state === 'done' && <XCircle className="h-4 w-4 text-accent-3" aria-hidden="true" />}
              <span className="text-caption font-medium text-text">debate-benchmark / alignment-gate</span>
            </div>
            <button
              onClick={run}
              disabled={state === 'running'}
              className="inline-flex min-h-11 items-center gap-[var(--space-xs)] rounded-pill bg-accent-primary px-[var(--space-md)] py-[var(--space-xs)] text-caption font-medium text-bg transition-colors hover:opacity-90 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
            >
              {state === 'running' ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Play className="h-4 w-4" aria-hidden="true" />
              )}
              {state === 'idle' ? 'Run gate' : state === 'running' ? 'Running…' : 'Re-run'}
            </button>
          </div>

          {/* Steps log */}
          <div className="min-h-40 space-y-1.5 rounded-card border border-border bg-surface px-[var(--space-md)] py-[var(--space-sm)] font-mono text-caption">
            {state === 'idle' && <p className="text-text-muted">Waiting to run. Click “Run gate”.</p>}
            {state !== 'idle' &&
              steps.map((s, idx) => {
                const isDone = idx < activeStep
                const isActive = idx === activeStep
                return (
                  <div key={s} className="flex items-start gap-[var(--space-xs)]">
                    {isDone ? (
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent-primary" aria-hidden="true" />
                    ) : isActive ? (
                      <Loader2 className="mt-0.5 h-3.5 w-3.5 shrink-0 animate-spin text-accent-4" aria-hidden="true" />
                    ) : (
                      <span className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded-pill border border-border" aria-hidden="true" />
                    )}
                    <span className={isDone || isActive ? 'text-text' : 'text-text-muted'}>{s}</span>
                  </div>
                )
              })}
          </div>

          {/* Result — derived from judge / fact-check signals, so label it (Req 6.1). */}
          {failed && (
            <div className="mt-[var(--space-md)] space-y-[var(--space-md)]">
              <div className="flex flex-wrap items-center gap-[var(--space-sm)]">
                <span className="text-caption font-medium text-text">Gate result</span>
                <JudgeSignalLabel className="ml-auto" />
              </div>
              <div className="grid gap-[var(--space-sm)] sm:grid-cols-3">
                <Metric label="Win rate Δ" value="+14%" sub="gpt-5.2 vs gpt-5.1" tone="warn" />
                <Metric label="Factuality Δ" value="−9%" sub="claims holding up" tone="bad" />
                <Metric label="Charismatic-liar wins" value="3 / 12" sub="persuasion ≠ truth" tone="bad" />
              </div>
              <div className="rounded-card border border-accent-3/40 bg-accent-3/10 p-[var(--space-md)]">
                <div className="mb-1 flex items-center gap-[var(--space-xs)]">
                  <XCircle className="h-4 w-4 text-accent-3" aria-hidden="true" />
                  <span className="text-caption font-semibold text-accent-3">Gate failed — merge blocked</span>
                </div>
                <p className="text-body leading-relaxed text-text-muted">
                  gpt-5.2 wins more debates overall, but its advantage comes disproportionately from arguments that the
                  fact-checker flagged as weaker. The persuasion-vs-truth divergence crossed the configured threshold,
                  so this looks like a persuasiveness gain rather than a reasoning gain. Review before shipping.
                </p>
              </div>
            </div>
          )}
        </div>
      </GlassPanel>

      <EmbedNote
        title="How this embeds in CI"
        description="Run the benchmark as a step in your pipeline and fail the job on a divergence regression. Models are validated first so a deprecated slug can't silently pass the gate."
        snippet={`# .github/workflows/model-upgrade.yml
- run: npm run models:validate
- run: npm run benchmark:run -- --config configs/alignment-gate.json
- run: node scripts/check-divergence.js --max-charismatic-liar-rate 0.15
  # exits non-zero -> merge blocked`}
      />
    </ShowcaseShell>
  )
}

function Metric({ label, value, sub, tone }: { label: string; value: string; sub: string; tone: 'good' | 'warn' | 'bad' }) {
  const color = tone === 'good' ? 'text-accent-primary' : tone === 'warn' ? 'text-accent-4' : 'text-accent-3'
  return (
    <div className="rounded-card border border-border bg-surface-raised p-[var(--space-sm)]">
      <p className="mb-1 text-caption text-text-muted">{label}</p>
      <p className={`text-h3 font-bold ${color}`}>{value}</p>
      <p className="mt-0.5 text-caption text-text-muted">{sub}</p>
    </div>
  )
}
