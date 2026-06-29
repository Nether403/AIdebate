/**
 * models:validate — maintenance CLI to detect model-slug drift.
 *
 * OpenRouter (and the providers behind it) deprecate and rename model slugs
 * fairly often. A stale slug only surfaces at debate time as a 404, which then
 * shows up as a confusing `evaluation_failed` or a failed turn. This script
 * cross-checks every slug the app can dispatch to OpenRouter against the live
 * OpenRouter catalogue so drift is caught proactively (e.g. in CI or before a
 * benchmark run) instead of mid-run.
 *
 * Checks:
 *   - DEBATER_MODELS ids (these are OpenRouter slugs)
 *   - INFRASTRUCTURE_MODELS fallbackModel slugs (OpenRouter fallback path)
 *
 * Exit code is non-zero when any slug is stale so it can gate CI. When
 * OPENROUTER_API_KEY is absent the check is skipped (exit 0) rather than failing
 * a key-less environment.
 *
 * Usage: npm run models:validate
 */
import { DEBATER_MODELS, INFRASTRUCTURE_MODELS } from '@/lib/llm/model-config'

interface OpenRouterModel {
  id: string
}

async function fetchLiveSlugs(apiKey: string): Promise<Set<string>> {
  const res = await fetch('https://openrouter.ai/api/v1/models', {
    headers: { Authorization: `Bearer ${apiKey}` },
  })
  if (!res.ok) {
    throw new Error(`OpenRouter /models returned ${res.status} ${res.statusText}`)
  }
  const body = (await res.json()) as { data?: OpenRouterModel[] }
  return new Set((body.data ?? []).map((m) => m.id))
}

/** Collect the distinct OpenRouter slugs the app may dispatch, with a label. */
function collectSlugs(): Array<{ slug: string; label: string }> {
  const entries: Array<{ slug: string; label: string }> = []
  for (const m of DEBATER_MODELS) {
    entries.push({ slug: m.id, label: `debater: ${m.name}` })
  }
  for (const assignment of Object.values(INFRASTRUCTURE_MODELS)) {
    if (assignment.fallbackModel && assignment.fallbackProvider === 'openrouter') {
      entries.push({ slug: assignment.fallbackModel, label: `${assignment.role} OpenRouter fallback` })
    }
  }
  return entries
}

async function main() {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim()
  if (!apiKey) {
    console.log('[models:validate] OPENROUTER_API_KEY not set — skipping live slug check.')
    process.exit(0)
  }

  const live = await fetchLiveSlugs(apiKey)
  const slugs = collectSlugs()
  const stale: Array<{ slug: string; label: string }> = []

  console.log(`[models:validate] Checking ${slugs.length} slug(s) against ${live.size} live OpenRouter models\n`)
  for (const { slug, label } of slugs) {
    const ok = live.has(slug)
    if (!ok) stale.push({ slug, label })
    console.log(`  ${ok ? 'OK  ' : 'STALE'} ${slug.padEnd(48)} ${label}`)
  }

  if (stale.length > 0) {
    console.error(`\n[models:validate] ${stale.length} stale slug(s) found:`)
    for (const { slug, label } of stale) {
      console.error(`  - ${slug} (${label})`)
    }
    console.error('\nUpdate lib/llm/model-config.ts with current OpenRouter slugs.')
    process.exit(1)
  }

  console.log('\n[models:validate] All slugs are live. ✓')
  process.exit(0)
}

main().catch((err) => {
  console.error('[models:validate] Failed:', err?.message ?? err)
  process.exit(1)
})
