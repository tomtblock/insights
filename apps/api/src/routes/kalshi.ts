/**
 * Kalshi API Routes
 * 
 * REST API: https://api.elections.kalshi.com/trade-api/v2
 * WebSocket: wss://api.elections.kalshi.com/trade-api/ws/v2
 */

import { Router, Request, Response } from 'express';
import axios from 'axios';
import WebSocket from 'ws';

const router = Router();

// API Base URL
const KALSHI_API = 'https://api.elections.kalshi.com/trade-api/v2';

// WebSocket connections store
const wsConnections: Map<string, {
  ws: WebSocket;
  subscriptions: Set<string>;
  lastData: Map<string, any>;
}> = new Map();

// Helper for API requests
async function fetchKalshi(path: string, params?: any) {
  const response = await axios.get(`${KALSHI_API}${path}`, {
    params,
    timeout: 30000,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  });
  return response.data;
}

// ============ REST API ROUTES ============

/**
 * GET /kalshi/markets
 * Get all markets
 */
router.get('/markets', async (req: Request, res: Response) => {
  try {
    const {
      limit = '100',
      cursor,
      status = 'open',
      event_ticker,
      series_ticker
    } = req.query;

    const data = await fetchKalshi('/markets', {
      limit: parseInt(limit as string),
      cursor,
      status,
      event_ticker,
      series_ticker
    });

    // Transform markets
    const markets = data.markets.map((m: any) => ({
      ...m,
      yes_price: m.yes_bid ? (m.yes_bid + m.yes_ask) / 2 / 100 : null,
      no_price: m.no_bid ? (m.no_bid + m.no_ask) / 2 / 100 : null,
      spread: m.yes_ask && m.yes_bid ? (m.yes_ask - m.yes_bid) / 100 : null,
      url: `https://kalshi.com/markets/${m.event_ticker}/${m.ticker}`
    }));

    res.json({ markets, cursor: data.cursor });
  } catch (error: any) {
    console.error('Error fetching Kalshi markets:', error.message);
    res.status(500).json({ error: 'Failed to fetch markets', details: error.message });
  }
});

/**
 * GET /kalshi/markets/:ticker
 * Get specific market
 */
router.get('/markets/:ticker', async (req: Request, res: Response) => {
  try {
    const { ticker } = req.params;
    const data = await fetchKalshi(`/markets/${ticker}`);
    
    const market = data.market;
    res.json({
      ...market,
      yes_price: market.yes_bid ? (market.yes_bid + market.yes_ask) / 2 / 100 : null,
      no_price: market.no_bid ? (market.no_bid + market.no_ask) / 2 / 100 : null,
      spread: market.yes_ask && market.yes_bid ? (market.yes_ask - market.yes_bid) / 100 : null,
      url: `https://kalshi.com/markets/${market.event_ticker}/${market.ticker}`
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch market', details: error.message });
  }
});

/**
 * GET /kalshi/events
 * Get all events
 */
router.get('/events', async (req: Request, res: Response) => {
  try {
    const {
      limit = '50',
      cursor,
      status,
      series_ticker,
      with_nested_markets = 'true'
    } = req.query;

    const data = await fetchKalshi('/events', {
      limit: parseInt(limit as string),
      cursor,
      status,
      series_ticker,
      with_nested_markets: with_nested_markets === 'true'
    });

    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch events', details: error.message });
  }
});

/**
 * GET /kalshi/events/:ticker
 * Get specific event
 */
router.get('/events/:ticker', async (req: Request, res: Response) => {
  try {
    const { ticker } = req.params;
    const { with_nested_markets = 'true' } = req.query;
    
    const data = await fetchKalshi(`/events/${ticker}`, {
      with_nested_markets: with_nested_markets === 'true'
    });

    res.json(data.event);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch event', details: error.message });
  }
});

/**
 * GET /kalshi/markets/:ticker/orderbook
 * Get order book
 */
router.get('/markets/:ticker/orderbook', async (req: Request, res: Response) => {
  try {
    const { ticker } = req.params;
    const { depth = '10' } = req.query;
    
    const data = await fetchKalshi(`/markets/${ticker}/orderbook`, {
      depth: parseInt(depth as string)
    });

    // Transform prices from cents to decimals
    const transformSide = (levels: any[]) => levels.map(l => ({
      price: l[0] / 100,
      quantity: l[1]
    }));

    res.json({
      ticker,
      yes: {
        bids: data.orderbook?.yes?.map((l: any) => ({ price: l[0] / 100, quantity: l[1] })) || [],
        asks: data.orderbook?.no?.map((l: any) => ({ price: (100 - l[0]) / 100, quantity: l[1] })) || []
      },
      no: {
        bids: data.orderbook?.no?.map((l: any) => ({ price: l[0] / 100, quantity: l[1] })) || [],
        asks: data.orderbook?.yes?.map((l: any) => ({ price: (100 - l[0]) / 100, quantity: l[1] })) || []
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch orderbook', details: error.message });
  }
});

/**
 * GET /kalshi/markets/:ticker/trades
 * Get recent trades
 */
router.get('/markets/:ticker/trades', async (req: Request, res: Response) => {
  try {
    const { ticker } = req.params;
    const { limit = '50', cursor } = req.query;
    
    const data = await fetchKalshi(`/markets/${ticker}/trades`, {
      limit: parseInt(limit as string),
      cursor
    });

    // Transform trades
    const trades = data.trades?.map((t: any) => ({
      ...t,
      yes_price: t.yes_price / 100,
      no_price: t.no_price / 100
    })) || [];

    res.json({ trades, cursor: data.cursor });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch trades', details: error.message });
  }
});

/**
 * GET /kalshi/series
 * Get all series (categories)
 */
router.get('/series', async (req: Request, res: Response) => {
  try {
    const { limit = '50', cursor } = req.query;
    
    const data = await fetchKalshi('/series', {
      limit: parseInt(limit as string),
      cursor
    });

    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch series', details: error.message });
  }
});

/**
 * GET /kalshi/top
 * Get top markets by volume
 */
router.get('/top', async (req: Request, res: Response) => {
  try {
    const { limit = '20' } = req.query;
    
    const data = await fetchKalshi('/markets', {
      limit: 200,
      status: 'open'
    });

    // Sort by volume and take top N
    const sorted = data.markets
      .filter((m: any) => m.volume_24h > 0)
      .sort((a: any, b: any) => (b.volume_24h || 0) - (a.volume_24h || 0))
      .slice(0, parseInt(limit as string))
      .map((m: any) => ({
        ticker: m.ticker,
        event_ticker: m.event_ticker,
        title: m.title,
        yes_price: m.yes_bid ? (m.yes_bid + m.yes_ask) / 2 / 100 : null,
        yes_bid: m.yes_bid / 100,
        yes_ask: m.yes_ask / 100,
        spread: m.yes_ask && m.yes_bid ? (m.yes_ask - m.yes_bid) / 100 : null,
        volume_24h: m.volume_24h,
        volume: m.volume,
        liquidity: m.liquidity,
        open_interest: m.open_interest,
        close_time: m.close_time,
        status: m.status,
        url: `https://kalshi.com/markets/${m.event_ticker}/${m.ticker}`
      }));

    res.json(sorted);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch top markets', details: error.message });
  }
});

// ============ WEBSOCKET ROUTES ============

/**
 * GET /kalshi/ws/status
 * Get WebSocket connection status
 */
router.get('/ws/status', (req: Request, res: Response) => {
  const connections: any[] = [];
  wsConnections.forEach((conn, id) => {
    connections.push({
      id,
      subscriptions: Array.from(conn.subscriptions),
      hasData: conn.lastData.size > 0
    });
  });
  res.json({ connections, total: connections.length });
});

/**
 * POST /kalshi/ws/subscribe
 * Subscribe to market updates via WebSocket
 */
router.post('/ws/subscribe', async (req: Request, res: Response) => {
  try {
    const { tickers } = req.body;
    
    if (!tickers || !Array.isArray(tickers)) {
      return res.status(400).json({ error: 'tickers array required' });
    }

    const connectionId = `conn_${Date.now()}`;
    
    // Create WebSocket connection
    const ws = new WebSocket('wss://api.elections.kalshi.com/trade-api/ws/v2');
    const subscriptions = new Set<string>(tickers);
    const lastData = new Map<string, any>();

    ws.on('open', () => {
      console.log(`Kalshi WS ${connectionId} connected`);
      
      // Subscribe to tickers
      ws.send(JSON.stringify({
        id: 1,
        cmd: 'subscribe',
        params: {
          channels: ['ticker'],
          market_tickers: tickers
        }
      }));
    });

    ws.on('message', (data: Buffer) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'ticker' && msg.msg) {
          lastData.set(msg.msg.market_ticker, {
            ...msg.msg,
            timestamp: new Date().toISOString()
          });
        }
      } catch (e) {
        console.error('Failed to parse WS message:', e);
      }
    });

    ws.on('close', () => {
      console.log(`Kalshi WS ${connectionId} closed`);
      wsConnections.delete(connectionId);
    });

    ws.on('error', (err) => {
      console.error(`Kalshi WS ${connectionId} error:`, err);
    });

    wsConnections.set(connectionId, { ws, subscriptions, lastData });

    res.json({ 
      success: true, 
      connectionId,
      subscriptions: tickers 
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to subscribe', details: error.message });
  }
});

/**
 * GET /kalshi/ws/:connectionId/data
 * Get latest data from WebSocket connection
 */
router.get('/ws/:connectionId/data', (req: Request, res: Response) => {
  const { connectionId } = req.params;
  const conn = wsConnections.get(connectionId);
  
  if (!conn) {
    return res.status(404).json({ error: 'Connection not found' });
  }

  const data: any = {};
  conn.lastData.forEach((value, key) => {
    data[key] = value;
  });

  res.json({ connectionId, data });
});

/**
 * DELETE /kalshi/ws/:connectionId
 * Close WebSocket connection
 */
router.delete('/ws/:connectionId', (req: Request, res: Response) => {
  const { connectionId } = req.params;
  const conn = wsConnections.get(connectionId);
  
  if (!conn) {
    return res.status(404).json({ error: 'Connection not found' });
  }

  conn.ws.close();
  wsConnections.delete(connectionId);

  res.json({ success: true, message: 'Connection closed' });
});

export default router;

