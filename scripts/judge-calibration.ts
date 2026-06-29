import 'dotenv/config'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { db } from '@/lib/db/client'
import { debates } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { computeCalibration, type GoldLabel, type JudgedResult, type Winner } from '@/lib/benchmark/calibration'

function getArg(name: string): string | null {
  const i = process.argv.findIndex(a => a === name)
  return i >= 0 ? process.argv[i + 1] || null : null
}

/**
 * Compare a benchmark run's persisted judge verdicts against a gold-standard
 * label file (no LLM calls). Reports agreement rate + confusion matrix.
 *
 * Usage: npm run judge:calibrate -- --run <benchmarkRunId> --gold configs/gold-set.example.json
 */
async function main() {
  const runId = getArg('--run')
  const goldPath = getArg('--gold')
  if (!runId || !goldPath) {
    console.error('Usage: --run <benchmarkRunId> --gold <gold-set.json>')
    process.exit(1)
  }

  const gold = JSON.parse(await readFile(resolve(process.cwd(), goldPath), 'utf8')) as GoldLabel[]

  const rows = await db.query.debates.findMany({
    where: eq(debates.benchmarkRunId, runId),
    with: { topic: true },
  })
  const judged: JudgedResult[] = rows.map(d => ({
    debateId: d.id,
    topicMotion: d.topic?.motion,
    judgeWinner: (d.aiJudgeWinner as Winner | null) ?? null,
  }))

  const summary = computeCalibration(judged, gold)

  console.log('=== JUDGE CALIBRATION (vs gold set) ===')
  console.log(`run=${runId} | gold labels=${summary.goldCount} | matched=${summary.matched} | unmatched=${summary.unmatched}`)
  console.log(`agreement: ${summary.agreements}/${summary.matched} = ${(summary.agreementRate * 100).toFixed(1)}%`)
  console.log('confusion (gold -> judge):')
  for (const [g, row] of Object.entries(summary.confusion)) {
    console.log(`  ${g}: ${Object.entries(row).map(([j, c]) => `${j}=${c}`).join(' ')}`)
  }
  if (summary.disagreements.length) {
    console.log('disagreements:')
    for (const d of summary.disagreements) {
      console.log(`  ${d.debateId.slice(0, 8)} "${(d.topicMotion || '').slice(0, 40)}" gold=${d.gold} judge=${d.judge}`)
    }
  }
  process.exit(0)
}

main().catch(error => {
  console.error('[Calibration] Failed:', error instanceof Error ? error.message : error)
  process.exit(1)
})
