/**
 * Polymarket API Routes
 * Exposes Polymarket Gamma, CLOB, and Data API endpoints
 */

import { Router, Request, Response } from 'express';
import axios from 'axios';

const router = Router();

// API Base URLs
const GAMMA_API = 'https://gamma-api.polymarket.com';
const CLOB_API = 'https://clob.polymarket.com';
const DATA_API = 'https://data-api.polymarket.com';

// Helper for API requests
async function fetchAPI(baseUrl: string, path: string, params?: any) {
  const response = await axios.get(`${baseUrl}${path}`, {
    params,
    timeout: 30000,
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'ArbPlatform/1.0'
    }
  });
  return response.data;
}

// ============ GAMMA API ROUTES ============

/**
 * GET /polymarket/markets
 * Get all markets from Gamma API
 */
router.get('/markets', async (req: Request, res: Response) => {
  try {
    const {
      active = 'true',
      closed = 'false',
      limit = '100',
      offset = '0',
      order = 'volume',
      ascending = 'false',
      tag_id
    } = req.query;

    const data = await fetchAPI(GAMMA_API, '/markets', {
      active: active === 'true',
      closed: closed === 'true',
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
      order,
      ascending: ascending === 'true',
      tag_id
    });

    res.json(data);
  } catch (error: any) {
    console.error('Error fetching Polymarket markets:', error.message);
    res.status(500).json({ error: 'Failed to fetch markets', details: error.message });
  }
});

/**
 * GET /polymarket/markets/:id
 * Get a specific market
 */
router.get('/markets/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = await fetchAPI(GAMMA_API, `/markets/${id}`);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch market', details: error.message });
  }
});

/**
 * GET /polymarket/events
 * Get all events
 */
router.get('/events', async (req: Request, res: Response) => {
  try {
    const {
      active = 'true',
      closed = 'false',
      limit = '50',
      offset = '0',
      order = 'volume',
      tag_id
    } = req.query;

    const data = await fetchAPI(GAMMA_API, '/events', {
      active: active === 'true',
      closed: closed === 'true',
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
      order,
      tag_id
    });

    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch events', details: error.message });
  }
});

/**
 * GET /polymarket/events/:id
 * Get a specific event
 */
router.get('/events/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = await fetchAPI(GAMMA_API, `/events/${id}`);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch event', details: error.message });
  }
});

/**
 * GET /polymarket/tags
 * Get all tags/categories
 */
router.get('/tags', async (req: Request, res: Response) => {
  try {
    const data = await fetchAPI(GAMMA_API, '/tags');
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch tags', details: error.message });
  }
});

/**
 * GET /polymarket/search
 * Search markets and events
 */
router.get('/search', async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }
    const data = await fetchAPI(GAMMA_API, '/search', { query: q });
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to search', details: error.message });
  }
});

// ============ CLOB API ROUTES ============

/**
 * GET /polymarket/clob/markets
 * Get all CLOB markets
 */
router.get('/clob/markets', async (req: Request, res: Response) => {
  try {
    const { next_cursor } = req.query;
    const data = await fetchAPI(CLOB_API, '/markets', { next_cursor });
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch CLOB markets', details: error.message });
  }
});

/**
 * GET /polymarket/clob/markets/:conditionId
 * Get specific CLOB market
 */
router.get('/clob/markets/:conditionId', async (req: Request, res: Response) => {
  try {
    const { conditionId } = req.params;
    const data = await fetchAPI(CLOB_API, `/markets/${conditionId}`);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch CLOB market', details: error.message });
  }
});

/**
 * GET /polymarket/clob/book
 * Get order book for a token
 */
router.get('/clob/book', async (req: Request, res: Response) => {
  try {
    const { token_id } = req.query;
    if (!token_id) {
      return res.status(400).json({ error: 'token_id is required' });
    }
    const data = await fetchAPI(CLOB_API, '/book', { token_id });
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch order book', details: error.message });
  }
});

/**
 * GET /polymarket/clob/price
 * Get price for a token
 */
router.get('/clob/price', async (req: Request, res: Response) => {
  try {
    const { token_id } = req.query;
    if (!token_id) {
      return res.status(400).json({ error: 'token_id is required' });
    }
    const data = await fetchAPI(CLOB_API, '/price', { token_id });
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch price', details: error.message });
  }
});

/**
 * GET /polymarket/clob/prices
 * Get prices for multiple tokens
 */
router.get('/clob/prices', async (req: Request, res: Response) => {
  try {
    const { token_ids } = req.query;
    if (!token_ids) {
      return res.status(400).json({ error: 'token_ids is required (comma-separated)' });
    }
    const data = await fetchAPI(CLOB_API, '/prices', { token_ids });
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch prices', details: error.message });
  }
});

/**
 * GET /polymarket/clob/midpoint
 * Get midpoint for a token
 */
router.get('/clob/midpoint', async (req: Request, res: Response) => {
  try {
    const { token_id } = req.query;
    if (!token_id) {
      return res.status(400).json({ error: 'token_id is required' });
    }
    const data = await fetchAPI(CLOB_API, '/midpoint', { token_id });
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch midpoint', details: error.message });
  }
});

/**
 * GET /polymarket/clob/spread
 * Get spread for a token
 */
router.get('/clob/spread', async (req: Request, res: Response) => {
  try {
    const { token_id } = req.query;
    if (!token_id) {
      return res.status(400).json({ error: 'token_id is required' });
    }
    const data = await fetchAPI(CLOB_API, '/spread', { token_id });
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch spread', details: error.message });
  }
});

/**
 * GET /polymarket/clob/prices-history
 * Get price history for a market
 */
router.get('/clob/prices-history', async (req: Request, res: Response) => {
  try {
    const { market, interval = '1d', fidelity = '60' } = req.query;
    if (!market) {
      return res.status(400).json({ error: 'market (token_id) is required' });
    }
    const data = await fetchAPI(CLOB_API, '/prices-history', {
      market,
      interval,
      fidelity: parseInt(fidelity as string)
    });
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch price history', details: error.message });
  }
});

/**
 * GET /polymarket/clob/trades
 * Get recent trades
 */
router.get('/clob/trades', async (req: Request, res: Response) => {
  try {
    const { market, maker, limit = '50', before, after } = req.query;
    const data = await fetchAPI(CLOB_API, '/trades', {
      market,
      maker,
      limit: parseInt(limit as string),
      before,
      after
    });
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch trades', details: error.message });
  }
});

// ============ DATA API ROUTES ============

/**
 * GET /polymarket/positions
 * Get user positions
 */
router.get('/positions', async (req: Request, res: Response) => {
  try {
    const {
      user,
      market,
      eventId,
      sizeThreshold = '1',
      redeemable = 'false',
      mergeable = 'false',
      limit = '100',
      offset = '0',
      sortBy = 'TOKENS',
      sortDirection = 'DESC'
    } = req.query;

    if (!user) {
      return res.status(400).json({ error: 'user address is required' });
    }

    const data = await fetchAPI(DATA_API, '/positions', {
      user,
      market,
      eventId,
      sizeThreshold: parseFloat(sizeThreshold as string),
      redeemable: redeemable === 'true',
      mergeable: mergeable === 'true',
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
      sortBy,
      sortDirection
    });

    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch positions', details: error.message });
  }
});

/**
 * GET /polymarket/timeseries/:conditionId
 * Get market timeseries data
 */
router.get('/timeseries/:conditionId', async (req: Request, res: Response) => {
  try {
    const { conditionId } = req.params;
    const { startTs, endTs, fidelity } = req.query;
    
    const data = await fetchAPI(DATA_API, `/timeseries/${conditionId}`, {
      startTs,
      endTs,
      fidelity
    });
    
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch timeseries', details: error.message });
  }
});

// ============ ENRICHED ENDPOINTS ============

/**
 * GET /polymarket/enriched/:id
 * Get market with CLOB data, order books, and recent trades
 */
router.get('/enriched/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Fetch Gamma market data
    const gamma = await fetchAPI(GAMMA_API, `/markets/${id}`);
    
    // Fetch CLOB data
    let clob = null;
    let orderBooks: any[] = [];
    let trades: any[] = [];
    
    try {
      clob = await fetchAPI(CLOB_API, `/markets/${gamma.conditionId}`);
      
      // Fetch order books for each token
      if (gamma.clob_token_ids?.length) {
        orderBooks = await Promise.all(
          gamma.clob_token_ids.map((tokenId: string) =>
            fetchAPI(CLOB_API, '/book', { token_id: tokenId }).catch(() => null)
          )
        );
        orderBooks = orderBooks.filter(Boolean);
      }
      
      // Fetch recent trades
      trades = await fetchAPI(CLOB_API, '/trades', {
        market: gamma.conditionId,
        limit: 20
      });
    } catch (clobError) {
      console.warn('CLOB data unavailable for market:', id);
    }
    
    // Calculate market depth
    const depth = orderBooks.map((book: any) => {
      if (!book) return null;
      const bidDepth = book.bids?.reduce((sum: number, b: any) => sum + parseFloat(b.size || 0), 0) || 0;
      const askDepth = book.asks?.reduce((sum: number, a: any) => sum + parseFloat(a.size || 0), 0) || 0;
      const bestBid = book.bids?.[0] ? parseFloat(book.bids[0].price) : 0;
      const bestAsk = book.asks?.[0] ? parseFloat(book.asks[0].price) : 1;
      return {
        tokenId: book.asset_id,
        bidDepth,
        askDepth,
        totalDepth: bidDepth + askDepth,
        spread: bestAsk - bestBid,
        midpoint: (bestBid + bestAsk) / 2
      };
    }).filter(Boolean);
    
    res.json({
      gamma,
      clob,
      orderBooks,
      trades,
      depth,
      url: `https://polymarket.com/event/${gamma.slug}`,
      lastUpdated: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch enriched market', details: error.message });
  }
});

/**
 * GET /polymarket/top
 * Get top markets by various metrics
 */
router.get('/top', async (req: Request, res: Response) => {
  try {
    const { by = 'volume', limit = '20' } = req.query;
    
    const markets = await fetchAPI(GAMMA_API, '/markets', {
      active: true,
      closed: false,
      limit: parseInt(limit as string),
      order: by,
      ascending: false
    });
    
    // Enrich with basic stats
    const enriched = markets.map((m: any) => ({
      id: m.id,
      question: m.question,
      slug: m.slug,
      volume: m.volume,
      volume24hr: m.volume24hr,
      liquidity: m.liquidity,
      outcomes: m.outcomes,
      prices: m.outcomePrices.map((p: string) => parseFloat(p)),
      spread: m.spread,
      endDate: m.endDate,
      tags: m.tags?.map((t: any) => t.label) || [],
      url: `https://polymarket.com/event/${m.slug}`
    }));
    
    res.json(enriched);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch top markets', details: error.message });
  }
});

export default router;

