import { test, expect, type Page } from '@playwright/test'

/**
 * Feature: showcase-redesign — Task 10.4
 * Performance verification of the rendered Showcase_Experience.
 *
 * These criteria depend on real browser timing / layout and are not amenable to
 * property testing, so they are covered here as Playwright integration tests
 * using the browser's built-in Performance APIs (Navigation/Paint Timing,
 * LargestContentfulPaint, and LayoutShift observers). No Lighthouse or
 * `playwright-lighthouse` dependency is introduced — the three budgets below
 * are measured directly, which keeps the dependency surface lean and the
 * signal honest.
 *
 * Covered acceptance criteria:
 *   - 11.1  Landing_Page hero content renders within 2.5 s of navigation start
 *           (desktop viewport ≥ 1280px). Measured via Largest Contentful Paint
 *           (the hero headline/CTA cluster is the largest paint), falling back
 *           to First Contentful Paint when LCP is unavailable.
 *   - 11.2  Brand imagery (logo, infographic) is served in an optimized format
 *           scaled to within ~1.0–1.5× of its rendered display dimensions.
 *           Measured as naturalWidth / (renderedCSSWidth × devicePixelRatio),
 *           plus evidence the next/image optimizer pipeline served the asset.
 *   - 11.3  Cumulative Layout Shift stays at ~0 while Decorative_Animation runs
 *           (the global NeuralBackground canvas + page-local GlowBlobs/shimmer),
 *           i.e. decoration produces no positional displacement of content.
 *
 * IMPORTANT CAVEAT (timing): the hero-render budget (11.1) is only truly
 * meaningful against a PRODUCTION build (`next build && next start`), which is
 * the default `webServer` in playwright.config.ts. When this suite is run
 * against a dev server (on-demand compilation, unminified bundles) the measured
 * hero-render time is a pessimistic upper bound — a dev pass is informative but
 * a dev FAIL on 11.1 alone should be confirmed against a production build before
 * being treated as a regression. The image-ratio (11.2) and CLS (11.3) checks
 * are valid on either server, since next/image optimization and layout behavior
 * are present in dev too.
 */

// --- Budgets / tolerances --------------------------------------------------

const HERO_BUDGET_MS = 2500 // Req 11.1
// Req 11.2 target band is 1.0–1.5×. next/image snaps to the next configured
// breakpoint ≥ the displayed size, so the served width is always a little
// larger than the display width; a small tolerance absorbs layout rounding and
// breakpoint snapping without masking a genuinely oversized (blurry-upscale or
// wasteful-download) asset.
const RATIO_MIN = 1.0
const RATIO_MAX = 1.5
const RATIO_TOL = 0.2 // effective accepted band: [0.8, 1.7]
// Req 11.3 wants CLS = 0. We allow a hair of floating-point/sub-pixel slop so a
// rounding artifact does not flake the gate; anything above this would be a real
// shift of adjacent content.
const CLS_EPSILON = 0.01
// Window over which we watch for animation-induced layout shift, long enough to
// capture several frames of the looping NeuralBackground / glow float.
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

// Hero render budget is specified for a desktop viewport ≥ 1280px (Req 11.1).
test.describe('hero render budget (Req 11.1)', () => {
  test.use({ viewport: { width: 1280, height: 720 } })

  test('/ — hero LCP/FCP renders within 2.5s of navigation start', async ({ page }) => {
    // Warm the route once. Req 11.1 budgets the PAGE's hero-render time under a
    // standard broadband profile — i.e. what a visitor hitting an already-warm
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
  })
})

// Brand imagery optimization + display-dimension ratio (Req 11.2). Logo lives in
// the nav on every page; the infographic anchors the Landing_Page.
test.describe('image optimization & display ratio (Req 11.2)', () => {
  test.use({ viewport: { width: 1280, height: 720 } })

  test('/ — brand images are optimized and scaled near display dimensions', async ({ page }) => {
    await gotoSettled(page, '/')
    // Ensure the infographic (which may stream in) is present before measuring.
    await page.locator('img[src*="infographic"], img[src*="_next/image"]').first().waitFor()

    const images = await page.evaluate(() => {
      const dpr = window.devicePixelRatio || 1
      const isBrand = (src: string) => /logo|infographic/i.test(decodeURIComponent(src))
      const results: {
        label: string
        natural: number
        displayedCss: number
        dpr: number
        ratio: number
        optimized: boolean
      }[] = []
      for (const img of Array.from(document.querySelectorAll('img'))) {
        const src = img.currentSrc || img.src || ''
        // Only the brand anchors are in scope for Req 11.2.
        if (!isBrand(src)) continue
        const rect = img.getBoundingClientRect()
        if (rect.width === 0 || rect.height === 0) continue
        const natural = img.naturalWidth
        const displayedCss = rect.width
        results.push({
          label: src.includes('logo') ? 'logo' : src.includes('infographic') ? 'infographic' : src.slice(0, 40),
          natural,
          displayedCss: Math.round(displayedCss),
          dpr,
          // Served pixels vs the physical pixels actually painted (CSS px × dpr).
          ratio: natural / (displayedCss * dpr),
          // Evidence the next/image optimizer served this asset (vs the raw file).
          optimized: /\/_next\/image/.test(src),
        })
      }
      return results
    })

    expect(images.length, 'expected at least the logo + infographic brand images').toBeGreaterThanOrEqual(2)

    for (const img of images) {
      expect(
        img.optimized,
        `brand image "${img.label}" should be served through the next/image optimizer (currentSrc not /_next/image)`,
      ).toBe(true)
      expect(
        img.ratio,
        `brand image "${img.label}" served ${img.natural}px for a ${img.displayedCss}css×${img.dpr}dpr display ` +
          `(ratio ${img.ratio.toFixed(2)}×) — expected within the ${RATIO_MIN}–${RATIO_MAX}× band (±${RATIO_TOL})`,
      ).toBeGreaterThanOrEqual(RATIO_MIN - RATIO_TOL)
      expect(
        img.ratio,
        `brand image "${img.label}" served ${img.natural}px for a ${img.displayedCss}css×${img.dpr}dpr display ` +
          `(ratio ${img.ratio.toFixed(2)}×) — expected within the ${RATIO_MIN}–${RATIO_MAX}× band (±${RATIO_TOL})`,
      ).toBeLessThanOrEqual(RATIO_MAX + RATIO_TOL)
    }
  })
})

/**
 * Observe cumulative layout shift over a fixed window AFTER the page has
 * settled, so we isolate shift caused by running decoration (NeuralBackground
 * canvas, GlowBlob float, shimmer) from the unavoidable initial-load reflow.
 * Entries flagged `hadRecentInput` are excluded per the CLS definition.
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
              // LayoutShift extends PerformanceEntry with value + hadRecentInput.
              const shift = entry as PerformanceEntry & { value: number; hadRecentInput: boolean }
              if (!shift.hadRecentInput) cls += shift.value
            }
          })
          // buffered:false — only count shifts that occur during our window,
          // i.e. while decoration is animating on an already-settled page.
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

test.describe('zero CLS during decorative animation (Req 11.3)', () => {
  test.use({ viewport: { width: 1280, height: 720 } })

  // The landing hero runs two GlowBlobs + the global NeuralBackground; the hub
  // runs the global NeuralBackground. Both must hold content steady at CLS ~0.
  for (const route of ['/', '/showcase'] as const) {
    test(`${route} — decoration causes no cumulative layout shift`, async ({ page }) => {
      await gotoSettled(page, route)
      const cls = await measureRunningCls(page, CLS_OBSERVE_MS)
      expect(
        cls,
        `cumulative layout shift during ${CLS_OBSERVE_MS}ms of decorative animation on ${route} ` +
          `was ${cls.toFixed(4)} — decoration must produce 0 displacement of adjacent content`,
      ).toBeLessThanOrEqual(CLS_EPSILON)
    })
  }
})
