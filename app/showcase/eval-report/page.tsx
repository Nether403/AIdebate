'use client'

import Link from 'next/link'
import { ArrowLeft, BarChart3, Award, AlertTriangle } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { EmbedNote } from '@/components/showcase/EmbedNote'

interface Row {
  model: string
  debates: number
  winRate: number
  factuality: number
  charismaticLiar: number
}

const rows: Row[] = [
  { model: 'Claude Sonnet 4.5', debates: 48, winRate: 64, factuality: 91, charismaticLiar: 3 },
  { model: 'GPT-5.1', debates: 48, winRate: 61, factuality: 88, charismaticLiar: 5 },
  { model: 'Gemini 3.1 Pro', debates: 48, winRate: 58, factuality: 90, charismaticLiar: 4 },
  { model: 'Grok 4.3', debates: 48, winRate: 55, factuality: 79, charismaticLiar: 11 },
  { model: 'DeepSeek V3.1', debates: 48, winRate: 47, factuality: 85, charismaticLiar: 6 },
]

const barColor = (cl: number) => (cl >= 10 ? '#fb7185' : cl >= 6 ? '#fbbf24' : '#34d399')

export default function EvalReportDemo() {
  const top = [...rows].sort((a, b) => b.winRate - a.winRate)[0]
  const flagged = [...rows].sort((a, b) => b.charismaticLiar - a.charismaticLiar)[0]
  const chartData = rows.map((r) => ({ name: r.model.replace(/ /g, '\n'), winRate: r.winRate, cl: r.charismaticLiar }))

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 py-10">
      <div className="max-w-4xl mx-auto px-4">
        <Link href="/showcase" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-6">
          <ArrowLeft className="w-4 h-4" /> Showcase
        </Link>

        <div className="mb-2 text-sm font-medium text-rose-400">Eval-as-a-Service Report</div>
        <h1 className="text-3xl font-bold text-white mb-2">Benchmark run scorecard</h1>
        <p className="text-slate-400 mb-6 leading-relaxed">
          A shareable comparison across one benchmark run: who wins, whose claims hold up, and who wins by being
          persuasive rather than correct. Run name: <span className="text-slate-300">alignment-topic-set-v1 · 240 debates</span>.
        </p>

        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
            <div className="flex items-center gap-2 mb-1">
              <Award className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-medium text-emerald-300">Top win rate</span>
            </div>
            <p className="text-xl font-bold text-white">{top.model}</p>
            <p className="text-xs text-slate-400">{top.winRate}% wins · {top.factuality}% factuality</p>
          </div>
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span className="text-sm font-medium text-rose-300">Most charismatic-liar wins</span>
            </div>
            <p className="text-xl font-bold text-white">{flagged.model}</p>
            <p className="text-xs text-slate-400">
              {flagged.charismaticLiar} wins where persuasion beat weaker facts · {flagged.factuality}% factuality
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-5 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-rose-400" />
            <h2 className="text-lg font-semibold text-white">Win rate by model</h2>
            <span className="ml-auto text-xs text-slate-400">bar colored by charismatic-liar count</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 8 }}>
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} interval={0} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} domain={[0, 80]} unit="%" />
                <Tooltip
                  contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0' }}
                  cursor={{ fill: 'rgba(148,163,184,0.08)' }}
                />
                <Bar dataKey="winRate" radius={[4, 4, 0, 0]}>
                  {chartData.map((d, i) => (
                    <Cell key={i} fill={barColor(d.cl)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-slate-700 bg-slate-900/70 overflow-hidden mb-2">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-slate-400 text-xs uppercase tracking-wide">
                <th className="text-left px-4 py-3 font-medium">Model</th>
                <th className="text-right px-4 py-3 font-medium">Debates</th>
                <th className="text-right px-4 py-3 font-medium">Win rate</th>
                <th className="text-right px-4 py-3 font-medium">Factuality</th>
                <th className="text-right px-4 py-3 font-medium">Charismatic-liar</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.model} className="border-b border-slate-800 last:border-0">
                  <td className="px-4 py-3 text-white">{r.model}</td>
                  <td className="px-4 py-3 text-right text-slate-300">{r.debates}</td>
                  <td className="px-4 py-3 text-right text-slate-300">{r.winRate}%</td>
                  <td className="px-4 py-3 text-right text-slate-300">{r.factuality}%</td>
                  <td className={`px-4 py-3 text-right font-medium ${r.charismaticLiar >= 10 ? 'text-rose-400' : r.charismaticLiar >= 6 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {r.charismaticLiar}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-slate-500 mb-2">
          Judge output is a model-based signal under a fixed configuration, not ground truth. Win rate measures
          persuasion; factuality and charismatic-liar counts are derived from fact-check verdicts.
        </p>

        <EmbedNote
          title="How this embeds as a report API"
          description="Point the harness at any set of models via one config, then fetch the aggregated metrics as JSON or render them as a hosted report."
          snippet={`POST /api/eval/run
{ "models": ["anthropic/claude-sonnet-4.5","openai/gpt-5.1","x-ai/grok-4.3"],
  "topicSet": "alignment-topic-set-v1", "rounds": 3 }

GET /api/eval/{runId}/metrics
-> per-model winRate, factuality, charismaticLiarWins, costPerDebate`}
        />
      </div>
    </div>
  )
}
