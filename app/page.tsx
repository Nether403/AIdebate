import { Suspense } from 'react'
import { ArrowRight, Gavel, ShieldCheck, GitBranch, FileCode } from 'lucide-react'

import { CTA_TARGETS } from '@/lib/design-system/manifest'
import { ACCENT_TOKENS } from '@/lib/design-system/tokens'
import { CtaButton } from '@/components/showcase/CtaButton'
import { GlassPanel } from '@/components/showcase/GlassPanel'
import { GlowBlob } from '@/components/showcase/GlowBlob'
import { Infographic } from '@/components/showcase/Infographic'
import { JudgeSignalLabel } from '@/components/showcase/JudgeSignalLabel'
import { SampleDataLabel } from '@/components/showcase/SampleDataLabel'
import { SectionHeading } from '@/components/showcase/SectionHeading'
import { SectionSkeleton } from '@/components/showcase/SectionSkeleton'
import { ShimmerText } from '@/components/showcase/ShimmerText'

/**
 * Landing_Page (Requirement 3): a restrained, pitch-deck-grade hero plus four
 * fixed-order sections, composed entirely from Design_System primitives and
 * tokens. It paints NO background of its own — the global `--color-bg` body
 * token and the single budgeted NeuralBackground show through (Requirement 3.5,
 * shell deference). Spacing between sections comes only from the spacing scale.
 *
 * Honest workbench framing throughout (Requirement 3.6): this is an LLM debate
 * benchmarking and alignment-research workbench. No prediction-market, betting,
 * points, badge, or social-sharing language appears anywhere on the page.
 *
 * Heading contract: exactly one <h1> (the hero headline); every section carries
 * exactly one <h2> via SectionHeading, with no skipped levels (Requirement 3.2,
 * 8.5). Card/stage titles are intentionally non-heading text so each section
 * keeps a single heading.
 *
 * Server component: no client state lives here. Interactive/animated pieces
 * (Infographic, AnimateIn) are client components rendered from the server tree.
 *
 * Progressive placeholders (Requirement 11.4): the hero renders synchronously so
 * it is never gated (Requirement 11.1, above the fold), while the four content
 * sections are async server components each wrapped in its own `<Suspense>`
 * boundary. Under streaming SSR a token-styled `SectionSkeleton` is flushed for
 * any section still pending and is progressively replaced by the real content as
 * it resolves — so a slow section shows a skeleton rather than blank space, with
 * no layout shift. The infographic carries its own image-fetch text fallback
 * (Requirement 11.5) via the `Infographic` primitive's `onError` path.
 */

// CTA sourcing from the manifest keeps hrefs/labels on the real-route allow-list
// (Requirement 5.1–5.3). Exactly one primary CTA exists on the page (the hero);
// the closing section reinforces the same route with a secondary CTA so the
// single-primary contract holds (Requirement 3.3, 3.4).
const PRIMARY_CTA = CTA_TARGETS.find((c) => c.id === 'primary') ?? CTA_TARGETS[0]
const SECONDARY_CTA = CTA_TARGETS.find((c) => c.id === 'secondary') ?? CTA_TARGETS[1]

const MEASURES = [
  {
    icon: Gavel,
    title: 'Double-pass judging',
    body: 'Every transcript is judged Pro-first and Con-first to cancel position bias, with a tiebreaker on disagreement and the consensus state recorded.',
    accent: 'text-accent-primary',
  },
  {
    icon: ShieldCheck,
    title: 'Sourced factuality',
    body: 'Claims are checked against live search and kept with their sources, confidence, and verdicts — not reduced to an opaque factuality score.',
    accent: 'text-accent-2',
  },
  {
    icon: GitBranch,
    title: 'Persuasion–rigor divergence',
    body: 'We surface where the judged winner diverges from the factuality-favored side, exposing models that win by being persuasively wrong.',
    accent: 'text-accent-3',
  },
  {
    icon: FileCode,
    title: 'Structured export',
    body: 'Each run exports a complete artifact — turns, prompts, parameters, judge output, costs — as JSONL/CSV for downstream research.',
    accent: 'text-accent-4',
  },
] as const

const PIPELINE_STAGES = [
  'Configure a motion, pick two models, and set rounds and word limits.',
  'Debaters argue in reflect–critique–refine loops while a fact-checker verifies each claim against sources.',
  'A bias-aware judge scores both passes; the run is persisted as an inspectable, exportable artifact.',
] as const

export default function Home() {
  return (
    <div className="mx-auto w-full max-w-6xl px-[var(--space-lg)] py-[var(--space-xl)] space-y-[var(--space-section)]">
      <Hero />

      {/* Each content section streams independently: its SectionSkeleton is
          shown while pending and replaced progressively as the section resolves
          (Requirement 11.4). The skeleton shape mirrors the section so the swap
          causes no layout shift (Requirement 11.3). */}
      <Suspense fallback={<SectionSkeleton media />}>
        <HowItWorks />
      </Suspense>

      <Suspense fallback={<SectionSkeleton cards={MEASURES.length} />}>
        <WhatItMeasures />
      </Suspense>

      <Suspense fallback={<SectionSkeleton />}>
        <SampleArtifact />
      </Suspense>

      <Suspense fallback={<SectionSkeleton />}>
        <CallToAction />
      </Suspense>
    </div>
  )
}

/* =====================================================================
   HERO — single <h1>, value prop, one primary + one secondary CTA.
   Kept compact (and synchronous) to render immediately above the fold at
   1280×720 (Requirement 3.1, 11.1). Two decorative GlowBlobs + the global
   NeuralBackground keep concurrent decoration within the budget of three
   (Requirement 2.4); overflow is clipped so the blobs never create a
   horizontal scrollbar (Req 7.1).
   ===================================================================== */
function Hero() {
  return (
    <section className="relative overflow-hidden">
      <GlowBlob
        accent={ACCENT_TOKENS.primary}
        className="h-[360px] w-[360px] -left-24 -top-24"
      />
      <GlowBlob
        accent={ACCENT_TOKENS.supporting[0]}
        className="h-[420px] w-[420px] -right-28 top-10"
      />

      {/* The hero is the above-the-fold LCP cluster (Req 11.1): it must paint on
          the server render, so it is intentionally NOT wrapped in AnimateIn —
          Framer Motion SSRs its `initial` opacity:0 state, which would hold the
          LCP <h1> invisible until hydration (~2.8s) and blow the 2.5s budget.
          Entrance animation is reserved for below-the-fold content. */}
      <div className="relative z-10 mx-auto max-w-3xl space-y-[var(--space-lg)] py-[var(--space-xl)] text-center">
        <h1 className="text-hero font-bold tracking-tight text-text text-balance">
          The LLM debate{' '}
          <ShimmerText>benchmarking workbench</ShimmerText>
        </h1>

        <p className="mx-auto max-w-2xl text-body text-text-muted">
          An inspectable workbench for alignment research: run adversarial debates
          between models, verify claims against sources, and judge persuasion against
          logical rigor — then export the full artifact.
        </p>

        <div className="flex flex-col items-center justify-center gap-[var(--space-md)] sm:flex-row">
          <CtaButton variant="primary" href={PRIMARY_CTA.href}>
            {PRIMARY_CTA.label}
            <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </CtaButton>
          <CtaButton variant="secondary" href={SECONDARY_CTA.href}>
            {SECONDARY_CTA.label}
          </CtaButton>
        </div>
      </div>
    </section>
  )
}

/* =====================================================================
   SECTION 1 — How it works (infographic anchor, Requirement 2.3). The
   Infographic primitive renders an optimized image with an onError text
   fallback in place of a broken image (Requirement 11.5).
   ===================================================================== */
async function HowItWorks() {
  return (
    <section className="space-y-[var(--space-xl)]">
      <div className="mx-auto max-w-2xl space-y-[var(--space-sm)] text-center">
        <SectionHeading level={2}>How it works</SectionHeading>
        <p className="text-body text-text-muted">
          Data, validation, and judging flow through one orchestrated debate graph.
        </p>
      </div>

      <div className="grid items-center gap-[var(--space-xl)] lg:grid-cols-12">
        <div className="lg:col-span-7">
          <GlassPanel className="rounded-card p-[var(--space-md)]">
            <Infographic priority />
          </GlassPanel>
        </div>

        <ol className="space-y-[var(--space-md)] lg:col-span-5">
          {PIPELINE_STAGES.map((stage, i) => (
            <li key={i} className="flex gap-[var(--space-md)]">
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-pill border border-accent-primary text-caption font-bold text-accent-primary"
                aria-hidden="true"
              >
                {i + 1}
              </span>
              <p className="text-body text-text-muted">{stage}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

/* =====================================================================
   SECTION 2 — What it measures (capability cards, workbench framing)
   ===================================================================== */
async function WhatItMeasures() {
  return (
    <section className="space-y-[var(--space-xl)]">
      <div className="mx-auto max-w-2xl space-y-[var(--space-sm)] text-center">
        <SectionHeading level={2}>What it measures</SectionHeading>
        <p className="text-body text-text-muted">
          The workbench isolates the signals that separate persuasive models from
          rigorous ones.
        </p>
      </div>

      <div className="grid gap-[var(--space-lg)] md:grid-cols-2 lg:grid-cols-4">
        {MEASURES.map(({ icon: Icon, title, body, accent }) => (
          <GlassPanel key={title} className="rounded-card p-[var(--space-lg)]">
            <Icon className={`mb-[var(--space-md)] h-7 w-7 ${accent}`} aria-hidden="true" />
            <p className="mb-[var(--space-xs)] text-body font-semibold text-text">{title}</p>
            <p className="text-caption text-text-muted">{body}</p>
          </GlassPanel>
        ))}
      </div>
    </section>
  )
}

/* =====================================================================
   SECTION 3 — Sample artifact (judge-output preview).
   The preview is illustrative sample data AND judge output, so both
   honesty labels sit co-located within the section (Requirement 5.4,
   6.1): SampleDataLabel marks the data as demo, JudgeSignalLabel marks
   the verdict as a model-based signal, not ground truth.
   ===================================================================== */
async function SampleArtifact() {
  return (
    <section className="space-y-[var(--space-xl)]">
      <div className="mx-auto max-w-2xl space-y-[var(--space-sm)] text-center">
        <SectionHeading level={2}>Sample artifact</SectionHeading>
        <p className="text-body text-text-muted">
          A compact preview of the judge output captured with every completed run.
        </p>
      </div>

      <GlassPanel className="mx-auto max-w-3xl rounded-card p-[var(--space-lg)]">
        <div className="mb-[var(--space-lg)] flex flex-wrap items-center gap-[var(--space-sm)]">
          <SampleDataLabel />
          <JudgeSignalLabel />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-[var(--space-sm)]">
          <p className="font-mono text-caption text-text-muted">run: adhoc_preview_smoke_test</p>
          <p className="text-caption font-semibold uppercase tracking-widest text-accent-2">
            Consensus
          </p>
        </div>

        <div className="mt-[var(--space-lg)] grid gap-[var(--space-md)] sm:grid-cols-2">
          <div className="rounded-card border border-border bg-surface-raised p-[var(--space-md)]">
            <p className="text-caption text-text-muted">Pro-first pass</p>
            <p className="text-body font-semibold text-text">Con win · 6.2 – 5.8</p>
          </div>
          <div className="rounded-card border border-border bg-surface-raised p-[var(--space-md)]">
            <p className="text-caption text-text-muted">Con-first pass</p>
            <p className="text-body font-semibold text-text">Con win · 6.0 – 5.9</p>
          </div>
        </div>

        <p className="mt-[var(--space-md)] text-caption text-text-muted">
          <span className="font-semibold text-text">Verdict:</span> Con prevails. Pro argued
          transparent validation well, but Con grounded concrete proliferation vectors that
          Pro did not neutralize.
        </p>
      </GlassPanel>
    </section>
  )
}

/* =====================================================================
   SECTION 4 — Call to action (primary-route reinforcement).
   Uses a SECONDARY CtaButton to the primary route so the page keeps
   exactly one primary CTA in the hero (Requirement 3.3).
   ===================================================================== */
async function CallToAction() {
  return (
    <section className="space-y-[var(--space-xl)]">
      <GlassPanel className="mx-auto max-w-3xl rounded-card p-[var(--space-xl)] text-center">
        <SectionHeading level={2} className="mb-[var(--space-md)]">
          Run your first benchmark
        </SectionHeading>
        <p className="mx-auto mb-[var(--space-lg)] max-w-2xl text-body text-text-muted">
          Configure a motion, pick two models, and produce a complete, inspectable debate
          artifact in a few minutes.
        </p>
        <div className="flex justify-center">
          <CtaButton variant="secondary" href={PRIMARY_CTA.href}>
            {PRIMARY_CTA.label}
            <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </CtaButton>
        </div>
      </GlassPanel>
    </section>
  )
}
