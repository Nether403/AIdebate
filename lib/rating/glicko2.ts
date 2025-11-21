/**
 * Glicko-2 Rating System Implementation
 * 
 * Based on Mark Glickman's Glicko-2 rating system
 * http://www.glicko.net/glicko/glicko2.pdf
 * 
 * Key concepts:
 * - Rating (r): Player's skill level
 * - Rating Deviation (RD): Uncertainty in the rating
 * - Volatility (σ): Degree of expected fluctuation in rating
 */

const TAU = 0.5 // System constant that constrains volatility (recommended: 0.3-1.2)
const EPSILON = 0.000001 // Convergence tolerance

/**
 * Glicko-2 rating representation
 */
export interface Glicko2Rating {
  rating: number // r (typically starts at 1500)
  ratingDeviation: number // RD (typically starts at 350)
  volatility: number // σ (typically starts at 0.06)
}

/**
 * Match result for rating calculation
 */
export interface MatchResult {
  opponentRating: number
  opponentRatingDeviation: number
  score: number // 1 = win, 0.5 = draw, 0 = loss
}

/**
 * Convert rating to Glicko-2 scale (μ)
 */
function toGlicko2Scale(rating: number): number {
  return (rating - 1500) / 173.7178
}

/**
 * Convert rating from Glicko-2 scale back to standard scale
 */
function fromGlicko2Scale(mu: number): number {
  return mu * 173.7178 + 1500
}

/**
 * Convert RD to Glicko-2 scale (φ)
 */
function rdToGlicko2Scale(rd: number): number {
  return rd / 173.7178
}

/**
 * Convert RD from Glicko-2 scale back to standard scale
 */
function rdFromGlicko2Scale(phi: number): number {
  return phi * 173.7178
}

/**
 * Calculate g(φ) function
 */
function g(phi: number): number {
  return 1 / Math.sqrt(1 + (3 * phi * phi) / (Math.PI * Math.PI))
}

/**
 * Calculate E(μ, μj, φj) - expected score
 */
function E(mu: number, muJ: number, phiJ: number): number {
  return 1 / (1 + Math.exp(-g(phiJ) * (mu - muJ)))
}

/**
 * Calculate variance (v)
 */
function calculateVariance(mu: number, results: MatchResult[]): number {
  let sum = 0
  
  for (const result of results) {
    const muJ = toGlicko2Scale(result.opponentRating)
    const phiJ = rdToGlicko2Scale(result.opponentRatingDeviation)
    const gPhiJ = g(phiJ)
    const e = E(mu, muJ, phiJ)
    
    sum += gPhiJ * gPhiJ * e * (1 - e)
  }
  
  return 1 / sum
}

/**
 * Calculate delta (Δ)
 */
function calculateDelta(mu: number, v: number, results: MatchResult[]): number {
  let sum = 0
  
  for (const result of results) {
    const muJ = toGlicko2Scale(result.opponentRating)
    const phiJ = rdToGlicko2Scale(result.opponentRatingDeviation)
    const e = E(mu, muJ, phiJ)
    
    sum += g(phiJ) * (result.score - e)
  }
  
  return v * sum
}

/**
 * Calculate new volatility (σ')
 * This is the most complex part of Glicko-2
 */
function calculateNewVolatility(
  phi: number,
  sigma: number,
  v: number,
  delta: number
): number {
  const a = Math.log(sigma * sigma)
  const deltaSq = delta * delta
  const phiSq = phi * phi
  
  // Define f(x) function
  const f = (x: number): number => {
    const ex = Math.exp(x)
    const num1 = ex * (deltaSq - phiSq - v - ex)
    const den1 = 2 * Math.pow(phiSq + v + ex, 2)
    const num2 = x - a
    const den2 = TAU * TAU
    return num1 / den1 - num2 / den2
  }
  
  // Find bounds for iteration
  let A = a
  let B: number
  
  if (deltaSq > phiSq + v) {
    B = Math.log(deltaSq - phiSq - v)
  } else {
    let k = 1
    while (f(a - k * TAU) < 0) {
      k++
    }
    B = a - k * TAU
  }
  
  // Illinois algorithm for finding root
  let fA = f(A)
  let fB = f(B)
  
  while (Math.abs(B - A) > EPSILON) {
    const C = A + ((A - B) * fA) / (fB - fA)
    const fC = f(C)
    
    if (fC * fB < 0) {
      A = B
      fA = fB
    } else {
      fA = fA / 2
    }
    
    B = C
    fB = fC
  }
  
  return Math.exp(A / 2)
}

/**
 * Update rating after a rating period with match results
 */
export function updateRating(
  currentRating: Glicko2Rating,
  results: MatchResult[]
): Glicko2Rating {
  // If no games played, increase RD due to inactivity
  if (results.length === 0) {
    const phi = rdToGlicko2Scale(currentRating.ratingDeviation)
    const sigma = currentRating.volatility
    const phiStar = Math.sqrt(phi * phi + sigma * sigma)
    
    return {
      rating: currentRating.rating,
      ratingDeviation: rdFromGlicko2Scale(phiStar),
      volatility: currentRating.volatility,
    }
  }
  
  // Convert to Glicko-2 scale
  const mu = toGlicko2Scale(currentRating.rating)
  const phi = rdToGlicko2Scale(currentRating.ratingDeviation)
  const sigma = currentRating.volatility
  
  // Step 3: Calculate variance (v)
  const v = calculateVariance(mu, results)
  
  // Step 4: Calculate delta (Δ)
  const delta = calculateDelta(mu, v, results)
  
  // Step 5: Calculate new volatility (σ')
  const sigmaPrime = calculateNewVolatility(phi, sigma, v, delta)
  
  // Step 6: Calculate new pre-rating period RD (φ*)
  const phiStar = Math.sqrt(phi * phi + sigmaPrime * sigmaPrime)
  
  // Step 7: Calculate new rating and RD
  const phiPrime = 1 / Math.sqrt(1 / (phiStar * phiStar) + 1 / v)
  const muPrime = mu + phiPrime * phiPrime * calculateDelta(mu, v, results)
  
  // Convert back to standard scale
  return {
    rating: fromGlicko2Scale(muPrime),
    ratingDeviation: rdFromGlicko2Scale(phiPrime),
    volatility: sigmaPrime,
  }
}

/**
 * Initialize a new rating
 */
export function initializeRating(): Glicko2Rating {
  return {
    rating: 1500,
    ratingDeviation: 350,
    volatility: 0.06,
  }
}

/**
 * Calculate win probability between two players
 */
export function calculateWinProbability(
  player1: Glicko2Rating,
  player2: Glicko2Rating
): number {
  const mu1 = toGlicko2Scale(player1.rating)
  const mu2 = toGlicko2Scale(player2.rating)
  const phi2 = rdToGlicko2Scale(player2.ratingDeviation)
  
  return E(mu1, mu2, phi2)
}
