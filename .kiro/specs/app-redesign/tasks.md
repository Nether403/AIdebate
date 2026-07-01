# Implementation Plan: App Redesign

## Overview

This plan ports a single approved design language (shadcn/ui + Tailwind v4, New York / Neutral, themed to a cool near-black with one cyan→violet accent) across the whole app shell and its real research screens. The reference eval-report screen is the canonical visual ground truth.

The work follows the design's migration order (smallest reversible steps): theme foundation first, then the shell, then the canonical eval-report port, then the remaining screens, then cleanup of the retired primitive layer. Each step keeps the app building; a file is retired only after its replacement is wired and its importers are updated.

This is a **presentation-only** redesign (TypeScript/TSX). It must not change debate execution, agent/LLM logic, debate API routes, export logic, or the DB schema (per AGENTS.md non-goals).

## Tasks

- [x] 1. Establish theme foundation (shadcn + tokens)
  - [x] 1.1 Initialize shadcn and add the base component set
    - Run `npx shadcn@latest init` (New York style, Neutral base, CSS variables on); confirm `components.json` matches the design's config and `lib/utils.ts` (`cn`) is created
    - Add components actually used: `button card badge table separator dropdown-menu sidebar tooltip skeleton`
    - Wire Geist + Geist Mono via `next/font/google` in `app/layout.tsx` (`--font-geist-sans`, `--font-geist-mono`); leave `tailwind.config` blank (v4)
    - _Requirements: 1.8_

  - [x] 1.2 Replace the globals.css token + primitive blocks with the adapted shadcn contract
    - Overwrite the `@theme` + `:root`/`.dark`/`.light` blocks in `app/globals.css` with the concrete token values from the design (cool near-black `#070b11`, slate text scale, single `--primary` cyan + `--accent-gradient`, amber/rose status tokens, `--chart-*`, `--glow-*`, light overrides)
    - Add the `@media (prefers-reduced-motion: reduce)` rule that disables all animation/transition
    - Delete the retired `glass-panel`, `glow-blob`, `shimmer-text`, `skeleton` keyframes and the global `* { transition: ... }` rule
    - Define exactly one accent identity (`--accent-gradient` + cyan `--primary`); reserve amber/rose for status only
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.7, 1.11, 3.5, 12.1_

  - [x] 1.3 Write property test for the palette contrast floor
    - **Property 4: Palette floor**
    - **Validates: Requirements 9.1**
    - Table-driven fast-check property over the documented dark/light (fg, bg, role) token pairs asserting `contrastRatio(fg,bg) ≥ MIN_CONTRAST[role]` (≥4.5:1 normal text, ≥3:1 large text / non-text)

- [x] 2. Build and wire the persistent app shell
  - [x] 2.1 Implement AmbientGlow
    - Create `components/layout/AmbientGlow.tsx`: static, `aria-hidden`, `pointer-events-none fixed inset-0 z-0`, three blurred radial blobs using `--glow-*` tokens; no rAF loop, no per-frame repaint
    - _Requirements: 11.2, 11.6, 12.3_

  - [x] 2.2 Implement AppSidebar
    - Create `components/layout/AppSidebar.tsx` (`'use client'`): brand logo `/logo.jpg` via `next/image` with cyan halo, explicit width/height, informational alt (1–250 chars), links to `/`
    - Render exactly the six `NAV_ITEMS` from the manifest with active state from `usePathname()`; 44×44 min targets; visible cyan focus ring; keyboard operable
    - Source every link href exclusively from the Navigation_Manifest allow-list
    - _Requirements: 2.2, 5.1, 6.4, 8.1, 9.3, 11.4_

  - [x] 2.3 Implement AppTopBar and TopBarContext
    - Create `components/layout/AppTopBar.tsx` (`'use client'`): sticky `top-0`, translucent backdrop-blur, hairline bottom border; renders breadcrumb and ThemeToggle always, context pill only when provided, primary-action slot only when provided
    - Create `components/layout/TopBarContext.tsx` with `useTopBar(config)` so pages set breadcrumb/context/action declaratively
    - _Requirements: 2.4, 2.5, 9.3_

  - [x] 2.4 Implement AppShell and mobile sidebar disclosure
    - Create `components/layout/AppShell.tsx`: composes AmbientGlow (z0), AppSidebar (z10), and main column { AppTopBar, children }; owns the `bg-[#070b11]` base and `font-sans antialiased` root; the only mount point for the global background decoration
    - Below 1024px: hide sidebar off-canvas, show a disclosure toggle in the top bar, render main column full width; at/above 1024px: persistent sidebar column, no toggle
    - Disclosure toggle opens the drawer and moves focus into it; dismiss closes the drawer and returns focus to the toggle; no focus trap
    - _Requirements: 2.1, 10.1, 10.2, 10.5, 10.6_

  - [x] 2.5 Swap AppShell into the root layout
    - Modify `app/layout.tsx`: replace `Navigation` + `NeuralBackground` with `AppShell` wrapping `{children}`; keep `ThemeProvider` and `ToastProvider`
    - Delete `components/layout/Navigation.tsx` and `components/layout/NeuralBackground.tsx` once no imports remain
    - _Requirements: 2.1, 2.6, 11.6_

  - [x] 2.6 Write property test for single nav source and six destinations
    - **Property 1: Single nav source** and **Property 2: Exactly six destinations**
    - **Validates: Requirements 5.1, 6.1, 6.4**
    - fast-check over the manifest: every rendered sidebar/top-bar href ∈ EXISTING_ROUTES and ∉ EXCLUDED_PATTERNS; sidebar renders exactly one entry per ALLOWED_NAV_DESTINATIONS member

  - [x] 2.7 Write unit tests for responsive sidebar behavior
    - Drawer open moves focus in; dismiss returns focus to the toggle; toggle hidden at ≥1024px
    - _Requirements: 10.1, 10.2, 10.5, 10.6_

- [x] 3. Verify and harden the Theme_Provider behavior
  - [x] 3.1 Confirm theme default, persistence, and invalid-preference handling
    - Ensure ThemeProvider applies dark when no stored preference exists, overwrites an invalid stored preference with dark, applies the selected theme to the document without reload, and persists the selection
    - Host the ThemeToggle in AppTopBar; ensure themed surfaces/text/accents re-resolve from CSS variables on theme change
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 3.2 Write unit tests for theme default and invalid-preference overwrite
    - No stored preference → dark; invalid stored value → dark and stored value overwritten
    - _Requirements: 3.1, 3.2, 3.4_

- [x] 4. Build shared data-presentation primitives
  - [x] 4.1 Implement Card, CardHeader, and Badge
    - Create `components/ui/Card.tsx` (themed shadcn card: translucent `bg-card backdrop-blur-sm` hairline border) and `CardHeader`
    - Create `components/ui/Badge.tsx` with `tone: 'neutral' | 'accent'`; honesty-label badges wrap this
    - _Requirements: 1.11, 4.2_

  - [x] 4.2 Implement Stat (KPI tile)
    - Create `components/app/Stat.tsx` with icon, iconClass, label, value, sub, optional `highlight` (cyan-tinted gradient surface for the hero KPI only)
    - Apply gradient/glow only to the highlighted KPI role
    - _Requirements: 1.5, 13.1_

  - [x] 4.3 Implement CssBar, LegendDot, and severity mapping
    - Create `components/app/CssBar.tsx`: CSS gradient bar, fill width clamped 0–100% proportional to `value/max`; LegendDot
    - Implement `severity(count)` mapping: 0 → low (cyan→violet gradient), 1–2 → elevated (amber), ≥3 → high (rose), conveyed via dot + numeric value + text label (never color alone)
    - _Requirements: 1.9, 9.4, 13.2, 13.3_

  - [x] 4.4 Implement CodeCard
    - Create `components/app/CodeCard.tsx`: mono code/API block with header + copy, Geist Mono content
    - _Requirements: 1.8, 13.1_

  - [x] 4.5 Write property test for severity mapping and CssBar fill bounds
    - **Property derived from Req 13.2/13.3 (severity + bar proportionality)**
    - **Validates: Requirements 13.2, 13.3**
    - fast-check: ∀ count → correct severity bucket and style; ∀ (value,max) → fill width ∈ [0,100] and proportional to value/max

- [x] 5. Checkpoint - shell and primitives build green
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Port the canonical eval-report screen
  - [x] 6.1 Fold the reference screen into the eval-report route
    - Modify `app/showcase/eval-report/page.tsx`: render the KPI stat row, the model-comparison scorecard table (numeric cells in Geist Mono tabular numerals), CSS comparison bars, and the code/API card using the new primitives
    - Drop the page's self-rendered nav/background; set the top bar via `useTopBar`; single `h1`
    - Render a "sample / demo data" badge on the KPI stat row and the scorecard table
    - _Requirements: 1.9, 2.6, 7.1, 9.2, 13.1, 13.4_

  - [x] 6.2 Delete the throwaway reference route
    - Delete `app/reference/page.tsx` after its contents are folded into eval-report; ensure it ships no route
    - _Requirements: 7.4_

  - [x] 6.3 Write unit test for honesty badges on the eval-report screen
    - **Property 5: Honesty labels present**
    - **Validates: Requirements 7.1, 7.2, 7.3, 13.4**
    - Assert the "sample / demo data" badge renders on the KPI row and table, and "model-based signal · not ground truth" renders on any judge-output surface, visible without interaction

- [x] 7. Re-skin the showcase hub and landing surfaces
  - [x] 7.1 Re-skin the showcase hub
    - Modify `app/showcase/page.tsx`: render one Card per Navigation_Manifest showcase entry in declared order (title, description, single activatable link), keep the `SHOWCASE_ENTRIES` mapping
    - Render an empty-state message when there are zero entries; omit cards whose link does not resolve to EXISTING_ROUTES and render the remaining valid entries
    - Drop self-rendered nav/background; set top bar via `useTopBar`; single `h1`
    - _Requirements: 2.6, 4.1, 4.2, 4.3, 4.4, 4.5, 9.2_

  - [x] 7.2 Re-skin the landing page
    - Modify `app/page.tsx`: re-skin hero + sections to the language; keep honest framing and a single `h1`; source CTAs from the manifest
    - Present exactly one primary and one secondary CTA, resolving to two distinct EXISTING_ROUTES members; replace shimmer/glow-blob primitives with AmbientGlow + restrained gradient
    - _Requirements: 1.5, 2.6, 5.1, 5.3, 9.2_

  - [x] 7.3 Write property test for showcase entry and CTA link integrity
    - **Property 1 (link integrity) applied to showcase + CTA validation**
    - **Validates: Requirements 4.1, 4.5, 5.2, 5.4, 6.2**
    - fast-check over manifest inputs: empty/`#`/anchor-only and non-EXISTING_ROUTES hrefs fail validation and are not rendered; EXCLUDED_PATTERNS targets are rejected with a surfaced error

  - [x] 7.4 Adapt landing-structure and shell-conformance tests
    - Re-point `app/__tests__/landing-structure.test.ts` and `app/showcase/__tests__/demo-shell-conformance.test.ts` to assert single-h1 and shell usage on the new pages
    - **Property 3: One h1 per page**
    - **Validates: Requirements 2.6, 9.2**

- [x] 8. Re-skin the remaining priority research screens
  - [x] 8.1 Re-skin the live-debate screen
    - Modify `app/showcase/live-debate/page.tsx`: transcript + fact-check + judge cards in the new Card/Badge/severity system; drop self-nav/background; `useTopBar`; single `h1`
    - Render the "model-based signal · not ground truth" badge on judge-output surfaces and "sample / demo data" where illustrative
    - _Requirements: 2.6, 7.1, 7.2, 7.3, 9.2, 9.4_

  - [x] 8.2 Re-skin the regression-gate and steelman screens
    - Modify `app/showcase/regression-gate/page.tsx` (CI-gate status cards, pass/fail with status colors, CSS bars) and `app/showcase/steelman/page.tsx` (host-app frame + two-sided analysis panel)
    - Drop self-nav/background; `useTopBar`; single `h1` each; severity via dot + value + label
    - _Requirements: 2.6, 9.2, 9.4_

  - [x] 8.3 Re-skin the synthetic-data screen
    - Modify `app/showcase/synthetic-data/page.tsx`: JSONL/code cards using the CodeCard treatment; drop self-nav/background; `useTopBar`; single `h1`; "sample / demo data" badge on illustrative data
    - _Requirements: 2.6, 7.1, 9.2_

  - [x] 8.4 Re-skin the debate viewer and create-run screens
    - Modify `app/debate/[debateId]/page.tsx`, `app/debate/example/page.tsx`: real transcript viewer in new components; re-skin loading/error states reserving their layout box
    - Modify `app/debate/new/page.tsx`: config form with shadcn form controls; primary action in the top bar
    - Drop self-nav/background; `useTopBar`; single `h1` each; "model-based signal" badge on judge output
    - _Requirements: 2.6, 7.2, 9.2, 11.5_

  - [x] 8.5 Re-skin the system-health screen
    - Modify `app/health/page.tsx`: KPI/stat tiles + status table using Stat/Card; severity via dot + value + label; horizontally scrollable wrapper for wide tables under 1024px
    - Drop self-nav/background; `useTopBar`; single `h1`
    - _Requirements: 2.6, 9.2, 9.4, 10.4_

  - [x] 8.6 Write unit test for severity non-color encoding across screens
    - Assert severity surfaces expose a status dot AND numeric value AND text label
    - _Requirements: 9.4_

- [x] 9. Re-skin the secondary screens
  - [x] 9.1 Re-skin the topics-submit and admin screens
    - Modify `app/topics/submit/page.tsx` (form re-skin) and `app/admin/page.tsx`, `app/admin/topics/page.tsx` (table/stat re-skin)
    - Drop self-nav/background; `useTopBar`; single `h1` each; wide tables in `overflow-x-auto` wrappers under 1024px
    - _Requirements: 2.6, 9.2, 10.4_

  - [x] 9.2 Resolve the components-showcase page
    - Re-skin or retire `app/components-showcase/page.tsx` (internal demo); if kept, render inside the shell with a single `h1`; if retired, remove the route and its imports
    - _Requirements: 2.6, 9.2_

- [x] 10. Image accessibility pass
  - [x] 10.1 Classify and label every image
    - Audit all in-scope images: informational images get descriptive alt (1–250 chars), decorative images get empty alt and are excluded from the accessibility tree; every image has an explicit alt attribute
    - Provide fallback alt (1–250 chars) for informational images whose alt source is unavailable; never empty alt for informational images
    - _Requirements: 2.3, 8.1, 8.2, 8.3, 8.4_

  - [x] 10.2 Replace or drop the illegible infographic
    - Replace `/infographic.jpg` in the "How it works" media with a legible CSS/SVG diagram (or drop the media and keep the numbered steps); supply a real text alternative
    - _Requirements: 8.1, 8.2_

- [x] 11. Retire the orphaned primitive layer
  - [x] 11.1 Remove orphaned styling/primitive modules
    - After confirming no remaining imports, delete `lib/design-system/tokens.ts`, `lib/design-system/motion.ts`, `components/showcase/GlassPanel.tsx`, `GlowBlob.tsx`, `ShimmerText.tsx`; audit `Infographic`, `EmbedNote`, `SectionSkeleton`, `AnimateIn`, `HostAppFrame` and retire those no longer used
    - Keep `lib/design-system/manifest.ts` (content allow-lists); adapt labels/icons only if needed
    - _Requirements: 7.4, 11.6_

  - [x] 11.2 Re-point or drop tests tied to retired modules
    - Drop the `tokens.ts`/`motion.ts` property tests; ensure the kept manifest invariants and the new palette-floor property remain
    - _Requirements: 1.4, 9.1_

- [x] 12. Cross-cutting verification tasks
  - [x] 12.1 Write property test for accent discipline
    - **Property 7: Accent discipline**
    - **Validates: Requirements 1.5, 1.6**
    - Assert gradient/glow classes appear only on interactive/emphasis roles and no body-text node carries a gradient text-fill or text-shadow

  - [x] 12.2 Write property test for reduced-motion safety
    - **Property 8: Reduced-motion safety**
    - **Validates: Requirements 12.1, 12.2, 12.3**
    - Under `prefers-reduced-motion: reduce`: no element animates/transitions and all content that would otherwise animate in is rendered in its final visible, interactive state

  - [x] 12.3 Write property/E2E test for no decorative layout shift and responsive integrity
    - **Property 6: No decorative layout shift**
    - **Validates: Requirements 11.1, 11.2, 11.3, 10.3, 12.x**
    - AmbientGlow contributes 0 to CLS (fixed, out of flow); re-point Playwright responsive/theme/axe/performance specs at the new shell + key screens (375/768/1440 no horizontal overflow, theme persist, axe clean, hero LCP ≤2.5s, page CLS ≤0.1)

  - [x] 12.4 Confirm presentation-only invariant
    - Verify no change to `lib/debate/*`, `lib/agents/*`, `lib/llm/*`, `app/api/debate/*`, export logic, or DB schema (diff review + existing backend tests stay green)
    - _Requirements: 7.4_

- [x] 13. Final checkpoint - full verification and visual ground-truth review
  - Run `npm run typecheck`, `npm run lint`, `npm run test:unit`, `npm run build`, `npm run test:e2e`
  - Screenshot the eval-report screen and key shell screens; compare eval-report against `design-reference-final.png` / `design-reference-fullpage.png`
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional (tests) and can be skipped for a faster MVP, but are recommended given the design's explicit Correctness Properties.
- Each task references specific requirement sub-clauses for traceability.
- The migration order keeps the app building at every step; a file is retired only after its replacement is wired and importers are updated.
- Property tests validate the eight universal Correctness Properties from the design; unit tests cover specific examples and edge cases.
- Verification is not complete on green tests alone — the canonical eval-report screen must be visually compared against the reference captures (per Task Verification Standards).

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2"] },
    { "id": 2, "tasks": ["1.3", "2.1", "2.2", "2.3", "4.1"] },
    { "id": 3, "tasks": ["2.4", "3.1", "4.2", "4.3", "4.4"] },
    { "id": 4, "tasks": ["2.5", "2.6", "2.7", "3.2", "4.5"] },
    { "id": 5, "tasks": ["6.1", "7.1", "7.2"] },
    { "id": 6, "tasks": ["6.2", "6.3", "7.3", "7.4", "8.1", "8.2", "8.3", "8.4", "8.5"] },
    { "id": 7, "tasks": ["8.6", "9.1", "9.2", "10.1"] },
    { "id": 8, "tasks": ["10.2", "11.1", "12.1", "12.2", "12.4"] },
    { "id": 9, "tasks": ["11.2", "12.3"] }
  ]
}
```
