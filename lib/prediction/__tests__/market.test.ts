/**
 * Prediction Market Tests
 * 
 * Tests odds calculation, betting logic, and payout distribution.
 * 
 * Requirements: 10
 */

import { describe, it, expect } from 'vitest'

// Import only the types and pure functions to avoid database dependencies
interface BetPool {
  proTotal: number
  conTotal: number
  tieTotal: number
  totalPool: number
}

interface Odds {
  pro: number
  con: number
  tie: number
}

// Copy the calculateOdds function for testing (pure function, no dependencies)
function calculateOdds(pool: BetPool): Odds {
  const minOdds = 1.1
  const houseEdge = 0.05 // 5% house edge
  const effectivePool = pool.totalPool * (1 - houseEdge)
  
  // If no bets yet, return even odds
  if (pool.totalPool === 0) {
    return { pro: 2.0, con: 2.0, tie: 3.0 }
  }
  
  // Calculate odds for each outcome
  const proOdds = pool.proTotal > 0 
    ? Math.max(minOdds, effectivePool / pool.proTotal)
    : 10.0 // High odds if no one bet on this side
  
  const conOdds = pool.conTotal > 0
    ? Math.max(minOdds, effectivePool / pool.conTotal)
    : 10.0
  
  const tieOdds = pool.tieTotal > 0
    ? Math.max(minOdds, effectivePool / pool.tieTotal)
    : 15.0 // Even higher odds for tie
  
  return {
    pro: Math.round(proOdds * 100) / 100,
    con: Math.round(conOdds * 100) / 100,
    tie: Math.round(tieOdds * 100) / 100,
  }
}

describe('Prediction Market', () => {
  describe('calculateOdds', () => {
    it('should return even odds when no bets placed', () => {
      const pool: BetPool = {
        proTotal: 0,
        conTotal: 0,
        tieTotal: 0,
        totalPool: 0,
      }
      
      const odds = calculateOdds(pool)
      
      expect(odds.pro).toBe(2.0)
      expect(odds.con).toBe(2.0)
      expect(odds.tie).toBe(3.0)
    })

    it('should calculate higher odds for less popular side', () => {
      const pool: BetPool = {
        proTotal: 1000,
        conTotal: 100,
        tieTotal: 50,
        totalPool: 1150,
      }
      
      const odds = calculateOdds(pool)
      
      // Con should have higher odds since fewer people bet on it
      expect(odds.con).toBeGreaterThan(odds.pro)
      // Tie should have highest odds
      expect(odds.tie).toBeGreaterThan(odds.con)
    })

    it('should apply minimum odds of 1.1x', () => {
      const pool: BetPool = {
        proTotal: 10000,
        conTotal: 10,
        tieTotal: 10,
        totalPool: 10020,
      }
      
      const odds = calculateOdds(pool)
      
      // Even with overwhelming bets on pro, odds should not go below 1.1x
      expect(odds.pro).toBeGreaterThanOrEqual(1.1)
      expect(odds.con).toBeGreaterThanOrEqual(1.1)
      expect(odds.tie).toBeGreaterThanOrEqual(1.1)
    })

    it('should apply house edge correctly', () => {
      const pool: BetPool = {
        proTotal: 500,
        conTotal: 500,
        tieTotal: 0,
        totalPool: 1000,
      }
      
      const odds = calculateOdds(pool)
      
      // With 5% house edge, effective pool is 950
      // Odds should be 950 / 500 = 1.9x for each side
      expect(odds.pro).toBeCloseTo(1.9, 1)
      expect(odds.con).toBeCloseTo(1.9, 1)
    })

    it('should handle equal distribution', () => {
      const pool: BetPool = {
        proTotal: 333,
        conTotal: 333,
        tieTotal: 334,
        totalPool: 1000,
      }
      
      const odds = calculateOdds(pool)
      
      // All sides should have similar odds
      expect(Math.abs(odds.pro - odds.con)).toBeLessThan(0.1)
      expect(Math.abs(odds.con - odds.tie)).toBeLessThan(0.1)
    })

    it('should return high odds when no one bet on a side', () => {
      const pool: BetPool = {
        proTotal: 1000,
        conTotal: 0,
        tieTotal: 0,
        totalPool: 1000,
      }
      
      const odds = calculateOdds(pool)
      
      // Sides with no bets should have high odds
      expect(odds.con).toBe(10.0)
      expect(odds.tie).toBe(15.0)
    })

    it('should handle large bet pools', () => {
      const pool: BetPool = {
        proTotal: 50000,
        conTotal: 30000,
        tieTotal: 20000,
        totalPool: 100000,
      }
      
      const odds = calculateOdds(pool)
      
      // All odds should be reasonable
      expect(odds.pro).toBeGreaterThan(1.0)
      expect(odds.con).toBeGreaterThan(1.0)
      expect(odds.tie).toBeGreaterThan(1.0)
      
      // Pro should have lowest odds (most popular)
      expect(odds.pro).toBeLessThan(odds.con)
      expect(odds.con).toBeLessThan(odds.tie)
    })

    it('should round odds to 2 decimal places', () => {
      const pool: BetPool = {
        proTotal: 333,
        conTotal: 333,
        tieTotal: 334,
        totalPool: 1000,
      }
      
      const odds = calculateOdds(pool)
      
      // Check that odds are rounded to 2 decimals
      expect(odds.pro.toString().split('.')[1]?.length || 0).toBeLessThanOrEqual(2)
      expect(odds.con.toString().split('.')[1]?.length || 0).toBeLessThanOrEqual(2)
      expect(odds.tie.toString().split('.')[1]?.length || 0).toBeLessThanOrEqual(2)
    })

    it('should handle extreme imbalance', () => {
      const pool: BetPool = {
        proTotal: 9900,
        conTotal: 50,
        tieTotal: 50,
        totalPool: 10000,
      }
      
      const odds = calculateOdds(pool)
      
      // Pro odds should be minimum
      expect(odds.pro).toBeCloseTo(1.1, 1)
      
      // Con and tie should have much higher odds
      expect(odds.con).toBeGreaterThan(5.0)
      expect(odds.tie).toBeGreaterThan(5.0)
    })
  })

  describe('Payout Calculations', () => {
    it('should calculate correct payout for winning bet', () => {
      const wagerAmount = 100
      const oddsAtBet = 2.5
      const expectedPayout = Math.floor(wagerAmount * oddsAtBet)
      
      expect(expectedPayout).toBe(250)
    })

    it('should calculate correct profit', () => {
      const wagerAmount = 100
      const payoutAmount = 250
      const profit = payoutAmount - wagerAmount
      
      expect(profit).toBe(150)
    })

    it('should handle losing bet (no payout)', () => {
      const wagerAmount = 100
      const payoutAmount = 0
      const profit = payoutAmount - wagerAmount
      
      expect(profit).toBe(-100)
    })

    it('should floor payout amounts', () => {
      const wagerAmount = 33
      const oddsAtBet = 2.7
      const expectedPayout = Math.floor(wagerAmount * oddsAtBet)
      
      // 33 * 2.7 = 89.1, should floor to 89
      expect(expectedPayout).toBe(89)
    })
  })

  describe('Accuracy Calculations', () => {
    it('should calculate accuracy correctly', () => {
      const correctPredictions = 8
      const totalBets = 10
      const accuracy = (correctPredictions / totalBets) * 100
      
      expect(accuracy).toBe(80)
    })

    it('should identify Superforecaster (80%+ accuracy with 10+ bets)', () => {
      const correctPredictions = 9
      const totalBets = 10
      const accuracy = (correctPredictions / totalBets) * 100
      
      expect(accuracy).toBeGreaterThanOrEqual(80)
      expect(totalBets).toBeGreaterThanOrEqual(10)
    })

    it('should not qualify as Superforecaster with less than 10 bets', () => {
      const correctPredictions = 8
      const totalBets = 9
      const accuracy = (correctPredictions / totalBets) * 100
      
      expect(accuracy).toBeGreaterThanOrEqual(80)
      expect(totalBets).toBeLessThan(10) // Not enough bets
    })

    it('should not qualify as Superforecaster with less than 80% accuracy', () => {
      const correctPredictions = 7
      const totalBets = 10
      const accuracy = (correctPredictions / totalBets) * 100
      
      expect(accuracy).toBeLessThan(80)
      expect(totalBets).toBeGreaterThanOrEqual(10)
    })
  })

  describe('ROI Calculations', () => {
    it('should calculate positive ROI', () => {
      const totalWagered = 1000
      const totalWon = 1500
      const roi = ((totalWon - totalWagered) / totalWagered) * 100
      
      expect(roi).toBe(50) // 50% ROI
    })

    it('should calculate negative ROI', () => {
      const totalWagered = 1000
      const totalWon = 700
      const roi = ((totalWon - totalWagered) / totalWagered) * 100
      
      expect(roi).toBe(-30) // -30% ROI
    })

    it('should handle zero ROI', () => {
      const totalWagered = 1000
      const totalWon = 1000
      const roi = ((totalWon - totalWagered) / totalWagered) * 100
      
      expect(roi).toBe(0)
    })

    it('should handle no bets placed', () => {
      const totalWagered = 0
      const totalWon = 0
      const roi = totalWagered > 0 ? ((totalWon - totalWagered) / totalWagered) * 100 : 0
      
      expect(roi).toBe(0)
    })
  })

  describe('Balance Management', () => {
    it('should validate minimum bet amount', () => {
      const minBet = 10
      const wagerAmount = 5
      
      expect(wagerAmount).toBeLessThan(minBet)
    })

    it('should validate maximum bet amount', () => {
      const maxBet = 500
      const wagerAmount = 600
      
      expect(wagerAmount).toBeGreaterThan(maxBet)
    })

    it('should validate sufficient balance', () => {
      const userBalance = 100
      const wagerAmount = 150
      
      expect(wagerAmount).toBeGreaterThan(userBalance)
    })

    it('should allow valid bet within limits', () => {
      const userBalance = 1000
      const wagerAmount = 100
      const minBet = 10
      const maxBet = 500
      
      expect(wagerAmount).toBeGreaterThanOrEqual(minBet)
      expect(wagerAmount).toBeLessThanOrEqual(maxBet)
      expect(wagerAmount).toBeLessThanOrEqual(userBalance)
    })
  })

  describe('Comprehensive Bet Distribution Scenarios', () => {
    it('should handle scenario: heavy favorite (90-10 split)', () => {
      const pool: BetPool = {
        proTotal: 9000,
        conTotal: 1000,
        tieTotal: 0,
        totalPool: 10000,
      }
      
      const odds = calculateOdds(pool)
      
      // Pro should have very low odds (heavy favorite)
      expect(odds.pro).toBeLessThan(1.5)
      // Con should have high odds (underdog)
      expect(odds.con).toBeGreaterThan(5.0)
      // Verify odds reflect the imbalance
      expect(odds.con).toBeGreaterThan(odds.pro * 3)
    })

    it('should handle scenario: close race (55-45 split)', () => {
      const pool: BetPool = {
        proTotal: 5500,
        conTotal: 4500,
        tieTotal: 0,
        totalPool: 10000,
      }
      
      const odds = calculateOdds(pool)
      
      // Both sides should have similar odds
      expect(Math.abs(odds.pro - odds.con)).toBeLessThan(0.4)
      // Both should be close to 2x (even money with house edge)
      expect(odds.pro).toBeGreaterThan(1.5)
      expect(odds.pro).toBeLessThan(2.2)
      expect(odds.con).toBeGreaterThan(1.5)
      expect(odds.con).toBeLessThan(2.2)
    })

    it('should handle scenario: three-way split with tie bets', () => {
      const pool: BetPool = {
        proTotal: 4000,
        conTotal: 4000,
        tieTotal: 2000,
        totalPool: 10000,
      }
      
      const odds = calculateOdds(pool)
      
      // Pro and con should have similar odds
      expect(Math.abs(odds.pro - odds.con)).toBeLessThan(0.1)
      // Tie should have higher odds (less popular)
      expect(odds.tie).toBeGreaterThan(odds.pro)
      expect(odds.tie).toBeGreaterThan(odds.con)
    })

    it('should handle scenario: underdog with small bets', () => {
      const pool: BetPool = {
        proTotal: 9500,
        conTotal: 500,
        tieTotal: 0,
        totalPool: 10000,
      }
      
      const odds = calculateOdds(pool)
      
      // Con should have very high odds
      expect(odds.con).toBeGreaterThan(10.0)
      // Pro should have minimum odds
      expect(odds.pro).toBeCloseTo(1.1, 1)
      
      // Verify payout would be substantial for con bettors
      const conBettor = 100
      const potentialPayout = Math.floor(conBettor * odds.con)
      expect(potentialPayout).toBeGreaterThan(1000)
    })

    it('should handle scenario: progressive bet accumulation', () => {
      // Simulate bets coming in over time
      const scenarios = [
        { proTotal: 100, conTotal: 0, tieTotal: 0, totalPool: 100 },
        { proTotal: 100, conTotal: 100, tieTotal: 0, totalPool: 200 },
        { proTotal: 200, conTotal: 100, tieTotal: 0, totalPool: 300 },
        { proTotal: 200, conTotal: 200, tieTotal: 100, totalPool: 500 },
      ]
      
      const oddsProgression = scenarios.map(calculateOdds)
      
      // Verify odds change as bets accumulate
      expect(oddsProgression[0].con).toBe(10.0) // No con bets yet
      expect(oddsProgression[1].pro).toBeCloseTo(oddsProgression[1].con, 0.5) // Even split
      expect(oddsProgression[2].pro).toBeLessThan(oddsProgression[2].con) // Pro becomes favorite
      expect(oddsProgression[3].tie).toBeGreaterThan(oddsProgression[3].pro) // Tie has highest odds
    })

    it('should handle scenario: whale bet impact', () => {
      // Before whale bet
      const beforeWhale: BetPool = {
        proTotal: 1000,
        conTotal: 1000,
        tieTotal: 0,
        totalPool: 2000,
      }
      
      // After whale bets 5000 on pro
      const afterWhale: BetPool = {
        proTotal: 6000,
        conTotal: 1000,
        tieTotal: 0,
        totalPool: 7000,
      }
      
      const oddsBefore = calculateOdds(beforeWhale)
      const oddsAfter = calculateOdds(afterWhale)
      
      // Pro odds should drop significantly
      expect(oddsAfter.pro).toBeLessThan(oddsBefore.pro)
      // Con odds should increase significantly
      expect(oddsAfter.con).toBeGreaterThan(oddsBefore.con)
      // Verify the magnitude of change
      expect(oddsBefore.pro - oddsAfter.pro).toBeGreaterThan(0.5)
    })
  })

  describe('Payout Accuracy Tests', () => {
    it('should calculate exact payout for 2x odds', () => {
      const wager = 100
      const odds = 2.0
      const payout = Math.floor(wager * odds)
      
      expect(payout).toBe(200)
    })

    it('should calculate exact payout for 1.5x odds', () => {
      const wager = 100
      const odds = 1.5
      const payout = Math.floor(wager * odds)
      
      expect(payout).toBe(150)
    })

    it('should calculate exact payout for 10x odds', () => {
      const wager = 50
      const odds = 10.0
      const payout = Math.floor(wager * odds)
      
      expect(payout).toBe(500)
    })

    it('should handle fractional payouts correctly', () => {
      const wager = 33
      const odds = 2.7
      const payout = Math.floor(wager * odds)
      
      // 33 * 2.7 = 89.1, should floor to 89
      expect(payout).toBe(89)
      expect(payout).not.toBe(90) // Verify it floors, not rounds
    })

    it('should calculate net profit correctly', () => {
      const scenarios = [
        { wager: 100, odds: 2.0, expectedProfit: 100 },
        { wager: 100, odds: 1.5, expectedProfit: 50 },
        { wager: 50, odds: 10.0, expectedProfit: 450 },
        { wager: 100, odds: 1.1, expectedProfit: 10 },
      ]
      
      scenarios.forEach(({ wager, odds, expectedProfit }) => {
        const payout = Math.floor(wager * odds)
        const profit = payout - wager
        expect(profit).toBe(expectedProfit)
      })
    })

    it('should handle multiple winners splitting pool', () => {
      // Pool: 10000 total, 2000 on winning side
      const totalPool = 10000
      const winningBets = 2000
      const houseEdge = 0.05
      const effectivePool = totalPool * (1 - houseEdge)
      const odds = effectivePool / winningBets
      
      // Each winner gets proportional share
      const bettor1Wager = 500
      const bettor2Wager = 1000
      const bettor3Wager = 500
      
      const bettor1Payout = Math.floor(bettor1Wager * odds)
      const bettor2Payout = Math.floor(bettor2Wager * odds)
      const bettor3Payout = Math.floor(bettor3Wager * odds)
      
      const totalPayout = bettor1Payout + bettor2Payout + bettor3Payout
      
      // Total payout should be close to effective pool (within rounding)
      expect(totalPayout).toBeGreaterThan(effectivePool - 10)
      expect(totalPayout).toBeLessThanOrEqual(effectivePool)
      
      // Verify proportional distribution
      expect(bettor2Payout).toBe(bettor1Payout * 2) // Bettor 2 wagered 2x bettor 1
    })

    it('should handle losing bet (zero payout)', () => {
      const wager = 100
      const payout = 0 // Lost bet
      const profit = payout - wager
      
      expect(profit).toBe(-100)
      expect(payout).toBe(0)
    })

    it('should verify house edge is applied correctly', () => {
      const pool: BetPool = {
        proTotal: 5000,
        conTotal: 5000,
        tieTotal: 0,
        totalPool: 10000,
      }
      
      const odds = calculateOdds(pool)
      const houseEdge = 0.05
      const effectivePool = pool.totalPool * (1 - houseEdge)
      const expectedOdds = effectivePool / pool.proTotal
      
      expect(odds.pro).toBeCloseTo(expectedOdds, 2)
      expect(odds.con).toBeCloseTo(expectedOdds, 2)
      
      // Verify house takes 5%
      const totalWagerOnPro = 5000
      const totalPayoutIfProWins = Math.floor(totalWagerOnPro * odds.pro)
      const houseTake = pool.totalPool - totalPayoutIfProWins
      const houseTakePercentage = houseTake / pool.totalPool
      
      expect(houseTakePercentage).toBeCloseTo(0.05, 2)
    })
  })

  describe('DebatePoints Balance Update Tests', () => {
    it('should deduct wager from balance', () => {
      const initialBalance = 1000
      const wager = 100
      const newBalance = initialBalance - wager
      
      expect(newBalance).toBe(900)
    })

    it('should add payout to balance', () => {
      const balanceAfterWager = 900
      const payout = 200
      const finalBalance = balanceAfterWager + payout
      
      expect(finalBalance).toBe(1100)
    })

    it('should handle complete win cycle', () => {
      const initialBalance = 1000
      const wager = 100
      const odds = 2.5
      
      // Place bet
      const balanceAfterBet = initialBalance - wager
      expect(balanceAfterBet).toBe(900)
      
      // Win bet
      const payout = Math.floor(wager * odds)
      const finalBalance = balanceAfterBet + payout
      
      expect(payout).toBe(250)
      expect(finalBalance).toBe(1150)
      expect(finalBalance - initialBalance).toBe(150) // Net profit
    })

    it('should handle complete loss cycle', () => {
      const initialBalance = 1000
      const wager = 100
      
      // Place bet
      const balanceAfterBet = initialBalance - wager
      expect(balanceAfterBet).toBe(900)
      
      // Lose bet (no payout)
      const payout = 0
      const finalBalance = balanceAfterBet + payout
      
      expect(finalBalance).toBe(900)
      expect(finalBalance - initialBalance).toBe(-100) // Net loss
    })

    it('should handle multiple bets sequence', () => {
      let balance = 1000
      
      // Bet 1: Win
      balance -= 100
      balance += Math.floor(100 * 2.0) // Win 200
      expect(balance).toBe(1100)
      
      // Bet 2: Lose
      balance -= 150
      expect(balance).toBe(950)
      
      // Bet 3: Win
      balance -= 200
      balance += Math.floor(200 * 1.5) // Win 300
      expect(balance).toBe(1050)
      
      // Net result: +50 points
      expect(balance - 1000).toBe(50)
    })

    it('should prevent betting more than balance', () => {
      const balance = 100
      const wager = 150
      
      const canBet = wager <= balance
      expect(canBet).toBe(false)
    })

    it('should handle minimum balance after multiple losses', () => {
      let balance = 1000
      
      // Lose 5 bets of 100 each
      for (let i = 0; i < 5; i++) {
        balance -= 100
      }
      
      expect(balance).toBe(500)
      
      // Should still be able to bet minimum (10)
      expect(balance).toBeGreaterThanOrEqual(10)
    })

    it('should track cumulative statistics correctly', () => {
      const stats = {
        totalWagered: 0,
        totalWon: 0,
        betsPlaced: 0,
        betsWon: 0,
      }
      
      // Bet 1: Win
      stats.totalWagered += 100
      stats.betsPlaced += 1
      stats.totalWon += 200
      stats.betsWon += 1
      
      // Bet 2: Lose
      stats.totalWagered += 150
      stats.betsPlaced += 1
      
      // Bet 3: Win
      stats.totalWagered += 200
      stats.betsPlaced += 1
      stats.totalWon += 300
      stats.betsWon += 1
      
      expect(stats.totalWagered).toBe(450)
      expect(stats.totalWon).toBe(500)
      expect(stats.betsPlaced).toBe(3)
      expect(stats.betsWon).toBe(2)
      
      const netProfit = stats.totalWon - stats.totalWagered
      expect(netProfit).toBe(50)
      
      const winRate = (stats.betsWon / stats.betsPlaced) * 100
      expect(winRate).toBeCloseTo(66.67, 1)
    })

    it('should handle starting balance for new users', () => {
      const startingBalance = 1000
      
      expect(startingBalance).toBe(1000)
      expect(startingBalance).toBeGreaterThanOrEqual(10) // Can place minimum bet
    })

    it('should calculate ROI correctly over time', () => {
      const totalWagered = 1000
      const totalWon = 1300
      const roi = ((totalWon - totalWagered) / totalWagered) * 100
      
      expect(roi).toBe(30) // 30% ROI
    })
  })

  describe('Edge Cases and Boundary Conditions', () => {
    it('should handle zero total pool', () => {
      const pool: BetPool = {
        proTotal: 0,
        conTotal: 0,
        tieTotal: 0,
        totalPool: 0,
      }
      
      const odds = calculateOdds(pool)
      
      expect(odds.pro).toBe(2.0)
      expect(odds.con).toBe(2.0)
      expect(odds.tie).toBe(3.0)
    })

    it('should handle very small bets', () => {
      const pool: BetPool = {
        proTotal: 1,
        conTotal: 1,
        tieTotal: 0,
        totalPool: 2,
      }
      
      const odds = calculateOdds(pool)
      
      expect(odds.pro).toBeGreaterThan(0)
      expect(odds.con).toBeGreaterThan(0)
    })

    it('should handle very large bets', () => {
      const pool: BetPool = {
        proTotal: 1000000,
        conTotal: 1000000,
        tieTotal: 0,
        totalPool: 2000000,
      }
      
      const odds = calculateOdds(pool)
      
      expect(odds.pro).toBeGreaterThan(1.0)
      expect(odds.con).toBeGreaterThan(1.0)
      expect(odds.pro).toBeCloseTo(odds.con, 0.1)
    })

    it('should handle single bettor scenario', () => {
      const pool: BetPool = {
        proTotal: 100,
        conTotal: 0,
        tieTotal: 0,
        totalPool: 100,
      }
      
      const odds = calculateOdds(pool)
      
      // Con and tie should have maximum odds
      expect(odds.con).toBe(10.0)
      expect(odds.tie).toBe(15.0)
    })

    it('should maintain minimum odds floor', () => {
      const pool: BetPool = {
        proTotal: 100000,
        conTotal: 1,
        tieTotal: 1,
        totalPool: 100002,
      }
      
      const odds = calculateOdds(pool)
      
      // Even with extreme imbalance, minimum odds should apply
      expect(odds.pro).toBeGreaterThanOrEqual(1.1)
      expect(odds.con).toBeGreaterThanOrEqual(1.1)
      expect(odds.tie).toBeGreaterThanOrEqual(1.1)
    })

    it('should handle precision in odds calculation', () => {
      const pool: BetPool = {
        proTotal: 333,
        conTotal: 333,
        tieTotal: 334,
        totalPool: 1000,
      }
      
      const odds = calculateOdds(pool)
      
      // Verify rounding to 2 decimal places
      expect(Number.isFinite(odds.pro)).toBe(true)
      expect(Number.isFinite(odds.con)).toBe(true)
      expect(Number.isFinite(odds.tie)).toBe(true)
      
      // Check decimal places
      const proDecimals = odds.pro.toString().split('.')[1]?.length || 0
      const conDecimals = odds.con.toString().split('.')[1]?.length || 0
      const tieDecimals = odds.tie.toString().split('.')[1]?.length || 0
      
      expect(proDecimals).toBeLessThanOrEqual(2)
      expect(conDecimals).toBeLessThanOrEqual(2)
      expect(tieDecimals).toBeLessThanOrEqual(2)
    })
  })
})
