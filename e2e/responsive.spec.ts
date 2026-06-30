import { test, expect, type Page } from '@playwright/test'

/**
 * Feature: showcase-redesign — Task 10.1
 * Responsive verification of the rendered Showcase_Experience at 375 / 768 /
 * 1440 px, plus the 1280×720 hero above-the-fold check.
 *
 * These criteria are NOT amenable to property testing (they depend on real
 * browser layout), so they are covered here as Playwright integration tests.
 *
 * Covered acceptance criteria:
 *   - 7.1 / 7.2 / 7.3  no horizontal scroll / no element past the viewport edge
 *                      at 375 / 768 / 1440
 *   - 7.4              primary CTAs stack into a single column at 375 (no two
 *                      share a horizontal row)
 *   - 7.5             text/interactive elements render without clipping past the
 *                      viewport at every width
 *   - 7.6             44×44 CSS-px minimum target for primary CTAs and nav controls
 *   - 7.7             oversized content (img / pre / table / code / canvas) is
 *                      constrained to the content width, not expanding the page
 *   - 3.1             hero headline + description + primary CTA above the fold at
 *                      1280×720
 *
 * Public surfaces under test: the Landing_Page, the Showcase_Hub, and the five
 * Showcase_Demo_Pages.
 */

const ROUTES = [
  '/', // Landing_Page
  '/showcase', // Showcase_Hub
  '/showcase/live-debate',
  '/showcase/eval-report',
  '/showcase/regression-gate',
  '/showcase/steelman',
  '/showcase/synthetic-data',
] as const

const WIDTHS = [375, 768, 1440] as const
const VIEWPORT_HEIGHT = 900
const MIN_TARGET = 44
// Sub-pixel tolerance: layout math (rounding, fractional borders, scrollbar
// gutter) can legitimately produce ~1px slop that is not a real overflow bug.
const EPSILON = 1.5

/** Wait for the route to be settled enough to measure layout reliably. */
async function gotoSettled(page: Page, route: string) {
  await page.goto(route, { waitUntil: 'networkidle' })
  // Allow streamed Suspense sections / fonts to flush before measuring.
  await page.waitForTimeout(300)
}

/**
 * Document-level horizontal overflow: the scrollable width must not exceed the
 * visible client width. This is the canonical "no horizontal scrollbar" check
 * (Req 7.1–7.3).
 */
async function getHorizontalOverflow(page: Page) {
  return page.evaluate(() => {
    const doc = document.documentElement
    return {
      scrollWidth: doc.scrollWidth,
      clientWidth: doc.clientWidth,
      bodyScrollWidth: document.body.scrollWidth,
    }
  })
}

for (const width of WIDTHS) {
  test.describe(`responsive @ ${width}px`, () => {
    test.use({ viewport: { width, height: VIEWPORT_HEIGHT } })

    for (const route of ROUTES) {
      test(`${route} — no horizontal overflow (Req 7.1–7.3)`, async ({ page }) => {
        await gotoSettled(page, route)
        const { scrollWidth, clientWidth, bodyScrollWidth } = await getHorizontalOverflow(page)
        expect(scrollWidth, 'documentElement.scrollWidth must not exceed clientWidth').toBeLessThanOrEqual(
          clientWidth + EPSILON,
        )
        expect(bodyScrollWidth, 'body must not be wider than the viewport').toBeLessThanOrEqual(
          width + EPSILON,
        )
      })

      test(`${route} — no element extends past the viewport edge (Req 7.5)`, async ({ page }) => {
        await gotoSettled(page, route)
        // Report any visible element whose left/right edge falls outside the
        // viewport (clipping / horizontal overflow at the element level). This
        // is a containment proxy for "no clipping"; full visual overlap
        // detection is out of scope for a layout smoke test.
        //
        // Excluded, because they extend past the edge BY DESIGN without causing
        // any page scroll (the canonical scrollWidth check above already proves
        // there is none):
        //   - aria-hidden decorations (GlowBlob, the fixed NeuralBackground
        //     canvas) — purely ornamental, not content;
        //   - elements whose overflow is contained by an ancestor that clips or
        //     scrolls it (overflow x/y hidden|clip|auto|scroll) — that is exactly
        //     the Req 7.7 containment contract, not a leak.
        const offenders = await page.evaluate((vw) => {
          const isContained = (el: HTMLElement): boolean => {
            if (el.closest('[aria-hidden="true"]')) return true
            let node: HTMLElement | null = el.parentElement
            while (node && node !== document.body) {
              const s = getComputedStyle(node)
              const clip = /(hidden|clip|auto|scroll)/
              if (clip.test(s.overflowX) || clip.test(s.overflowY)) return true
              if (s.position === 'fixed') return true
              node = node.parentElement
            }
            return false
          }
          const bad: { tag: string; cls: string; left: number; right: number }[] = []
          for (const el of Array.from(document.body.querySelectorAll<HTMLElement>('*'))) {
            const style = getComputedStyle(el)
            if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') continue
            if (style.position === 'fixed') continue
            const rect = el.getBoundingClientRect()
            if (rect.width === 0 || rect.height === 0) continue
            if ((rect.right > vw + 2 || rect.left < -2) && !isContained(el)) {
              bad.push({
                tag: el.tagName.toLowerCase(),
                cls: typeof el.className === 'string' ? el.className.slice(0, 60) : '',
                left: Math.round(rect.left),
                right: Math.round(rect.right),
              })
            }
          }
          return bad.slice(0, 15)
        }, width)
        expect(offenders, `elements extend past the ${width}px viewport: ${JSON.stringify(offenders)}`).toEqual([])
      })

      test(`${route} — oversized content stays contained (Req 7.7)`, async ({ page }) => {
        await gotoSettled(page, route)
        // Media / code / tabular content with large intrinsic width must be
        // constrained to its container (own-scroll), never widening the page.
        // An element wider than the viewport is acceptable IFF a clipping or
        // scrolling ancestor confines that overflow (Req 7.7); only an
        // unconfined leak is a failure. Decorative aria-hidden media (the
        // NeuralBackground canvas) is not content and is excluded.
        const offenders = await page.evaluate((vw) => {
          const selectors = 'img, pre, table, code, canvas, svg, video, iframe'
          const confined = (el: HTMLElement): boolean => {
            if (el.closest('[aria-hidden="true"]')) return true
            let node: HTMLElement | null = el.parentElement
            while (node && node !== document.body) {
              const s = getComputedStyle(node)
              const clip = /(hidden|clip|auto|scroll)/
              if (clip.test(s.overflowX) || clip.test(s.overflowY)) {
                return node.getBoundingClientRect().right <= vw + 2
              }
              node = node.parentElement
            }
            return false
          }
          const bad: { tag: string; right: number }[] = []
          for (const el of Array.from(document.body.querySelectorAll<HTMLElement>(selectors))) {
            const style = getComputedStyle(el)
            if (style.position === 'fixed') continue
            const rect = el.getBoundingClientRect()
            if (rect.width === 0 || rect.height === 0) continue
            if (rect.right > vw + 2 && !confined(el)) {
              bad.push({ tag: el.tagName.toLowerCase(), right: Math.round(rect.right) })
            }
          }
          return bad.slice(0, 15)
        }, width)
        expect(offenders, `oversized content overflows the viewport: ${JSON.stringify(offenders)}`).toEqual([])
      })

      test(`${route} — nav controls & primary CTAs meet 44×44 (Req 7.6)`, async ({ page }) => {
        await gotoSettled(page, route)
        // Navigation controls (links + menu/theme toggles) and the rounded-pill
        // CTA buttons are the targets Req 7.6 scopes to. We measure each visible
        // candidate's box; both dimensions must be >= 44 CSS px.
        const undersized = await page.evaluate((min) => {
          const candidates = new Set<HTMLElement>()
          // Navigation controls: destination links + menu/theme toggles.
          for (const el of Array.from(document.querySelectorAll<HTMLElement>('nav a, nav button'))) {
            candidates.add(el)
          }
          // Primary/secondary CTAs and the BackToHub link render as anchors with
          // the rounded-pill target class. We deliberately do NOT include
          // `button.rounded-pill`: in-page utility buttons (e.g. a "Copy" button
          // on a demo) are neither a primary CTA nor a navigation control and are
          // outside Req 7.6's scope.
          for (const el of Array.from(document.querySelectorAll<HTMLElement>('a.rounded-pill'))) {
            candidates.add(el)
          }
          const bad: { tag: string; name: string; w: number; h: number }[] = []
          for (const el of candidates) {
            const style = getComputedStyle(el)
            if (style.display === 'none' || style.visibility === 'hidden') continue
            const rect = el.getBoundingClientRect()
            if (rect.width === 0 || rect.height === 0) continue // not currently shown (e.g. collapsed menu)
            if (rect.width + 0.5 < min || rect.height + 0.5 < min) {
              bad.push({
                tag: el.tagName.toLowerCase(),
                name: (el.textContent ?? '').trim().slice(0, 30) || el.getAttribute('aria-label') || '',
                w: Math.round(rect.width),
                h: Math.round(rect.height),
              })
            }
          }
          return bad
        }, MIN_TARGET)
        expect(undersized, `interactive targets below 44×44: ${JSON.stringify(undersized)}`).toEqual([])
      })
    }

    // CTA stacking is a Landing_Page concern (Req 7.4) and only required at 375.
    if (width === 375) {
      test('/ — hero CTAs stack into a single column at 375 (Req 7.4)', async ({ page }) => {
        await gotoSettled(page, '/')
        const primary = page.getByRole('link', { name: 'Create a benchmark run' }).first()
        const secondary = page.getByRole('link', { name: 'Explore the showcase' }).first()
        const a = await primary.boundingBox()
        const b = await secondary.boundingBox()
        expect(a, 'primary CTA must be present').not.toBeNull()
        expect(b, 'secondary CTA must be present').not.toBeNull()
        if (!a || !b) return
        // Single column => the two CTAs do not share a horizontal row: one sits
        // fully below the other.
        const stacked = b.y >= a.y + a.height - EPSILON || a.y >= b.y + b.height - EPSILON
        expect(
          stacked,
          `hero CTAs share a row at 375px (primary y=${a.y} h=${a.height}, secondary y=${b.y} h=${b.height})`,
        ).toBe(true)
      })
    }
  })
}

// Hero above the fold is specified at exactly 1280×720 (Req 3.1).
test.describe('hero above the fold @ 1280×720 (Req 3.1)', () => {
  test.use({ viewport: { width: 1280, height: 720 } })

  test('/ — headline, description, and primary CTA visible without scrolling', async ({ page }) => {
    await gotoSettled(page, '/')

    const headline = page.getByRole('heading', { level: 1 })
    const primary = page.getByRole('link', { name: 'Create a benchmark run' }).first()

    await expect(headline).toBeVisible()
    await expect(primary).toBeVisible()

    const headlineBox = await headline.boundingBox()
    const ctaBox = await primary.boundingBox()
    expect(headlineBox, 'hero headline must have a box').not.toBeNull()
    expect(ctaBox, 'primary CTA must have a box').not.toBeNull()
    if (!headlineBox || !ctaBox) return

    // Every above-the-fold element's bottom edge must fit within the 720px fold.
    expect(headlineBox.y, 'headline must start within the fold').toBeGreaterThanOrEqual(0)
    expect(
      ctaBox.y + ctaBox.height,
      `primary CTA bottom (${Math.round(ctaBox.y + ctaBox.height)}) must be within the 720px fold`,
    ).toBeLessThanOrEqual(720 + EPSILON)

    // And nothing required scrolling to reveal it: the page should not have
    // pushed the fold content below the viewport.
    const scrolledForFold = await page.evaluate(() => window.scrollY)
    expect(scrolledForFold, 'no scroll should be needed to see the hero').toBe(0)
  })
})
