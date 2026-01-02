/**
 * Adapter Types for Market Ingestion
 * 
 * All adapters must implement VenueAdapter interface.
 * Raw data is validated against schemas at the boundary.
 */

import type { Venue, MarketMechanism, MarketStatus, QuoteCurrency } from '@arb/schemas';

/**
 * Raw market data from venue (pre-validation)
 */
export interface RawMarket {
  venue: Venue;
  market_id_native: string;
  outcome_id_native: string;
  title: string;
  description?: string;
  tags: string[];
  outcome_name: string;
  mechanism: MarketMechanism;
  quote_currency: QuoteCurrency;
  fee_bps: number | null;
  tick_size: number | null;
  open_ts: number;
  close_ts: number | null;
  resolve_ts: number | null;
  status: MarketStatus;
  resolution_source: string;
  truth_spec_text: string;
  truth_ambiguity_score: number;
}

/**
 * Raw liquidity data from venue (pre-validation)
 */
export interface RawLiquidity {
  ts: number;
  venue: Venue;
  outcome_id_native: string;
  best_bid: number | null;
  best_ask: number | null;
  mid: number | null;
  spread: number | null;
  depth_usd_1pct: number | null;
  depth_usd_5pct: number | null;
  amm_price: number | null;
  amm_slippage_100: number | null;
  amm_slippage_500: number | null;
  amm_slippage_1000: number | null;
  last_update_ts: number;
}

/**
 * Raw order book data
 */
export interface RawOrderBook {
  venue: Venue;
  outcome_id_native: string;
  ts: number;
  bids: Array<{ price: number; size: number }>;
  asks: Array<{ price: number; size: number }>;
}

/**
 * Adapter configuration
 */
export interface AdapterConfig {
  apiKey?: string;
  baseUrl: string;
  rateLimit?: number; // requests per second
  timeout?: number; // ms
}

/**
 * Venue adapter interface
 * All adapters must implement this interface.
 */
export interface VenueAdapter {
  venue: Venue;
  
  /**
   * Initialize the adapter (validate credentials, etc.)
   */
  initialize(): Promise<void>;
  
  /**
   * Fetch all markets from the venue
   */
  fetchMarkets(): Promise<RawMarket[]>;
  
  /**
   * Fetch liquidity snapshot for a specific market
   */
  fetchLiquidity(outcomeId: string): Promise<RawLiquidity | null>;
  
  /**
   * Fetch full order book for a specific market (CLOB only)
   */
  fetchOrderBook?(outcomeId: string): Promise<RawOrderBook | null>;
  
  /**
   * Get the health status of the adapter
   */
  getHealth(): { status: 'healthy' | 'degraded' | 'down'; message?: string };
  
  /**
   * Get the list of market IDs (for completeness audit)
   */
  fetchMarketIds(): Promise<string[]>;
}

