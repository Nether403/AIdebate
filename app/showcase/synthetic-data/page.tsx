'use client'

import { useState } from 'react'
import { Database, Copy, Check } from 'lucide-react'
import { ShowcaseShell } from '@/components/showcase/ShowcaseShell'
import { BackToHub } from '@/components/showcase/BackToHub'
import { SampleDataLabel } from '@/components/showcase/SampleDataLabel'
import { GlassPanel } from '@/components/showcase/GlassPanel'
import { EmbedNote } from '@/components/showcase/EmbedNote'
import {
  SAMPLE_MOTION,
  sampleTurns,
  sampleEvaluations,
  sampleProModel,
  sampleConModel,
} from '@/lib/showcase/sample-data'

// Derive training artifacts from the same debate the flagship demo shows.
const consensus = sampleEvaluations.find((e) => e.order === 'consensus')!
const winnerSide = consensus.winner
const winnerSpeech = sampleTurns.find((t) => t.side === winnerSide && t.roundNumber === 3)!
const loserSide = winnerSide === 'pro' ? 'con' : 'pro'
const loserSpeech = sampleTurns.find((t) => t.side === loserSide && t.roundNumber === 3)!

const preferencePair = {
  task: 'debate_argument_quality',
  prompt: `Motion: "${SAMPLE_MOTION}". Argue the ${winnerSide.toUpperCase()} side's closing statement.`,
  chosen: winnerSpeech.speech,
  rejected: loserSpeech.speech,
  preference_source: 'bias-swapped LLM judge consensus',
  margin: +(consensus[winnerSide === 'pro' ? 'proScore' : 'conScore'] - consensus[winnerSide === 'pro' ? 'conScore' : 'proScore']).toFixed(2),
  rationale: consensus.reasoning,
}

const processTrace = {
  task: 'process_supervision',
  prompt: `Motion: "${SAMPLE_MOTION}". Respond to the opponent and advance the ${winnerSide.toUpperCase()} case.`,
  steps: [
    { phase: 'reflection', text: winnerSpeech.reflection, label: 'good_framing' },
    { phase: 'critique', text: winnerSpeech.critique, label: 'identifies_opponent_weakness' },
    { phase: 'speech', text: winnerSpeech.speech, label: 'grounded_rebuttal' },
  ],
  process_reward: 0.86,
}

const factRows = sampleTurns.flatMap((t) =>
  (t.factChecks ?? []).map((c) => ({
    claim: c.claim,
    verdict: c.verdict,
    confidence: c.confidence,
    sources: c.sources.map((s) => s.url),
    side: t.side,
  })),
)

const tabs = {
  preference: { label: 'Preference pair (DPO/RLHF)', data: preferencePair, count: 1, note: 'One chosen/rejected pair per debate, with the judge\'s rationale and score margin attached — preference data with an audit trail.' },
  process: { label: 'Process supervision', data: processTrace, count: 1, note: 'Step-labelled reasoning traces (reflect → critique → speech) for training process reward models that supervise how an answer is reached.' },
  facts: { label: 'Grounded fact-checks', data: factRows, count: factRows.length, note: 'Every checked claim with verdict, confidence, and source URLs — a citation/grounding dataset for retrieval and verification models.' },
}

export default function SyntheticDataDemo() {
  const [tab, setTab] = useState<keyof typeof tabs>('preference')
  const [copied, setCopied] = useState(false)
  const current = tabs[tab]
  const json = JSON.stringify(current.data, null, 2)

  const copy = () => {
    navigator.clipboard?.writeText(json)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <ShowcaseShell
      title="One debate, three training datasets"
      intro={
        <>
          The debate from the flagship demo ({sampleProModel.name} vs {sampleConModel.name}) becomes labelled training
          data automatically. Switch tabs to see the same artifact reshaped for different recipes.
        </>
      }
    >
      <div className="flex flex-wrap items-center gap-[var(--space-md)]">
        <BackToHub />
        <SampleDataLabel />
      </div>

      <section className="space-y-[var(--space-md)]">
        <div className="flex flex-wrap gap-[var(--space-sm)]">
          {(Object.keys(tabs) as (keyof typeof tabs)[]).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setTab(k)}
              aria-pressed={tab === k}
              className={`rounded-pill px-[var(--space-md)] py-[var(--space-sm)] text-caption font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg ${
                tab === k
                  ? 'bg-accent-primary text-bg'
                  : 'bg-surface-raised text-text-muted hover:text-text'
              }`}
            >
              {tabs[k].label}
            </button>
          ))}
        </div>

        <GlassPanel className="overflow-hidden rounded-card">
          <div className="flex items-center gap-[var(--space-sm)] border-b border-border bg-surface-raised px-[var(--space-md)] py-[var(--space-sm)]">
            <Database className="h-4 w-4 text-accent-4" aria-hidden="true" />
            <span className="text-caption font-medium text-text">
              {current.count} row{current.count === 1 ? '' : 's'} · {tab}.jsonl
            </span>
            <button
              type="button"
              onClick={copy}
              className="ml-auto inline-flex items-center gap-[var(--space-xs)] rounded-pill px-[var(--space-sm)] py-[var(--space-xs)] text-caption text-text-muted transition-colors hover:text-text focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-accent-primary" aria-hidden="true" />
              ) : (
                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <p className="px-[var(--space-md)] pt-[var(--space-sm)] text-caption leading-relaxed text-text-muted">
            {current.note}
          </p>
          <pre
            className="max-h-96 overflow-x-auto overflow-y-auto p-[var(--space-md)] text-caption text-text-muted"
            tabIndex={0}
            role="region"
            aria-label="Synthetic dataset JSON preview (scrollable)"
          >
            <code>{json}</code>
          </pre>
        </GlassPanel>
      </section>

      <EmbedNote
        title="How this embeds in a training pipeline"
        description="Run a benchmark, then export to JSONL. The dataset rows above are derived from the persisted artifact, so they carry full provenance (models, prompt versions, judge config, sources)."
        snippet={`npm run benchmark:run -- --config configs/topic-set-v1.json
npm run dataset:export -- --run <runId> --out exports/<runId>

# exports/<runId>/
#   preference_pairs.jsonl   process_traces.jsonl
#   fact_checks.jsonl        manifest.json`}
      />
    </ShowcaseShell>
  )
}
