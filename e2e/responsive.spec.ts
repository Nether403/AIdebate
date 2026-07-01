import { test, expect, type Page } from '@playwright/test'

/**
 * Feature: app-redesign — Task 12.3
 * Responsive verification of the redesigned App_Shell and its key research
 * screens at 375 / 768 / 1440 px, plus the sidebar disclosure behavior either
 * side of the 1024 px breakpoint.
 *
 * These criteria depend on real browser layout and are not amenable to property
 * testing, so they are covered here as Playwright integration tests.
 *
 * Covered acceptance criteria (app-redesign requirements.md, Requirement 10):
 *   - 10.1  Below 1024px the App_Sidebar is hidden off-canvas, a sidebar-
 *           disclosure toggle is rendered in the App_TopBar, and the main column
 *           is full width.
 *   - 10.2  At/above 1024px the App_Sidebar is a persistent column and the
 *           disclosure toggle is NOT rendered.
 *   - 10.3  At 375, 768, and 1440 px the Application renders without horizontal
 *           page scrolling.
 *   - 10.4  Below 1024px a data table wider than the content column is rendered
 *           inside a horizontally scrollable wrapper — only the table scrolls,
 *           not the page (covered by the containment check below).
 *   - 10.5  Activating the disclosure toggle opens the drawer and moves focus
 *           into it.
 *   - 10.6  Dismissing the drawer closes it and returns focus to the toggle.
 *
 * Key screens under test: the landing page, the showcase hub, the canonical
 * eval-report screen, and the system-health screen (a wide-table surface).
 */

const ROUTES = [
  '/', // landing
  '/showcase', // showcase hub
  '/showcase/eval-report', // canonical eval-report
  '/health', // system health (wide status table)
] as const

const WIDTHS = [375, 768, 1440] as const
const VIEWPORT_HEIGHT = 900
const MIN_TARGET = 44
// Sub-pixel tolerance: layout math (rounding, fractional borders, scrollbar
// gutter) can legitimately produce ~1px slop that is not a real overflow bug.
const EPSILON = 1.5
// The App_Shell switches between the off-canvas drawer and the persistent
// sidebar column at 1024px (Tailwind `lg`).
const SIDEBAR_BREAKPOINT = 1024

/** Wait for the route to be settled enough to measure layout reliably. */
async function gotoSettled(page: Page, route: string) {
  await page.goto(route, { waitUntil: 'networkidle' })
  // Allow streamed Suspense sections / fonts to flush before measuring.
  await page.waitForTimeout(300)
}

/**
 * Document-level horizontal overflow: the scrollable width must not exceed the
 * visible client width. This is the canonical "no horizontal scrollbar" check
 * (Req 10.3).
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
      test(`${route} — no horizontal page scrolling (Req 10.3)`, async ({ page }) => {
        await gotoSettled(page, route)
        const { scrollWidth, clientWidth, bodyScrollWidth } = await getHorizontalOverflow(page)
        expect(scrollWidth, 'documentElement.scrollWidth must not exceed clientWidth').toBeLessThanOrEqual(
          clientWidth + EPSILON,
        )
        expect(bodyScrollWidth, 'body must not be wider than the viewport').toBeLessThanOrEqual(
          width + EPSILON,
        )
      })

      test(`${route} — no element extends past the viewport edge`, async ({ page }) => {
        await gotoSettled(page, route)
        // Report any visible element whose left/right edge falls outside the
        // viewport (clipping / horizontal overflow at the element level).
        //
        // Excluded, because they extend past the edge BY DESIGN without causing
        // any page scroll (the scrollWidth check above already proves there is
        // none):
        //   - aria-hidden decorations (the fixed AmbientGlow layer) — purely
        //     ornamental, not content;
        //   - elements whose overflow is contained by an ancestor that clips or
        //     scrolls it (overflow x/y hidden|clip|auto|scroll) — that is exactly
        //     the Req 10.4 containment contract, not a leak;
        //   - fixed-position layers (pinned to the viewport, out of flow).
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

      test(`${route} — oversized content (incl. wide tables) stays contained (Req 10.4)`, async ({
        page,
      }) => {
        await gotoSettled(page, route)
        // Media / code / tabular content with large intrinsic width must be
        // constrained to its container (own-scroll), never widening the page.
        // An element wider than the viewport is acceptable IFF a clipping or
        // scrolling ancestor confines that overflow (Req 10.4); only an
        // unconfined leak is a failure. Decorative aria-hidden media is excluded.
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

      test(`${route} — nav controls & primary CTAs meet 44×44 (Req 9.3)`, async ({ page }) => {
        await gotoSettled(page, route)
        // Req 9.3 scopes the 44×44 floor to the primary navigation controls: the
        // App_Sidebar destination links, the sidebar mobile-disclosure control,
        // the theme toggle, and the primary action / hero CTAs. The App_TopBar
        // breadcrumb is wayfinding rendered as INLINE text links, which the
        // target-size guidance exempts (a link constrained by its line-height in
        // a sentence/trail) and which the shell builds as inline text by
        // construction — so the breadcrumb nav is deliberately not in this set.
        const undersized = await page.evaluate((min) => {
          const candidates = new Set<HTMLElement>()
          // Primary sidebar destination links (the persistent nav).
          for (const el of Array.from(document.querySelectorAll<HTMLElement>('nav[aria-label="Primary"] a'))) {
            candidates.add(el)
          }
          // App_TopBar controls: the disclosure toggle and the theme toggle (header buttons).
          for (const el of Array.from(document.querySelectorAll<HTMLElement>('header button'))) {
            candidates.add(el)
          }
          // Hero CTAs: the primary and secondary calls-to-action by accessible name.
          for (const el of Array.from(document.querySelectorAll<HTMLElement>('a'))) {
            const label = (el.textContent ?? '').trim()
            if (/Create a benchmark run|Explore the showcase/.test(label)) candidates.add(el)
          }
          const bad: { tag: string; name: string; w: number; h: number }[] = []
          for (const el of candidates) {
            const style = getComputedStyle(el)
            if (style.display === 'none' || style.visibility === 'hidden') continue
            const rect = el.getBoundingClientRect()
            if (rect.width === 0 || rect.height === 0) continue // not currently shown (e.g. collapsed sidebar)
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
  })
}

// --- Sidebar disclosure behavior either side of the 1024px breakpoint -------

test.describe('App_Shell sidebar @ below 1024px (Req 10.1, 10.5, 10.6)', () => {
  test.use({ viewport: { width: 768, height: VIEWPORT_HEIGHT } })

  test('/ — sidebar is off-canvas and a disclosure toggle is shown; toggle opens the drawer and moves focus in, dismiss returns focus', async ({
    page,
  }) => {
    await gotoSettled(page, '/')

    // 10.1 — the persistent sidebar nav is hidden (its wrapper is `hidden lg:block`).
    const primaryNav = page.locator('nav[aria-label="Primary"]')
    // The disclosure toggle lives in the top bar below lg.
    const toggle = page.getByRole('button', { name: 'Open navigation' })
    await expect(toggle, 'disclosure toggle must be rendered below 1024px (Req 10.1)').toBeVisible()
    // No persistent sidebar column is visible at this width.
    expect(
      await primaryNav.first().isVisible().catch(() => false),
      'persistent App_Sidebar must be hidden off-canvas below 1024px (Req 10.1)',
    ).toBe(false)

    // 10.5 — activating the toggle opens the drawer and moves focus into it.
    await toggle.click()
    const drawer = page.locator('#app-sidebar-drawer')
    await expect(drawer, 'disclosure toggle must open the sidebar drawer (Req 10.5)').toBeVisible()
    const focusInDrawer = await page.evaluate(() => {
      const drawerEl = document.getElementById('app-sidebar-drawer')
      const active = document.activeElement
      return !!drawerEl && !!active && (drawerEl === active || drawerEl.contains(active))
    })
    expect(focusInDrawer, 'opening the drawer must move focus into it (Req 10.5)').toBe(true)

    // 10.6 — dismissing (Escape) closes the drawer and returns focus to the toggle.
    await page.keyboard.press('Escape')
    await expect(drawer, 'dismiss must close the drawer (Req 10.6)').toBeHidden()
    await expect(toggle, 'dismiss must return focus to the disclosure toggle (Req 10.6)').toBeFocused()
  })
})

test.describe('App_Shell sidebar @ at/above 1024px (Req 10.2)', () => {
  test.use({ viewport: { width: SIDEBAR_BREAKPOINT, height: VIEWPORT_HEIGHT } })

  test('/ — sidebar is a persistent column and no disclosure toggle is rendered', async ({ page }) => {
    await gotoSettled(page, '/')

    await expect(
      page.locator('nav[aria-label="Primary"]').first(),
      'App_Sidebar must render as a persistent column at/above 1024px (Req 10.2)',
    ).toBeVisible()
    // The toggle carries `lg:hidden`, so at/above 1024px it is not rendered to
    // the user (display:none → out of the a11y tree). Assert it is not visible.
    await expect(
      page.locator('header button[aria-label="Open navigation"]'),
      'the disclosure toggle must NOT be rendered at/above 1024px (Req 10.2)',
    ).toBeHidden()
  })
})
