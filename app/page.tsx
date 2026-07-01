'use client'

import Link from 'next/link'
import { ArrowRight, Gavel, ShieldCheck, GitBranch, FileCode } from 'lucide-react'

import { CTA_TARGETS } from '@/lib/design-system/manifest'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useTopBar } from '@/components/layout/TopBarContext'
import { cn } from '@/lib/utils'

/**
 * Landing_Page — re-skinned to the unified cool near-black + cyan→violet
 * language (task 7.2). It renders only its own content: the global AppShell
 * already mounts the single AmbientGlow, sidebar, and top bar, so this page
 * paints NO background and renders no nav (Requirement 2.6). The top bar is set
 * declaratively via `useTopBar` (hence `'use client'`).
 *
 * Honest workbench framing throughout (per AGENTS.md): this is an LLM debate
 * benchmarking and alignment-research workbench — no prediction-market,
 * betting, points, badge, social, or gamified language anywhere.
 *
 * Heading contract (Requirement 9.2): exactly one <h1> (the hero headline);
 * sections use <h2> with no skipped levels.
 *
 * CTA contract (Requirements 5.1, 5.3): both CTAs are sourced exclusively from
 * the Navigation_Manifest `CTA_TARGETS`. The page presents exactly one primary
 * and one secondary CTA, resolving to two distinct members of EXISTING_ROUTES
 * (`/debate/new` and `/showcase`).
 *
 * Accent discipline (Requirement 1.5): the cyan→violet gradient is used only on
 * the emphasis headline span and the primary CTA (interactive/emphasis roles);
 * body text carries no gradient fill (Requirement 1.6).
 */

const PRIMARY_CTA = CTA_TARGETS.find((c) => c.id === 'primary') ?? CTA_TARGETS[0]
const SECONDARY_CTA = CTA_TARGETS.find((c) => c.id === 'secondary') ?? CTA_TARGETS[1]

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background'

const MEASURES = [
  {
    icon: Gavel,
    title: 'Double-pass judging',
    body: 'Every transcript is judged Pro-first and Con-first to cancel position bias, with a tiebreaker on disagreement and the consensus state recorded.',
  },
  {
    icon: ShieldCheck,
    title: 'Sourced factuality',
    body: 'Claims are checked against live search and kept with their sources, confidence, and verdicts — not reduced to an opaque factuality score.',
  },
  {
    icon: GitBranch,
    title: 'Persuasion–rigor divergence',
    body: 'We surface where the judged winner diverges from the factuality-favored side, exposing models that win by being persuasively wrong.',
  },
  {
    icon: FileCode,
    title: 'Structured export',
    body: 'Each run exports a complete artifact — turns, prompts, parameters, judge output, costs — as JSONL/CSV for downstream research.',
  },
] as const

const PIPELINE_STAGES = [
  'Configure a motion, pick two models, and set rounds and word limits.',
  'Debaters argue in reflect–critique–refine loops while a fact-checker verifies each claim against sources.',
  'A bias-aware judge scores both passes; the run is persisted as an inspectable, exportable artifact.',
] as const

export default function Home() {
  // Minimal breadcrumb for the landing surface; the shell renders the bar.
  useTopBar({ breadcrumb: [{ label: 'Home' }] })

  return (
    <div className="mx-auto w-full max-w-6xl space-y-24 px-6 py-16 sm:px-8">
      <Hero />
      <HowItWorks />
      <WhatItMeasures />
      <SampleArtifact />
    </div>
  )
}

/* =====================================================================
   HERO — single <h1>, value prop, one primary + one secondary CTA.
   Renders synchronously above the fold (no animated reveal gating, Req 11.1).
   ===================================================================== */
function Hero() {
  return (
    <section className="text-center">
      <div className="mx-auto max-w-3xl space-y-6 py-10">
        <Badge tone="accent" className="mx-auto">
          Alignment-research workbench
        </Badge>

        <h1 className="text-balance text-4xl font-bold tracking-tight text-card-foreground sm:text-5xl">
          The LLM debate{' '}
          <span
            className="bg-clip-text text-transparent"
            style={{ backgroundImage: 'var(--accent-gradient)' }}
          >
            benchmarking workbench
          </span>
        </h1>

        <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
          Run adversarial debates between models, verify claims against sources, and judge
          persuasion against logical rigor — then export the full, inspectable artifact.
        </p>

        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          {/* Primary CTA: gradient emphasis (interactive role only), 44px target. */}
          <Link
            href={PRIMARY_CTA.href}
            className={cn(
              'inline-flex h-11 min-w-11 items-center justify-center gap-2 rounded-lg px-6 text-sm font-semibold text-[var(--primary-foreground)] shadow-sm transition-opacity hover:opacity-90',
              focusRing
            )}
            style={{ backgroundImage: 'var(--accent-gradient)' }}
          >
            {PRIMARY_CTA.label}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>

          {/* Secondary CTA: outline, distinct route, no gradient. */}
          <Button asChild variant="outline" size="lg" className="h-11 min-w-11">
            <Link href={SECONDARY_CTA.href}>{SECONDARY_CTA.label}</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}

/* =====================================================================
   SECTION 1 — How it works (orchestrated pipeline)
   ===================================================================== */
function HowItWorks() {
  return (
    <section className="space-y-8">
      <div className="mx-auto max-w-2xl space-y-2 text-center">
        <h2 className="text-2xl font-bold tracking-tight text-card-foreground">How it works</h2>
        <p className="text-muted-foreground">
          Configuration, validation, and judging flow through one orchestrated debate graph.
        </p>
      </div>

      <Card className="mx-auto max-w-3xl p-6">
        <ol className="space-y-5">
          {PIPELINE_STAGES.map((stage, i) => (
            <li key={i} className="flex gap-4">
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-primary/40 text-sm font-bold text-primary"
                aria-hidden="true"
              >
                {i + 1}
              </span>
              <p className="text-muted-foreground">{stage}</p>
            </li>
          ))}
        </ol>
      </Card>
    </section>
  )
}

/* =====================================================================
   SECTION 2 — What it measures (capability cards)
   ===================================================================== */
function WhatItMeasures() {
  return (
    <section className="space-y-8">
      <div className="mx-auto max-w-2xl space-y-2 text-center">
        <h2 className="text-2xl font-bold tracking-tight text-card-foreground">What it measures</h2>
        <p className="text-muted-foreground">
          The workbench isolates the signals that separate persuasive models from rigorous ones.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {MEASURES.map(({ icon: Icon, title, body }) => (
          <Card key={title} className="p-6">
            <Icon className="mb-4 h-7 w-7 text-primary" aria-hidden="true" />
            <p className="mb-1.5 font-semibold text-card-foreground">{title}</p>
            <p className="text-sm text-muted-foreground">{body}</p>
          </Card>
        ))}
      </div>
    </section>
  )
}

/* =====================================================================
   SECTION 3 — Sample artifact (judge-output preview).
   Illustrative sample data AND judge output, so both honesty labels are
   co-located and statically visible (no interaction required).
   ===================================================================== */
function SampleArtifact() {
  return (
    <section className="space-y-8">
      <div className="mx-auto max-w-2xl space-y-2 text-center">
        <h2 className="text-2xl font-bold tracking-tight text-card-foreground">Sample artifact</h2>
        <p className="text-muted-foreground">
          A compact preview of the judge output captured with every completed run.
        </p>
      </div>

      <Card className="mx-auto max-w-3xl p-6">
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <Badge tone="neutral">Sample / demo data</Badge>
          <Badge tone="accent">Model-based signal · not ground truth</Badge>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-mono text-sm text-muted-foreground">run: adhoc_preview_smoke_test</p>
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">
            Consensus
          </span>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-border bg-foreground/[0.02] p-4">
            <p className="text-sm text-muted-foreground">Pro-first pass</p>
            <p className="font-semibold text-card-foreground">Con win · 6.2 – 5.8</p>
          </div>
          <div className="rounded-lg border border-border bg-foreground/[0.02] p-4">
            <p className="text-sm text-muted-foreground">Con-first pass</p>
            <p className="font-semibold text-card-foreground">Con win · 6.0 – 5.9</p>
          </div>
        </div>

        <p className="mt-4 text-sm text-muted-foreground">
          <span className="font-semibold text-card-foreground">Verdict:</span> Con prevails. Pro
          argued transparent validation well, but Con grounded concrete proliferation vectors that
          Pro did not neutralize.
        </p>
      </Card>
    </section>
  )
}
