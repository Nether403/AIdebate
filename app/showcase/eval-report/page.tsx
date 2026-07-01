'use client'

import {
  Trophy,
  TriangleAlert,
  Layers,
  Coins,
} from 'lucide-react'
import { useTopBar } from '@/components/layout/TopBarContext'
import { Card, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Stat } from '@/components/app/Stat'
import { CssBar, LegendDot, severity } from '@/components/app/CssBar'
import { CodeCard } from '@/components/app/CodeCard'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

/**
 * Canonical eval-report screen — the visual ground truth for the redesign.
 *
 * Ported from the throwaway reference screen (`app/reference/page.tsx`) onto the
 * shared primitives built in waves 2–4. Presentation only: the metrics below are
 * ILLUSTRATIVE SAMPLE DATA (a view-model), not wired to real debate/judge/API data.
 *
 * The nav/background/top bar are owned by AppShell; this page only renders its
 * content and sets the top bar declaratively via `useTopBar`. Exactly one <h1>.
 */

interface Row {
  model: string
  debates: number
  winRate: number
  factuality: number
  charismaticLiar: number
}

const ROWS: Row[] = [
  { model: 'Claude Sonnet 4.5', debates: 48, winRate: 64, factuality: 91, charismaticLiar: 3 },
  { model: 'GPT-5.1', debates: 48, winRate: 61, factuality: 88, charismaticLiar: 5 },
  { model: 'Gemini 3.1 Pro', debates: 48, winRate: 58, factuality: 90, charismaticLiar: 4 },
  { model: 'Grok 4.3', debates: 48, winRate: 55, factuality: 79, charismaticLiar: 11 },
  { model: 'DeepSeek V3.1', debates: 48, winRate: 47, factuality: 85, charismaticLiar: 6 },
]

const byWinRate = [...ROWS].sort((a, b) => b.winRate - a.winRate)

export default function EvalReportDemo() {
  useTopBar({
    breadcrumb: [{ label: 'Benchmark runs' }, { label: 'alignment-topic-set-v1' }],
    contextPill: '240 debates',
    primaryAction: { label: 'New run', href: '/debate/new' },
  })

  const top = byWinRate[0]
  const flagged = [...ROWS].sort((a, b) => b.charismaticLiar - a.charismaticLiar)[0]
  const totalDebates = ROWS.reduce((n, r) => n + r.debates, 0)
  const maxWin = Math.max(...ROWS.map((r) => r.winRate))

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      {/* Page heading + honesty labels */}
      <div className="mb-6">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <Badge tone="neutral">Sample / demo data</Badge>
          <Badge tone="accent">Model-based signal · not ground truth</Badge>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Benchmark run scorecard
        </h1>
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          A comparison across one benchmark run: who wins, whose claims hold up, and who wins by
          being persuasive rather than correct.
        </p>
      </div>

      {/* KPI stat row */}
      <div className="mb-3 flex items-center gap-2">
        <Badge tone="neutral">Sample / demo data</Badge>
      </div>
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat
          icon={Trophy}
          iconClass="text-cyan-300"
          label="Top win rate"
          value={top.model}
          sub={`${top.winRate}% wins · ${top.factuality}% factuality`}
          highlight
        />
        <Stat
          icon={TriangleAlert}
          iconClass="text-rose-400"
          label="Most charismatic-liar wins"
          value={flagged.model}
          sub={`${flagged.charismaticLiar} wins over weaker facts`}
        />
        <Stat
          icon={Layers}
          iconClass="text-slate-400"
          label="Total debates"
          value={String(totalDebates)}
          sub={`${ROWS.length} models · 3 rounds`}
        />
        <Stat
          icon={Coins}
          iconClass="text-slate-400"
          label="Avg cost / debate"
          value="$0.042"
          sub="est. from token usage"
        />
      </div>

      {/* Two-column: win-rate bars + scorecard table */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Win-rate comparison bars */}
        <section className="min-w-0 lg:col-span-2">
          <Card>
            <CardHeader title="Win rate by model" hint="bar color = charismatic-liar level" />
            <div className="space-y-4 px-5 pb-5">
              {byWinRate.map((r) => {
                const s = severity(r.charismaticLiar)
                return (
                  <div key={r.model}>
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="text-foreground/80">{r.model}</span>
                      <span className="font-mono font-medium tabular-nums text-foreground">
                        {r.winRate}%
                      </span>
                    </div>
                    <CssBar value={r.winRate} max={maxWin} barClass={s.bar} />
                  </div>
                )
              })}
              <div className="flex items-center gap-4 pt-1 text-[11px] text-muted-foreground">
                <LegendDot className="bg-gradient-to-r from-cyan-500 to-violet-500" label="low" />
                <LegendDot className="bg-amber-500" label="elevated" />
                <LegendDot className="bg-rose-500" label="high" />
              </div>
            </div>
          </Card>
        </section>

        {/* Per-model scorecard table */}
        <section className="min-w-0 lg:col-span-3">
          <Card>
            <div className="flex items-center justify-between px-5 pt-3.5">
              <Badge tone="neutral">Sample / demo data</Badge>
            </div>
            <CardHeader title="Per-model scorecard" hint="sorted by win rate" />
            <Table>
              <TableHeader>
                <TableRow className="border-y border-border text-[11px] uppercase tracking-wider text-muted-foreground hover:bg-transparent">
                  <TableHead className="px-5 py-2.5 text-left font-medium text-muted-foreground">
                    Model
                  </TableHead>
                  <TableHead className="px-3 py-2.5 text-right font-medium text-muted-foreground">
                    Debates
                  </TableHead>
                  <TableHead className="px-3 py-2.5 text-right font-medium text-muted-foreground">
                    Win
                  </TableHead>
                  <TableHead className="px-3 py-2.5 text-right font-medium text-muted-foreground">
                    Factuality
                  </TableHead>
                  <TableHead className="px-5 py-2.5 text-right font-medium text-muted-foreground">
                    Char.-liar
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {byWinRate.map((r) => {
                  const s = severity(r.charismaticLiar)
                  return (
                    <TableRow key={r.model} className="border-b border-border last:border-0">
                      <TableCell className="px-5 py-3 font-medium text-foreground">
                        {r.model}
                      </TableCell>
                      <TableCell className="px-3 py-3 text-right font-mono tabular-nums text-muted-foreground">
                        {r.debates}
                      </TableCell>
                      <TableCell className="px-3 py-3 text-right font-mono tabular-nums text-foreground">
                        {r.winRate}%
                      </TableCell>
                      <TableCell className="px-3 py-3 text-right font-mono tabular-nums text-muted-foreground">
                        {r.factuality}%
                      </TableCell>
                      <TableCell className="px-5 py-3">
                        <span className="flex items-center justify-end gap-1.5">
                          <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} aria-hidden="true" />
                          <span className={`font-mono font-medium tabular-nums ${s.text}`}>
                            {r.charismaticLiar}
                          </span>
                        </span>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
            <p className="border-t border-border px-5 py-3 text-xs leading-relaxed text-muted-foreground">
              Win rate measures persuasion; factuality and charismatic-liar counts are derived from
              fact-check verdicts under a fixed judge configuration. Judge output is a model-based
              signal, not ground truth.
            </p>
          </Card>
        </section>
      </div>

      {/* Code / API card */}
      <section className="mt-6">
        <CodeCard
          label="eval API"
          code={`POST /api/eval/run
{ "models": ["anthropic/claude-sonnet-4.5", "openai/gpt-5.1", "x-ai/grok-4.3"],
  "topicSet": "alignment-topic-set-v1", "rounds": 3 }

GET /api/eval/{runId}/metrics
→ per-model winRate, factuality, charismaticLiarWins, costPerDebate`}
        />
      </section>
    </div>
  )
}
