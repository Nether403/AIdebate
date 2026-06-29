'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Database, Copy, Check } from 'lucide-react'
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 py-10">
      <div className="max-w-4xl mx-auto px-4">
        <Link href="/showcase" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-6">
          <ArrowLeft className="w-4 h-4" /> Showcase
        </Link>

        <div className="mb-2 text-sm font-medium text-amber-400">Synthetic Data Generator</div>
        <h1 className="text-3xl font-bold text-white mb-2">One debate, three training datasets</h1>
        <p className="text-slate-400 mb-6 leading-relaxed">
          The debate from the flagship demo ({sampleProModel.name} vs {sampleConModel.name}) becomes labelled training
          data automatically. Switch tabs to see the same artifact reshaped for different recipes.
        </p>

        <div className="flex flex-wrap gap-2 mb-4">
          {(Object.keys(tabs) as (keyof typeof tabs)[]).map((k) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                tab === k ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {tabs[k].label}
            </button>
          ))}
        </div>

        <div className="rounded-xl border border-slate-700 bg-slate-900/70 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-700 bg-slate-800/60">
            <Database className="w-4 h-4 text-amber-400" />
            <span className="text-sm text-slate-200 font-medium">{current.count} row{current.count === 1 ? '' : 's'} · {tab}.jsonl</span>
            <button onClick={copy} className="ml-auto inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-white">
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <p className="px-4 pt-3 text-xs text-slate-400 leading-relaxed">{current.note}</p>
          <pre className="text-xs p-4 overflow-x-auto text-slate-300 max-h-[460px]">
            <code>{json}</code>
          </pre>
        </div>

        <EmbedNote
          title="How this embeds in a training pipeline"
          description="Run a benchmark, then export to JSONL. The dataset rows above are derived from the persisted artifact, so they carry full provenance (models, prompt versions, judge config, sources)."
          snippet={`npm run benchmark:run -- --config configs/topic-set-v1.json
npm run dataset:export -- --run <runId> --out exports/<runId>

# exports/<runId>/
#   preference_pairs.jsonl   process_traces.jsonl
#   fact_checks.jsonl        manifest.json`}
        />
      </div>
    </div>
  )
}
