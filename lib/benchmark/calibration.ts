/**
 * Judge calibration against a gold-standard label set — without re-running the
 * judge. Compares already-persisted judge winners (e.g. a benchmark run's
 * debate verdicts) to human/expert gold labels, producing an agreement rate and
 * a confusion matrix. Pure: no DB/LLM. (For live re-evaluation against gold
 * debates, see lib/agents/judge-calibration.ts.)
 */

export type Winner = 'pro' | 'con' | 'tie'

export interface GoldLabel {
  debateId?: string
  topicMotion?: string
  winner: Winner
  note?: string
}

export interface JudgedResult {
  debateId: string
  topicMotion?: string
  judgeWinner: Winner | null
}

export interface CalibrationSummary {
  goldCount: number
  matched: number
  unmatched: number
  agreements: number
  agreementRate: number // agreements / matched (0 when nothing matched)
  /** gold winner -> judge winner ('none' when unjudged) -> count */
  confusion: Record<string, Record<string, number>>
  disagreements: Array<{ debateId: string; topicMotion?: string; gold: Winner; judge: Winner | null }>
}

function normalizeMotion(motion?: string): string {
  return (motion ?? '').trim().toLowerCase()
}

/**
 * Compute calibration of judged results against gold labels.
 * Gold labels are matched to judged results by `debateId` first, then by
 * normalized `topicMotion`.
 */
export function computeCalibration(judged: JudgedResult[], gold: GoldLabel[]): CalibrationSummary {
  const byId = new Map<string, JudgedResult>()
  const byMotion = new Map<string, JudgedResult>()
  for (const j of judged) {
    byId.set(j.debateId, j)
    const m = normalizeMotion(j.topicMotion)
    if (m) byMotion.set(m, j)
  }

  const confusion: Record<string, Record<string, number>> = {}
  const disagreements: CalibrationSummary['disagreements'] = []
  let matched = 0
  let agreements = 0

  for (const g of gold) {
    const match = (g.debateId && byId.get(g.debateId)) || (g.topicMotion ? byMotion.get(normalizeMotion(g.topicMotion)) : undefined)
    if (!match) continue

    matched += 1
    const judgeKey = match.judgeWinner ?? 'none'
    confusion[g.winner] = confusion[g.winner] ?? {}
    confusion[g.winner][judgeKey] = (confusion[g.winner][judgeKey] ?? 0) + 1

    if (match.judgeWinner === g.winner) {
      agreements += 1
    } else {
      disagreements.push({ debateId: match.debateId, topicMotion: match.topicMotion, gold: g.winner, judge: match.judgeWinner })
    }
  }

  return {
    goldCount: gold.length,
    matched,
    unmatched: gold.length - matched,
    agreements,
    agreementRate: matched > 0 ? agreements / matched : 0,
    confusion,
    disagreements,
  }
}
