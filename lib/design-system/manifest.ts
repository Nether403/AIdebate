/**
 * Design_System manifest — typed registries for the Showcase_Experience.
 *
 * Single source of truth for navigation destinations, CTA targets, showcase
 * demo entries, brand imagery, the real-route allow-list, and the non-goal
 * exclusion patterns. These registries are consumed BOTH to render the public
 * surfaces AND to property-test invariants (see tasks 2.7–2.10, fast-check).
 *
 * Trust-boundary note: although this is first-party data, the property tests
 * treat these manifests as untrusted input (generating malformed entries) so a
 * future bad edit — an empty title, a "#" href, an excluded route, a missing
 * alt — fails CI rather than shipping. The bound constants and `isValid*`
 * predicates below are the shared contract those tests assert against, and the
 * module-load self-check at the bottom fails fast on a malformed first-party
 * edit.
 *
 * Requirements: 4.1, 5.1, 5.2, 5.3, 6.2, 6.3, 6.4, 8.1, 8.2
 */

// --- Navigation allow-list (Requirement 6.4) -------------------------------

/** The six — and only six — approved research destinations. */
export const ALLOWED_NAV_DESTINATIONS = [
  'create-benchmark-run',
  'inspect-transcript',
  'review-fact-checks-judge',
  'compare-models',
  'export-datasets',
  'system-health',
] as const

export type AllowedNavDestination = (typeof ALLOWED_NAV_DESTINATIONS)[number]

// --- Types -----------------------------------------------------------------

export interface NavItem {
  id: AllowedNavDestination
  label: string
  href: string
}

export interface CtaTarget {
  id: string
  label: string
  /** Must resolve to a member of EXISTING_ROUTES (Requirement 5.1–5.3). */
  href: string
}

export interface ShowcaseEntry {
  /** Must resolve to a member of EXISTING_ROUTES (Requirement 4.1). */
  href: string
  /** 1..80 characters inclusive (Requirement 4.1). */
  title: string
  /** 1..200 characters inclusive (Requirement 4.1). */
  description: string
}

export interface BrandImage {
  src: string
  /** Informational: 1..250 chars (Req 8.1). Decorative: '' (Req 8.2). */
  alt: string
  decorative: boolean
}

// --- Typed bounds (Requirements 4.1, 8.1) ----------------------------------

export const SHOWCASE_TITLE_MIN = 1
export const SHOWCASE_TITLE_MAX = 80
export const SHOWCASE_DESCRIPTION_MIN = 1
export const SHOWCASE_DESCRIPTION_MAX = 200
export const INFORMATIONAL_ALT_MIN = 1
export const INFORMATIONAL_ALT_MAX = 250

// --- Real-route allow-list (Requirements 5.1–5.3) --------------------------

/**
 * The allow-list of real, resolvable application routes the Showcase_Experience
 * may link to. Verified against the `app/` directory. `/health` is the single
 * new minimal page added by task 6.2 to satisfy the navigation contract; it is
 * included here so the manifest stays internally consistent.
 */
export const EXISTING_ROUTES: ReadonlySet<string> = new Set<string>([
  '/',
  '/showcase',
  '/debate/new',
  '/debate/example',
  '/showcase/live-debate',
  '/showcase/eval-report',
  '/showcase/regression-gate',
  '/showcase/steelman',
  '/showcase/synthetic-data',
  '/health',
])

// --- Non-goal exclusion patterns (Requirements 6.2, 6.3) -------------------

/**
 * Patterns for content the Showcase_Experience must never expose, per
 * AGENTS.md non-goals: prediction markets, betting/wagering, DebatePoints,
 * superforecaster badges, and social-share / follow / virality mechanics.
 * Used by `middleware.ts` (task 6.1) to redirect excluded routes and by
 * Property 5 to prove no nav/CTA target matches.
 */
export const EXCLUDED_PATTERNS: RegExp[] = [
  /prediction/i,
  /betting|\bbet\b|wager/i,
  /\bpoints\b|debatepoints/i,
  /badge|superforecaster/i,
  /share|social/i,
  /\bfollow\b/i,
  /leaderboard/i,
  /virality|viral/i,
]

// --- Registries ------------------------------------------------------------

/** Navigation_Shell destinations — exactly the six approved, real routes. */
export const NAV_ITEMS: NavItem[] = [
  { id: 'create-benchmark-run', label: 'Create benchmark run', href: '/debate/new' },
  { id: 'inspect-transcript', label: 'Inspect transcript', href: '/debate/example' },
  { id: 'review-fact-checks-judge', label: 'Fact-checks & judge', href: '/showcase/live-debate' },
  { id: 'compare-models', label: 'Compare models', href: '/showcase/eval-report' },
  { id: 'export-datasets', label: 'Export datasets', href: '/showcase/synthetic-data' },
  { id: 'system-health', label: 'System health', href: '/health' },
]

/** Landing_Page calls-to-action: one primary, one distinct secondary. */
export const CTA_TARGETS: CtaTarget[] = [
  { id: 'primary', label: 'Create a benchmark run', href: '/debate/new' },
  { id: 'secondary', label: 'Explore the showcase', href: '/showcase' },
]

/** One entry per demo page; titles 1–80 chars, descriptions 1–200 chars. */
export const SHOWCASE_ENTRIES: ShowcaseEntry[] = [
  {
    href: '/showcase/live-debate',
    title: 'Live Debate Viewer',
    description:
      'Two models argue, get fact-checked, and a bias-aware judge decides. Inspect the reasoning, the sources, and the persuasion-vs-truth signal.',
  },
  {
    href: '/showcase/eval-report',
    title: 'Eval-as-a-Service Report',
    description:
      'A model-vs-model scorecard: win rates, factuality, and charismatic-liar flags aggregated across a benchmark run.',
  },
  {
    href: '/showcase/regression-gate',
    title: 'Model Regression Gate',
    description:
      'A CI check that runs a debate benchmark on model upgrades and blocks the deploy when the new model wins more by being persuasively wrong.',
  },
  {
    href: '/showcase/steelman',
    title: 'Steelman Widget',
    description:
      'A drop-in panel: pick a contested question and get a sourced two-sided analysis with a reasoned verdict, shown inside a mock host app.',
  },
  {
    href: '/showcase/synthetic-data',
    title: 'Synthetic Data Generator',
    description:
      'Turn one debate into training data: preference pairs with rationales and process-supervision traces, exported as ready-to-use JSONL.',
  },
]

/** Persistent brand anchors (Requirements 2.2, 2.3). Both are informational. */
export const BRAND_IMAGES: BrandImage[] = [
  {
    src: '/logo.jpg',
    alt: 'LLMargument workbench logo',
    decorative: false,
  },
  {
    src: '/infographic.jpg',
    alt: 'Infographic of the debate benchmarking flow: two models argue, a fact-checker verifies claims against sources, and a bias-aware judge scores both persuasion and logical rigor.',
    decorative: false,
  },
]

// --- Validation predicates (shared contract for the property tests) --------

export function isRealRoute(href: string): boolean {
  return EXISTING_ROUTES.has(href)
}

/** A usable CTA/nav href: non-empty, not an anchor-only/placeholder, real. */
export function isResolvableHref(href: string): boolean {
  return (
    typeof href === 'string' &&
    href.length > 0 &&
    href !== '#' &&
    !href.startsWith('#') &&
    isRealRoute(href)
  )
}

export function matchesExcludedPattern(value: string): boolean {
  return EXCLUDED_PATTERNS.some((pattern) => pattern.test(value))
}

export function isValidShowcaseEntry(entry: ShowcaseEntry): boolean {
  return (
    entry.title.length >= SHOWCASE_TITLE_MIN &&
    entry.title.length <= SHOWCASE_TITLE_MAX &&
    entry.description.length >= SHOWCASE_DESCRIPTION_MIN &&
    entry.description.length <= SHOWCASE_DESCRIPTION_MAX &&
    isRealRoute(entry.href)
  )
}

export function isValidBrandImage(image: BrandImage): boolean {
  if (image.decorative) {
    return image.alt === ''
  }
  return image.alt.length >= INFORMATIONAL_ALT_MIN && image.alt.length <= INFORMATIONAL_ALT_MAX
}

// --- Module-load self-check ------------------------------------------------
// ponytail: first-party data is correct today; this guard exists so a future
// bad edit fails fast at import (and in CI) instead of shipping a broken link
// or an out-of-bounds label. Upgrade path: the Property 3–6 fast-check suites
// (tasks 2.7–2.10) supersede this as the authoritative invariant coverage.
function assertManifestInvariants(): void {
  const navIds = new Set(NAV_ITEMS.map((n) => n.id))
  if (navIds.size !== ALLOWED_NAV_DESTINATIONS.length) {
    throw new Error('manifest: NAV_ITEMS must cover each approved destination exactly once')
  }
  for (const item of NAV_ITEMS) {
    if (!isResolvableHref(item.href)) throw new Error(`manifest: NAV_ITEMS href not a real route: ${item.href}`)
    if (matchesExcludedPattern(item.href)) throw new Error(`manifest: NAV_ITEMS href hits excluded pattern: ${item.href}`)
  }
  for (const cta of CTA_TARGETS) {
    if (!isResolvableHref(cta.href)) throw new Error(`manifest: CTA_TARGETS href not a real route: ${cta.href}`)
    if (matchesExcludedPattern(cta.href)) throw new Error(`manifest: CTA_TARGETS href hits excluded pattern: ${cta.href}`)
  }
  for (const entry of SHOWCASE_ENTRIES) {
    if (!isValidShowcaseEntry(entry)) throw new Error(`manifest: invalid SHOWCASE_ENTRIES entry: ${entry.href}`)
  }
  for (const image of BRAND_IMAGES) {
    if (!isValidBrandImage(image)) throw new Error(`manifest: invalid BRAND_IMAGES alt for: ${image.src}`)
  }
}

assertManifestInvariants()
