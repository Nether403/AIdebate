'use client'

import { useState } from 'react'
import { useTopBar } from '@/components/layout/TopBarContext'
import { Badge } from '@/components/ui/badge'
import { CodeCard } from '@/components/app/CodeCard'
import {
  SAMPLE_MOTION,
  sampleTurns,
  sampleEvaluations,
  sampleProModel,
  sampleConModel,
} from '@/lib/showcase/sample-data'

/**
 * Synthetic-data showcase — one persisted debate artifact reshaped into three
 * training datasets. Rendered inside the global AppShell (which owns the
 * sidebar, top bar, and ambient background; this page declares none of its own,
 * per Req 2.6). The top bar breadcrumb is set declaratively via `useTopBar`.
 *
 * Presentation only: the rows below are ILLUSTRATIVE SAMPLE DATA derived from
 * the curated demo debate, labelled with a neutral "sample / demo data" badge
 * (Req 7.1). JSONL and pipeline blocks render with the CodeCard treatment
 * (mono, header, copy — Req 1.8). Exactly one <h1> (Req 9.2).
 */

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
  const current = tabs[tab]
  const json = JSON.stringify(current.data, null, 2)

  useTopBar({
    breadcrumb: [{ label: 'Workbench', href: '/' }, { label: 'Showcase', href: '/showcase' }, { label: 'Synthetic data' }],
    contextPill: '1 debate · 3 datasets',
  })

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8 px-4 py-10 sm:px-6">
      <header className="space-y-3">
        <Badge tone="neutral">Sample / demo data</Badge>
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          One debate, three training datasets
        </h1>
        <p className="max-w-3xl text-muted-foreground">
          The debate from the flagship demo ({sampleProModel.name} vs {sampleConModel.name}) becomes
          labelled training data automatically. Switch tabs to see the same artifact reshaped for
          different recipes.
        </p>
      </header>

      <section className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {(Object.keys(tabs) as (keyof typeof tabs)[]).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setTab(k)}
              aria-pressed={tab === k}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                tab === k
                  ? 'border-primary/30 bg-primary/10 text-primary'
                  : 'border-border bg-foreground/[0.04] text-muted-foreground hover:text-foreground'
              }`}
            >
              {tabs[k].label}
            </button>
          ))}
        </div>

        <p className="text-sm leading-relaxed text-muted-foreground">{current.note}</p>

        <CodeCard
          label={`${current.count} row${current.count === 1 ? '' : 's'} · ${tab}.jsonl`}
          code={json}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">
          How this embeds in a training pipeline
        </h2>
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
          Run a benchmark, then export to JSONL. The dataset rows above are derived from the
          persisted artifact, so they carry full provenance (models, prompt versions, judge config,
          sources).
        </p>
        <CodeCard
          label="export pipeline"
          code={`npm run benchmark:run -- --config configs/topic-set-v1.json
npm run dataset:export -- --run <runId> --out exports/<runId>

# exports/<runId>/
#   preference_pairs.jsonl   process_traces.jsonl
#   fact_checks.jsonl        manifest.json`}
        />
      </section>
    </div>
  )
}
