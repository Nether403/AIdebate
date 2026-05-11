export function formatDebateExport(debate: any, exportedAt = new Date()) {
  return {
    debate: {
      id: debate.id,
      status: debate.status,
      topic: {
        motion: debate.topic.motion,
        category: debate.topic.category,
        difficulty: debate.topic.difficulty,
      },
      participants: {
        pro: {
          model: {
            name: debate.proModel.name,
            provider: debate.proModel.provider,
            modelId: debate.proModel.modelId,
          },
          persona: debate.proPersona ? {
            name: debate.proPersona.name,
            description: debate.proPersona.description,
          } : null,
        },
        con: {
          model: {
            name: debate.conModel.name,
            provider: debate.conModel.provider,
            modelId: debate.conModel.modelId,
          },
          persona: debate.conPersona ? {
            name: debate.conPersona.name,
            description: debate.conPersona.description,
          } : null,
        },
      },
      configuration: {
        totalRounds: debate.totalRounds,
        factCheckMode: debate.factCheckMode,
        wordLimitPerTurn: debate.wordLimitPerTurn,
        judge: {
          provider: debate.judgeProvider,
          model: debate.judgeModel,
        },
        factChecker: {
          provider: debate.factCheckerProvider,
          model: debate.factCheckerModel,
        },
        promptVersion: debate.promptVersion,
        generationParams: debate.generationParams,
      },
      results: {
        winner: debate.winner,
        crowdWinner: debate.crowdWinner,
        aiJudgeWinner: debate.aiJudgeWinner,
        crowdVotes: {
          pro: debate.crowdVotesProCount,
          con: debate.crowdVotesConCount,
          tie: debate.crowdVotesTieCount,
        },
        errorState: debate.errorState,
      },
      timestamps: {
        created: debate.createdAt,
        started: debate.startedAt,
        completed: debate.completedAt,
      },
    },
    transcript: debate.turns.map((turn: any) => ({
      round: turn.roundNumber,
      side: turn.side,
      model: turn.model.name,
      content: {
        reflection: turn.reflection,
        critique: turn.critique,
        speech: turn.speech,
      },
      metadata: {
        wordCount: turn.wordCount,
        tokensUsed: turn.tokensUsed,
        latencyMs: turn.latencyMs,
        wasRejected: turn.wasRejected,
        retryCount: turn.retryCount,
      },
      factChecks: turn.factChecks.map((fc: any) => ({
        claim: fc.claim,
        verdict: fc.verdict,
        confidence: fc.confidence,
        sources: fc.sources,
        reasoning: fc.reasoning,
      })),
      timestamp: turn.createdAt,
    })),
    evaluations: debate.evaluations.map((evaluation: any) => ({
      judgeProvider: evaluation.judgeProvider,
      judgeModel: evaluation.judgeModel,
      evaluationOrder: evaluation.evaluationOrder,
      winner: evaluation.winner,
      scores: {
        pro: evaluation.proScore,
        con: evaluation.conScore,
      },
      rubricScores: evaluation.rubricScores,
      reasoning: evaluation.reasoning,
      positionBiasDetected: evaluation.positionBiasDetected,
      parseStatus: evaluation.parseStatus,
      rawResponse: evaluation.rawResponse,
      errorMessage: evaluation.errorMessage,
      promptVersion: evaluation.promptVersion,
      schemaVersion: evaluation.schemaVersion,
      consensus: evaluation.consensus,
      tiebreakerUsed: evaluation.tiebreakerUsed,
      timestamp: evaluation.createdAt,
    })),
    exportMetadata: {
      exportedAt: exportedAt.toISOString(),
      version: '1.0',
      format: 'json',
    },
  }
}
