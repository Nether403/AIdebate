'use client'

import { useState } from 'react'
import { Scale, ThumbsUp, ThumbsDown, ExternalLink } from 'lucide-react'
import { useTopBar } from '@/components/layout/TopBarContext'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CodeCard } from '@/components/app/CodeCard'
import { cn } from '@/lib/utils'

/**
 * Steelman showcase — a host-app frame around a sourced both-sides analysis
 * panel. Hand the debate engine a contested question; it argues the motion both
 * ways, fact-checks each side, and returns a sourced, adjudicated summary.
 *
 * Presentation only: every case below is ILLUSTRATIVE SAMPLE DATA. The
 * nav/background/top bar are owned by AppShell; this page renders its content
 * and sets the top bar declaratively via `useTopBar`. Exactly one <h1>.
 */

interface Steelman {
  question: string
  pro: { headline: string; points: string[] }
  con: { headline: string; points: string[] }
  verdict: string
  lean: 'pro' | 'con' | 'balanced'
  sources: string[]
}

const cases: Record<string, Steelman> = {
  nuclear: {
    question: 'Should we expand nuclear energy to fight climate change?',
    pro: {
      headline: 'Yes — it is the scalable firm clean source',
      points: [
        'Lifecycle emissions (~12 gCO2/kWh) are comparable to wind, but it runs regardless of weather.',
        'Every IPCC 1.5°C pathway includes a growing nuclear contribution.',
        'Recent builds in South Korea and the UAE delivered roughly on time and budget.',
      ],
    },
    con: {
      headline: 'Not essential — a portfolio can do the job',
      points: [
        'Western builds (Hinkley, Vogtle) ran years late and billions over budget.',
        'Solar LCOE fell ~90% in a decade; storage and geothermal also provide firmness.',
        '"Essential" implies no substitute exists — that has not been shown for most grids.',
      ],
    },
    verdict:
      'Strong case for building nuclear where it can be delivered well, especially in grids without abundant hydro. The claim that it is strictly "essential everywhere" is weaker than the claim that it is highly valuable.',
    lean: 'balanced',
    sources: ['ipcc.ch/report/ar5/wg3', 'iea.org/reports/grid-scale-storage', 'irena.org/publications'],
  },
  remote: {
    question: 'Is fully remote work better for software teams?',
    pro: {
      headline: 'Yes — autonomy and access to talent',
      points: [
        'Wider hiring pool and no relocation constraints.',
        'Fewer interruptions can raise focused output for senior individual contributors.',
        'Lower office overhead and commute cost.',
      ],
    },
    con: {
      headline: 'Not universally — onboarding and cohesion suffer',
      points: [
        'Junior engineers ramp slower without ambient mentorship.',
        'Cross-team coordination and serendipity decline.',
        'Outcomes depend heavily on team maturity and tooling.',
      ],
    },
    verdict:
      'Evidence is mixed and context-dependent. Remote tends to help experienced, well-documented teams and hurt early-career onboarding. "Better for everyone" is not supported.',
    lean: 'con',
    sources: ['example.org/remote-work-study', 'example.org/onboarding-research'],
  },
}

// Lean is part of the adjudicated judge output. Like severity, it is conveyed
// via a status dot + text label, never color alone (Req 9.4):
//   pro -> cyan, con -> rose, balanced -> violet.
const leanStyle = (lean: Steelman['lean']) =>
  lean === 'pro'
    ? { text: 'text-cyan-300', dot: 'bg-cyan-400' }
    : lean === 'con'
      ? { text: 'text-rose-400', dot: 'bg-rose-500' }
      : { text: 'text-violet-400', dot: 'bg-violet-500' }

export default function SteelmanDemo() {
  useTopBar({
    breadcrumb: [{ label: 'Showcase', href: '/showcase' }, { label: 'Steelman' }],
    contextPill: 'Decision support',
  })

  const [key, setKey] = useState<keyof typeof cases>('nuclear')
  const c = cases[key]
  const lean = leanStyle(c.lean)

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      {/* Page heading + honesty labels */}
      <div className="mb-6">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <Badge tone="neutral">Sample / demo data</Badge>
          <Badge tone="accent">Model-based signal · not ground truth</Badge>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Steelman: a sourced both-sides panel
        </h1>
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Hand the debate engine a contested question and it argues the motion both ways,
          fact-checks each side, and returns a sourced, adjudicated summary — the strongest honest
          case for and against, plus where the evidence actually leans.
        </p>
      </div>

      {/* Host-app frame: a fake decision-support tool embedding the panel. */}
      <Card>
        <div className="flex items-center gap-2 border-b border-border bg-foreground/[0.03] px-5 py-3">
          <Scale className="h-4 w-4 text-primary" aria-hidden="true" />
          <span className="text-sm font-medium text-foreground">DecideKit · Research assistant</span>
          <Badge tone="neutral" className="ml-auto">
            embedded panel
          </Badge>
        </div>

        <div className="space-y-6 p-5">
          {/* Question selector */}
          <div className="space-y-1.5">
            <label htmlFor="steelman-question" className="text-xs font-medium text-muted-foreground">
              Contested question
            </label>
            <select
              id="steelman-question"
              value={key}
              onChange={(e) => setKey(e.target.value as keyof typeof cases)}
              className="w-full max-w-2xl rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {Object.entries(cases).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.question}
                </option>
              ))}
            </select>
          </div>

          {/* Two-sided analysis panel */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <SidePanel
              icon={ThumbsUp}
              iconClass="text-cyan-300"
              titleClass="text-cyan-300"
              title="For"
              headline={c.pro.headline}
              points={c.pro.points}
            />
            <SidePanel
              icon={ThumbsDown}
              iconClass="text-rose-400"
              titleClass="text-rose-400"
              title="Against"
              headline={c.con.headline}
              points={c.con.points}
            />
          </div>

          {/* Adjudicated verdict — judge output, labelled at the page top. */}
          <div className="rounded-lg border border-border bg-card p-5">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Scale className="h-5 w-5 text-violet-400" aria-hidden="true" />
              <h2 className="text-base font-semibold text-foreground">Verdict</h2>
              <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide">
                <span className={cn('h-2 w-2 rounded-full', lean.dot)} aria-hidden="true" />
                <span className={lean.text}>leans {c.lean}</span>
              </span>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">{c.verdict}</p>
          </div>

          {/* Sources */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">Sources:</span>
            {c.sources.map((s) => (
              <span
                key={s}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-foreground/[0.04] px-3 py-1 text-xs text-muted-foreground"
              >
                <ExternalLink className="h-3 w-3 text-violet-400" aria-hidden="true" /> {s}
              </span>
            ))}
          </div>
        </div>
      </Card>

      {/* Headless API */}
      <section className="mt-6">
        <div className="mb-2">
          <p className="text-sm font-medium text-foreground">Headless first</p>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Post one contested question and read back the structured both-sides verdict. The same
            JSON drives this panel, your own decision-support UI, or a dataset row.
          </p>
        </div>
        <CodeCard
          label="steelman API"
          code={`POST /api/steelman
{ "question": "Should we expand nuclear energy to fight climate change?" }

-> {
  "for":  { "headline": "...", "points": [...] },
  "against": { "headline": "...", "points": [...] },
  "verdict": "...", "lean": "balanced",
  "sources": [ { "url": "..." } ]
}`}
        />
      </section>
    </div>
  )
}

/** One side of the two-sided analysis panel (For / Against). */
function SidePanel({
  icon: Icon,
  iconClass,
  titleClass,
  title,
  headline,
  points,
}: {
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>
  iconClass: string
  titleClass: string
  title: string
  headline: string
  points: string[]
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="mb-2 flex items-center gap-2">
        <Icon className={cn('h-4 w-4', iconClass)} aria-hidden={true} />
        <h2 className={cn('text-base font-semibold', titleClass)}>{title}</h2>
      </div>
      <p className="mb-2 text-sm font-semibold text-foreground">{headline}</p>
      <ul className="space-y-2">
        {points.map((p) => (
          <li key={p} className="text-xs leading-relaxed text-muted-foreground">
            • {p}
          </li>
        ))}
      </ul>
    </div>
  )
}
