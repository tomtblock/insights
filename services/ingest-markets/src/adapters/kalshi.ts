/**
 * Kalshi API Integration
 * 
 * WebSocket: wss://api.elections.kalshi.com/trade-api/ws/v2
 * REST: https://api.elections.kalshi.com/trade-api/v2
 * 
 * Documentation: https://trading-api.readme.io/reference
 */

import axios, { AxiosInstance } from 'axios';
import WebSocket from 'ws';
import { EventEmitter } from 'events';

// ============ API ENDPOINTS ============
const KALSHI_WS_URL = 'wss://api.elections.kalshi.com/trade-api/ws/v2';
const KALSHI_REST_URL = 'https://api.elections.kalshi.com/trade-api/v2';
const KALSHI_DEMO_REST_URL = 'https://demo-api.kalshi.co/trade-api/v2';

// ============ TYPES ============

export interface KalshiMarket {
  ticker: string;
  event_ticker: string;
  market_type: string;
  title: string;
  subtitle?: string;
  yes_sub_title?: string;
  no_sub_title?: string;
  open_time: string;
  close_time: string;
  expected_expiration_time: string;
  expiration_time?: string;
  status: 'open' | 'closed' | 'settled';
  response_price_units: string;
  notional_value: number;
  tick_size: number;
  yes_bid: number;
  yes_ask: number;
  no_bid: number;
  no_ask: number;
  last_price: number;
  previous_yes_bid?: number;
  previous_yes_ask?: number;
  previous_price?: number;
  volume: number;
  volume_24h: number;
  liquidity: number;
  open_interest: number;
  result?: string;
  cap_strike?: number;
  rules_primary?: string;
  rules_secondary?: string;
  settlement_timer_seconds?: number;
  category?: string;
  tags?: string[];
}

export interface KalshiEvent {
  event_ticker: string;
  series_ticker: string;
  title: string;
  mutually_exclusive: boolean;
  category: string;
  sub_title?: string;
  strike_date?: string;
  markets: KalshiMarket[];
}

export interface KalshiOrderBook {
  ticker: string;
  yes: KalshiOrderBookSide;
  no: KalshiOrderBookSide;
}

export interface KalshiOrderBookSide {
  bids: KalshiOrderBookLevel[];
  asks: KalshiOrderBookLevel[];
}

export interface KalshiOrderBookLevel {
  price: number;
  quantity: number;
}

export interface KalshiTrade {
  trade_id: string;
  ticker: string;
  side: 'yes' | 'no';
  yes_price: number;
  no_price: number;
  count: number;
  taker_side: 'yes' | 'no';
  created_time: string;
}

export interface KalshiWSMessage {
  type: string;
  msg?: any;
  sid?: number;
}

export interface KalshiSnapshot {
  market_ticker: string;
  yes_bid: number;
  yes_ask: number;
  no_bid: number;
  no_ask: number;
  last_price: number;
  volume: number;
  open_interest: number;
  timestamp: string;
}

// ============ KALSHI REST CLIENT ============

export class KalshiRestClient {
  private client: AxiosInstance;
  private apiKey?: string;

  constructor(apiKey?: string, demo: boolean = false) {
    this.apiKey = apiKey;
    this.client = axios.create({
      baseURL: demo ? KALSHI_DEMO_REST_URL : KALSHI_REST_URL,
      timeout: 30000,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
      }
    });
  }

  /**
   * Get all events
   */
  async getEvents(params?: {
    limit?: number;
    cursor?: string;
    status?: string;
    series_ticker?: string;
    with_nested_markets?: boolean;
  }): Promise<{ events: KalshiEvent[]; cursor?: string }> {
    const response = await this.client.get('/events', { params });
    return response.data;
  }

  /**
   * Get a specific event
   */
  async getEvent(eventTicker: string, withNestedMarkets: boolean = true): Promise<KalshiEvent> {
    const response = await this.client.get(`/events/${eventTicker}`, {
      params: { with_nested_markets: withNestedMarkets }
    });
    return response.data.event;
  }

  /**
   * Get all markets
   */
  async getMarkets(params?: {
    limit?: number;
    cursor?: string;
    event_ticker?: string;
    series_ticker?: string;
    status?: string;
    tickers?: string;
    min_close_ts?: number;
    max_close_ts?: number;
  }): Promise<{ markets: KalshiMarket[]; cursor?: string }> {
    const response = await this.client.get('/markets', { params });
    return response.data;
  }

  /**
   * Get a specific market
   */
  async getMarket(ticker: string): Promise<KalshiMarket> {
    const response = await this.client.get(`/markets/${ticker}`);
    return response.data.market;
  }

  /**
   * Get order book for a market
   */
  async getOrderBook(ticker: string, depth?: number): Promise<KalshiOrderBook> {
    const response = await this.client.get(`/markets/${ticker}/orderbook`, {
      params: { depth }
    });
    return response.data.orderbook;
  }

  /**
   * Get trades for a market
   */
  async getTrades(ticker: string, params?: {
    limit?: number;
    cursor?: string;
    min_ts?: number;
    max_ts?: number;
  }): Promise<{ trades: KalshiTrade[]; cursor?: string }> {
    const response = await this.client.get(`/markets/${ticker}/trades`, { params });
    return response.data;
  }

  /**
   * Get market history (candlesticks)
   */
  async getMarketHistory(ticker: string, params?: {
    start_ts?: number;
    end_ts?: number;
    period_interval?: number; // in minutes
  }): Promise<{ history: any[] }> {
    const response = await this.client.get(`/markets/${ticker}/history`, { params });
    return response.data;
  }

  /**
   * Get series (categories)
   */
  async getSeries(params?: {
    limit?: number;
    cursor?: string;
  }): Promise<{ series: any[]; cursor?: string }> {
    const response = await this.client.get('/series', { params });
    return response.data;
  }

  /**
   * Search markets
   */
  async search(query: string): Promise<{ markets: KalshiMarket[]; events: KalshiEvent[] }> {
    // Kalshi doesn't have a dedicated search endpoint, so we search in title
    const { markets } = await this.getMarkets({ limit: 200, status: 'open' });
    const queryLower = query.toLowerCase();
    
    const filteredMarkets = markets.filter(m => 
      m.title.toLowerCase().includes(queryLower) ||
      m.ticker.toLowerCase().includes(queryLower)
    );

    // Group by event
    const eventTickers = [...new Set(filteredMarkets.map(m => m.event_ticker))];
    const events: KalshiEvent[] = [];
    
    for (const ticker of eventTickers.slice(0, 10)) {
      try {
        const event = await this.getEvent(ticker);
        events.push(event);
      } catch (e) {
        // Event not found
      }
    }

    return { markets: filteredMarkets, events };
  }
}

// ============ KALSHI WEBSOCKET CLIENT ============

export class KalshiWebSocketClient extends EventEmitter {
  private ws: WebSocket | null = null;
  private apiKey?: string;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000;
  private subscriptions: Set<string> = new Set();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private isConnected: boolean = false;
  private messageId: number = 1;

  constructor(apiKey?: string) {
    super();
    this.apiKey = apiKey;
  }

  /**
   * Connect to WebSocket
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const url = this.apiKey 
          ? `${KALSHI_WS_URL}?token=${this.apiKey}`
          : KALSHI_WS_URL;

        this.ws = new WebSocket(url);

        this.ws.on('open', () => {
          console.log('Kalshi WebSocket connected');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          this.emit('connected');
          
          // Resubscribe to previous subscriptions
          for (const ticker of this.subscriptions) {
            this.subscribeToMarket(ticker);
          }
          
          resolve();
        });

        this.ws.on('message', (data: Buffer) => {
          try {
            const message = JSON.parse(data.toString());
            this.handleMessage(message);
          } catch (e) {
            console.error('Failed to parse Kalshi message:', e);
          }
        });

        this.ws.on('close', (code, reason) => {
          console.log(`Kalshi WebSocket closed: ${code} - ${reason}`);
          this.isConnected = false;
          this.stopHeartbeat();
          this.emit('disconnected', { code, reason: reason.toString() });
          this.attemptReconnect();
        });

        this.ws.on('error', (error) => {
          console.error('Kalshi WebSocket error:', error);
          this.emit('error', error);
          if (!this.isConnected) {
            reject(error);
          }
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    this.subscriptions.clear();
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
  }

  /**
   * Subscribe to market updates
   */
  subscribeToMarket(ticker: string): void {
    this.subscriptions.add(ticker);
    if (this.isConnected && this.ws) {
      this.send({
        id: this.messageId++,
        cmd: 'subscribe',
        params: {
          channels: ['ticker'],
          market_tickers: [ticker]
        }
      });
    }
  }

  /**
   * Subscribe to orderbook updates
   */
  subscribeToOrderbook(ticker: string): void {
    if (this.isConnected && this.ws) {
      this.send({
        id: this.messageId++,
        cmd: 'subscribe',
        params: {
          channels: ['orderbook_delta'],
          market_tickers: [ticker]
        }
      });
    }
  }

  /**
   * Subscribe to trade updates
   */
  subscribeToTrades(ticker: string): void {
    if (this.isConnected && this.ws) {
      this.send({
        id: this.messageId++,
        cmd: 'subscribe',
        params: {
          channels: ['trade'],
          market_tickers: [ticker]
        }
      });
    }
  }

  /**
   * Unsubscribe from market
   */
  unsubscribeFromMarket(ticker: string): void {
    this.subscriptions.delete(ticker);
    if (this.isConnected && this.ws) {
      this.send({
        id: this.messageId++,
        cmd: 'unsubscribe',
        params: {
          channels: ['ticker', 'orderbook_delta', 'trade'],
          market_tickers: [ticker]
        }
      });
    }
  }

  /**
   * Send message to WebSocket
   */
  private send(message: any): void {
    if (this.ws && this.isConnected) {
      this.ws.send(JSON.stringify(message));
    }
  }

  /**
   * Handle incoming messages
   */
  private handleMessage(message: any): void {
    switch (message.type) {
      case 'ticker':
        this.emit('ticker', message.msg);
        break;
      case 'orderbook_delta':
        this.emit('orderbook', message.msg);
        break;
      case 'orderbook_snapshot':
        this.emit('orderbook_snapshot', message.msg);
        break;
      case 'trade':
        this.emit('trade', message.msg);
        break;
      case 'subscribed':
        this.emit('subscribed', message.msg);
        break;
      case 'unsubscribed':
        this.emit('unsubscribed', message.msg);
        break;
      case 'error':
        this.emit('ws_error', message.msg);
        break;
      default:
        this.emit('message', message);
    }
  }

  /**
   * Start heartbeat
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected && this.ws) {
        this.ws.ping();
      }
    }, 30000);
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Attempt to reconnect
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnect attempts reached');
      this.emit('max_reconnect_reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      this.connect().catch(err => {
        console.error('Reconnection failed:', err);
      });
    }, delay);
  }

  /**
   * Get connection status
   */
  getStatus(): { connected: boolean; subscriptions: string[] } {
    return {
      connected: this.isConnected,
      subscriptions: Array.from(this.subscriptions)
    };
  }
}

// ============ MARKET TRANSFORMER ============

/**
 * Transform Kalshi market to platform-standard format
 */
export function transformKalshiMarket(market: KalshiMarket): {
  market_id_native: string;
  venue: string;
  title: string;
  description: string;
  category: string;
  outcomes: string[];
  prices: number[];
  volume_24h: number;
  liquidity: number;
  open_interest: number;
  end_date: string;
  status: string;
  url: string;
  ticker: string;
  event_ticker: string;
  yes_bid: number;
  yes_ask: number;
  no_bid: number;
  no_ask: number;
  spread: number;
  last_price: number;
} {
  const yesMid = (market.yes_bid + market.yes_ask) / 2 / 100;
  const noMid = (market.no_bid + market.no_ask) / 2 / 100;
  const spread = (market.yes_ask - market.yes_bid) / 100;

  return {
    market_id_native: market.ticker,
    venue: 'kalshi',
    title: market.title,
    description: market.rules_primary || '',
    category: market.category || 'Uncategorized',
    outcomes: ['Yes', 'No'],
    prices: [yesMid, noMid],
    volume_24h: market.volume_24h || 0,
    liquidity: market.liquidity || 0,
    open_interest: market.open_interest || 0,
    end_date: market.expected_expiration_time || market.close_time,
    status: market.status,
    url: `https://kalshi.com/markets/${market.event_ticker}/${market.ticker}`,
    ticker: market.ticker,
    event_ticker: market.event_ticker,
    yes_bid: market.yes_bid / 100,
    yes_ask: market.yes_ask / 100,
    no_bid: market.no_bid / 100,
    no_ask: market.no_ask / 100,
    spread,
    last_price: market.last_price / 100
  };
}

/**
 * Compare Polymarket and Kalshi markets
 */
export interface MarketComparison {
  polymarket?: {
    id: string;
    question: string;
    yesPrice: number;
    noPrice: number;
    spread: number;
    volume: number;
    liquidity: number;
    url: string;
  };
  kalshi?: {
    ticker: string;
    title: string;
    yesBid: number;
    yesAsk: number;
    spread: number;
    volume: number;
    liquidity: number;
    openInterest: number;
    url: string;
  };
  priceDiff?: number;
  arbOpportunity?: boolean;
  arbEdge?: number;
}

// Export singleton instances
export const kalshiRestClient = new KalshiRestClient();
export const kalshiWsClient = new KalshiWebSocketClient();
