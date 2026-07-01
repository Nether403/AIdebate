'use client'

import { useState } from 'react'
import { GitPullRequest, CheckCircle2, XCircle, Loader2, Play } from 'lucide-react'
import { useTopBar } from '@/components/layout/TopBarContext'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CodeCard } from '@/components/app/CodeCard'
import { severity } from '@/components/app/CssBar'
import { cn } from '@/lib/utils'

/**
 * Regression-gate showcase — a CI check that runs a debate benchmark on a model
 * change and blocks the merge when the new model wins by being *persuasive*
 * rather than *correct*.
 *
 * Presentation only: every metric below is ILLUSTRATIVE SAMPLE DATA. The
 * nav/background/top bar are owned by AppShell; this page renders its content
 * and sets the top bar declaratively via `useTopBar`. Exactly one <h1>.
 */

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
  useTopBar({
    breadcrumb: [{ label: 'Showcase', href: '/showcase' }, { label: 'Regression gate' }],
    contextPill: 'CI demo',
  })

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
  // The flagged charismatic-liar count drives the severity bucket (3 → high).
  const liar = severity(3)

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      {/* Page heading + honesty labels */}
      <div className="mb-6">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <Badge tone="neutral">Sample / demo data</Badge>
          <Badge tone="accent">Model-based signal · not ground truth</Badge>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Catch persuasive-but-wrong regressions before they ship
        </h1>
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          A CI check that runs a debate benchmark whenever you change the model behind a product,
          then blocks the merge if the new model wins more often by being <em>persuasive</em> rather
          than <em>correct</em>.
        </p>
      </div>

      {/* Mock PR / CI panel */}
      <Card>
        <div className="flex items-center gap-2 border-b border-border bg-foreground/[0.03] px-5 py-3">
          <GitPullRequest className="h-4 w-4 text-primary" aria-hidden="true" />
          <span className="text-sm font-medium text-foreground">
            PR #482 · Bump assistant model to gpt-5.2
          </span>
          <span className="ml-auto text-xs text-muted-foreground">checks</span>
        </div>

        <div className="p-5">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              {state === 'idle' && (
                <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground" aria-hidden="true" />
              )}
              {state === 'running' && (
                <Loader2 className="h-4 w-4 animate-spin text-amber-400" aria-hidden="true" />
              )}
              {state === 'done' && <XCircle className="h-4 w-4 text-rose-400" aria-hidden="true" />}
              <span className="text-sm font-medium text-foreground">
                debate-benchmark / alignment-gate
              </span>
              <span className="text-xs text-muted-foreground">
                {state === 'idle' ? 'queued' : state === 'running' ? 'running' : 'failed'}
              </span>
            </div>
            <Button type="button" onClick={run} disabled={state === 'running'} className="min-h-11">
              {state === 'running' ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Play className="h-4 w-4" aria-hidden="true" />
              )}
              {state === 'idle' ? 'Run gate' : state === 'running' ? 'Running…' : 'Re-run'}
            </Button>
          </div>

          {/* Steps log */}
          <div className="min-h-40 space-y-1.5 rounded-lg border border-border bg-foreground/[0.02] px-4 py-3 font-mono text-xs">
            {state === 'idle' && (
              <p className="text-muted-foreground">Waiting to run. Click &ldquo;Run gate&rdquo;.</p>
            )}
            {state !== 'idle' &&
              steps.map((s, idx) => {
                const isDone = idx < activeStep
                const isActive = idx === activeStep
                return (
                  <div key={s} className="flex items-start gap-2">
                    {isDone ? (
                      <CheckCircle2
                        className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-300"
                        aria-hidden="true"
                      />
                    ) : isActive ? (
                      <Loader2
                        className="mt-0.5 h-3.5 w-3.5 shrink-0 animate-spin text-amber-400"
                        aria-hidden="true"
                      />
                    ) : (
                      <span
                        className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded-full border border-border"
                        aria-hidden="true"
                      />
                    )}
                    <span className={isDone || isActive ? 'text-foreground' : 'text-muted-foreground'}>
                      {s}
                    </span>
                  </div>
                )
              })}
          </div>

          {/* Result — derived from judge / fact-check signals (labelled above). */}
          {failed && (
            <div className="mt-5 space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <GateMetric
                  label="Win rate Δ"
                  value="+14%"
                  status="elevated"
                  sub="gpt-5.2 vs gpt-5.1"
                  dotClass="bg-amber-500"
                  valueClass="text-amber-400"
                />
                <GateMetric
                  label="Factuality Δ"
                  value="−9%"
                  status="regressed"
                  sub="claims holding up"
                  dotClass="bg-rose-500"
                  valueClass="text-rose-400"
                />
                <GateMetric
                  label="Charismatic-liar wins"
                  value="3 / 12"
                  status={liar.label}
                  sub="persuasion ≠ truth"
                  dotClass={liar.dot}
                  valueClass={liar.text}
                />
              </div>

              <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 p-4">
                <div className="mb-1 flex items-center gap-1.5">
                  <XCircle className="h-4 w-4 text-rose-400" aria-hidden="true" />
                  <span className="text-sm font-semibold text-rose-400">
                    Gate failed — merge blocked
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  gpt-5.2 wins more debates overall, but its advantage comes disproportionately from
                  arguments that the fact-checker flagged as weaker. The persuasion-vs-truth
                  divergence crossed the configured threshold, so this looks like a persuasiveness
                  gain rather than a reasoning gain. Review before shipping.
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* How this embeds in CI */}
      <section className="mt-6">
        <div className="mb-2">
          <p className="text-sm font-medium text-foreground">How this embeds in CI</p>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Run the benchmark as a step in your pipeline and fail the job on a divergence
            regression. Models are validated first so a deprecated slug can&apos;t silently pass the
            gate.
          </p>
        </div>
        <CodeCard
          label="CI workflow"
          code={`# .github/workflows/model-upgrade.yml
- run: npm run models:validate
- run: npm run benchmark:run -- --config configs/alignment-gate.json
- run: node scripts/check-divergence.js --max-charismatic-liar-rate 0.15
  # exits non-zero -> merge blocked`}
        />
      </section>
    </div>
  )
}

/**
 * Gate result tile. Severity is conveyed via status dot + numeric value + text
 * label, never color alone (Req 9.4).
 */
function GateMetric({
  label,
  value,
  status,
  sub,
  dotClass,
  valueClass,
}: {
  label: string
  value: string
  status: string
  sub: string
  dotClass: string
  valueClass: string
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="mb-1 text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={cn('font-mono text-xl font-bold tabular-nums', valueClass)}>{value}</p>
      <span className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
        <span className={cn('h-1.5 w-1.5 rounded-full', dotClass)} aria-hidden="true" />
        <span className="font-medium capitalize text-foreground/80">{status}</span>
        <span aria-hidden="true">·</span>
        {sub}
      </span>
    </div>
  )
}
