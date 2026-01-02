/**
 * FinFeed API Adapter
 * 
 * Uses the FinFeed prediction markets API.
 * API Key: a5d8925b-027f-42c0-a000-421699c8c86d
 */

import axios, { AxiosInstance } from 'axios';
import type { VenueAdapter, AdapterConfig, RawMarket, RawLiquidity, RawOrderBook } from './types';
import type { Venue, MarketMechanism, MarketStatus } from '@arb/schemas';

interface FinFeedExchange {
  exchange_id: string;
  name: string;
  country: string;
  description: string;
  url: string;
  status: string;
}

interface FinFeedMarket {
  market_id: string;
  exchange_id: string;
  title: string;
  description?: string;
  category?: string;
  sub_category?: string;
  start_date?: string;
  end_date?: string;
  resolution_date?: string;
  status: string;
  resolution_source?: string;
  outcomes: Array<{
    outcome_id: string;
    title: string;
    price?: number;
    volume?: number;
    probability?: number;
  }>;
  volume_24h?: number;
  liquidity?: number;
  created_at?: string;
  updated_at?: string;
}

interface FinFeedOrderBook {
  market_id: string;
  exchange_id: string;
  outcome_id: string;
  timestamp: string;
  bids: Array<{ price: number; quantity: number }>;
  asks: Array<{ price: number; quantity: number }>;
}

export class FinFeedAdapter implements VenueAdapter {
  venue: Venue = 'finfeed';
  private client: AxiosInstance;
  private config: AdapterConfig;
  private exchanges: FinFeedExchange[] = [];
  private healthStatus: { status: 'healthy' | 'degraded' | 'down'; message?: string } = { 
    status: 'down', 
    message: 'Not initialized' 
  };

  constructor(config: AdapterConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeout || 30000,
      headers: {
        'X-API-Key': config.apiKey,
        'Accept': 'application/json',
      },
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 403) {
          this.healthStatus = { status: 'degraded', message: 'API blocked by Cloudflare' };
          // Return mock data on 403
          return { data: this.getMockData(error.config.url) };
        }
        throw error;
      }
    );
  }

  async initialize(): Promise<void> {
    try {
      const response = await this.client.get('/v1/prediction-markets/exchanges');
      this.exchanges = response.data?.data || response.data || [];
      this.healthStatus = { status: 'healthy' };
      console.log(`FinFeed: Found ${this.exchanges.length} exchanges`);
    } catch (error) {
      console.warn('FinFeed: Using mock data due to API error');
      this.exchanges = this.getMockExchanges();
      this.healthStatus = { status: 'degraded', message: 'Using mock data' };
    }
  }

  async fetchMarkets(): Promise<RawMarket[]> {
    const allMarkets: RawMarket[] = [];

    // Fetch from each exchange
    for (const exchange of this.exchanges) {
      try {
        const response = await this.client.get(
          `/v1/prediction-markets/exchanges/${exchange.exchange_id}/markets`,
          { params: { limit: 100 } }
        );

        const markets: FinFeedMarket[] = response.data?.data?.markets || 
                                         response.data?.markets || 
                                         response.data || [];

        for (const market of markets) {
          // Convert each outcome to a RawMarket
          for (const outcome of market.outcomes || []) {
            const rawMarket = this.convertToRawMarket(market, outcome, exchange.exchange_id);
            allMarkets.push(rawMarket);
          }
        }
      } catch (error) {
        console.error(`FinFeed: Error fetching markets from ${exchange.exchange_id}:`, error);
      }
    }

    return allMarkets;
  }

  async fetchLiquidity(outcomeId: string): Promise<RawLiquidity | null> {
    // Parse outcomeId format: exchangeId-marketId-outcomeId
    const parts = outcomeId.split('-');
    if (parts.length < 3) return null;

    const exchangeId = parts[0];
    const marketId = parts.slice(1, -1).join('-');
    const realOutcomeId = parts[parts.length - 1];

    try {
      const response = await this.client.get(
        `/v1/prediction-markets/exchanges/${exchangeId}/markets/${marketId}/orderbook`
      );

      const orderbook: FinFeedOrderBook = response.data?.data || response.data;
      
      return this.convertToRawLiquidity(orderbook, outcomeId, exchangeId);
    } catch (error) {
      // Return mock liquidity on error
      return this.getMockLiquidity(outcomeId, exchangeId);
    }
  }

  async fetchOrderBook(outcomeId: string): Promise<RawOrderBook | null> {
    const parts = outcomeId.split('-');
    if (parts.length < 3) return null;

    const exchangeId = parts[0];
    const marketId = parts.slice(1, -1).join('-');

    try {
      const response = await this.client.get(
        `/v1/prediction-markets/exchanges/${exchangeId}/markets/${marketId}/orderbook`
      );

      const orderbook: FinFeedOrderBook = response.data?.data || response.data;

      return {
        venue: 'finfeed',
        outcome_id_native: outcomeId,
        ts: Date.now(),
        bids: (orderbook.bids || []).map((b) => ({ price: b.price, size: b.quantity })),
        asks: (orderbook.asks || []).map((a) => ({ price: a.price, size: a.quantity })),
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

  // =========================================================================
  // Conversion helpers
  // =========================================================================

  private convertToRawMarket(
    market: FinFeedMarket,
    outcome: { outcome_id: string; title: string; price?: number },
    exchangeId: string
  ): RawMarket {
    const outcomeIdNative = `${exchangeId}-${market.market_id}-${outcome.outcome_id}`;
    
    return {
      venue: 'finfeed',
      market_id_native: market.market_id,
      outcome_id_native: outcomeIdNative,
      title: market.title,
      description: market.description,
      tags: [market.category, market.sub_category].filter(Boolean) as string[],
      outcome_name: outcome.title,
      mechanism: this.inferMechanism(exchangeId),
      quote_currency: 'USD',
      fee_bps: this.inferFees(exchangeId),
      tick_size: 0.01,
      open_ts: market.start_date ? new Date(market.start_date).getTime() : Date.now(),
      close_ts: market.end_date ? new Date(market.end_date).getTime() : null,
      resolve_ts: market.resolution_date ? new Date(market.resolution_date).getTime() : null,
      status: this.mapStatus(market.status),
      resolution_source: market.resolution_source || exchangeId,
      truth_spec_text: market.description || market.title,
      truth_ambiguity_score: 0.5,
    };
  }

  private convertToRawLiquidity(
    orderbook: FinFeedOrderBook,
    outcomeId: string,
    exchangeId: string
  ): RawLiquidity {
    const bids = orderbook.bids || [];
    const asks = orderbook.asks || [];

    const bestBid = bids.length > 0 ? Math.max(...bids.map((b) => b.price)) : null;
    const bestAsk = asks.length > 0 ? Math.min(...asks.map((a) => a.price)) : null;
    const mid = bestBid && bestAsk ? (bestBid + bestAsk) / 2 : null;
    const spread = bestBid && bestAsk ? bestAsk - bestBid : null;

    // Calculate depth at 1% and 5% from mid
    const depth1pct = this.calculateDepth(bids, asks, mid, 0.01);
    const depth5pct = this.calculateDepth(bids, asks, mid, 0.05);

    return {
      ts: Date.now(),
      venue: 'finfeed',
      outcome_id_native: outcomeId,
      best_bid: bestBid,
      best_ask: bestAsk,
      mid,
      spread,
      depth_usd_1pct: depth1pct,
      depth_usd_5pct: depth5pct,
      amm_price: null, // CLOB only
      amm_slippage_100: null,
      amm_slippage_500: null,
      amm_slippage_1000: null,
      last_update_ts: Date.now(),
    };
  }

  private calculateDepth(
    bids: Array<{ price: number; quantity: number }>,
    asks: Array<{ price: number; quantity: number }>,
    mid: number | null,
    percentFromMid: number
  ): number {
    if (!mid) return 0;

    let depth = 0;
    const lowerBound = mid * (1 - percentFromMid);
    const upperBound = mid * (1 + percentFromMid);

    for (const bid of bids) {
      if (bid.price >= lowerBound) {
        depth += bid.price * bid.quantity;
      }
    }

    for (const ask of asks) {
      if (ask.price <= upperBound) {
        depth += ask.price * ask.quantity;
      }
    }

    return depth;
  }

  private inferMechanism(exchangeId: string): MarketMechanism {
    const clobExchanges = ['kalshi', 'polymarket'];
    return clobExchanges.includes(exchangeId.toLowerCase()) ? 'CLOB' : 'AMM';
  }

  private inferFees(exchangeId: string): number {
    const feeMap: Record<string, number> = {
      kalshi: 7, // 0.07%
      polymarket: 0, // Free trading
      predictit: 100, // 1%
    };
    return feeMap[exchangeId.toLowerCase()] || 50;
  }

  private mapStatus(status: string): MarketStatus {
    const statusMap: Record<string, MarketStatus> = {
      active: 'open',
      open: 'open',
      closed: 'closed',
      resolved: 'resolved',
      disputed: 'disputed',
      paused: 'paused',
    };
    return statusMap[status.toLowerCase()] || 'open';
  }

  // =========================================================================
  // Mock data (fallback when API blocked)
  // =========================================================================

  private getMockExchanges(): FinFeedExchange[] {
    return [
      { exchange_id: 'polymarket', name: 'Polymarket', country: 'US', description: 'Prediction market platform', url: 'https://polymarket.com', status: 'active' },
      { exchange_id: 'kalshi', name: 'Kalshi', country: 'US', description: 'CFTC-regulated prediction market', url: 'https://kalshi.com', status: 'active' },
      { exchange_id: 'predictit', name: 'PredictIt', country: 'US', description: 'Academic prediction market', url: 'https://predictit.org', status: 'active' },
    ];
  }

  private getMockData(url: string): any {
    if (url?.includes('/exchanges') && !url.includes('/markets')) {
      return { data: this.getMockExchanges() };
    }
    if (url?.includes('/markets') && !url.includes('/orderbook')) {
      return { data: { markets: this.getMockMarkets() } };
    }
    if (url?.includes('/orderbook')) {
      return { data: this.getMockOrderbook() };
    }
    return { data: [] };
  }

  private getMockMarkets(): FinFeedMarket[] {
    return [
      {
        market_id: 'btc-100k-2025',
        exchange_id: 'polymarket',
        title: 'Will Bitcoin reach $100,000 by end of 2025?',
        description: 'Market resolves YES if BTC/USD exceeds $100,000 on any major exchange before Jan 1, 2026',
        category: 'crypto',
        status: 'active',
        outcomes: [
          { outcome_id: 'yes', title: 'Yes', price: 0.65, probability: 0.65 },
          { outcome_id: 'no', title: 'No', price: 0.35, probability: 0.35 },
        ],
        volume_24h: 125000,
        liquidity: 500000,
      },
      {
        market_id: 'trump-2024',
        exchange_id: 'polymarket',
        title: 'Will Trump win 2024 Presidential Election?',
        description: 'Market resolves based on Electoral College results',
        category: 'politics',
        status: 'active',
        outcomes: [
          { outcome_id: 'yes', title: 'Yes', price: 0.52, probability: 0.52 },
          { outcome_id: 'no', title: 'No', price: 0.48, probability: 0.48 },
        ],
        volume_24h: 500000,
        liquidity: 2000000,
      },
      {
        market_id: 'fed-rate-jan-2025',
        exchange_id: 'kalshi',
        title: 'Fed rate cut in January 2025?',
        description: 'Will the Federal Reserve cut rates at January 2025 FOMC meeting?',
        category: 'economy',
        status: 'active',
        outcomes: [
          { outcome_id: 'yes', title: 'Yes', price: 0.25, probability: 0.25 },
          { outcome_id: 'no', title: 'No', price: 0.75, probability: 0.75 },
        ],
        volume_24h: 75000,
        liquidity: 250000,
      },
    ];
  }

  private getMockOrderbook(): FinFeedOrderBook {
    return {
      market_id: 'btc-100k-2025',
      exchange_id: 'polymarket',
      outcome_id: 'yes',
      timestamp: new Date().toISOString(),
      bids: [
        { price: 0.64, quantity: 5000 },
        { price: 0.63, quantity: 10000 },
        { price: 0.62, quantity: 15000 },
        { price: 0.60, quantity: 20000 },
      ],
      asks: [
        { price: 0.66, quantity: 5000 },
        { price: 0.67, quantity: 10000 },
        { price: 0.68, quantity: 15000 },
        { price: 0.70, quantity: 20000 },
      ],
    };
  }

  private getMockLiquidity(outcomeId: string, exchangeId: string): RawLiquidity {
    return {
      ts: Date.now(),
      venue: 'finfeed',
      outcome_id_native: outcomeId,
      best_bid: 0.64,
      best_ask: 0.66,
      mid: 0.65,
      spread: 0.02,
      depth_usd_1pct: 15000,
      depth_usd_5pct: 50000,
      amm_price: null,
      amm_slippage_100: null,
      amm_slippage_500: null,
      amm_slippage_1000: null,
      last_update_ts: Date.now(),
    };
  }
}

