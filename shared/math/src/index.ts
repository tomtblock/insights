/**
 * @arb/math - Deterministic Math Functions for Arbitrage Platform
 * 
 * All functions are pure - no side effects, same inputs = same outputs.
 * These are the canonical implementations used in both:
 * - Opportunity engine (calculation)
 * - Algorithm tab (display)
 */

import type { LiquiditySnapshot, EdgeProfile } from '@arb/schemas';

// ============================================================================
// Constants
// ============================================================================

export const Q_BUCKETS = [100, 250, 500, 1000, 2500, 5000] as const;
export type QBucket = (typeof Q_BUCKETS)[number];

export const DEFAULT_RISK_BUFFER_BPS = 15; // 15 basis points
export const DEFAULT_STALENESS_THRESHOLD_MS = 2000;
export const DEFAULT_SPREAD_THRESHOLD_BPS = 30;
export const MIN_DEPTH_USD = 500;

// ============================================================================
// Order Book Types
// ============================================================================

export interface OrderBookLevel {
  price: number; // 0-1 probability
  size: number;  // USD notional
}

export interface OrderBook {
  bids: OrderBookLevel[]; // sorted descending by price
  asks: OrderBookLevel[]; // sorted ascending by price
  ts: number;
}

// ============================================================================
// CLOB Execution Price Calculation
// ============================================================================

/**
 * Calculate execution price for buying Q USD on a CLOB
 * Walks up the ask book until Q is filled
 * 
 * @param asks - Ask levels sorted ascending by price
 * @param q - Target notional in USD
 * @returns Average execution price, or null if insufficient depth
 */
export function calculateClobBuyPrice(
  asks: OrderBookLevel[],
  q: number
): number | null {
  if (asks.length === 0 || q <= 0) return null;
  
  let remaining = q;
  let totalCost = 0;
  
  for (const level of asks) {
    const fillSize = Math.min(remaining, level.size);
    totalCost += fillSize * level.price;
    remaining -= fillSize;
    
    if (remaining <= 0) break;
  }
  
  // If we couldn't fill the entire order
  if (remaining > 0) return null;
  
  return totalCost / q;
}

/**
 * Calculate execution price for selling Q USD on a CLOB
 * Walks down the bid book until Q is filled
 * 
 * @param bids - Bid levels sorted descending by price
 * @param q - Target notional in USD
 * @returns Average execution price, or null if insufficient depth
 */
export function calculateClobSellPrice(
  bids: OrderBookLevel[],
  q: number
): number | null {
  if (bids.length === 0 || q <= 0) return null;
  
  let remaining = q;
  let totalProceeds = 0;
  
  for (const level of bids) {
    const fillSize = Math.min(remaining, level.size);
    totalProceeds += fillSize * level.price;
    remaining -= fillSize;
    
    if (remaining <= 0) break;
  }
  
  // If we couldn't fill the entire order
  if (remaining > 0) return null;
  
  return totalProceeds / q;
}

// ============================================================================
// AMM Execution Price Calculation
// ============================================================================

/**
 * Constant product AMM price calculation
 * For buying: price increases as you buy
 * For selling: price decreases as you sell
 * 
 * @param currentPrice - Current AMM price (0-1)
 * @param q - Trade size in USD
 * @param liquidity - Total pool liquidity in USD
 * @param isBuy - true for buy, false for sell
 * @returns Average execution price after slippage
 */
export function calculateAmmExecutionPrice(
  currentPrice: number,
  q: number,
  liquidity: number,
  isBuy: boolean
): number {
  if (liquidity <= 0 || q <= 0) return currentPrice;
  
  // For small trades, use linear approximation
  if (q / liquidity < 0.01) {
    const slippage = (q / liquidity) * 0.5; // Simplified constant product
    return isBuy 
      ? currentPrice * (1 + slippage)
      : currentPrice * (1 - slippage);
  }
  
  // Full constant product formula
  // x * y = k
  // After trade: (x ± Δx) * (y ∓ Δy) = k
  const k = liquidity * liquidity * currentPrice * (1 - currentPrice);
  const x = liquidity * (1 - currentPrice); // Token X reserve
  const y = liquidity * currentPrice; // Token Y reserve
  
  if (isBuy) {
    // Buying Y with X (price goes up)
    const newX = x + q;
    const newY = k / newX;
    const avgPrice = q / (y - newY);
    return Math.min(avgPrice, 0.99); // Cap at 99%
  } else {
    // Selling Y for X (price goes down)
    const newY = y + q;
    const newX = k / newY;
    const avgPrice = (x - newX) / q;
    return Math.max(avgPrice, 0.01); // Floor at 1%
  }
}

/**
 * Calculate AMM slippage for a given trade size
 * 
 * @param currentPrice - Current AMM price
 * @param q - Trade size in USD
 * @param liquidity - Total pool liquidity
 * @param isBuy - true for buy, false for sell
 * @returns Slippage as a decimal (0.01 = 1%)
 */
export function calculateAmmSlippage(
  currentPrice: number,
  q: number,
  liquidity: number,
  isBuy: boolean
): number {
  const execPrice = calculateAmmExecutionPrice(currentPrice, q, liquidity, isBuy);
  return Math.abs(execPrice - currentPrice);
}

// ============================================================================
// Edge Calculation
// ============================================================================

export interface EdgeCalculationInput {
  buySnapshot: LiquiditySnapshot;
  sellSnapshot: LiquiditySnapshot;
  buyFeesBps: number;
  sellFeesBps: number;
  riskBufferBps: number;
  buyBook?: OrderBook;
  sellBook?: OrderBook;
}

export interface QBucketEdge {
  q: number;
  buy_price: number;
  sell_price: number;
  gross_edge: number;
  fees: number;
  risk_buffer: number;
  net_edge: number;
  executable: boolean;
}

/**
 * Calculate edge for a specific Q bucket
 */
export function calculateEdgeForQ(
  input: EdgeCalculationInput,
  q: number
): QBucketEdge {
  const { buySnapshot, sellSnapshot, buyFeesBps, sellFeesBps, riskBufferBps } = input;
  
  let buyPrice: number;
  let sellPrice: number;
  let executable = true;
  
  // Determine buy price
  if (buySnapshot.best_ask !== null && input.buyBook) {
    // CLOB: Use order book
    const price = calculateClobBuyPrice(input.buyBook.asks, q);
    if (price === null) {
      buyPrice = buySnapshot.best_ask;
      executable = false;
    } else {
      buyPrice = price;
    }
  } else if (buySnapshot.amm_price !== null) {
    // AMM: Calculate with slippage
    const liquidity = (buySnapshot.depth_usd_1pct || 0) * 10; // Estimate
    buyPrice = calculateAmmExecutionPrice(buySnapshot.amm_price, q, liquidity, true);
  } else {
    buyPrice = buySnapshot.mid || 0.5;
    executable = false;
  }
  
  // Determine sell price
  if (sellSnapshot.best_bid !== null && input.sellBook) {
    // CLOB: Use order book
    const price = calculateClobSellPrice(input.sellBook.bids, q);
    if (price === null) {
      sellPrice = sellSnapshot.best_bid;
      executable = false;
    } else {
      sellPrice = price;
    }
  } else if (sellSnapshot.amm_price !== null) {
    // AMM: Calculate with slippage
    const liquidity = (sellSnapshot.depth_usd_1pct || 0) * 10; // Estimate
    sellPrice = calculateAmmExecutionPrice(sellSnapshot.amm_price, q, liquidity, false);
  } else {
    sellPrice = sellSnapshot.mid || 0.5;
    executable = false;
  }
  
  // Calculate edges
  const grossEdge = sellPrice - buyPrice;
  const fees = (buyFeesBps + sellFeesBps) / 10000;
  const riskBuffer = riskBufferBps / 10000;
  const netEdge = grossEdge - fees - riskBuffer;
  
  // Check depth constraints
  const buyDepth = buySnapshot.depth_usd_1pct || 0;
  const sellDepth = sellSnapshot.depth_usd_1pct || 0;
  if (buyDepth < q || sellDepth < q) {
    executable = false;
  }
  
  return {
    q,
    buy_price: buyPrice,
    sell_price: sellPrice,
    gross_edge: grossEdge,
    fees,
    risk_buffer: riskBuffer,
    net_edge: netEdge,
    executable: executable && netEdge > 0,
  };
}

/**
 * Calculate full edge profile across all Q buckets
 */
export function calculateEdgeProfile(input: EdgeCalculationInput): EdgeProfile {
  const qBuckets = Q_BUCKETS.map((q) => calculateEdgeForQ(input, q));
  
  // Find best executable Q
  const executableBuckets = qBuckets.filter((b) => b.executable);
  const bestBucket = executableBuckets.reduce<QBucketEdge | null>(
    (best, current) => {
      if (!best) return current;
      // Optimize for total edge * size
      const bestScore = best.net_edge * best.q;
      const currentScore = current.net_edge * current.q;
      return currentScore > bestScore ? current : best;
    },
    null
  );
  
  // Calculate max executable size
  const maxExecutable = executableBuckets.length > 0
    ? Math.max(...executableBuckets.map((b) => b.q))
    : 0;
  
  return {
    q_buckets: qBuckets,
    best_q: bestBucket?.q || null,
    max_executable_size: maxExecutable,
    total_fees_bps: input.buyFeesBps + input.sellFeesBps,
  };
}

// ============================================================================
// Confidence Score Calculation
// ============================================================================

export interface ConfidenceScoreInput {
  edgeProfile: EdgeProfile;
  buySnapshot: LiquiditySnapshot;
  sellSnapshot: LiquiditySnapshot;
  truthAmbiguityScore: number;
  timeToResolutionMs: number | null;
  stalenessThresholdMs: number;
}

/**
 * Calculate confidence score (0-100) for an opportunity
 * 
 * Components:
 * - Net edge margin beyond buffer (0-40)
 * - Depth robustness (0-25)
 * - Freshness (0-15)
 * - Truth ambiguity (0-10)
 * - Near-resolution penalty (0-10)
 */
export function calculateConfidenceScore(input: ConfidenceScoreInput): number {
  const {
    edgeProfile,
    buySnapshot,
    sellSnapshot,
    truthAmbiguityScore,
    timeToResolutionMs,
    stalenessThresholdMs,
  } = input;
  
  let score = 0;
  
  // 1. Edge margin score (0-40)
  const bestBucket = edgeProfile.q_buckets.find((b) => b.q === edgeProfile.best_q);
  if (bestBucket && bestBucket.net_edge > 0) {
    // 10 bps = 10 points, 40 bps = 40 points
    score += Math.min(40, bestBucket.net_edge * 10000);
  }
  
  // 2. Depth robustness (0-25)
  const minDepth = Math.min(
    buySnapshot.depth_usd_1pct || 0,
    sellSnapshot.depth_usd_1pct || 0
  );
  // $500 = 5 points, $5000 = 25 points
  score += Math.min(25, (minDepth / 5000) * 25);
  
  // 3. Freshness (0-15)
  const now = Date.now();
  const buyStaleness = now - (buySnapshot.last_update_ts || now);
  const sellStaleness = now - (sellSnapshot.last_update_ts || now);
  const maxStaleness = Math.max(buyStaleness, sellStaleness);
  if (maxStaleness <= stalenessThresholdMs) {
    score += 15;
  } else if (maxStaleness <= stalenessThresholdMs * 2) {
    score += 10;
  } else if (maxStaleness <= stalenessThresholdMs * 5) {
    score += 5;
  }
  
  // 4. Truth ambiguity score (0-10)
  // Low ambiguity = high score
  score += (1 - truthAmbiguityScore) * 10;
  
  // 5. Near-resolution penalty (0-10)
  if (timeToResolutionMs !== null) {
    const hourMs = 60 * 60 * 1000;
    if (timeToResolutionMs >= 24 * hourMs) {
      score += 10;
    } else if (timeToResolutionMs >= 4 * hourMs) {
      score += 7;
    } else if (timeToResolutionMs >= hourMs) {
      score += 4;
    } else if (timeToResolutionMs >= 30 * 60 * 1000) {
      score += 2;
    }
    // < 30 min = 0 points
  } else {
    score += 10; // No resolution date = full points
  }
  
  return Math.round(Math.min(100, Math.max(0, score)));
}

// ============================================================================
// Staleness Checks
// ============================================================================

export function isStalenessAcceptable(
  snapshot: LiquiditySnapshot,
  thresholdMs: number
): boolean {
  const now = Date.now();
  const staleness = now - (snapshot.last_update_ts || now);
  return staleness <= thresholdMs;
}

export function isSpreadAcceptable(
  snapshot: LiquiditySnapshot,
  thresholdBps: number
): boolean {
  if (snapshot.spread === null) return true; // AMM has no spread
  return snapshot.spread * 10000 <= thresholdBps;
}

export function isDepthAcceptable(
  snapshot: LiquiditySnapshot,
  minDepthUsd: number
): boolean {
  return (snapshot.depth_usd_1pct || 0) >= minDepthUsd;
}

// ============================================================================
// Hash Generation (for replay integrity)
// ============================================================================

/**
 * Generate deterministic hash for a snapshot
 * Used to verify replay integrity
 */
export function hashSnapshot(snapshot: LiquiditySnapshot): string {
  const data = JSON.stringify({
    ts: snapshot.ts,
    venue: snapshot.venue,
    outcome_id: snapshot.outcome_id_native,
    bid: snapshot.best_bid,
    ask: snapshot.best_ask,
    mid: snapshot.mid,
    amm: snapshot.amm_price,
  });
  
  // Simple hash for demo - use crypto.subtle in production
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

// ============================================================================
// LaTeX Generation (for Algorithm tab)
// ============================================================================

export function generateEdgeLatex(): string {
  return `
\\text{Edge}(Q) = P_{\\text{sell}}(Q) - P_{\\text{buy}}(Q) - \\text{Fees} - \\text{RiskBuffer}
  `.trim();
}

export function generateClobPriceLatex(isBuy: boolean): string {
  const side = isBuy ? 'buy' : 'sell';
  const book = isBuy ? 'asks' : 'bids';
  return `
P_{\\text{${side}}}(Q) = \\frac{\\sum_{i=1}^{n} p_i \\cdot q_i}{Q} \\text{ where } \\sum_{i=1}^{n} q_i = Q \\text{ from ${book}}
  `.trim();
}

export function generateAmmPriceLatex(): string {
  return `
P_{\\text{AMM}}(Q) = P_0 \\cdot \\left(1 + \\frac{Q}{2L}\\right) \\text{ (buy, simplified linear)}
  `.trim();
}

export function generateConfidenceLatex(): string {
  return `
\\text{Score} = \\min(40, \\text{Edge}_{\\text{bps}}) + \\min(25, \\frac{\\text{Depth}}{5000} \\cdot 25) + \\text{Freshness} + (1 - \\text{Ambiguity}) \\cdot 10 + \\text{ResolutionBonus}
  `.trim();
}

