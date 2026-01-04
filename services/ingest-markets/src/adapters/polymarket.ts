/**
 * Polymarket API Integration
 * 
 * Integrates three Polymarket APIs:
 * - Gamma API: Market metadata, categorization, indexed volume
 * - CLOB API: Central Limit Order Book for trading
 * - Data API: User positions and market data
 * 
 * Documentation: https://docs.polymarket.com/developers
 */

import axios, { AxiosInstance } from 'axios';

// ============ API ENDPOINTS ============
const GAMMA_API_URL = 'https://gamma-api.polymarket.com';
const CLOB_API_URL = 'https://clob.polymarket.com';
const DATA_API_URL = 'https://data-api.polymarket.com';

// ============ TYPES ============

// Gamma API Types
export interface GammaMarket {
  id: string;
  question: string;
  conditionId: string;
  slug: string;
  resolutionSource: string;
  endDate: string;
  liquidity: number;
  volume: number;
  volume24hr: number;
  active: boolean;
  closed: boolean;
  archived: boolean;
  new: boolean;
  featured: boolean;
  restricted: boolean;
  groupItemTitle: string;
  groupItemThreshold: number;
  outcomes: string[];
  outcomePrices: string[];
  clob_token_ids: string[];
  tags: GammaTag[];
  events: GammaEvent[];
  spread: number;
  orderMinSize: number;
  orderPriceMinTickSize: number;
  description: string;
  startDate: string;
  createdAt: string;
  updatedAt: string;
  enableOrderBook: boolean;
  marketMakerAddress: string;
  image: string;
  icon: string;
}

export interface GammaEvent {
  id: string;
  slug: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  image: string;
  icon: string;
  active: boolean;
  closed: boolean;
  archived: boolean;
  new: boolean;
  featured: boolean;
  restricted: boolean;
  liquidity: number;
  volume: number;
  markets: GammaMarket[];
  tags: GammaTag[];
  createdAt: string;
  updatedAt: string;
}

export interface GammaTag {
  id: string;
  label: string;
  slug: string;
}

export interface GammaSearchResult {
  markets: GammaMarket[];
  events: GammaEvent[];
}

// CLOB API Types
export interface CLOBMarket {
  condition_id: string;
  question_id: string;
  tokens: CLOBToken[];
  min_tick_size: string;
  min_order_size: string;
  active: boolean;
  closed: boolean;
  end_date_iso: string;
  game_start_time: string;
  seconds_delay: number;
  fpmm: string;
  maker_base_fee: string;
  taker_base_fee: string;
  notifications_enabled: boolean;
  neg_risk: boolean;
  neg_risk_market_id: string;
  neg_risk_request_id: string;
}

export interface CLOBToken {
  token_id: string;
  outcome: string;
  price: string;
  winner: boolean;
}

export interface CLOBOrderBook {
  market: string;
  asset_id: string;
  timestamp: string;
  bids: CLOBOrderBookEntry[];
  asks: CLOBOrderBookEntry[];
  hash: string;
}

export interface CLOBOrderBookEntry {
  price: string;
  size: string;
}

export interface CLOBTrade {
  id: string;
  taker_order_id: string;
  market: string;
  asset_id: string;
  side: 'BUY' | 'SELL';
  size: string;
  fee_rate_bps: string;
  price: string;
  status: string;
  match_time: string;
  last_update: string;
  outcome: string;
  bucket_index: number;
  owner: string;
  maker_address: string;
  transaction_hash: string;
  trader_side: string;
  type: string;
}

export interface CLOBPriceHistory {
  t: number[]; // timestamps
  p: number[]; // prices
}

// Data API Types
export interface PolymarketPosition {
  proxyWallet: string;
  asset: string;
  conditionId: string;
  size: number;
  avgPrice: number;
  initialValue: number;
  currentValue: number;
  cashPnl: number;
  percentPnl: number;
  totalBought: number;
  realizedPnl: number;
  percentRealizedPnl: number;
  curPrice: number;
  redeemable: boolean;
  mergeable: boolean;
  title: string;
  slug: string;
  icon: string;
  eventSlug: string;
  outcome: string;
  outcomeIndex: number;
  oppositeOutcome: string;
  oppositeAsset: string;
  endDate: string;
  negativeRisk: boolean;
}

export interface MarketTimeseries {
  t: number[];
  p: number[];
  v?: number[];
}

// ============ POLYMARKET CLIENT ============

export class PolymarketClient {
  private gammaClient: AxiosInstance;
  private clobClient: AxiosInstance;
  private dataClient: AxiosInstance;

  constructor() {
    this.gammaClient = axios.create({
      baseURL: GAMMA_API_URL,
      timeout: 30000,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'ArbPlatform/1.0'
      }
    });

    this.clobClient = axios.create({
      baseURL: CLOB_API_URL,
      timeout: 30000,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'ArbPlatform/1.0'
      }
    });

    this.dataClient = axios.create({
      baseURL: DATA_API_URL,
      timeout: 30000,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'ArbPlatform/1.0'
      }
    });
  }

  // ============ GAMMA API METHODS ============

  /**
   * Get all active markets from Gamma API
   */
  async getMarkets(params?: {
    active?: boolean;
    closed?: boolean;
    archived?: boolean;
    limit?: number;
    offset?: number;
    order?: 'volume' | 'liquidity' | 'created' | 'end_date';
    ascending?: boolean;
    tag_id?: string;
  }): Promise<GammaMarket[]> {
    const response = await this.gammaClient.get('/markets', { params });
    return response.data;
  }

  /**
   * Get a specific market by ID or slug
   */
  async getMarket(idOrSlug: string): Promise<GammaMarket> {
    const response = await this.gammaClient.get(`/markets/${idOrSlug}`);
    return response.data;
  }

  /**
   * Get all events from Gamma API
   */
  async getEvents(params?: {
    active?: boolean;
    closed?: boolean;
    archived?: boolean;
    limit?: number;
    offset?: number;
    order?: 'volume' | 'liquidity' | 'created' | 'end_date';
    ascending?: boolean;
    tag_id?: string;
  }): Promise<GammaEvent[]> {
    const response = await this.gammaClient.get('/events', { params });
    return response.data;
  }

  /**
   * Get a specific event by ID or slug
   */
  async getEvent(idOrSlug: string): Promise<GammaEvent> {
    const response = await this.gammaClient.get(`/events/${idOrSlug}`);
    return response.data;
  }

  /**
   * Get all tags
   */
  async getTags(): Promise<GammaTag[]> {
    const response = await this.gammaClient.get('/tags');
    return response.data;
  }

  /**
   * Search markets and events
   */
  async search(query: string): Promise<GammaSearchResult> {
    const response = await this.gammaClient.get('/search', {
      params: { query }
    });
    return response.data;
  }

  // ============ CLOB API METHODS ============

  /**
   * Get CLOB market details
   */
  async getCLOBMarket(conditionId: string): Promise<CLOBMarket> {
    const response = await this.clobClient.get(`/markets/${conditionId}`);
    return response.data;
  }

  /**
   * Get all CLOB markets
   */
  async getCLOBMarkets(nextCursor?: string): Promise<{ data: CLOBMarket[]; next_cursor: string }> {
    const response = await this.clobClient.get('/markets', {
      params: { next_cursor: nextCursor }
    });
    return response.data;
  }

  /**
   * Get order book for a specific token
   */
  async getOrderBook(tokenId: string): Promise<CLOBOrderBook> {
    const response = await this.clobClient.get(`/book`, {
      params: { token_id: tokenId }
    });
    return response.data;
  }

  /**
   * Get order books for multiple tokens
   */
  async getOrderBooks(tokenIds: string[]): Promise<CLOBOrderBook[]> {
    const books = await Promise.all(
      tokenIds.map(id => this.getOrderBook(id).catch(() => null))
    );
    return books.filter((b): b is CLOBOrderBook => b !== null);
  }

  /**
   * Get midpoint price for a token
   */
  async getMidpoint(tokenId: string): Promise<{ mid: string; token_id: string }> {
    const response = await this.clobClient.get(`/midpoint`, {
      params: { token_id: tokenId }
    });
    return response.data;
  }

  /**
   * Get spread for a token
   */
  async getSpread(tokenId: string): Promise<{ spread: string; token_id: string }> {
    const response = await this.clobClient.get(`/spread`, {
      params: { token_id: tokenId }
    });
    return response.data;
  }

  /**
   * Get price for a token
   */
  async getPrice(tokenId: string): Promise<{ price: string; token_id: string }> {
    const response = await this.clobClient.get(`/price`, {
      params: { token_id: tokenId }
    });
    return response.data;
  }

  /**
   * Get prices for multiple tokens
   */
  async getPrices(tokenIds: string[]): Promise<{ token_id: string; price: string }[]> {
    const response = await this.clobClient.get(`/prices`, {
      params: { token_ids: tokenIds.join(',') }
    });
    return response.data;
  }

  /**
   * Get price history for a market
   */
  async getPriceHistory(
    tokenId: string,
    options?: {
      interval?: 'max' | '1w' | '1d' | '6h' | '1h';
      fidelity?: number;
    }
  ): Promise<CLOBPriceHistory> {
    const response = await this.clobClient.get(`/prices-history`, {
      params: {
        market: tokenId,
        interval: options?.interval || '1d',
        fidelity: options?.fidelity || 60
      }
    });
    return response.data;
  }

  /**
   * Get recent trades for a market
   */
  async getTrades(
    conditionId: string,
    options?: {
      maker?: string;
      limit?: number;
      before?: string;
      after?: string;
    }
  ): Promise<CLOBTrade[]> {
    const response = await this.clobClient.get(`/trades`, {
      params: {
        market: conditionId,
        ...options
      }
    });
    return response.data;
  }

  // ============ DATA API METHODS ============

  /**
   * Get user positions
   */
  async getPositions(
    userAddress: string,
    options?: {
      market?: string[];
      eventId?: number[];
      sizeThreshold?: number;
      redeemable?: boolean;
      mergeable?: boolean;
      limit?: number;
      offset?: number;
      sortBy?: 'CURRENT' | 'INITIAL' | 'TOKENS' | 'CASHPNL' | 'PERCENTPNL' | 'TITLE' | 'RESOLVING' | 'PRICE' | 'AVGPRICE';
      sortDirection?: 'ASC' | 'DESC';
      title?: string;
    }
  ): Promise<PolymarketPosition[]> {
    const response = await this.dataClient.get('/positions', {
      params: {
        user: userAddress,
        ...options
      }
    });
    return response.data;
  }

  /**
   * Get market timeseries data
   */
  async getTimeseries(
    conditionId: string,
    options?: {
      startTs?: number;
      endTs?: number;
      fidelity?: number;
    }
  ): Promise<MarketTimeseries> {
    const response = await this.dataClient.get(`/timeseries/${conditionId}`, {
      params: options
    });
    return response.data;
  }

  // ============ AGGREGATED METHODS ============

  /**
   * Get comprehensive market data combining Gamma and CLOB
   */
  async getEnrichedMarket(idOrSlug: string): Promise<{
    gamma: GammaMarket;
    clob: CLOBMarket | null;
    orderBooks: CLOBOrderBook[];
    recentTrades: CLOBTrade[];
  }> {
    const gamma = await this.getMarket(idOrSlug);
    
    let clob: CLOBMarket | null = null;
    let orderBooks: CLOBOrderBook[] = [];
    let recentTrades: CLOBTrade[] = [];

    try {
      clob = await this.getCLOBMarket(gamma.conditionId);
      
      if (gamma.clob_token_ids?.length) {
        orderBooks = await this.getOrderBooks(gamma.clob_token_ids);
      }
      
      recentTrades = await this.getTrades(gamma.conditionId, { limit: 20 });
    } catch (error) {
      console.error('Error fetching CLOB data:', error);
    }

    return { gamma, clob, orderBooks, recentTrades };
  }

  /**
   * Get top markets by volume
   */
  async getTopMarkets(limit: number = 50): Promise<GammaMarket[]> {
    return this.getMarkets({
      active: true,
      closed: false,
      limit,
      order: 'volume',
      ascending: false
    });
  }

  /**
   * Get markets by category/tag
   */
  async getMarketsByTag(tagSlug: string, limit: number = 50): Promise<GammaMarket[]> {
    const tags = await this.getTags();
    const tag = tags.find(t => t.slug === tagSlug);
    
    if (!tag) {
      throw new Error(`Tag not found: ${tagSlug}`);
    }

    return this.getMarkets({
      active: true,
      tag_id: tag.id,
      limit,
      order: 'volume',
      ascending: false
    });
  }

  /**
   * Get market with full order book depth analysis
   */
  async getMarketDepth(tokenId: string): Promise<{
    book: CLOBOrderBook;
    bidDepth: number;
    askDepth: number;
    spread: number;
    midpoint: number;
    bestBid: number;
    bestAsk: number;
  }> {
    const book = await this.getOrderBook(tokenId);
    
    const bidDepth = book.bids.reduce((sum, b) => sum + parseFloat(b.size), 0);
    const askDepth = book.asks.reduce((sum, a) => sum + parseFloat(a.size), 0);
    
    const bestBid = book.bids.length > 0 ? parseFloat(book.bids[0].price) : 0;
    const bestAsk = book.asks.length > 0 ? parseFloat(book.asks[0].price) : 1;
    
    const spread = bestAsk - bestBid;
    const midpoint = (bestBid + bestAsk) / 2;

    return {
      book,
      bidDepth,
      askDepth,
      spread,
      midpoint,
      bestBid,
      bestAsk
    };
  }

  /**
   * Calculate implied probability from order book
   */
  calculateImpliedProbability(market: GammaMarket): {
    outcomes: Array<{
      name: string;
      probability: number;
      price: number;
    }>;
    overround: number;
  } {
    const prices = market.outcomePrices.map(p => parseFloat(p));
    const total = prices.reduce((sum, p) => sum + p, 0);
    const overround = (total - 1) * 100; // As percentage

    return {
      outcomes: market.outcomes.map((name, i) => ({
        name,
        probability: prices[i] / total,
        price: prices[i]
      })),
      overround
    };
  }
}

// ============ MARKET TRANSFORMER ============

/**
 * Transform Polymarket data to platform-standard format
 */
export function transformPolymarketMarket(market: GammaMarket): {
  market_id_native: string;
  venue: string;
  title: string;
  description: string;
  category: string;
  outcomes: string[];
  prices: number[];
  volume_24h: number;
  liquidity: number;
  end_date: string;
  status: string;
  url: string;
  image_url: string;
  condition_id: string;
  clob_token_ids: string[];
  tags: string[];
  spread: number;
} {
  return {
    market_id_native: market.id,
    venue: 'polymarket',
    title: market.question,
    description: market.description || '',
    category: market.tags?.[0]?.label || 'Uncategorized',
    outcomes: market.outcomes,
    prices: market.outcomePrices.map(p => parseFloat(p)),
    volume_24h: market.volume24hr || 0,
    liquidity: market.liquidity || 0,
    end_date: market.endDate,
    status: market.closed ? 'closed' : market.active ? 'active' : 'inactive',
    url: `https://polymarket.com/event/${market.slug}`,
    image_url: market.image || market.icon || '',
    condition_id: market.conditionId,
    clob_token_ids: market.clob_token_ids || [],
    tags: market.tags?.map(t => t.label) || [],
    spread: market.spread || 0
  };
}

// Export singleton instance
export const polymarketClient = new PolymarketClient();
