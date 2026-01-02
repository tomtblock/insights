/**
 * Markets API Routes
 * Section 5.1 - GET /api/markets
 */

import { Router } from 'express';
import { db, redis } from '../server';
import { MarketOutcomeSchema, LiquiditySnapshotSchema } from '@arb/schemas';
import { z } from 'zod';

export const marketsRouter = Router();

// Query params schema
const MarketsQuerySchema = z.object({
  venue: z.string().optional(),
  status: z.enum(['open', 'closed', 'resolved', 'disputed', 'paused']).optional(),
  q: z.string().optional(), // Search query
  tag: z.string().optional(),
  domain: z.string().optional(),
  sort: z.enum(['volume', 'updated', 'created', 'resolve_ts']).default('updated'),
  page: z.coerce.number().int().min(0).default(0),
  page_size: z.coerce.number().int().min(1).max(100).default(50),
});

// GET /api/markets - List markets with filters
marketsRouter.get('/', async (req, res) => {
  try {
    const params = MarketsQuerySchema.parse(req.query);
    const { venue, status, q, tag, sort, page, page_size } = params;

    // Build query
    let whereClause = 'WHERE 1=1';
    const values: any[] = [];
    let paramIndex = 1;

    if (venue) {
      whereClause += ` AND venue = $${paramIndex++}`;
      values.push(venue);
    }
    if (status) {
      whereClause += ` AND status = $${paramIndex++}`;
      values.push(status);
    }
    if (q) {
      whereClause += ` AND (title ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`;
      values.push(`%${q}%`);
      paramIndex++;
    }
    if (tag) {
      whereClause += ` AND tags ? $${paramIndex++}`;
      values.push(tag);
    }

    // Sort order
    const sortColumn = {
      volume: 'updated_at DESC', // TODO: join with volume table
      updated: 'updated_at DESC',
      created: 'created_at DESC',
      resolve_ts: 'resolve_ts ASC NULLS LAST',
    }[sort];

    // Get total count
    const countResult = await db.query(
      `SELECT COUNT(*) FROM pm_market_outcomes ${whereClause}`,
      values
    );
    const total = parseInt(countResult.rows[0].count);

    // Get page of results
    values.push(page_size, page * page_size);
    const dataResult = await db.query(
      `SELECT * FROM pm_market_outcomes ${whereClause}
       ORDER BY ${sortColumn}
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
    console.error('GET /api/markets error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      ts: Date.now(),
    });
  }
});

// GET /api/markets/:venue/:outcomeId - Get single market
marketsRouter.get('/:venue/:outcomeId', async (req, res) => {
  try {
    const { venue, outcomeId } = req.params;

    const result = await db.query(
      `SELECT * FROM pm_market_outcomes 
       WHERE venue = $1 AND outcome_id_native = $2`,
      [venue, outcomeId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Market not found',
        ts: Date.now(),
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
      ts: Date.now(),
    });
  } catch (error) {
    console.error('GET /api/markets/:venue/:outcomeId error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      ts: Date.now(),
    });
  }
});

// GET /api/markets/:venue/:outcomeId/liquidity - Get liquidity history
marketsRouter.get('/:venue/:outcomeId/liquidity', async (req, res) => {
  try {
    const { venue, outcomeId } = req.params;
    const window = (req.query.window as string) || '1h';

    // Parse window to interval
    const intervalMap: Record<string, string> = {
      '1h': '1 hour',
      '4h': '4 hours',
      '24h': '24 hours',
      '7d': '7 days',
      '30d': '30 days',
    };
    const interval = intervalMap[window] || '1 hour';

    const result = await db.query(
      `SELECT * FROM pm_liquidity_snapshots
       WHERE venue = $1 AND outcome_id_native = $2
         AND ts >= NOW() - INTERVAL '${interval}'
       ORDER BY ts DESC
       LIMIT 1000`,
      [venue, outcomeId]
    );

    res.json({
      success: true,
      data: result.rows,
      ts: Date.now(),
    });
  } catch (error) {
    console.error('GET /api/markets/:venue/:outcomeId/liquidity error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      ts: Date.now(),
    });
  }
});

// GET /api/markets/:venue/:outcomeId/volume - Get volume history
marketsRouter.get('/:venue/:outcomeId/volume', async (req, res) => {
  try {
    const { venue, outcomeId } = req.params;
    const bucket = (req.query.bucket as string) || '1h';
    const window = (req.query.window as string) || '7d';

    const intervalMap: Record<string, string> = {
      '1h': '1 hour',
      '24h': '24 hours',
      '7d': '7 days',
      '30d': '30 days',
    };
    const interval = intervalMap[window] || '7 days';

    const result = await db.query(
      `SELECT * FROM pm_volume_buckets
       WHERE venue = $1 AND outcome_id_native = $2 AND bucket = $3
         AND ts_bucket >= NOW() - INTERVAL '${interval}'
       ORDER BY ts_bucket DESC`,
      [venue, outcomeId, bucket]
    );

    res.json({
      success: true,
      data: result.rows,
      ts: Date.now(),
    });
  } catch (error) {
    console.error('GET /api/markets/:venue/:outcomeId/volume error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      ts: Date.now(),
    });
  }
});

