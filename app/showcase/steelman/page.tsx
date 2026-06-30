'use client'

import { useState } from 'react'
import { Scale, ThumbsUp, ThumbsDown, ExternalLink } from 'lucide-react'
import { ShowcaseShell } from '@/components/showcase/ShowcaseShell'
import { BackToHub } from '@/components/showcase/BackToHub'
import { GlassPanel } from '@/components/showcase/GlassPanel'
import { SectionHeading } from '@/components/showcase/SectionHeading'
import { SampleDataLabel } from '@/components/showcase/SampleDataLabel'
import { JudgeSignalLabel } from '@/components/showcase/JudgeSignalLabel'
import { EmbedNote } from '@/components/showcase/EmbedNote'

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

// Lean is part of the adjudicated judge output, so its emphasis color stays
// within the accent palette: pro -> primary, con -> accent-3, balanced -> accent-2.
const leanAccent = (lean: Steelman['lean']) =>
  lean === 'pro' ? 'text-accent-primary' : lean === 'con' ? 'text-accent-3' : 'text-accent-2'

export default function SteelmanDemo() {
  const [key, setKey] = useState<keyof typeof cases>('nuclear')
  const c = cases[key]

  return (
    <ShowcaseShell
      title="Steelman: a sourced both-sides panel"
      intro="Hand the debate engine a contested question and it argues the motion both ways, fact-checks each side, and returns a sourced, adjudicated summary — the strongest honest case for and against, plus where the evidence actually leans."
    >
      <div className="flex flex-wrap items-center gap-[var(--space-md)]">
        <BackToHub />
        <SampleDataLabel />
      </div>

      {/* Question selector */}
      <section className="space-y-[var(--space-sm)]">
        <label htmlFor="steelman-question" className="text-caption font-medium text-text-muted">
          Contested question
        </label>
        <select
          id="steelman-question"
          value={key}
          onChange={(e) => setKey(e.target.value as keyof typeof cases)}
          className="w-full max-w-2xl rounded-card border border-border bg-surface px-[var(--space-md)] py-[var(--space-sm)] text-body text-text focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
        >
          {Object.entries(cases).map(([k, v]) => (
            <option key={k} value={k}>
              {v.question}
            </option>
          ))}
        </select>
      </section>

      {/* Both-sided arguments */}
      <section className="grid grid-cols-1 gap-[var(--space-md)] sm:grid-cols-2">
        <GlassPanel className="rounded-card p-[var(--space-lg)]">
          <div className="mb-[var(--space-sm)] flex items-center gap-[var(--space-sm)]">
            <ThumbsUp className="h-4 w-4 text-accent-primary" aria-hidden="true" />
            <SectionHeading level={2} className="!text-h3 text-accent-primary">
              For
            </SectionHeading>
          </div>
          <p className="mb-[var(--space-sm)] text-body font-semibold text-text">{c.pro.headline}</p>
          <ul className="space-y-[var(--space-sm)]">
            {c.pro.points.map((p) => (
              <li key={p} className="text-caption leading-relaxed text-text-muted">
                • {p}
              </li>
            ))}
          </ul>
        </GlassPanel>

        <GlassPanel className="rounded-card p-[var(--space-lg)]">
          <div className="mb-[var(--space-sm)] flex items-center gap-[var(--space-sm)]">
            <ThumbsDown className="h-4 w-4 text-accent-3" aria-hidden="true" />
            <SectionHeading level={2} className="!text-h3 text-accent-3">
              Against
            </SectionHeading>
          </div>
          <p className="mb-[var(--space-sm)] text-body font-semibold text-text">{c.con.headline}</p>
          <ul className="space-y-[var(--space-sm)]">
            {c.con.points.map((p) => (
              <li key={p} className="text-caption leading-relaxed text-text-muted">
                • {p}
              </li>
            ))}
          </ul>
        </GlassPanel>
      </section>

      {/* Adjudicated verdict — judge output, so the honesty label sits adjacent (Req 6.1) */}
      <GlassPanel className="rounded-card p-[var(--space-lg)]">
        <div className="mb-[var(--space-md)] flex flex-wrap items-center gap-[var(--space-sm)]">
          <Scale className="h-5 w-5 text-accent-2" aria-hidden="true" />
          <SectionHeading level={2} className="!text-h3">
            Verdict
          </SectionHeading>
          <span className={`text-caption font-semibold uppercase tracking-wide ${leanAccent(c.lean)}`}>
            leans {c.lean}
          </span>
          <JudgeSignalLabel className="ml-auto" />
        </div>
        <p className="text-body leading-relaxed text-text-muted">{c.verdict}</p>
      </GlassPanel>

      {/* Sources */}
      <section className="flex flex-wrap items-center gap-[var(--space-sm)]">
        <span className="text-caption text-text-muted">Sources:</span>
        {c.sources.map((s) => (
          <span
            key={s}
            className="inline-flex items-center gap-[var(--space-xs)] rounded-pill border border-border bg-surface-raised px-[var(--space-sm)] py-[var(--space-xs)] text-caption text-text-muted"
          >
            <ExternalLink className="h-3 w-3 text-accent-2" aria-hidden="true" /> {s}
          </span>
        ))}
      </section>

      <EmbedNote
        description="Headless first: post one contested question and read back the structured both-sides verdict. The same JSON drives this panel, your own decision-support UI, or a dataset row."
        snippet={`POST /api/steelman
{ "question": "Should we expand nuclear energy to fight climate change?" }

-> {
  "for":  { "headline": "...", "points": [...] },
  "against": { "headline": "...", "points": [...] },
  "verdict": "...", "lean": "balanced",
  "sources": [ { "url": "..." } ]
}`}
      />
    </ShowcaseShell>
  )
}
