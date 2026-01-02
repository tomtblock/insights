/**
 * Market Ingestion Service
 * 
 * Continuously ingests prediction market data from multiple venues.
 * Validates all data against Zod schemas before persistence.
 */

import { Pool } from 'pg';
import { createClient as createRedisClient } from 'redis';
import { MarketOutcomeSchema, LiquiditySnapshotSchema } from '@arb/schemas';
import { FinFeedAdapter } from './adapters/finfeed';
import { PolymarketAdapter } from './adapters/polymarket';
import { KalshiAdapter } from './adapters/kalshi';
import type { VenueAdapter, RawMarket, RawLiquidity } from './adapters/types';

// Configuration
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://localhost:5432/arb_platform';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const FINFEED_API_KEY = process.env.FINFEED_API_KEY || 'a5d8925b-027f-42c0-a000-421699c8c86d';

// Ingestion intervals per venue (ms)
const INGESTION_INTERVALS: Record<string, number> = {
  finfeed: 5000,
  polymarket: 2000,
  kalshi: 2000,
  predictit: 30000,
  manifold: 60000,
};

// Initialize database
const db = new Pool({
  connectionString: DATABASE_URL,
  max: 10,
});

// Initialize Redis
const redis = createRedisClient({ url: REDIS_URL });

// Adapters registry
const adapters: Record<string, VenueAdapter> = {};

/**
 * Initialize all venue adapters
 */
async function initializeAdapters() {
  console.log('Initializing venue adapters...');

  // FinFeed (primary source)
  adapters.finfeed = new FinFeedAdapter({
    apiKey: FINFEED_API_KEY,
    baseUrl: 'https://api.finfeedapi.com',
  });

  // Polymarket
  adapters.polymarket = new PolymarketAdapter({
    baseUrl: 'https://gamma-api.polymarket.com',
  });

  // Kalshi
  adapters.kalshi = new KalshiAdapter({
    baseUrl: 'https://trading-api.kalshi.com/trade-api/v2',
  });

  // Initialize all
  for (const [venue, adapter] of Object.entries(adapters)) {
    try {
      await adapter.initialize();
      console.log(`✅ ${venue} adapter initialized`);
    } catch (error) {
      console.error(`❌ Failed to initialize ${venue}:`, error);
    }
  }
}

/**
 * Validate and persist market outcome
 */
async function persistMarket(rawMarket: RawMarket): Promise<boolean> {
  try {
    // Validate with Zod
    const validationResult = MarketOutcomeSchema.safeParse(rawMarket);
    if (!validationResult.success) {
      console.warn(`Invalid market data from ${rawMarket.venue}:`, validationResult.error.message);
      return false;
    }

    const market = validationResult.data;

    // Upsert to database
    await db.query(
      `INSERT INTO pm_market_outcomes (
        venue, market_id_native, outcome_id_native, title, description,
        tags, outcome_name, mechanism, quote_currency, fee_bps, tick_size,
        open_ts, close_ts, resolve_ts, status, resolution_source,
        truth_spec_text, truth_ambiguity_score
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 
                to_timestamp($12/1000.0), $13::timestamptz, $14::timestamptz, 
                $15, $16, $17, $18)
      ON CONFLICT (venue, outcome_id_native) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        tags = EXCLUDED.tags,
        status = EXCLUDED.status,
        close_ts = EXCLUDED.close_ts,
        resolve_ts = EXCLUDED.resolve_ts,
        updated_at = NOW()`,
      [
        market.venue,
        market.market_id_native,
        market.outcome_id_native,
        market.title,
        market.description || null,
        JSON.stringify(market.tags),
        market.outcome_name,
        market.mechanism,
        market.quote_currency,
        market.fee_bps,
        market.tick_size,
        market.open_ts,
        market.close_ts ? new Date(market.close_ts).toISOString() : null,
        market.resolve_ts ? new Date(market.resolve_ts).toISOString() : null,
        market.status,
        market.resolution_source,
        market.truth_spec_text,
        market.truth_ambiguity_score,
      ]
    );

    return true;
  } catch (error) {
    console.error('Failed to persist market:', error);
    return false;
  }
}

/**
 * Validate and persist liquidity snapshot
 */
async function persistLiquidity(rawLiquidity: RawLiquidity): Promise<boolean> {
  try {
    // Validate with Zod
    const validationResult = LiquiditySnapshotSchema.safeParse(rawLiquidity);
    if (!validationResult.success) {
      console.warn(`Invalid liquidity data:`, validationResult.error.message);
      return false;
    }

    const liq = validationResult.data;

    // Generate snapshot hash for replay integrity
    const snapshotHash = generateSnapshotHash(liq);

    // Insert to time-series table
    await db.query(
      `INSERT INTO pm_liquidity_snapshots (
        ts, venue, outcome_id_native, best_bid, best_ask, mid, spread,
        depth_usd_1pct, depth_usd_5pct, amm_price, amm_slippage_100,
        amm_slippage_500, amm_slippage_1000, last_update_ts, snapshot_hash
      ) VALUES (
        NOW(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
        to_timestamp($13/1000.0), $14
      )`,
      [
        liq.venue,
        liq.outcome_id_native,
        liq.best_bid,
        liq.best_ask,
        liq.mid,
        liq.spread,
        liq.depth_usd_1pct,
        liq.depth_usd_5pct,
        liq.amm_price,
        liq.amm_slippage_100,
        liq.amm_slippage_500,
        liq.amm_slippage_1000,
        liq.last_update_ts,
        snapshotHash,
      ]
    );

    // Update Redis cache for fast lookup
    const cacheKey = `liquidity:${liq.venue}:${liq.outcome_id_native}`;
    await redis.set(cacheKey, JSON.stringify(liq), { EX: 60 });

    return true;
  } catch (error) {
    console.error('Failed to persist liquidity:', error);
    return false;
  }
}

/**
 * Generate deterministic hash for snapshot (for replay integrity)
 */
function generateSnapshotHash(snapshot: any): string {
  const data = JSON.stringify({
    ts: snapshot.ts,
    venue: snapshot.venue,
    outcome_id: snapshot.outcome_id_native,
    bid: snapshot.best_bid,
    ask: snapshot.best_ask,
    mid: snapshot.mid,
  });
  
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

/**
 * Run ingestion loop for a specific venue
 */
async function runVenueIngestion(venue: string) {
  const adapter = adapters[venue];
  if (!adapter) {
    console.warn(`No adapter for venue: ${venue}`);
    return;
  }

  const interval = INGESTION_INTERVALS[venue] || 10000;
  
  console.log(`Starting ingestion for ${venue} (interval: ${interval}ms)`);

  const ingest = async () => {
    try {
      // Fetch markets
      const markets = await adapter.fetchMarkets();
      let marketCount = 0;
      for (const market of markets) {
        if (await persistMarket(market)) {
          marketCount++;
        }
      }

      // Fetch liquidity for open markets
      const openMarkets = markets.filter((m) => m.status === 'open');
      let liquidityCount = 0;
      for (const market of openMarkets) {
        const liquidity = await adapter.fetchLiquidity(market.outcome_id_native);
        if (liquidity && await persistLiquidity(liquidity)) {
          liquidityCount++;
        }
      }

      console.log(`[${venue}] Ingested ${marketCount} markets, ${liquidityCount} liquidity snapshots`);
    } catch (error) {
      console.error(`[${venue}] Ingestion error:`, error);
    }
  };

  // Initial run
  await ingest();

  // Schedule recurring ingestion
  setInterval(ingest, interval);
}

/**
 * Main entry point
 */
async function main() {
  console.log('🚀 Market Ingestion Service starting...');

  try {
    // Test database connection
    const client = await db.connect();
    console.log('✅ Database connected');
    client.release();

    // Connect Redis
    await redis.connect();
    console.log('✅ Redis connected');

    // Initialize adapters
    await initializeAdapters();

    // Start ingestion for all venues
    for (const venue of Object.keys(adapters)) {
      runVenueIngestion(venue);
    }

    console.log('✅ Market Ingestion Service running');
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

