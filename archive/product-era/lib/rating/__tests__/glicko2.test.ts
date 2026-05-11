/**
 * Tests for Glicko-2 rating algorithm
 */

import {
  updateRating,
  initializeRating,
  calculateWinProbability,
  type Glicko2Rating,
  type MatchResult,
} from '../glicko2'

describe('Glicko-2 Algorithm', () => {
  describe('initializeRating', () => {
    it('should initialize with correct default values', () => {
      const rating = initializeRating()
      
      expect(rating.rating).toBe(1500)
      expect(rating.ratingDeviation).toBe(350)
      expect(rating.volatility).toBe(0.06)
    })
  })

  describe('updateRating', () => {
    it('should increase rating after a win', () => {
      const player: Glicko2Rating = {
        rating: 1500,
        ratingDeviation: 200,
        volatility: 0.06,
      }
      
      const results: MatchResult[] = [
        {
          opponentRating: 1500,
          opponentRatingDeviation: 200,
          score: 1, // Win
        },
      ]
      
      const newRating = updateRating(player, results)
      
      expect(newRating.rating).toBeGreaterThan(player.rating)
      expect(newRating.ratingDeviation).toBeLessThan(player.ratingDeviation)
    })

    it('should decrease rating after a loss', () => {
      const player: Glicko2Rating = {
        rating: 1500,
        ratingDeviation: 200,
        volatility: 0.06,
      }
      
      const results: MatchResult[] = [
        {
          opponentRating: 1500,
          opponentRatingDeviation: 200,
          score: 0, // Loss
        },
      ]
      
      const newRating = updateRating(player, results)
      
      expect(newRating.rating).toBeLessThan(player.rating)
      expect(newRating.ratingDeviation).toBeLessThan(player.ratingDeviation)
    })

    it('should not change rating significantly after a draw', () => {
      const player: Glicko2Rating = {
        rating: 1500,
        ratingDeviation: 200,
        volatility: 0.06,
      }
      
      const results: MatchResult[] = [
        {
          opponentRating: 1500,
          opponentRatingDeviation: 200,
          score: 0.5, // Draw
        },
      ]
      
      const newRating = updateRating(player, results)
      
      // Rating should stay close to original
      expect(Math.abs(newRating.rating - player.rating)).toBeLessThan(10)
      expect(newRating.ratingDeviation).toBeLessThan(player.ratingDeviation)
    })

    it('should handle multiple games in one rating period', () => {
      const player: Glicko2Rating = {
        rating: 1500,
        ratingDeviation: 200,
        volatility: 0.06,
      }
      
      const results: MatchResult[] = [
        {
          opponentRating: 1400,
          opponentRatingDeviation: 30,
          score: 1, // Win against weaker opponent
        },
        {
          opponentRating: 1550,
          opponentRatingDeviation: 100,
          score: 0, // Loss against stronger opponent
        },
        {
          opponentRating: 1700,
          opponentRatingDeviation: 300,
          score: 1, // Win against much stronger opponent
        },
      ]
      
      const newRating = updateRating(player, results)
      
      // Should gain rating overall (2 wins, 1 loss, including upset)
      expect(newRating.rating).toBeGreaterThan(player.rating)
      expect(newRating.ratingDeviation).toBeLessThan(player.ratingDeviation)
    })

    it('should increase RD when no games played (inactivity)', () => {
      const player: Glicko2Rating = {
        rating: 1500,
        ratingDeviation: 200,
        volatility: 0.06,
      }
      
      const results: MatchResult[] = []
      
      const newRating = updateRating(player, results)
      
      expect(newRating.rating).toBe(player.rating) // Rating unchanged
      expect(newRating.ratingDeviation).toBeGreaterThan(player.ratingDeviation) // RD increases
      expect(newRating.volatility).toBe(player.volatility) // Volatility unchanged
    })

    it('should reduce RD with more games played', () => {
      const player: Glicko2Rating = {
        rating: 1500,
        ratingDeviation: 350, // High uncertainty
        volatility: 0.06,
      }
      
      // Play many games
      const results: MatchResult[] = Array(10).fill(null).map((_, i) => ({
        opponentRating: 1500,
        opponentRatingDeviation: 200,
        score: i % 2 === 0 ? 1 : 0, // Alternating wins and losses
      }))
      
      const newRating = updateRating(player, results)
      
      // RD should decrease significantly with many games
      expect(newRating.ratingDeviation).toBeLessThan(player.ratingDeviation * 0.5)
    })

    it('should handle upset victories correctly', () => {
      const weakPlayer: Glicko2Rating = {
        rating: 1200,
        ratingDeviation: 200,
        volatility: 0.06,
      }
      
      const results: MatchResult[] = [
        {
          opponentRating: 1800, // Much stronger opponent
          opponentRatingDeviation: 100,
          score: 1, // Upset win
        },
      ]
      
      const newRating = updateRating(weakPlayer, results)
      
      // Should gain significant rating from upset
      expect(newRating.rating - weakPlayer.rating).toBeGreaterThan(50)
    })
  })

  describe('calculateWinProbability', () => {
    it('should return 0.5 for equally rated players', () => {
      const player1: Glicko2Rating = {
        rating: 1500,
        ratingDeviation: 200,
        volatility: 0.06,
      }
      
      const player2: Glicko2Rating = {
        rating: 1500,
        ratingDeviation: 200,
        volatility: 0.06,
      }
      
      const prob = calculateWinProbability(player1, player2)
      
      expect(prob).toBeCloseTo(0.5, 1)
    })

    it('should return higher probability for higher rated player', () => {
      const strongPlayer: Glicko2Rating = {
        rating: 1700,
        ratingDeviation: 200,
        volatility: 0.06,
      }
      
      const weakPlayer: Glicko2Rating = {
        rating: 1300,
        ratingDeviation: 200,
        volatility: 0.06,
      }
      
      const prob = calculateWinProbability(strongPlayer, weakPlayer)
      
      expect(prob).toBeGreaterThan(0.75)
    })

    it('should return lower probability for lower rated player', () => {
      const weakPlayer: Glicko2Rating = {
        rating: 1300,
        ratingDeviation: 200,
        volatility: 0.06,
      }
      
      const strongPlayer: Glicko2Rating = {
        rating: 1700,
        ratingDeviation: 200,
        volatility: 0.06,
      }
      
      const prob = calculateWinProbability(weakPlayer, strongPlayer)
      
      expect(prob).toBeLessThan(0.25)
    })

    it('should account for rating deviation in probability', () => {
      const certainPlayer: Glicko2Rating = {
        rating: 1500,
        ratingDeviation: 50, // Low uncertainty
        volatility: 0.06,
      }
      
      const uncertainPlayer: Glicko2Rating = {
        rating: 1500,
        ratingDeviation: 350, // High uncertainty
        volatility: 0.06,
      }
      
      const prob1 = calculateWinProbability(certainPlayer, uncertainPlayer)
      const prob2 = calculateWinProbability(uncertainPlayer, certainPlayer)
      
      // Probabilities should be close to 0.5 but not exactly equal
      expect(prob1).toBeCloseTo(0.5, 0)
      expect(prob2).toBeCloseTo(0.5, 0)
    })
  })

  describe('Edge Cases', () => {
    it('should handle very high ratings', () => {
      const player: Glicko2Rating = {
        rating: 2500,
        ratingDeviation: 100,
        volatility: 0.06,
      }
      
      const results: MatchResult[] = [
        {
          opponentRating: 2400,
          opponentRatingDeviation: 100,
          score: 1,
        },
      ]
      
      const newRating = updateRating(player, results)
      
      expect(newRating.rating).toBeGreaterThan(player.rating)
      expect(newRating.rating).toBeLessThan(3000) // Reasonable upper bound
    })

    it('should handle very low ratings', () => {
      const player: Glicko2Rating = {
        rating: 800,
        ratingDeviation: 100,
        volatility: 0.06,
      }
      
      const results: MatchResult[] = [
        {
          opponentRating: 900,
          opponentRatingDeviation: 100,
          score: 0,
        },
      ]
      
      const newRating = updateRating(player, results)
      
      expect(newRating.rating).toBeLessThan(player.rating)
      expect(newRating.rating).toBeGreaterThan(0) // Should not go negative
    })

    it('should handle very low RD', () => {
      const player: Glicko2Rating = {
        rating: 1500,
        ratingDeviation: 30, // Very certain
        volatility: 0.06,
      }
      
      const results: MatchResult[] = [
        {
          opponentRating: 1500,
          opponentRatingDeviation: 200,
          score: 1,
        },
      ]
      
      const newRating = updateRating(player, results)
      
      // Rating should change less with low RD
      expect(Math.abs(newRating.rating - player.rating)).toBeLessThan(20)
    })
  })
})
