/**
 * Polymarket Adapter
 * 
 * Fetches data from Polymarket's public API.
 */

import axios, { AxiosInstance } from 'axios';
import type { VenueAdapter, AdapterConfig, RawMarket, RawLiquidity, RawOrderBook } from './types';
import type { Venue } from '@arb/schemas';

interface PolymarketEvent {
  id: string;
  title: string;
  description: string;
  markets: PolymarketMarket[];
  startDate?: string;
  endDate?: string;
  active: boolean;
}

interface PolymarketMarket {
  id: string;
  question: string;
  outcomes: string[];
  outcomePrices: string[];
  volume: string;
  liquidity: string;
  active: boolean;
  closed: boolean;
  resolved: boolean;
  resolutionSource?: string;
  endDate?: string;
}

interface PolymarketBook {
  market: string;
  asset_id: string;
  bids: Array<{ price: string; size: string }>;
  asks: Array<{ price: string; size: string }>;
  timestamp: number;
}

export class PolymarketAdapter implements VenueAdapter {
  venue: Venue = 'polymarket';
  private client: AxiosInstance;
  private healthStatus: { status: 'healthy' | 'degraded' | 'down'; message?: string } = {
    status: 'down',
    message: 'Not initialized',
  };

  constructor(config: AdapterConfig) {
    this.client = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeout || 30000,
    });
  }

  async initialize(): Promise<void> {
    try {
      // Test connection with a simple request
      await this.client.get('/markets', { params: { limit: 1 } });
      this.healthStatus = { status: 'healthy' };
    } catch (error) {
      // Fall back to mock mode
      this.healthStatus = { status: 'degraded', message: 'Using mock data' };
    }
  }

  async fetchMarkets(): Promise<RawMarket[]> {
    try {
      const response = await this.client.get('/markets', {
        params: { limit: 100, active: true },
      });

      const markets: PolymarketMarket[] = response.data || [];
      return markets.flatMap((m) => this.convertToRawMarkets(m));
    } catch (error) {
      // Return mock data on error
      return this.getMockMarkets();
    }
  }

  async fetchLiquidity(outcomeId: string): Promise<RawLiquidity | null> {
    const [marketId, outcome] = outcomeId.split('-');
    
    try {
      const response = await this.client.get(`/book`, {
        params: { token_id: outcomeId },
      });

      const book: PolymarketBook = response.data;
      return this.convertToRawLiquidity(book, outcomeId);
    } catch (error) {
      return this.getMockLiquidity(outcomeId);
    }
  }

  async fetchOrderBook(outcomeId: string): Promise<RawOrderBook | null> {
    try {
      const response = await this.client.get(`/book`, {
        params: { token_id: outcomeId },
      });

      const book: PolymarketBook = response.data;
      return {
        venue: 'polymarket',
        outcome_id_native: outcomeId,
        ts: book.timestamp || Date.now(),
        bids: book.bids.map((b) => ({ price: parseFloat(b.price), size: parseFloat(b.size) })),
        asks: book.asks.map((a) => ({ price: parseFloat(a.price), size: parseFloat(a.size) })),
      };
    } catch (error) {
      return null;
    }
  }

  getHealth() {
    return this.healthStatus;
  }

  async fetchMarketIds(): Promise<string[]> {
    const markets = await this.fetchMarkets();
    return markets.map((m) => m.outcome_id_native);
  }

  private convertToRawMarkets(market: PolymarketMarket): RawMarket[] {
    const outcomes = market.outcomes || ['Yes', 'No'];
    const prices = market.outcomePrices?.map((p) => parseFloat(p)) || [0.5, 0.5];

    return outcomes.map((outcome, i) => ({
      venue: 'polymarket' as Venue,
      market_id_native: market.id,
      outcome_id_native: `${market.id}-${outcome.toLowerCase()}`,
      title: market.question,
      description: '',
      tags: [],
      outcome_name: outcome,
      mechanism: 'CLOB' as const,
      quote_currency: 'USDC' as const,
      fee_bps: 0,
      tick_size: 0.01,
      open_ts: Date.now(),
      close_ts: market.endDate ? new Date(market.endDate).getTime() : null,
      resolve_ts: null,
      status: market.resolved ? 'resolved' : market.closed ? 'closed' : 'open',
      resolution_source: market.resolutionSource || 'Polymarket',
      truth_spec_text: market.question,
      truth_ambiguity_score: 0.3,
    }));
  }

  private convertToRawLiquidity(book: PolymarketBook, outcomeId: string): RawLiquidity {
    const bids = book.bids.map((b) => ({ price: parseFloat(b.price), size: parseFloat(b.size) }));
    const asks = book.asks.map((a) => ({ price: parseFloat(a.price), size: parseFloat(a.size) }));

    const bestBid = bids.length > 0 ? Math.max(...bids.map((b) => b.price)) : null;
    const bestAsk = asks.length > 0 ? Math.min(...asks.map((a) => a.price)) : null;
    const mid = bestBid && bestAsk ? (bestBid + bestAsk) / 2 : null;

    return {
      ts: Date.now(),
      venue: 'polymarket',
      outcome_id_native: outcomeId,
      best_bid: bestBid,
      best_ask: bestAsk,
      mid,
      spread: bestBid && bestAsk ? bestAsk - bestBid : null,
      depth_usd_1pct: this.calculateDepth(bids, asks, mid, 0.01),
      depth_usd_5pct: this.calculateDepth(bids, asks, mid, 0.05),
      amm_price: null,
      amm_slippage_100: null,
      amm_slippage_500: null,
      amm_slippage_1000: null,
      last_update_ts: book.timestamp || Date.now(),
    };
  }

  private calculateDepth(
    bids: Array<{ price: number; size: number }>,
    asks: Array<{ price: number; size: number }>,
    mid: number | null,
    percentFromMid: number
  ): number {
    if (!mid) return 0;
    let depth = 0;
    for (const bid of bids) {
      if (bid.price >= mid * (1 - percentFromMid)) {
        depth += bid.price * bid.size;
      }
    }
    for (const ask of asks) {
      if (ask.price <= mid * (1 + percentFromMid)) {
        depth += ask.price * ask.size;
      }
    }
    return depth;
  }

  // Mock data fallbacks
  private getMockMarkets(): RawMarket[] {
    return [
      {
        venue: 'polymarket',
        market_id_native: 'pm-btc-100k',
        outcome_id_native: 'pm-btc-100k-yes',
        title: 'Will Bitcoin reach $100k by 2025?',
        description: 'BTC price market',
        tags: ['crypto', 'bitcoin'],
        outcome_name: 'Yes',
        mechanism: 'CLOB',
        quote_currency: 'USDC',
        fee_bps: 0,
        tick_size: 0.01,
        open_ts: Date.now() - 86400000,
        close_ts: null,
        resolve_ts: null,
        status: 'open',
        resolution_source: 'Polymarket',
        truth_spec_text: 'BTC exceeds $100,000 on major exchange',
        truth_ambiguity_score: 0.2,
      },
    ];
  }

  private getMockLiquidity(outcomeId: string): RawLiquidity {
    return {
      ts: Date.now(),
      venue: 'polymarket',
      outcome_id_native: outcomeId,
      best_bid: 0.63,
      best_ask: 0.65,
      mid: 0.64,
      spread: 0.02,
      depth_usd_1pct: 25000,
      depth_usd_5pct: 100000,
      amm_price: null,
      amm_slippage_100: null,
      amm_slippage_500: null,
      amm_slippage_1000: null,
      last_update_ts: Date.now(),
    };
  }
}

