'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Sparkles, ThumbsUp, ThumbsDown, ExternalLink } from 'lucide-react'
import { HostAppFrame } from '@/components/showcase/HostAppFrame'
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

export default function SteelmanDemo() {
  const [key, setKey] = useState<keyof typeof cases>('nuclear')
  const c = cases[key]
  const leanColor = c.lean === 'pro' ? 'text-blue-600' : c.lean === 'con' ? 'text-rose-600' : 'text-violet-600'

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 py-10">
      <div className="max-w-5xl mx-auto px-4">
        <Link href="/showcase" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-6">
          <ArrowLeft className="w-4 h-4" /> Showcase
        </Link>

        <div className="mb-2 text-sm font-medium text-violet-400">Steelman Widget</div>
        <h1 className="text-3xl font-bold text-white mb-2">A sourced &ldquo;both sides&rdquo; panel, dropped into any product</h1>
        <p className="text-slate-400 mb-6 leading-relaxed">
          Below is a fictional decision-support app. The highlighted panel is the embedded component — it asks the
          debate engine to argue a contested question both ways and return a sourced, adjudicated summary.
        </p>

        <HostAppFrame appName="Brightpath" appTagline="Decision support" nav={['Briefs', 'Decisions', 'Sources', 'Settings']} activeNav="Decisions">
          {/* Embedded widget */}
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-violet-600" />
              <h2 className="text-lg font-bold text-slate-900">Steelman this decision</h2>
              <span className="ml-auto text-[10px] uppercase tracking-wide text-violet-600 font-semibold bg-violet-100 px-2 py-0.5 rounded">
                Embedded
              </span>
            </div>

            <select
              value={key}
              onChange={(e) => setKey(e.target.value as keyof typeof cases)}
              className="w-full mb-5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
            >
              {Object.entries(cases).map(([k, v]) => (
                <option key={k} value={k}>{v.question}</option>
              ))}
            </select>

            <div className="grid sm:grid-cols-2 gap-3 mb-4">
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <ThumbsUp className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-semibold text-blue-700">For</span>
                </div>
                <p className="text-sm font-medium text-slate-800 mb-2">{c.pro.headline}</p>
                <ul className="space-y-1.5">
                  {c.pro.points.map((p) => (
                    <li key={p} className="text-xs text-slate-600 leading-relaxed">• {p}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <ThumbsDown className="w-4 h-4 text-rose-600" />
                  <span className="text-sm font-semibold text-rose-700">Against</span>
                </div>
                <p className="text-sm font-medium text-slate-800 mb-2">{c.con.headline}</p>
                <ul className="space-y-1.5">
                  {c.con.points.map((p) => (
                    <li key={p} className="text-xs text-slate-600 leading-relaxed">• {p}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 mb-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                Verdict · <span className={leanColor}>{c.lean}</span>
              </p>
              <p className="text-sm text-slate-700 leading-relaxed">{c.verdict}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-500">Sources:</span>
              {c.sources.map((s) => (
                <span key={s} className="inline-flex items-center gap-1 text-xs text-violet-700 bg-violet-50 border border-violet-200 px-2 py-0.5 rounded">
                  <ExternalLink className="w-3 h-3" /> {s}
                </span>
              ))}
            </div>
          </div>
        </HostAppFrame>

        <EmbedNote
          description="The host app calls one endpoint with a question and renders the structured result however it likes. The debate engine handles the arguing, fact-checking, and adjudication."
          snippet={`POST /api/steelman
{ "question": "Should we expand nuclear energy to fight climate change?" }

-> {
  "for":  { "headline": "...", "points": [...] },
  "against": { "headline": "...", "points": [...] },
  "verdict": "...", "lean": "balanced",
  "sources": [ { "url": "..." } ]
}`}
        />
      </div>
    </div>
  )
}
