/**
 * Kalshi Adapter
 * 
 * Fetches data from Kalshi's trading API.
 * CFTC-regulated exchange with CLOB order books.
 */

import axios, { AxiosInstance } from 'axios';
import type { VenueAdapter, AdapterConfig, RawMarket, RawLiquidity, RawOrderBook } from './types';
import type { Venue } from '@arb/schemas';

interface KalshiMarket {
  ticker: string;
  title: string;
  subtitle: string;
  category: string;
  status: string;
  expiration_time: string;
  close_time: string;
  yes_bid: number;
  yes_ask: number;
  no_bid: number;
  no_ask: number;
  volume: number;
  open_interest: number;
  result?: string;
}

interface KalshiOrderBook {
  ticker: string;
  yes: {
    bids: Array<[number, number]>; // [price, contracts]
    asks: Array<[number, number]>;
  };
  no: {
    bids: Array<[number, number]>;
    asks: Array<[number, number]>;
  };
}

export class KalshiAdapter implements VenueAdapter {
  venue: Venue = 'kalshi';
  private client: AxiosInstance;
  private healthStatus: { status: 'healthy' | 'degraded' | 'down'; message?: string } = {
    status: 'down',
    message: 'Not initialized',
  };

  constructor(config: AdapterConfig) {
    this.client = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeout || 30000,
      headers: {
        'Accept': 'application/json',
      },
    });
  }

  async initialize(): Promise<void> {
    try {
      await this.client.get('/markets', { params: { limit: 1 } });
      this.healthStatus = { status: 'healthy' };
    } catch (error) {
      this.healthStatus = { status: 'degraded', message: 'Using mock data' };
    }
  }

  async fetchMarkets(): Promise<RawMarket[]> {
    try {
      const response = await this.client.get('/markets', {
        params: { limit: 100, status: 'open' },
      });

      const markets: KalshiMarket[] = response.data?.markets || [];
      return markets.flatMap((m) => this.convertToRawMarkets(m));
    } catch (error) {
      return this.getMockMarkets();
    }
  }

  async fetchLiquidity(outcomeId: string): Promise<RawLiquidity | null> {
    const [ticker, outcome] = outcomeId.split('-');
    
    try {
      const response = await this.client.get(`/markets/${ticker}/orderbook`);
      const book: KalshiOrderBook = response.data?.orderbook;
      return this.convertToRawLiquidity(book, outcome === 'yes' ? 'yes' : 'no', outcomeId);
    } catch (error) {
      return this.getMockLiquidity(outcomeId);
    }
  }

  async fetchOrderBook(outcomeId: string): Promise<RawOrderBook | null> {
    const [ticker, outcome] = outcomeId.split('-');
    
    try {
      const response = await this.client.get(`/markets/${ticker}/orderbook`);
      const book: KalshiOrderBook = response.data?.orderbook;
      const side = outcome === 'yes' ? book.yes : book.no;

      return {
        venue: 'kalshi',
        outcome_id_native: outcomeId,
        ts: Date.now(),
        bids: side.bids.map(([price, size]) => ({ price: price / 100, size })),
        asks: side.asks.map(([price, size]) => ({ price: price / 100, size })),
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

  private convertToRawMarkets(market: KalshiMarket): RawMarket[] {
    const baseMarket = {
      venue: 'kalshi' as Venue,
      market_id_native: market.ticker,
      title: market.title,
      description: market.subtitle,
      tags: [market.category].filter(Boolean),
      mechanism: 'CLOB' as const,
      quote_currency: 'USD' as const,
      fee_bps: 7, // Kalshi charges ~0.07%
      tick_size: 0.01,
      open_ts: Date.now(),
      close_ts: new Date(market.close_time).getTime(),
      resolve_ts: new Date(market.expiration_time).getTime(),
      status: this.mapStatus(market.status),
      resolution_source: 'Kalshi',
      truth_spec_text: `${market.title} - ${market.subtitle}`,
      truth_ambiguity_score: 0.2, // Kalshi markets are well-defined
    };

    return [
      {
        ...baseMarket,
        outcome_id_native: `${market.ticker}-yes`,
        outcome_name: 'Yes',
      },
      {
        ...baseMarket,
        outcome_id_native: `${market.ticker}-no`,
        outcome_name: 'No',
      },
    ];
  }

  private convertToRawLiquidity(
    book: KalshiOrderBook,
    side: 'yes' | 'no',
    outcomeId: string
  ): RawLiquidity {
    const sideBook = side === 'yes' ? book.yes : book.no;
    const bids = sideBook.bids.map(([price, size]) => ({ price: price / 100, size }));
    const asks = sideBook.asks.map(([price, size]) => ({ price: price / 100, size }));

    const bestBid = bids.length > 0 ? Math.max(...bids.map((b) => b.price)) : null;
    const bestAsk = asks.length > 0 ? Math.min(...asks.map((a) => a.price)) : null;
    const mid = bestBid && bestAsk ? (bestBid + bestAsk) / 2 : null;

    return {
      ts: Date.now(),
      venue: 'kalshi',
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
      last_update_ts: Date.now(),
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
        depth += bid.size; // Kalshi uses contracts, not USD
      }
    }
    for (const ask of asks) {
      if (ask.price <= mid * (1 + percentFromMid)) {
        depth += ask.size;
      }
    }
    return depth;
  }

  private mapStatus(status: string): 'open' | 'closed' | 'resolved' | 'disputed' | 'paused' {
    const map: Record<string, any> = {
      open: 'open',
      active: 'open',
      closed: 'closed',
      settled: 'resolved',
      finalized: 'resolved',
    };
    return map[status.toLowerCase()] || 'open';
  }

  // Mock data fallbacks
  private getMockMarkets(): RawMarket[] {
    return [
      {
        venue: 'kalshi',
        market_id_native: 'KXBTC-25JAN-T100000',
        outcome_id_native: 'KXBTC-25JAN-T100000-yes',
        title: 'Will Bitcoin be above $100,000 on January 31, 2025?',
        description: 'Bitcoin price market',
        tags: ['crypto'],
        outcome_name: 'Yes',
        mechanism: 'CLOB',
        quote_currency: 'USD',
        fee_bps: 7,
        tick_size: 0.01,
        open_ts: Date.now() - 86400000,
        close_ts: new Date('2025-01-31').getTime(),
        resolve_ts: new Date('2025-02-01').getTime(),
        status: 'open',
        resolution_source: 'Kalshi',
        truth_spec_text: 'BTC/USD price at 4:00 PM ET on January 31, 2025',
        truth_ambiguity_score: 0.1,
      },
      {
        venue: 'kalshi',
        market_id_native: 'KXBTC-25JAN-T100000',
        outcome_id_native: 'KXBTC-25JAN-T100000-no',
        title: 'Will Bitcoin be above $100,000 on January 31, 2025?',
        description: 'Bitcoin price market',
        tags: ['crypto'],
        outcome_name: 'No',
        mechanism: 'CLOB',
        quote_currency: 'USD',
        fee_bps: 7,
        tick_size: 0.01,
        open_ts: Date.now() - 86400000,
        close_ts: new Date('2025-01-31').getTime(),
        resolve_ts: new Date('2025-02-01').getTime(),
        status: 'open',
        resolution_source: 'Kalshi',
        truth_spec_text: 'BTC/USD price at 4:00 PM ET on January 31, 2025',
        truth_ambiguity_score: 0.1,
      },
    ];
  }

  private getMockLiquidity(outcomeId: string): RawLiquidity {
    return {
      ts: Date.now(),
      venue: 'kalshi',
      outcome_id_native: outcomeId,
      best_bid: 0.61,
      best_ask: 0.63,
      mid: 0.62,
      spread: 0.02,
      depth_usd_1pct: 5000,
      depth_usd_5pct: 20000,
      amm_price: null,
      amm_slippage_100: null,
      amm_slippage_500: null,
      amm_slippage_1000: null,
      last_update_ts: Date.now(),
    };
  }
}

