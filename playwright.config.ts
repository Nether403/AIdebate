import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright configuration for the Showcase_Redesign rendered-criteria tests
 * (responsive / theme / accessibility / performance). These browser-level
 * checks are intentionally kept OUT of the node:test unit harness
 * (`tests/run-unit-tests.ts`) — they live under `e2e/` and run via
 * `npm run test:e2e` (`playwright test`).
 *
 * The webServer block boots the Next.js app once for the whole run. We build
 * then `next start` so the suite exercises the production render path (the
 * hero-budget / CLS / above-the-fold criteria are only meaningful on a
 * production build). Locally, an already-running server on the port is reused.
 */
const PORT = Number(process.env.PLAYWRIGHT_PORT ?? 3100)
const baseURL = `http://localhost:${PORT}`

export default defineConfig({
  testDir: './e2e',
  // Generous per-test timeout: first navigation may compile routes on demand.
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    // Build + start for a production render; override with PLAYWRIGHT_WEB_SERVER
    // (e.g. "npm run dev -- -p 3100") for a faster local dev-server loop.
    command:
      process.env.PLAYWRIGHT_WEB_SERVER ??
      `npm run build && npm run start -- -p ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
})
