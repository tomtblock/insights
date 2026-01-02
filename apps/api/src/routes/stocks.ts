/**
 * Stocks API Routes
 * Section 5.6 - GET /api/stocks
 */

import { Router } from 'express';
import { db } from '../server';
import { z } from 'zod';

export const stocksRouter = Router();

// Query params schema
const StocksQuerySchema = z.object({
  q: z.string().optional(),
  exchange: z.string().optional(),
  country: z.string().optional(),
  sector: z.string().optional(),
  enabled: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(0).default(0),
  page_size: z.coerce.number().int().min(1).max(100).default(50),
});

// GET /api/stocks/symbols - Search and list stock symbols
stocksRouter.get('/symbols', async (req, res) => {
  try {
    const params = StocksQuerySchema.parse(req.query);
    const { q, exchange, country, sector, enabled, page, page_size } = params;

    let whereClause = 'WHERE 1=1';
    const values: any[] = [];
    let paramIndex = 1;

    if (q) {
      whereClause += ` AND (symbol_id ILIKE $${paramIndex} OR name ILIKE $${paramIndex})`;
      values.push(`%${q}%`);
      paramIndex++;
    }
    if (exchange) {
      whereClause += ` AND exchange_id = $${paramIndex}`;
      values.push(exchange);
      paramIndex++;
    }
    if (country) {
      whereClause += ` AND country = $${paramIndex}`;
      values.push(country);
      paramIndex++;
    }
    if (sector) {
      whereClause += ` AND sector = $${paramIndex}`;
      values.push(sector);
      paramIndex++;
    }
    if (enabled !== undefined) {
      whereClause += ` AND is_enabled = $${paramIndex}`;
      values.push(enabled);
      paramIndex++;
    }

    // Get total count
    const countResult = await db.query(
      `SELECT COUNT(*) FROM stocks_symbols ${whereClause}`,
      values
    );
    const total = parseInt(countResult.rows[0].count);

    // Get page of results
    values.push(page_size, page * page_size);
    const dataResult = await db.query(
      `SELECT * FROM stocks_symbols ${whereClause}
       ORDER BY symbol_id ASC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      values
    );

    res.json({
      success: true,
      data: dataResult.rows,
      pagination: {
        page,
        page_size,
        total,
        has_more: (page + 1) * page_size < total,
      },
      ts: Date.now(),
    });
  } catch (error) {
    console.error('GET /api/stocks/symbols error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      ts: Date.now(),
    });
  }
});

// GET /api/stocks/:exchange/:symbol - Get single stock details
stocksRouter.get('/:exchange/:symbol', async (req, res) => {
  try {
    const { exchange, symbol } = req.params;

    // Get symbol info
    const symbolResult = await db.query(
      `SELECT * FROM stocks_symbols WHERE exchange_id = $1 AND symbol_id = $2`,
      [exchange, symbol]
    );

    if (symbolResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Stock symbol not found',
        ts: Date.now(),
      });
    }

    // Get latest price
    const priceResult = await db.query(
      `SELECT * FROM stocks_price_snapshots
       WHERE exchange_id = $1 AND symbol_id = $2
       ORDER BY ts DESC
       LIMIT 1`,
      [exchange, symbol]
    );

    res.json({
      success: true,
      data: {
        ...symbolResult.rows[0],
        latest_price: priceResult.rows[0] || null,
      },
      ts: Date.now(),
    });
  } catch (error) {
    console.error('GET /api/stocks/:exchange/:symbol error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      ts: Date.now(),
    });
  }
});

// GET /api/stocks/:exchange/:symbol/prices - Get price history
stocksRouter.get('/:exchange/:symbol/prices', async (req, res) => {
  try {
    const { exchange, symbol } = req.params;
    const window = (req.query.window as string) || '30d';
    const interval = (req.query.interval as string) || '1h';

    // Parse window to SQL interval
    const windowMap: Record<string, string> = {
      '1d': '1 day',
      '7d': '7 days',
      '30d': '30 days',
      '90d': '90 days',
      '1y': '1 year',
    };
    const sqlInterval = windowMap[window] || '30 days';

    // Get price snapshots
    const result = await db.query(
      `SELECT * FROM stocks_price_snapshots
       WHERE exchange_id = $1 AND symbol_id = $2
         AND ts >= NOW() - INTERVAL '${sqlInterval}'
       ORDER BY ts ASC`,
      [exchange, symbol]
    );

    res.json({
      success: true,
      data: result.rows,
      ts: Date.now(),
    });
  } catch (error) {
    console.error('GET /api/stocks/:exchange/:symbol/prices error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      ts: Date.now(),
    });
  }
});

// GET /api/stocks/links/:symbol - Get entity links for stock
stocksRouter.get('/links/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;

    // Find entity by ticker
    const entityResult = await db.query(
      `SELECT * FROM entities WHERE ticker = $1`,
      [symbol]
    );

    if (entityResult.rows.length === 0) {
      return res.json({
        success: true,
        data: {
          symbol,
          entity: null,
          markets: [],
          events: [],
          topics: [],
        },
        ts: Date.now(),
      });
    }

    const entity = entityResult.rows[0];

    // Get linked markets
    const marketsResult = await db.query(
      `SELECT el.*, m.title, m.venue, m.status
       FROM entity_links el
       JOIN pm_market_outcomes m ON m.venue || '-' || m.outcome_id_native = el.source_id
       WHERE el.entity_id = $1 AND el.source_type = 'market'`,
      [entity.entity_id]
    );

    // Get linked events
    const eventsResult = await db.query(
      `SELECT el.*, e.title, e.domain, e.status
       FROM entity_links el
       JOIN events_current e ON e.event_id::text = el.source_id
       WHERE el.entity_id = $1 AND el.source_type = 'event'`,
      [entity.entity_id]
    );

    // Get linked topics
    const topicsResult = await db.query(
      `SELECT el.*, t.label, t.status
       FROM entity_links el
       JOIN topics t ON t.topic_id::text = el.source_id
       WHERE el.entity_id = $1 AND el.source_type = 'topic'`,
      [entity.entity_id]
    );

    res.json({
      success: true,
      data: {
        symbol,
        entity,
        markets: marketsResult.rows,
        events: eventsResult.rows,
        topics: topicsResult.rows,
      },
      ts: Date.now(),
    });
  } catch (error) {
    console.error('GET /api/stocks/links/:symbol error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      ts: Date.now(),
    });
  }
});

