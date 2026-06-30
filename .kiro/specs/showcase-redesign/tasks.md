# Implementation Plan: Showcase Redesign

## Overview

This plan rebuilds the public surfaces (Landing_Page, Showcase_Hub, five Demo Pages) on top of a single Design_System. Work flows bottom-up: first the token foundation in `app/globals.css` and the typed layer in `lib/design-system/`, then the reusable primitives and shared shell, then the global frame and route guards, and finally the page compositions and cross-cutting verification. Property tests are written against the typed config/logic layer (`tokens.ts`, `motion.ts`, `manifest.ts`) using `fast-check`; rendered, viewport, theming, and performance criteria are covered by example/Playwright/Lighthouse tests.

Implementation language: **TypeScript** (Next.js App Router, Tailwind CSS v4, Framer Motion), matching the existing app.

## Tasks

- [x] 1. Establish the Design_System token foundation in `app/globals.css`
  - [x] 1.1 Declare all seven token categories and theme scopes in a single `@theme` block
    - Define named custom properties for color, glow, typography scale, spacing scale, corner radius, elevation, and motion (e.g. `--color-accent-primary`, `--color-accent-2..4`, `--glow-accent`, `--text-hero`, `--space-section`, `--radius-card`, `--shadow-elevation-1..3`, `--duration-entrance`, `--ease-standard`)
    - Override theme-dependent surface/text/accent/border tokens in `:root` (dark default), `.light`, and an explicit `.dark` scope so the ThemeProvider class always maps to rules
    - Constrain accents to exactly one primary plus at most three supporting tokens
    - _Requirements: 1.1, 1.5, 10.2, 10.4_

  - [x] 1.2 Consolidate reusable primitives and reduced-motion rules in `app/globals.css`
    - Define `glass-panel`, `glow-blob`, and `shimmer-text` exactly once, sourced from token custom properties
    - Restrict glow/neon styling to accent/emphasis classes; never apply glow to body-text classes
    - Add a `@media (prefers-reduced-motion: reduce)` block that disables decorative float/shimmer motion while leaving anchors visible
    - _Requirements: 1.7, 2.5, 2.7, 9.1_

- [x] 2. Build the typed Design_System layer in `lib/design-system/`
  - [x] 2.1 Implement `tokens.ts` (token-name unions, accent allow-list, resolver, contrast util)
    - Export `TOKEN_CATEGORIES`, `ACCENT_TOKENS` (one primary + ≤3 supporting), and `ThemeMode`
    - Implement a total `resolveToken(name, theme)` that never returns empty/undefined and falls back to the default (dark) theme value when unresolved
    - Add a WCAG 2.1 contrast-ratio helper plus the theme-scoped text/surface token pairings it consumes
    - _Requirements: 1.5, 2.6, 8.3, 10.4_

  - [x] 2.2 Write property test for token resolution
    - **Property 1: Token resolution is total with theme fallback**
    - **Validates: Requirements 10.2, 10.4**

  - [x] 2.3 Write property test for theme-aware contrast
    - **Property 2: Theme-aware contrast meets WCAG thresholds**
    - **Validates: Requirements 2.6, 8.3, 8.4, 10.1**

  - [x] 2.4 Implement `motion.ts` reduced-motion-aware variant builder
    - Implement pure `buildVariant(kind, reducedMotion)` reading durations from CSS custom properties via a `getMotionToken()` helper
    - Cap entrance duration at 600 ms; under reduced motion emit opacity-only specs with duration ≤200 ms (no positional/scale/rotation change)
    - _Requirements: 9.1, 9.6, 9.7_

  - [x] 2.5 Write property test for motion variants
    - **Property 7: Motion variants respect motion discipline**
    - **Validates: Requirements 2.7, 9.1, 9.6, 9.7**

  - [x] 2.6 Implement `manifest.ts` typed registries
    - Define `NAV_ITEMS` (six approved destinations only), `CTA_TARGETS`, `SHOWCASE_ENTRIES`, `BRAND_IMAGES`, `EXISTING_ROUTES`, and `EXCLUDED_PATTERNS`
    - Enforce typed bounds: showcase title 1–80 chars, description 1–200 chars, informational alt 1–250 chars, decorative alt empty
    - _Requirements: 4.1, 5.1, 5.2, 5.3, 6.2, 6.3, 6.4, 8.1, 8.2_

  - [x] 2.7 Write property test for showcase hub entries
    - **Property 3: Showcase hub entries are well-formed and navigable**
    - **Validates: Requirements 4.1**

  - [x] 2.8 Write property test for CTA and navigation targets
    - **Property 4: Every CTA and navigation target is a real, non-placeholder route**
    - **Validates: Requirements 5.1, 5.2, 5.3**

  - [x] 2.9 Write property test for navigation allow-list and exclusions
    - **Property 5: Navigation integrity — allow-list and non-goal exclusion**
    - **Validates: Requirements 6.2, 6.3, 6.4**

  - [x] 2.10 Write property test for image alt-text bounds
    - **Property 6: Image alt-text obeys informational and decorative bounds**
    - **Validates: Requirements 8.1, 8.2**

- [x] 3. Checkpoint - Ensure the Design_System layer is complete and tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement reusable primitive components (`components/showcase/`)
  - [x] 4.1 Implement `GlassPanel`, `GlowBlob`, and `ShimmerText`
    - Wrap the single consolidated `glass-panel` / `glow-blob` / `shimmer-text` definitions; reference, never redefine
    - Keep glow confined to accent/emphasis roles
    - _Requirements: 1.7, 2.5_

  - [x] 4.2 Implement `BrandLogo` and `Infographic`
    - Render via `next/image` with intrinsic sizing and container-scoped overflow
    - `Infographic` carries descriptive alt and an `onError` text fallback in place of a broken image
    - _Requirements: 2.2, 2.3, 7.7, 8.1, 11.2, 11.5_

  - [x] 4.3 Implement `SectionHeading` and `CtaButton`
    - `SectionHeading` enforces hierarchical levels without skipping
    - `CtaButton` renders a real `next/link`; the secondary variant never reuses the primary fill/size/weight; targets meet 44×44 minimum
    - _Requirements: 3.3, 3.4, 7.6, 8.5_

  - [x] 4.4 Implement `SampleDataLabel` and `JudgeSignalLabel`
    - Visible "Sample / demo data" label for illustrative sections; visible "model-based signal, not ground truth" label for judge output
    - _Requirements: 5.4, 6.1_

  - [x] 4.5 Implement `AnimateIn` and `SimulatorControls`
    - `AnimateIn` sources variants from `buildVariant` + `useReducedMotion`; entrance ≤600 ms
    - `SimulatorControls` exposes a persistent pause/resume control, stops within 100 ms, shows a paused indicator, and starts paused under reduced motion
    - _Requirements: 9.3, 9.4, 9.5, 9.6, 9.7_

  - [x] 4.6 Write unit tests for primitive behavior
    - Cover `CtaButton` primary/secondary visual distinction, `Infographic` error fallback, and `SimulatorControls` pause-within-100 ms / starts-paused-under-reduced-motion
    - _Requirements: 3.4, 9.4, 9.7, 11.5_

- [x] 5. Build the shared shell and global frame
  - [x] 5.1 Implement `ShowcaseShell` and `BackToHub` (`components/showcase/`)
    - `ShowcaseShell` applies shared background, container width, spacing rhythm, and exactly one `<h1>` heading treatment; consuming pages set no own background
    - `BackToHub` renders a return link to `/showcase` meeting the 44×44 minimum
    - _Requirements: 4.2, 4.3, 8.5, 7.6_

  - [x] 5.2 Rebuild `components/layout/Navigation.tsx` to the six approved destinations
    - Render only the `NAV_ITEMS` allow-list, each mapped to a real resolvable route; expose no gamification/prediction/social destination
    - _Requirements: 5.2, 5.3, 6.4_

  - [x] 5.3 Make `NeuralBackground` reduced-motion-aware and budget-counted
    - Pause/stop the canvas loop under `prefers-reduced-motion`; document it as the single global Decorative_Animation leaving headroom for ≤2 per viewport; reserve space so it causes zero layout shift
    - _Requirements: 2.4, 2.7, 11.3_

  - [x] 5.4 Wire `app/layout.tsx` global frame
    - Compose `ThemeProvider`, rebuilt `Navigation`, and budgeted `NeuralBackground`; render persistent `BrandLogo`; ensure theme-class application restyles all surfaces
    - _Requirements: 2.2, 10.3_

- [x] 6. Add route guards and the system-health route
  - [x] 6.1 Implement `middleware.ts` excluded-route redirect
    - Match requested paths against `EXCLUDED_PATTERNS`; do not render excluded content and redirect to an exposed approved destination
    - _Requirements: 6.5_

  - [x] 6.2 Implement `app/health/page.tsx` minimal system-health page
    - Fetch `/api/health` and render status so the "system health" nav destination resolves to a real route
    - _Requirements: 5.2, 6.4_

  - [x] 6.3 Write test for excluded-route redirect
    - Assert an excluded path is not rendered and resolves to an approved destination
    - _Requirements: 6.5_

- [x] 7. Compose the Landing_Page (`app/page.tsx`)
  - [x] 7.1 Build the hero and at least four fixed-order sections
    - Hero: value-prop headline, supporting description, one primary CTA (`/debate/new`), one distinct secondary CTA (`/showcase`), all above the fold at 1280×720
    - Sections (How it works with infographic anchor, What it measures, Sample artifact, Call to action), each with exactly one heading; spacing only from the scale; workbench framing with no gamification/prediction/social language
    - _Requirements: 2.3, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

  - [x] 7.2 Add the sample-artifact section labels
    - Co-locate `SampleDataLabel` with the illustrative judge-output preview and `JudgeSignalLabel` adjacent to the judge output
    - _Requirements: 5.4, 6.1_

  - [x] 7.3 Add progressive placeholders and image fallback to the landing sections
    - Use Suspense/loading boundaries to show skeletons for pending sections within 1 s and replace progressively; wire image-fetch text fallback
    - _Requirements: 11.4, 11.5_

  - [x] 7.4 Write example tests for landing structure
    - Assert ≥4 ordered sections each with one heading, exactly one primary CTA, distinct secondary CTAs, and no excluded terminology
    - _Requirements: 3.2, 3.3, 3.4, 3.6_

- [x] 8. Compose the Showcase_Hub (`app/showcase/page.tsx`)
  - [x] 8.1 Render the hub through `ShowcaseShell` mapping `SHOWCASE_ENTRIES`
    - Render each entry as a navigable `next/link` card with bounded title/description; sets no own background
    - _Requirements: 4.1, 4.3, 4.5, 5.2_

  - [x] 8.2 Add navigation-failure handling
    - On demo navigation failure, stay on the hub and surface a visible "couldn't open that demo" error via an error boundary / caught prefetch error
    - _Requirements: 4.7, 5.5_

  - [x] 8.3 Write example test for hub entries and error state
    - Assert all entries render as navigable cards and a failed navigation keeps the visitor on the hub with a visible error
    - _Requirements: 4.1, 4.7_

- [x] 9. Refactor the five Demo Pages through the shared shell (`app/showcase/*/page.tsx`)
  - [x] 9.1 Refactor `live-debate` page
    - Render via `ShowcaseShell` (no own background), add `BackToHub`, `JudgeSignalLabel` on judge output, and `SimulatorControls` on the auto-advancing sequence
    - _Requirements: 4.2, 4.3, 4.4, 6.1, 9.3, 9.4, 9.5, 9.7_

  - [x] 9.2 Refactor `eval-report` page
    - Render via `ShowcaseShell`; add `BackToHub`, `SampleDataLabel`, and `JudgeSignalLabel`
    - _Requirements: 4.2, 4.3, 4.4, 5.4, 6.1_

  - [x] 9.3 Refactor `regression-gate` page
    - Render via `ShowcaseShell`; add `BackToHub`, `SampleDataLabel`, and `JudgeSignalLabel`
    - _Requirements: 4.2, 4.3, 4.4, 5.4, 6.1_

  - [x] 9.4 Refactor `steelman` page
    - Render via `ShowcaseShell`; add `BackToHub`, `SampleDataLabel`, and `JudgeSignalLabel`
    - _Requirements: 4.2, 4.3, 4.4, 5.4, 6.1_

  - [x] 9.5 Refactor `synthetic-data` page
    - Render via `ShowcaseShell`; add `BackToHub` and `SampleDataLabel`
    - _Requirements: 4.2, 4.3, 4.4, 5.4_

  - [x] 9.6 Write example test for demo-page shell conformance
    - Assert every demo page renders through `ShowcaseShell`, declares no own background, and shows a `BackToHub` link
    - _Requirements: 4.2, 4.3, 4.4_

- [ ] 10. Cross-cutting verification of rendered criteria
  - [x] 10.1 Write Playwright responsive tests at 375 / 768 / 1440
    - Assert no horizontal scroll/overflow, CTA single-column stacking at 375, no overlap/clipping, 44×44 targets, oversized-content containment, and hero above the fold at 1280×720
    - _Requirements: 3.1, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

  - [-] 10.2 Write Playwright theme + accessibility tests
    - Assert theme toggle restyles all surfaces within 300 ms with none stale; axe checks; keyboard activation with visible focus, reading-order focus, no focus trap; reduced-motion suppression with anchors visible
    - _Requirements: 2.7, 8.4, 8.6, 8.7, 9.2, 10.3_

  - [x] 10.3 Write static/smoke scan checks
    - Assert no raw hex/px/ms outside the Design_System, accents reference accent tokens only, primitives declared exactly once, no glow on body text, demo roots declare no background, and glow/gradient area ≤40% at the three breakpoints
    - _Requirements: 1.2, 1.3, 1.4, 1.6, 1.7, 2.1, 2.5, 3.5, 4.4_

  - [-] 10.4 Write Lighthouse/trace performance checks
    - Assert hero render ≤2.5 s, optimized images within the display-dimension ratio, and CLS 0 during decorative animation
    - _Requirements: 11.1, 11.2, 11.3_

- [~] 11. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional test sub-tasks and can be skipped for a faster MVP; core implementation tasks are never optional.
- Each task references specific granular requirements for traceability.
- The seven property tests map one-to-one to the design's Correctness Properties (1–7) and run via the existing `npm run test:unit` (`fast-check`) harness; rendered/viewport/theme/performance criteria use Playwright and Lighthouse.
- Verification baseline after changes: `npm run typecheck`, `npm run lint`, `npm run test:unit`, `npm run build`.
- This is a presentation-only change; no debate execution, persistence, judging, or export logic is modified.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "2.1", "2.4", "2.6"] },
    { "id": 1, "tasks": ["1.2", "2.2", "2.3", "2.5", "2.7", "2.8", "2.9", "2.10"] },
    { "id": 2, "tasks": ["4.1", "4.2", "4.3", "4.4", "4.5"] },
    { "id": 3, "tasks": ["4.6", "5.1", "5.2", "5.3"] },
    { "id": 4, "tasks": ["5.4", "6.1", "6.2"] },
    { "id": 5, "tasks": ["6.3", "7.1", "8.1", "9.1", "9.2", "9.3", "9.4", "9.5"] },
    { "id": 6, "tasks": ["7.2", "8.2"] },
    { "id": 7, "tasks": ["7.3"] },
    { "id": 8, "tasks": ["7.4", "8.3", "9.6", "10.1", "10.2", "10.3", "10.4"] }
  ]
}
```
