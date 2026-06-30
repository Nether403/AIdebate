import { test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test('diag live-debate contrast', async ({ page }) => {
  await page.goto('/showcase/live-debate', { waitUntil: 'networkidle' })
  await page.waitForTimeout(400)
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()
  for (const v of results.violations) {
    for (const n of v.nodes) {
      console.log('VIOLATION', v.id, '|', n.target.join(' '))
      console.log('  ', n.failureSummary?.replace(/\n/g, ' '))
      // axe attaches color data in any[] node.any data
      for (const a of n.any) {
        console.log('   DATA', a.id, JSON.stringify(a.data))
      }
    }
  }
})
