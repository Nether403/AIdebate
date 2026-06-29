'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, GitPullRequest, CheckCircle2, XCircle, Loader2, Play } from 'lucide-react'
import { EmbedNote } from '@/components/showcase/EmbedNote'

type StepState = 'idle' | 'running' | 'done'

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
        setTimeout(tick, 750)
      } else {
        setActiveStep(steps.length)
        setState('done')
      }
    }
    setTimeout(tick, 750)
  }

  const failed = state === 'done'

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 py-10">
      <div className="max-w-4xl mx-auto px-4">
        <Link href="/showcase" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-6">
          <ArrowLeft className="w-4 h-4" /> Showcase
        </Link>

        <div className="mb-2 text-sm font-medium text-emerald-400">Model Regression Gate</div>
        <h1 className="text-3xl font-bold text-white mb-2">Catch persuasive-but-wrong regressions before they ship</h1>
        <p className="text-slate-400 mb-6 leading-relaxed">
          A CI check that runs a debate benchmark whenever you change the model behind a product, then blocks the merge
          if the new model wins more often by being <em>persuasive</em> rather than <em>correct</em>.
        </p>

        {/* Mock PR / CI panel */}
        <div className="rounded-xl border border-slate-700 bg-slate-900/70 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-700 bg-slate-800/60">
            <GitPullRequest className="w-4 h-4 text-emerald-400" />
            <span className="text-sm text-slate-200 font-medium">PR #482 · Bump assistant model to gpt-5.2</span>
            <span className="ml-auto text-xs text-slate-400">checks</span>
          </div>

          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {state === 'idle' && <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />}
                {state === 'running' && <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />}
                {state === 'done' && <XCircle className="w-4 h-4 text-red-400" />}
                <span className="text-sm font-medium text-slate-200">debate-benchmark / alignment-gate</span>
              </div>
              <button
                onClick={run}
                disabled={state === 'running'}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-md bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
              >
                {state === 'running' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                {state === 'idle' ? 'Run gate' : state === 'running' ? 'Running…' : 'Re-run'}
              </button>
            </div>

            {/* Steps log */}
            <div className="font-mono text-xs bg-slate-950/80 border border-slate-800 rounded-lg p-3 space-y-1.5 min-h-[150px]">
              {state === 'idle' && <p className="text-slate-500">Waiting to run. Click “Run gate”.</p>}
              {state !== 'idle' &&
                steps.map((s, idx) => {
                  const isDone = idx < activeStep
                  const isActive = idx === activeStep
                  return (
                    <div key={s} className="flex items-start gap-2">
                      {isDone ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                      ) : isActive ? (
                        <Loader2 className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0 animate-spin" />
                      ) : (
                        <span className="w-3.5 h-3.5 rounded-full border border-slate-600 mt-0.5 shrink-0" />
                      )}
                      <span className={isDone || isActive ? 'text-slate-300' : 'text-slate-600'}>{s}</span>
                    </div>
                  )
                })}
            </div>

            {/* Result */}
            {failed && (
              <div className="mt-4 space-y-4">
                <div className="grid sm:grid-cols-3 gap-3">
                  <Metric label="Win rate Δ" value="+14%" sub="gpt-5.2 vs gpt-5.1" tone="warn" />
                  <Metric label="Factuality Δ" value="−9%" sub="claims holding up" tone="bad" />
                  <Metric label="Charismatic-liar wins" value="3 / 12" sub="persuasion ≠ truth" tone="bad" />
                </div>
                <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <XCircle className="w-4 h-4 text-red-400" />
                    <span className="text-sm font-semibold text-red-300">Gate failed — merge blocked</span>
                  </div>
                  <p className="text-sm text-red-100/80 leading-relaxed">
                    gpt-5.2 wins more debates overall, but its advantage comes disproportionately from arguments that the
                    fact-checker flagged as weaker. The persuasion-vs-truth divergence crossed the configured threshold,
                    so this looks like a persuasiveness gain rather than a reasoning gain. Review before shipping.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <EmbedNote
          title="How this embeds in CI"
          description="Run the benchmark as a step in your pipeline and fail the job on a divergence regression. Models are validated first so a deprecated slug can't silently pass the gate."
          snippet={`# .github/workflows/model-upgrade.yml
- run: npm run models:validate
- run: npm run benchmark:run -- --config configs/alignment-gate.json
- run: node scripts/check-divergence.js --max-charismatic-liar-rate 0.15
  # exits non-zero -> merge blocked`}
        />
      </div>
    </div>
  )
}

function Metric({ label, value, sub, tone }: { label: string; value: string; sub: string; tone: 'good' | 'warn' | 'bad' }) {
  const color = tone === 'good' ? 'text-emerald-400' : tone === 'warn' ? 'text-amber-400' : 'text-red-400'
  return (
    <div className="rounded-lg bg-slate-900/60 border border-slate-700 p-3">
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-slate-500 mt-0.5">{sub}</p>
    </div>
  )
}
