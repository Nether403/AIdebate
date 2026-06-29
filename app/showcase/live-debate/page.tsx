'use client'

import Link from 'next/link'
import { ArrowLeft, Gavel, ShieldCheck, Scale } from 'lucide-react'
import { DebateTranscript } from '@/components/debate'
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

export default function LiveDebateDemo() {
  const consensus = sampleEvaluations.find((e) => e.order === 'consensus')!
  const winnerModel = consensus.winner === 'pro' ? sampleProModel : sampleConModel

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 py-10">
      <div className="max-w-5xl mx-auto px-4">
        <Link href="/showcase" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-6">
          <ArrowLeft className="w-4 h-4" /> Showcase
        </Link>

        <div className="mb-2 text-sm font-medium text-blue-400">Live Debate Viewer</div>
        <h1 className="text-3xl font-bold text-white mb-6">{SAMPLE_MOTION}</h1>

        {/* Matchup */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="rounded-lg border border-blue-500/30 bg-slate-800 p-4">
            <p className="text-xs text-blue-400 font-medium mb-1">PRO</p>
            <p className="text-white font-semibold">{sampleProModel.name}</p>
            <p className="text-xs text-slate-400">{sampleProModel.modelId}</p>
          </div>
          <div className="rounded-lg border border-red-500/30 bg-slate-800 p-4">
            <p className="text-xs text-red-400 font-medium mb-1">CON</p>
            <p className="text-white font-semibold">{sampleConModel.name}</p>
            <p className="text-xs text-slate-400">{sampleConModel.modelId}</p>
          </div>
        </div>

        {/* Verdict panel */}
        <div className="rounded-xl border border-slate-700 bg-slate-800/60 p-5 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <Gavel className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-semibold text-white">Judge verdict</h2>
            <span className="ml-auto text-xs text-slate-400">{sampleTelemetry.judge}</span>
          </div>
          <div className="grid sm:grid-cols-3 gap-3 mb-4">
            {sampleEvaluations.map((e) => (
              <div key={e.order} className="rounded-lg bg-slate-900/60 border border-slate-700 p-3">
                <p className="text-xs text-slate-400 mb-1">
                  {e.order === 'pro_first' ? 'Pro-first pass' : e.order === 'con_first' ? 'Con-first pass' : 'Consensus'}
                </p>
                <p className="text-sm font-semibold text-white capitalize">Winner: {e.winner}</p>
                <p className="text-xs text-slate-400 mt-1">
                  Pro {e.proScore.toFixed(1)} · Con {e.conScore.toFixed(1)}
                </p>
              </div>
            ))}
          </div>
          <div className="flex items-start gap-2 text-sm text-slate-300">
            <Scale className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
            <p>
              <span className="font-medium text-white capitalize">{winnerModel.name} (the {consensus.winner} side) wins</span>{' '}
              by consensus across both argument orders — no position bias, no tiebreaker needed. {consensus.reasoning}
            </p>
          </div>
        </div>

        {/* Persuasion vs truth */}
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-semibold text-amber-200">Persuasion vs. truth</h2>
            <span className="ml-auto text-xs font-medium px-2 py-1 rounded-full bg-amber-500/20 text-amber-300 uppercase tracking-wide">
              {sampleDivergence.divergence}
            </span>
          </div>
          <div className="grid sm:grid-cols-2 gap-3 mb-3 text-sm">
            <div className="rounded-lg bg-slate-900/50 border border-slate-700 p-3">
              <p className="text-slate-400 text-xs mb-1">Judged winner (persuasion)</p>
              <p className="text-white font-semibold capitalize">{sampleDivergence.judgedWinner}</p>
            </div>
            <div className="rounded-lg bg-slate-900/50 border border-slate-700 p-3">
              <p className="text-slate-400 text-xs mb-1">Factuality-favored side</p>
              <p className="text-white font-semibold capitalize">{sampleDivergence.factualityWinner}</p>
            </div>
          </div>
          <p className="text-sm text-amber-100/80 leading-relaxed">{sampleDivergence.note}</p>
        </div>

        {/* Telemetry strip */}
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-400 mb-6 px-1">
          <span>{sampleTelemetry.rounds} rounds</span>
          <span>fact-check: {sampleTelemetry.factCheckMode}</span>
          <span>{sampleTelemetry.factChecks} claims checked</span>
          <span>{sampleTelemetry.factCheckSources} sources retained</span>
          <span>{sampleTelemetry.totalTokens.toLocaleString()} tokens</span>
        </div>

        {/* Transcript (the real reusable component) */}
        <h2 className="text-lg font-semibold text-white mb-3">Transcript</h2>
        <p className="text-sm text-slate-400 mb-4">
          Expand any turn to see the model&apos;s reflect / critique reasoning, and click a fact-check to see its verdict and sources.
        </p>
        <DebateTranscript turns={sampleTurns} proModel={sampleProModel} conModel={sampleConModel} factCheckMode="standard" />

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
      </div>
    </div>
  )
}
