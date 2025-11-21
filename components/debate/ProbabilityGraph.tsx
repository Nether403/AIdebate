'use client'

import { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { DebateTurn, Model } from '@/types'

interface ProbabilityGraphProps {
  turns: DebateTurn[]
  proModel: Model
  conModel: Model
  currentOdds?: {
    pro: number
    con: number
    tie: number
  }
}

export function ProbabilityGraph({ turns, proModel, conModel, currentOdds }: ProbabilityGraphProps) {
  // Calculate probability evolution based on turns
  const probabilityData = useMemo(() => {
    const data: Array<{
      turn: number
      pro: number
      con: number
      tie: number
      label: string
    }> = []

    // Initial state (50-50)
    data.push({
      turn: 0,
      pro: 50,
      con: 50,
      tie: 0,
      label: 'Start',
    })

    // Simple heuristic: adjust probabilities based on fact-checks and word count
    let proProbability = 50
    let conProbability = 50

    turns.forEach((turn, index) => {
      // Adjust based on fact-check results
      const factCheckScore = turn.factChecksPassed - turn.factChecksFailed
      const adjustment = factCheckScore * 2 // Each fact check worth 2%

      if (turn.side === 'pro') {
        proProbability = Math.min(95, Math.max(5, proProbability + adjustment))
        conProbability = 100 - proProbability
      } else {
        conProbability = Math.min(95, Math.max(5, conProbability + adjustment))
        proProbability = 100 - conProbability
      }

      // Penalize rejections
      if (turn.wasRejected) {
        if (turn.side === 'pro') {
          proProbability = Math.max(5, proProbability - 10)
        } else {
          conProbability = Math.max(5, conProbability - 10)
        }
        proProbability = Math.min(95, proProbability)
        conProbability = Math.min(95, conProbability)
      }

      // Normalize to ensure they sum to 100
      const total = proProbability + conProbability
      proProbability = (proProbability / total) * 100
      conProbability = (conProbability / total) * 100

      data.push({
        turn: index + 1,
        pro: Math.round(proProbability * 10) / 10,
        con: Math.round(conProbability * 10) / 10,
        tie: 0,
        label: `R${turn.roundNumber} ${turn.side.toUpperCase()}`,
      })
    })

    // If we have current odds from prediction market, use those for the latest point
    if (currentOdds && data.length > 0) {
      data[data.length - 1] = {
        ...data[data.length - 1],
        pro: Math.round(currentOdds.pro * 10) / 10,
        con: Math.round(currentOdds.con * 10) / 10,
        tie: Math.round(currentOdds.tie * 10) / 10,
      }
    }

    return data
  }, [turns, currentOdds])

  const latestData = probabilityData[probabilityData.length - 1]

  return (
    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white">Live Probability</h3>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-slate-300">Pro: {latestData.pro}%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-slate-300">Con: {latestData.con}%</span>
          </div>
        </div>
      </div>

      {/* Current Odds Display */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
          <p className="text-sm text-blue-400 mb-1">Pro Position</p>
          <p className="text-2xl font-bold text-white">{latestData.pro}%</p>
          <p className="text-xs text-slate-400 mt-1">{proModel.name}</p>
        </div>
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <p className="text-sm text-red-400 mb-1">Con Position</p>
          <p className="text-2xl font-bold text-white">{latestData.con}%</p>
          <p className="text-xs text-slate-400 mt-1">{conModel.name}</p>
        </div>
      </div>

      {/* Probability Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={probabilityData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis
              dataKey="label"
              stroke="#94a3b8"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              stroke="#94a3b8"
              style={{ fontSize: '12px' }}
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '8px',
                color: '#fff',
              }}
              formatter={(value: number) => `${value}%`}
            />
            <Legend
              wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }}
            />
            <Line
              type="monotone"
              dataKey="pro"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: '#3b82f6', r: 4 }}
              activeDot={{ r: 6 }}
              name="Pro"
            />
            <Line
              type="monotone"
              dataKey="con"
              stroke="#ef4444"
              strokeWidth={2}
              dot={{ fill: '#ef4444', r: 4 }}
              activeDot={{ r: 6 }}
              name="Con"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Prediction Market Info */}
      {currentOdds && (
        <div className="mt-4 p-3 bg-slate-700/50 rounded-lg">
          <p className="text-xs text-slate-400 text-center">
            📊 Current odds based on {turns.length} turns and fact-check results
          </p>
        </div>
      )}
    </div>
  )
}
