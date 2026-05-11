export function summarizeBenchmarkStatuses(statuses: string[]) {
  const completedDebates = statuses.filter(status => status === 'completed').length
  const failedDebates = statuses.filter(status => status === 'failed').length
  const evaluationFailedDebates = statuses.filter(status => status === 'evaluation_failed').length
  const status = failedDebates > 0 ? 'failed' : 'completed'

  return {
    status,
    completedDebates,
    failedDebates,
    evaluationFailedDebates,
  } as const
}
