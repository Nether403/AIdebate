import Image from 'next/image'
import {
  FlaskConical,
  ScrollText,
  ShieldCheck,
  GitCompareArrows,
  Database,
  Activity,
  Trophy,
  TriangleAlert,
  Layers,
  Coins,
  ChevronRight,
  Copy,
} from 'lucide-react'

/**
 * REFERENCE SCREEN — design exploration only (not wired into the app).
 *
 * Approved layout/density from the first pass, now with measured "flair":
 * a cool near-black base (not flat grey-on-black), two soft ambient glows and
 * gradient accents drawn from the logo's cyan→violet→pink iridescence, and the
 * real brand logo in the shell. Restrained: one ambient glow layer + gradient
 * only on interactive/emphasis roles, surfaces stay calm and legible.
 *
 * Rendered as a full-viewport overlay so it escapes the legacy top-nav and
 * shows only the new look. Illustrative data, same as /showcase/eval-report.
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

const NAV = [
  { icon: FlaskConical, label: 'Benchmark runs', active: true },
  { icon: ScrollText, label: 'Debate transcripts' },
  { icon: ShieldCheck, label: 'Fact-checks & judge' },
  { icon: GitCompareArrows, label: 'Compare models' },
  { icon: Database, label: 'Export datasets' },
  { icon: Activity, label: 'System health' },
]

// charismatic-liar severity → status color (low = signature cyan, then amber, rose)
function severity(cl: number) {
  if (cl >= 10) return { text: 'text-rose-400', dot: 'bg-rose-500', bar: 'from-rose-500 to-rose-400', label: 'high' }
  if (cl >= 6) return { text: 'text-amber-400', dot: 'bg-amber-500', bar: 'from-amber-500 to-amber-400', label: 'elevated' }
  return { text: 'text-cyan-300', dot: 'bg-cyan-400', bar: 'from-cyan-500 to-violet-500', label: 'low' }
}

export default function ReferenceScreen() {
  const top = [...ROWS].sort((a, b) => b.winRate - a.winRate)[0]
  const flagged = [...ROWS].sort((a, b) => b.charismaticLiar - a.charismaticLiar)[0]
  const totalDebates = ROWS.reduce((n, r) => n + r.debates, 0)
  const maxWin = Math.max(...ROWS.map((r) => r.winRate))

  return (
    <div className="fixed inset-0 z-[100] flex overflow-hidden bg-[#070b11] font-sans text-slate-200 antialiased">
      {/* Ambient glows pulled from the logo palette — soft, low-opacity, behind everything */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute -left-24 -top-32 h-[28rem] w-[28rem] rounded-full bg-cyan-500/10 blur-[130px]" />
        <div className="absolute -bottom-32 right-0 h-[28rem] w-[28rem] rounded-full bg-violet-600/10 blur-[130px]" />
        <div className="absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 rounded-full bg-fuchsia-500/5 blur-[120px]" />
      </div>

      {/* ---------------------------------------------------------------- Sidebar */}
      <aside className="relative z-10 hidden w-64 shrink-0 flex-col border-r border-white/[0.07] bg-[#080c12]/70 backdrop-blur-xl lg:flex">
        <div className="flex h-16 items-center gap-3 border-b border-white/[0.07] px-5">
          <div className="relative">
            <div className="absolute inset-0 rounded-lg bg-cyan-400/30 blur-md" aria-hidden="true" />
            <Image
              src="/logo.jpg"
              alt="LLMargument workbench logo"
              width={34}
              height={34}
              className="relative rounded-lg ring-1 ring-white/10"
            />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold tracking-tight text-slate-100">llmargument</p>
            <p className="text-[11px] text-slate-500">Debate workbench</p>
          </div>
        </div>

        <nav className="flex-1 space-y-0.5 px-3 py-4">
          <p className="px-3 pb-2 text-[11px] font-medium uppercase tracking-wider text-slate-600">
            Workspace
          </p>
          {NAV.map(({ icon: Icon, label, active }) => (
            <a
              key={label}
              href="#"
              className={[
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                active
                  ? 'bg-cyan-500/10 font-medium text-white ring-1 ring-inset ring-cyan-400/20'
                  : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200',
              ].join(' ')}
            >
              <Icon className={active ? 'h-4 w-4 shrink-0 text-cyan-300' : 'h-4 w-4 shrink-0'} strokeWidth={2} />
              {label}
            </a>
          ))}
        </nav>

        <div className="border-t border-white/[0.07] p-3">
          <div className="flex items-center gap-3 rounded-lg px-3 py-2">
            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-cyan-400 to-violet-500" />
            <div className="leading-tight">
              <p className="text-xs font-medium text-slate-200">Research</p>
              <p className="text-[11px] text-slate-500">alignment-lab</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ------------------------------------------------------------- Main column */}
      <div className="relative z-10 flex min-w-0 flex-1 flex-col overflow-y-auto">
        {/* Top bar */}
        <header className="sticky top-0 z-10 flex h-16 items-center gap-3 border-b border-white/[0.07] bg-[#070b11]/70 px-6 backdrop-blur-xl">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span>Benchmark runs</span>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="font-medium text-slate-200">alignment-topic-set-v1</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="rounded-md border border-white/10 bg-white/[0.03] px-2.5 py-1 text-xs text-slate-400">
              240 debates
            </span>
            <button className="rounded-md bg-gradient-to-r from-cyan-500 to-violet-500 px-3 py-1.5 text-sm font-medium text-white shadow-[0_0_20px_-6px_rgba(34,211,238,0.6)] transition-all hover:brightness-110">
              New run
            </button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
          {/* Page heading */}
          <div className="mb-6">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge tone="neutral">Sample / demo data</Badge>
              <Badge tone="accent">Model-based signal · not ground truth</Badge>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-white">
              Benchmark run scorecard
            </h1>
            <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-slate-400">
              A comparison across one benchmark run: who wins, whose claims hold up, and who wins by
              being persuasive rather than correct.
            </p>
          </div>

          {/* KPI stat row */}
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

          {/* Two-column: chart + table */}
          <div className="grid gap-6 lg:grid-cols-5">
            {/* Win-rate bars */}
            <section className="lg:col-span-2">
              <Card>
                <CardHeader title="Win rate by model" hint="bar color = charismatic-liar level" />
                <div className="space-y-4 px-5 pb-5">
                  {[...ROWS]
                    .sort((a, b) => b.winRate - a.winRate)
                    .map((r) => {
                      const s = severity(r.charismaticLiar)
                      return (
                        <div key={r.model}>
                          <div className="mb-1.5 flex items-center justify-between text-sm">
                            <span className="text-slate-300">{r.model}</span>
                            <span className="font-medium tabular-nums text-slate-100">{r.winRate}%</span>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
                            <div
                              className={`h-full rounded-full bg-gradient-to-r ${s.bar}`}
                              style={{ width: `${(r.winRate / maxWin) * 100}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  <div className="flex items-center gap-4 pt-1 text-[11px] text-slate-500">
                    <LegendDot className="bg-gradient-to-r from-cyan-500 to-violet-500" label="low" />
                    <LegendDot className="bg-amber-500" label="elevated" />
                    <LegendDot className="bg-rose-500" label="high" />
                  </div>
                </div>
              </Card>
            </section>

            {/* Scorecard table */}
            <section className="lg:col-span-3">
              <Card>
                <CardHeader title="Per-model scorecard" hint="sorted by win rate" />
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-y border-white/[0.07] text-[11px] uppercase tracking-wider text-slate-500">
                        <th className="px-5 py-2.5 text-left font-medium">Model</th>
                        <th className="px-3 py-2.5 text-right font-medium">Debates</th>
                        <th className="px-3 py-2.5 text-right font-medium">Win</th>
                        <th className="px-3 py-2.5 text-right font-medium">Factuality</th>
                        <th className="px-5 py-2.5 text-right font-medium">Char.-liar</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...ROWS]
                        .sort((a, b) => b.winRate - a.winRate)
                        .map((r) => {
                          const s = severity(r.charismaticLiar)
                          return (
                            <tr
                              key={r.model}
                              className="border-b border-white/[0.05] last:border-0 hover:bg-white/[0.03]"
                            >
                              <td className="px-5 py-3 font-medium text-slate-100">{r.model}</td>
                              <td className="px-3 py-3 text-right tabular-nums text-slate-400">{r.debates}</td>
                              <td className="px-3 py-3 text-right tabular-nums text-slate-200">{r.winRate}%</td>
                              <td className="px-3 py-3 text-right tabular-nums text-slate-400">{r.factuality}%</td>
                              <td className="px-5 py-3">
                                <span className="flex items-center justify-end gap-1.5">
                                  <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
                                  <span className={`tabular-nums font-medium ${s.text}`}>{r.charismaticLiar}</span>
                                </span>
                              </td>
                            </tr>
                          )
                        })}
                    </tbody>
                  </table>
                </div>
                <p className="border-t border-white/[0.05] px-5 py-3 text-xs leading-relaxed text-slate-500">
                  Win rate measures persuasion; factuality and charismatic-liar counts are derived
                  from fact-check verdicts under a fixed judge configuration.
                </p>
              </Card>
            </section>
          </div>

          {/* API embed */}
          <section className="mt-6">
            <Card>
              <CardHeader title="Embed as a report API" hint="one config in, metrics out" />
              <div className="px-5 pb-5">
                <p className="mb-3 text-sm text-slate-400">
                  Point the harness at any set of models, then fetch aggregated metrics as JSON or
                  render a hosted report.
                </p>
                <div className="overflow-hidden rounded-lg border border-white/[0.07] bg-[#05080d]">
                  <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-2">
                    <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                      eval API
                    </span>
                    <Copy className="h-3.5 w-3.5 text-slate-600" />
                  </div>
                  <pre className="overflow-x-auto px-4 py-3 text-[13px] leading-relaxed text-slate-300">
                    <code>{`POST /api/eval/run
{ "models": ["anthropic/claude-sonnet-4.5", "openai/gpt-5.1", "x-ai/grok-4.3"],
  "topicSet": "alignment-topic-set-v1", "rounds": 3 }

GET /api/eval/{runId}/metrics
→ per-model winRate, factuality, charismaticLiarWins, costPerDebate`}</code>
                  </pre>
                </div>
              </div>
            </Card>
          </section>

          <p className="mt-8 text-center text-xs text-slate-600">
            Reference design — illustrative data. Not wired into the live app.
          </p>
        </main>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ primitives */

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.02] shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset] backdrop-blur-sm">
      {children}
    </div>
  )
}

function CardHeader({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex items-center justify-between px-5 py-3.5">
      <h2 className="text-sm font-semibold text-slate-100">{title}</h2>
      {hint ? <span className="text-[11px] text-slate-500">{hint}</span> : null}
    </div>
  )
}

function Stat({
  icon: Icon,
  iconClass,
  label,
  value,
  sub,
  highlight,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  iconClass: string
  label: string
  value: string
  sub: string
  highlight?: boolean
}) {
  return (
    <div
      className={[
        'rounded-xl border p-4 backdrop-blur-sm',
        highlight
          ? 'border-cyan-400/20 bg-gradient-to-b from-cyan-500/[0.08] to-transparent'
          : 'border-white/[0.07] bg-white/[0.02]',
      ].join(' ')}
    >
      <div className="mb-2 flex items-center gap-2">
        <Icon className={`h-4 w-4 ${iconClass}`} strokeWidth={2} />
        <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">{label}</span>
      </div>
      <p className="truncate text-lg font-semibold text-white">{value}</p>
      <p className="mt-0.5 truncate text-xs text-slate-500">{sub}</p>
    </div>
  )
}

function Badge({ children, tone }: { children: React.ReactNode; tone: 'neutral' | 'accent' }) {
  const cls =
    tone === 'accent'
      ? 'border-cyan-400/30 bg-cyan-500/10 text-cyan-200'
      : 'border-white/10 bg-white/[0.04] text-slate-300'
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${cls}`}>
      {children}
    </span>
  )
}

function LegendDot({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-2 w-2 rounded-full ${className}`} />
      {label}
    </span>
  )
}
