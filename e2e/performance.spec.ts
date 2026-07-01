import { test, expect, type Page } from '@playwright/test'

/**
 * Feature: app-redesign — Task 12.3
 * Performance + layout-stability verification of the redesigned App_Shell and
 * its key research screens.
 *
 * These criteria depend on real browser timing / layout and are not amenable to
 * property testing, so they are covered here as Playwright integration tests
 * using the browser's built-in Performance APIs (Navigation/Paint Timing,
 * LargestContentfulPaint, and LayoutShift observers). No Lighthouse or
 * `playwright-lighthouse` dependency is introduced — the budgets below are
 * measured directly, which keeps the dependency surface lean and the signal
 * honest.
 *
 * Covered acceptance criteria (app-redesign requirements.md):
 *   - 11.1  An in-scope route renders its above-the-fold content from server
 *           HTML and renders the largest contentful element within 2.5 s,
 *           without gating it behind an animated reveal. Measured via Largest
 *           Contentful Paint, falling back to First Contentful Paint.
 *   - 11.2  The Ambient_Glow renders as a fixed, out-of-flow, pointer-events-none
 *           layer that contributes a cumulative layout shift of 0. The static
 *           construction is proven in the unit suite
 *           (components/layout/__tests__/ambient-glow-static.test.ts); here we
 *           back it empirically — with the glow being the only global decoration,
 *           the running CLS on a settled page must stay ~0.
 *   - 11.3  An in-scope route produces a page-level CLS of at most 0.1 over the
 *           load window.
 *   - 11.4  The brand logo is served through an optimized image element with an
 *           explicit, layout-reserving box near its display size.
 *
 * IMPORTANT CAVEAT (timing): the LCP budget (11.1) is only truly meaningful
 * against a PRODUCTION build (`next build && next start`), the default
 * `webServer` in playwright.config.ts. Against a dev server (on-demand
 * compilation, unminified bundles) the measured render time is a pessimistic
 * upper bound — a dev FAIL on 11.1 alone should be confirmed against a
 * production build before being treated as a regression. The image-ratio (11.4)
 * and CLS (11.2/11.3) checks are valid on either server.
 */

// --- Key screens under test (landing + hub + canonical eval-report + health)
const KEY_ROUTES = ['/', '/showcase', '/showcase/eval-report', '/health'] as const

// --- Budgets / tolerances --------------------------------------------------

const HERO_BUDGET_MS = 2500 // Req 11.1
// Req 11.4: next/image snaps to the next configured breakpoint ≥ the displayed
// size, so the served width is always a little larger than the display width;
// a small tolerance absorbs layout rounding and breakpoint snapping without
// masking a genuinely oversized (wasteful-download) asset.
const RATIO_MIN = 1.0
const RATIO_MAX = 1.5
const RATIO_TOL = 0.2 // effective accepted band: [0.8, 1.7]
// Req 11.2 wants the glow's CLS contribution = 0. With a static, fixed,
// out-of-flow decoration there should be no running shift at all; we allow a
// hair of floating-point/sub-pixel slop so a rounding artifact does not flake.
const CLS_EPSILON = 0.01
// Req 11.3 caps the page-level CLS over the whole load window at 0.1.
const PAGE_CLS_BUDGET = 0.1
// Window over which we watch for shift after the page has settled — long enough
// to catch any late decorative repaint (there must be none, since the glow is
// static and carries no per-frame loop).
const CLS_OBSERVE_MS = 3000

/** Navigate and let streamed Suspense sections, fonts, and images settle so the
 *  measurement window reflects a stable post-load page. */
async function gotoSettled(page: Page, route: string) {
  await page.goto(route, { waitUntil: 'networkidle' })
  await page.waitForTimeout(400)
}

/**
 * Measure hero render time relative to navigation start. Prefers Largest
 * Contentful Paint (buffered) and falls back to First Contentful Paint. Both
 * startTimes are relative to the navigation's timeOrigin, which is exactly the
 * "within N seconds of navigation start" frame Req 11.1 specifies.
 */
async function measureHeroRender(
  page: Page,
): Promise<{ lcp: number; fcp: number | null; lcpEl: string | null }> {
  return page.evaluate(
    () =>
      new Promise<{ lcp: number; fcp: number | null; lcpEl: string | null }>((resolve) => {
        let lcp = 0
        let lcpEl: string | null = null
        let observer: PerformanceObserver | null = null
        try {
          observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              // LCP entries are monotonic; keep the latest (largest) startTime.
              lcp = entry.startTime
              // Capture which element LCP latched onto so a failure can say
              // whether it was hero content or a later/below-fold paint.
              const el = (entry as PerformanceEntry & { element?: Element | null }).element
              if (el) {
                const tag = el.tagName.toLowerCase()
                const cls = typeof el.className === 'string' ? el.className.slice(0, 50) : ''
                lcpEl = cls ? `${tag}.${cls.trim().split(/\s+/).join('.')}` : tag
              }
            }
          })
          observer.observe({ type: 'largest-contentful-paint', buffered: true })
        } catch {
          // LCP unsupported — fall back to FCP only.
        }
        // Give the observer a beat to flush buffered entries, then resolve.
        setTimeout(() => {
          observer?.disconnect()
          const fcpEntry = performance
            .getEntriesByType('paint')
            .find((p) => p.name === 'first-contentful-paint')
          resolve({ lcp, fcp: fcpEntry ? fcpEntry.startTime : null, lcpEl })
        }, 600)
      }),
  )
}

// Hero render budget is specified for a desktop viewport (Req 11.1). The
// landing hero headline is the largest contentful paint.
test.describe('above-the-fold render budget (Req 11.1)', () => {
  test.use({ viewport: { width: 1280, height: 720 } })

  test('/ — hero LCP/FCP renders within 2.5s of navigation start', async ({ page }) => {
    // Warm the route once. Req 11.1 budgets the PAGE's render time under a
    // standard broadband profile — what a visitor hitting an already-warm
    // server experiences. A freshly `next start`-ed production server compiles
    // the route and optimizes next/image assets ON the first request, so an
    // unwarmed first navigation conflates that one-time server cold-start with
    // the page's own render budget. Warming first, then measuring on a fresh
    // navigation, isolates the criterion the requirement actually specifies.
    await page.goto('/', { waitUntil: 'networkidle' })
    await page.goto('about:blank')
    await page.goto('/', { waitUntil: 'networkidle' })

    const { lcp, fcp, lcpEl } = await measureHeroRender(page)
    // Use LCP when present (the hero is the largest contentful paint); otherwise
    // fall back to FCP so the assertion still has a meaningful signal.
    const heroRender = lcp > 0 ? lcp : (fcp ?? Number.POSITIVE_INFINITY)

    expect(
      heroRender,
      `hero render time ${Math.round(heroRender)}ms (LCP=${Math.round(lcp)}ms on <${
        lcpEl ?? 'unknown'
      }>, FCP=${fcp === null ? 'n/a' : Math.round(fcp)}ms) must be ≤ ${HERO_BUDGET_MS}ms of ` +
        `navigation start. NOTE: meaningful on a production build; a dev-server measurement is a ` +
        `pessimistic upper bound.`,
    ).toBeLessThanOrEqual(HERO_BUDGET_MS)

    // 11.1 also forbids gating the hero behind an animated reveal: the single
    // <h1> must be present and visible in the server-rendered HTML, not hidden
    // pending an animation.
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })
})

// Brand logo optimization + display-dimension ratio (Req 11.4). The logo lives
// in the persistent App_Sidebar (visible at desktop widths) and is served
// through the next/image optimizer with an explicit, layout-reserving box.
test.describe('logo optimization & layout-reserving box (Req 11.4)', () => {
  test.use({ viewport: { width: 1280, height: 720 } })

  test('/ — brand logo is optimized and scaled near its display dimensions', async ({ page }) => {
    await gotoSettled(page, '/')
    // The sidebar logo is served through the optimizer; wait for it before measuring.
    await page.locator('img[src*="logo"], img[src*="_next/image"]').first().waitFor()

    const images = await page.evaluate(() => {
      const dpr = window.devicePixelRatio || 1
      const isBrand = (src: string) => /logo/i.test(decodeURIComponent(src))
      const results: {
        label: string
        natural: number
        displayedCss: number
        dpr: number
        ratio: number
        optimized: boolean
        hasExplicitBox: boolean
      }[] = []
      for (const img of Array.from(document.querySelectorAll('img'))) {
        const src = img.currentSrc || img.src || ''
        // Only the brand logo is in scope for Req 11.4.
        if (!isBrand(src)) continue
        const rect = img.getBoundingClientRect()
        if (rect.width === 0 || rect.height === 0) continue
        const natural = img.naturalWidth
        const displayedCss = rect.width
        results.push({
          label: 'logo',
          natural,
          displayedCss: Math.round(displayedCss),
          dpr,
          // Served pixels vs the physical pixels actually painted (CSS px × dpr).
          ratio: natural / (displayedCss * dpr),
          // Evidence the next/image optimizer served this asset (vs the raw file).
          optimized: /\/_next\/image/.test(src),
          // next/image with explicit width/height sets the intrinsic attributes
          // that reserve the layout box before load (Req 11.4).
          hasExplicitBox: img.hasAttribute('width') && img.hasAttribute('height'),
        })
      }
      return results
    })

    expect(images.length, 'expected the brand logo image to be present').toBeGreaterThanOrEqual(1)

    for (const img of images) {
      expect(
        img.optimized,
        `brand logo should be served through the next/image optimizer (currentSrc not /_next/image)`,
      ).toBe(true)
      expect(
        img.hasExplicitBox,
        `brand logo must declare explicit width+height to reserve its layout box before load (Req 11.4)`,
      ).toBe(true)
      expect(
        img.ratio,
        `brand logo served ${img.natural}px for a ${img.displayedCss}css×${img.dpr}dpr display ` +
          `(ratio ${img.ratio.toFixed(2)}×) — expected within the ${RATIO_MIN}–${RATIO_MAX}× band (±${RATIO_TOL})`,
      ).toBeGreaterThanOrEqual(RATIO_MIN - RATIO_TOL)
      expect(
        img.ratio,
        `brand logo served ${img.natural}px for a ${img.displayedCss}css×${img.dpr}dpr display ` +
          `(ratio ${img.ratio.toFixed(2)}×) — expected within the ${RATIO_MIN}–${RATIO_MAX}× band (±${RATIO_TOL})`,
      ).toBeLessThanOrEqual(RATIO_MAX + RATIO_TOL)
    }
  })
})

/**
 * Read the page-level cumulative layout shift accumulated over the whole load
 * window (buffered entries from navigation start). Entries flagged
 * `hadRecentInput` are excluded per the CLS definition. Backs Req 11.3.
 */
async function measurePageLoadCls(page: Page): Promise<number> {
  return page.evaluate(
    () =>
      new Promise<number>((resolve) => {
        let cls = 0
        let observer: PerformanceObserver | null = null
        try {
          observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              const shift = entry as PerformanceEntry & { value: number; hadRecentInput: boolean }
              if (!shift.hadRecentInput) cls += shift.value
            }
          })
          // buffered:true — include every shift since navigation start so this
          // reflects the FULL load-window CLS (Req 11.3), not just a tail window.
          observer.observe({ type: 'layout-shift', buffered: true })
        } catch {
          resolve(0)
          return
        }
        setTimeout(() => {
          observer?.disconnect()
          resolve(cls)
        }, 600)
      }),
  )
}

/**
 * Observe cumulative layout shift over a fixed window AFTER the page has
 * settled, isolating any shift caused by the running decoration (the static
 * AmbientGlow) from the unavoidable initial-load reflow. Backs Req 11.2.
 */
async function measureRunningCls(page: Page, windowMs: number): Promise<number> {
  return page.evaluate(
    (ms) =>
      new Promise<number>((resolve) => {
        let cls = 0
        let observer: PerformanceObserver | null = null
        try {
          observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              const shift = entry as PerformanceEntry & { value: number; hadRecentInput: boolean }
              if (!shift.hadRecentInput) cls += shift.value
            }
          })
          // buffered:false — only count shifts during our window, i.e. while the
          // (static) decoration is on an already-settled page.
          observer.observe({ type: 'layout-shift', buffered: false })
        } catch {
          resolve(0)
          return
        }
        setTimeout(() => {
          observer?.disconnect()
          resolve(cls)
        }, ms)
      }),
    windowMs,
  )
}

test.describe('layout stability (Req 11.2, 11.3)', () => {
  test.use({ viewport: { width: 1280, height: 720 } })

  for (const route of KEY_ROUTES) {
    test(`${route} — page-level CLS over the load window stays within budget (Req 11.3)`, async ({
      page,
    }) => {
      await gotoSettled(page, route)
      const cls = await measurePageLoadCls(page)
      expect(
        cls,
        `page-level cumulative layout shift over the load window on ${route} was ${cls.toFixed(4)} ` +
          `— must be ≤ ${PAGE_CLS_BUDGET}`,
      ).toBeLessThanOrEqual(PAGE_CLS_BUDGET)
    })

    test(`${route} — static AmbientGlow causes no running layout shift (Req 11.2)`, async ({
      page,
    }) => {
      await gotoSettled(page, route)
      const cls = await measureRunningCls(page, CLS_OBSERVE_MS)
      expect(
        cls,
        `running cumulative layout shift during ${CLS_OBSERVE_MS}ms on a settled ${route} was ` +
          `${cls.toFixed(4)} — the static AmbientGlow must contribute 0 (Req 11.2)`,
      ).toBeLessThanOrEqual(CLS_EPSILON)
    })
  }
})
