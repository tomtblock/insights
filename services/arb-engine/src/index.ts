/**
 * Arbitrage Opportunity Engine
 * 
 * Deterministic edge calculation across venues.
 * All computations are replayable from stored snapshot hashes.
 * 
 * Section 6 of spec: Opportunity Engine
 */

import { Pool } from 'pg';
import { createClient as createRedisClient } from 'redis';
import { v4 as uuidv4 } from 'uuid';
import {
  calculateEdgeProfile,
  calculateConfidenceScore,
  hashSnapshot,
  Q_BUCKETS,
  DEFAULT_RISK_BUFFER_BPS,
  type EdgeCalculationInput,
} from '@arb/math';
import type { LiquiditySnapshot, EdgeProfile, Venue } from '@arb/schemas';

// Configuration
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://localhost:5432/arb_platform';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Engine settings
const SCAN_INTERVAL_MS = 2000; // 2 seconds
const OPPORTUNITY_EXPIRY_MS = 30000; // 30 seconds without update = expired
const MIN_CONFIDENCE_SCORE = 60;
const MIN_EDGE_BPS = 5;

// Venue fee schedule (bps)
const VENUE_FEES: Record<string, number> = {
  polymarket: 0,
  kalshi: 7,
  predictit: 100,
  manifold: 0,
  finfeed: 0,
};

// Initialize
const db = new Pool({ connectionString: DATABASE_URL, max: 10 });
const redis = createRedisClient({ url: REDIS_URL });

// Health check - don't run if system unhealthy
let isHealthy = true;

interface CanonicalEventMarkets {
  canonical_event_id: string;
  label: string;
  domain: string;
  markets: Array<{
    venue: string;
    outcome_id_native: string;
    market_id_native: string;
    title: string;
    mechanism: string;
    fee_bps: number;
    resolve_ts: Date | null;
    truth_ambiguity_score: number;
  }>;
}

interface CachedLiquidity extends LiquiditySnapshot {
  snapshot_hash: string;
}

/**
 * Check global health status
 * Opportunities engine should NOT run if health is RED
 */
async function checkHealth(): Promise<boolean> {
  try {
    const result = await db.query(`
      SELECT status FROM health_state
      WHERE status = 'red'
      LIMIT 1
    `);
    return result.rows.length === 0;
  } catch (error) {
    console.error('Health check failed:', error);
    return false;
  }
}

/**
 * Get all canonical events with their linked markets
 */
async function getCanonicalEventsWithMarkets(): Promise<CanonicalEventMarkets[]> {
  const result = await db.query(`
    SELECT 
      ce.canonical_event_id,
      ce.label,
      ce.domain,
      json_agg(json_build_object(
        'venue', ml.venue,
        'outcome_id_native', ml.outcome_id_native,
        'market_id_native', m.market_id_native,
        'title', m.title,
        'mechanism', m.mechanism,
        'fee_bps', COALESCE(m.fee_bps, 0),
        'resolve_ts', m.resolve_ts,
        'truth_ambiguity_score', m.truth_ambiguity_score
      )) as markets
    FROM canonical_events ce
    JOIN market_links ml ON ml.canonical_event_id = ce.canonical_event_id
    JOIN pm_market_outcomes m ON m.venue = ml.venue AND m.outcome_id_native = ml.outcome_id_native
    WHERE m.status = 'open'
    GROUP BY ce.canonical_event_id, ce.label, ce.domain
    HAVING COUNT(DISTINCT ml.venue) >= 2
  `);

  return result.rows;
}

/**
 * Get latest liquidity snapshot from cache or DB
 */
async function getLiquidity(venue: string, outcomeId: string): Promise<CachedLiquidity | null> {
  // Try Redis cache first
  const cacheKey = `liquidity:${venue}:${outcomeId}`;
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch {
    // Redis unavailable, continue with DB
  }

  // Fall back to database
  const result = await db.query(`
    SELECT * FROM pm_liquidity_snapshots
    WHERE venue = $1 AND outcome_id_native = $2
    ORDER BY ts DESC
    LIMIT 1
  `, [venue, outcomeId]);

  if (result.rows.length === 0) return null;

  const row = result.rows[0];
  return {
    ts: row.ts.getTime(),
    venue: row.venue,
    outcome_id_native: row.outcome_id_native,
    best_bid: parseFloat(row.best_bid) || null,
    best_ask: parseFloat(row.best_ask) || null,
    mid: parseFloat(row.mid) || null,
    spread: parseFloat(row.spread) || null,
    depth_usd_1pct: parseFloat(row.depth_usd_1pct) || null,
    depth_usd_5pct: parseFloat(row.depth_usd_5pct) || null,
    amm_price: parseFloat(row.amm_price) || null,
    amm_slippage_100: parseFloat(row.amm_slippage_100) || null,
    amm_slippage_500: parseFloat(row.amm_slippage_500) || null,
    amm_slippage_1000: parseFloat(row.amm_slippage_1000) || null,
    last_update_ts: row.last_update_ts.getTime(),
    snapshot_hash: row.snapshot_hash || hashSnapshot(row),
  };
}

/**
 * Calculate opportunities for a canonical event
 * Section 6.2: Edge computation algorithm
 */
async function calculateOpportunitiesForEvent(
  event: CanonicalEventMarkets
): Promise<Array<{
  buy_venue: string;
  sell_venue: string;
  buy_outcome_id: string;
  sell_outcome_id: string;
  edge_profile: EdgeProfile;
  confidence_score: number;
  snapshot_refs: any;
  flags: any;
}>> {
  const opportunities = [];

  // Get liquidity for all markets
  const liquidityMap = new Map<string, CachedLiquidity>();
  for (const market of event.markets) {
    const liq = await getLiquidity(market.venue, market.outcome_id_native);
    if (liq) {
      liquidityMap.set(`${market.venue}:${market.outcome_id_native}`, liq);
    }
  }

  // Check all venue pairs (Section 6.2: ordered pairs)
  for (const buyMarket of event.markets) {
    for (const sellMarket of event.markets) {
      if (buyMarket.venue === sellMarket.venue) continue;

      const buyKey = `${buyMarket.venue}:${buyMarket.outcome_id_native}`;
      const sellKey = `${sellMarket.venue}:${sellMarket.outcome_id_native}`;
      const buyLiquidity = liquidityMap.get(buyKey);
      const sellLiquidity = liquidityMap.get(sellKey);

      if (!buyLiquidity || !sellLiquidity) continue;

      // Calculate edge profile
      const input: EdgeCalculationInput = {
        buySnapshot: buyLiquidity,
        sellSnapshot: sellLiquidity,
        buyFeesBps: buyMarket.fee_bps || VENUE_FEES[buyMarket.venue] || 0,
        sellFeesBps: sellMarket.fee_bps || VENUE_FEES[sellMarket.venue] || 0,
        riskBufferBps: DEFAULT_RISK_BUFFER_BPS,
      };

      const edgeProfile = calculateEdgeProfile(input);

      // Check if there's a viable opportunity
      if (!edgeProfile.best_q) continue;

      const bestBucket = edgeProfile.q_buckets.find((b) => b.q === edgeProfile.best_q);
      if (!bestBucket || bestBucket.net_edge * 10000 < MIN_EDGE_BPS) continue;

      // Calculate confidence score
      const timeToResolution = buyMarket.resolve_ts
        ? buyMarket.resolve_ts.getTime() - Date.now()
        : null;

      const confidenceScore = calculateConfidenceScore({
        edgeProfile,
        buySnapshot: buyLiquidity,
        sellSnapshot: sellLiquidity,
        truthAmbiguityScore: Math.max(
          buyMarket.truth_ambiguity_score,
          sellMarket.truth_ambiguity_score
        ),
        timeToResolutionMs: timeToResolution,
        stalenessThresholdMs: 5000,
      });

      if (confidenceScore < MIN_CONFIDENCE_SCORE) continue;

      // Check flags
      const flags = {
        stale: Date.now() - buyLiquidity.last_update_ts > 5000 ||
               Date.now() - sellLiquidity.last_update_ts > 5000,
        near_resolution: timeToResolution !== null && timeToResolution < 30 * 60 * 1000,
        high_ambiguity: Math.max(
          buyMarket.truth_ambiguity_score,
          sellMarket.truth_ambiguity_score
        ) > 0.5,
        wide_spread: (buyLiquidity.spread || 0) > 0.03 || (sellLiquidity.spread || 0) > 0.03,
        low_depth: (buyLiquidity.depth_usd_1pct || 0) < 500 ||
                   (sellLiquidity.depth_usd_1pct || 0) < 500,
      };

      opportunities.push({
        buy_venue: buyMarket.venue,
        sell_venue: sellMarket.venue,
        buy_outcome_id: buyMarket.outcome_id_native,
        sell_outcome_id: sellMarket.outcome_id_native,
        edge_profile: edgeProfile,
        confidence_score: confidenceScore,
        snapshot_refs: {
          buy_snapshot_hash: buyLiquidity.snapshot_hash,
          sell_snapshot_hash: sellLiquidity.snapshot_hash,
          buy_ts: buyLiquidity.ts,
          sell_ts: sellLiquidity.ts,
        },
        flags,
      });
    }
  }

  return opportunities;
}

/**
 * Persist or update opportunity
 */
async function persistOpportunity(
  canonicalEventId: string,
  opp: any
): Promise<void> {
  // Check for existing opportunity
  const existing = await db.query(`
    SELECT opportunity_id, last_seen_ts
    FROM opportunities
    WHERE canonical_event_id = $1
      AND buy_venue = $2
      AND sell_venue = $3
      AND buy_outcome_id = $4
      AND sell_outcome_id = $5
      AND status = 'open'
  `, [
    canonicalEventId,
    opp.buy_venue,
    opp.sell_venue,
    opp.buy_outcome_id,
    opp.sell_outcome_id,
  ]);

  if (existing.rows.length > 0) {
    // Update existing
    await db.query(`
      UPDATE opportunities
      SET last_seen_ts = NOW(),
          confidence_score = $2,
          edge_profile = $3,
          snapshot_refs = $4,
          flags = $5
      WHERE opportunity_id = $1
    `, [
      existing.rows[0].opportunity_id,
      opp.confidence_score,
      JSON.stringify(opp.edge_profile),
      JSON.stringify(opp.snapshot_refs),
      JSON.stringify(opp.flags),
    ]);
  } else {
    // Create new
    await db.query(`
      INSERT INTO opportunities (
        opportunity_id, canonical_event_id,
        buy_venue, sell_venue, buy_outcome_id, sell_outcome_id,
        status, confidence_score, edge_profile, snapshot_refs, flags
      ) VALUES ($1, $2, $3, $4, $5, $6, 'open', $7, $8, $9, $10)
    `, [
      uuidv4(),
      canonicalEventId,
      opp.buy_venue,
      opp.sell_venue,
      opp.buy_outcome_id,
      opp.sell_outcome_id,
      opp.confidence_score,
      JSON.stringify(opp.edge_profile),
      JSON.stringify(opp.snapshot_refs),
      JSON.stringify(opp.flags),
    ]);
  }
}

/**
 * Expire stale opportunities
 */
async function expireStaleOpportunities(): Promise<number> {
  const result = await db.query(`
    UPDATE opportunities
    SET status = 'expired',
        invalidation_reason = 'Edge disappeared'
    WHERE status = 'open'
      AND last_seen_ts < NOW() - INTERVAL '${OPPORTUNITY_EXPIRY_MS} milliseconds'
    RETURNING opportunity_id
  `);
  return result.rowCount || 0;
}

/**
 * Main scan loop
 */
async function runScan() {
  // Check health first
  isHealthy = await checkHealth();
  if (!isHealthy) {
    console.log('⚠️ System unhealthy, skipping opportunity scan');
    return;
  }

  try {
    // Get canonical events with markets
    const events = await getCanonicalEventsWithMarkets();
    let totalOpportunities = 0;

    for (const event of events) {
      const opportunities = await calculateOpportunitiesForEvent(event);
      
      for (const opp of opportunities) {
        await persistOpportunity(event.canonical_event_id, opp);
        totalOpportunities++;
      }
    }

    // Expire old opportunities
    const expired = await expireStaleOpportunities();

    if (totalOpportunities > 0 || expired > 0) {
      console.log(`✅ Scan complete: ${totalOpportunities} active, ${expired} expired`);
    }
  } catch (error) {
    console.error('❌ Scan error:', error);
  }
}

/**
 * Main entry point
 */
async function main() {
  console.log('🚀 Arbitrage Opportunity Engine starting...');

  try {
    // Test database connection
    const client = await db.connect();
    console.log('✅ Database connected');
    client.release();

    // Connect Redis
    try {
      await redis.connect();
      console.log('✅ Redis connected');
    } catch {
      console.warn('⚠️ Redis unavailable, running without cache');
    }

    // Run initial scan
    await runScan();

    // Start continuous scanning
    setInterval(runScan, SCAN_INTERVAL_MS);

    console.log(`✅ Opportunity Engine running (scan every ${SCAN_INTERVAL_MS}ms)`);
  } catch (error) {
    console.error('❌ Failed to start service:', error);
    process.exit(1);
  }
}

// Handle shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down...');
  await db.end();
  await redis.quit();
  process.exit(0);
});

main();

