'use client'

import { BarChart3, Award, AlertTriangle } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { ShowcaseShell } from '@/components/showcase/ShowcaseShell'
import { BackToHub } from '@/components/showcase/BackToHub'
import { SectionHeading } from '@/components/showcase/SectionHeading'
import { GlassPanel } from '@/components/showcase/GlassPanel'
import { SampleDataLabel } from '@/components/showcase/SampleDataLabel'
import { JudgeSignalLabel } from '@/components/showcase/JudgeSignalLabel'
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

// Severity sourced from accent tokens so the chart stays theme-aware and within
// the Design_System palette (no raw hex). SVG fill accepts CSS custom properties.
const barColor = (cl: number) =>
  cl >= 10 ? 'var(--color-accent-3)' : cl >= 6 ? 'var(--color-accent-4)' : 'var(--color-accent-primary)'
const severityClass = (cl: number) =>
  cl >= 10 ? 'text-accent-3' : cl >= 6 ? 'text-accent-4' : 'text-accent-primary'

export default function EvalReportDemo() {
  const top = [...rows].sort((a, b) => b.winRate - a.winRate)[0]
  const flagged = [...rows].sort((a, b) => b.charismaticLiar - a.charismaticLiar)[0]
  const chartData = rows.map((r) => ({ name: r.model.replace(/ /g, '\n'), winRate: r.winRate, cl: r.charismaticLiar }))

  return (
    <ShowcaseShell
      title="Benchmark run scorecard"
      intro={
        <>
          A shareable comparison across one benchmark run: who wins, whose claims hold up, and who wins by being
          persuasive rather than correct. Run name:{' '}
          <span className="text-text">alignment-topic-set-v1 · 240 debates</span>.
        </>
      }
    >
      <BackToHub />

      {/* These metrics are illustrative and derived from judge / fact-check signals,
          so both honesty labels sit adjacent to the data (Req 5.4, 6.1). */}
      <div className="flex flex-wrap items-center gap-[var(--space-sm)]">
        <SampleDataLabel />
        <JudgeSignalLabel />
      </div>

      <section className="space-y-[var(--space-md)]">
        <SectionHeading level={2}>Headline results</SectionHeading>
        <div className="grid gap-[var(--space-md)] sm:grid-cols-2">
          <GlassPanel className="rounded-card p-[var(--space-md)]">
            <div className="mb-1 flex items-center gap-[var(--space-xs)]">
              <Award className="h-4 w-4 text-accent-primary" aria-hidden="true" />
              <span className="text-caption font-medium text-accent-primary">Top win rate</span>
            </div>
            <p className="text-h3 font-bold text-text">{top.model}</p>
            <p className="text-caption text-text-muted">
              {top.winRate}% wins · {top.factuality}% factuality
            </p>
          </GlassPanel>
          <GlassPanel className="rounded-card p-[var(--space-md)]">
            <div className="mb-1 flex items-center gap-[var(--space-xs)]">
              <AlertTriangle className="h-4 w-4 text-accent-3" aria-hidden="true" />
              <span className="text-caption font-medium text-accent-3">Most charismatic-liar wins</span>
            </div>
            <p className="text-h3 font-bold text-text">{flagged.model}</p>
            <p className="text-caption text-text-muted">
              {flagged.charismaticLiar} wins where persuasion beat weaker facts · {flagged.factuality}% factuality
            </p>
          </GlassPanel>
        </div>
      </section>

      <section className="space-y-[var(--space-md)]">
        <div className="flex flex-wrap items-center gap-[var(--space-sm)]">
          <BarChart3 className="h-5 w-5 text-accent-primary" aria-hidden="true" />
          <SectionHeading level={2}>Win rate by model</SectionHeading>
          <span className="ml-auto text-caption text-text-muted">bar colored by charismatic-liar count</span>
        </div>
        <GlassPanel className="rounded-card p-[var(--space-md)]">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 8 }}>
                <XAxis dataKey="name" tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} interval={0} />
                <YAxis tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} domain={[0, 80]} unit="%" />
                <Tooltip
                  contentStyle={{
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-card)',
                    color: 'var(--color-text)',
                  }}
                  cursor={{ fill: 'color-mix(in srgb, var(--color-text-muted) 12%, transparent)' }}
                />
                <Bar dataKey="winRate" radius={[4, 4, 0, 0]}>
                  {chartData.map((d, i) => (
                    <Cell key={i} fill={barColor(d.cl)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassPanel>
      </section>

      <section className="space-y-[var(--space-md)]">
        <div className="flex flex-wrap items-center gap-[var(--space-sm)]">
          <SectionHeading level={2}>Per-model scorecard</SectionHeading>
          <JudgeSignalLabel className="ml-auto" />
        </div>
        <GlassPanel className="overflow-hidden rounded-card">
          {/* Contain wide content so the table never forces page-width overflow (Req 7.7). */}
          <div className="overflow-x-auto">
            <table className="w-full text-body">
              <thead>
                <tr className="border-b border-border text-caption uppercase tracking-wide text-text-muted">
                  <th className="px-[var(--space-md)] py-[var(--space-sm)] text-left font-medium">Model</th>
                  <th className="px-[var(--space-md)] py-[var(--space-sm)] text-right font-medium">Debates</th>
                  <th className="px-[var(--space-md)] py-[var(--space-sm)] text-right font-medium">Win rate</th>
                  <th className="px-[var(--space-md)] py-[var(--space-sm)] text-right font-medium">Factuality</th>
                  <th className="px-[var(--space-md)] py-[var(--space-sm)] text-right font-medium">Charismatic-liar</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.model} className="border-b border-border last:border-0">
                    <td className="px-[var(--space-md)] py-[var(--space-sm)] text-text">{r.model}</td>
                    <td className="px-[var(--space-md)] py-[var(--space-sm)] text-right text-text-muted">{r.debates}</td>
                    <td className="px-[var(--space-md)] py-[var(--space-sm)] text-right text-text-muted">{r.winRate}%</td>
                    <td className="px-[var(--space-md)] py-[var(--space-sm)] text-right text-text-muted">{r.factuality}%</td>
                    <td className={`px-[var(--space-md)] py-[var(--space-sm)] text-right font-medium ${severityClass(r.charismaticLiar)}`}>
                      {r.charismaticLiar}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassPanel>
        <p className="text-caption text-text-muted">
          Judge output is a model-based signal under a fixed configuration, not ground truth. Win rate measures
          persuasion; factuality and charismatic-liar counts are derived from fact-check verdicts.
        </p>
      </section>

      <EmbedNote
        title="How this embeds as a report API"
        description="Point the harness at any set of models via one config, then fetch the aggregated metrics as JSON or render them as a hosted report."
        snippet={`POST /api/eval/run
{ "models": ["anthropic/claude-sonnet-4.5","openai/gpt-5.1","x-ai/grok-4.3"],
  "topicSet": "alignment-topic-set-v1", "rounds": 3 }

GET /api/eval/{runId}/metrics
-> per-model winRate, factuality, charismaticLiarWins, costPerDebate`}
      />
    </ShowcaseShell>
  )
}
