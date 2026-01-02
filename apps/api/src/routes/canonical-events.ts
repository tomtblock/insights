/**
 * Canonical Events API Routes
 * Section 5.2 - GET/POST /api/canonical-events
 */

import { Router } from 'express';
import { db } from '../server';
import { z } from 'zod';

export const canonicalEventsRouter = Router();

// Query params schema
const CanonicalEventsQuerySchema = z.object({
  q: z.string().optional(),
  domain: z.string().optional(),
  page: z.coerce.number().int().min(0).default(0),
  page_size: z.coerce.number().int().min(1).max(100).default(50),
});

// GET /api/canonical-events - List canonical events
canonicalEventsRouter.get('/', async (req, res) => {
  try {
    const params = CanonicalEventsQuerySchema.parse(req.query);
    const { q, domain, page, page_size } = params;

    let whereClause = 'WHERE 1=1';
    const values: any[] = [];
    let paramIndex = 1;

    if (q) {
      whereClause += ` AND label ILIKE $${paramIndex}`;
      values.push(`%${q}%`);
      paramIndex++;
    }
    if (domain) {
      whereClause += ` AND domain = $${paramIndex}`;
      values.push(domain);
      paramIndex++;
    }

    // Get total count
    const countResult = await db.query(
      `SELECT COUNT(*) FROM canonical_events ${whereClause}`,
      values
    );
    const total = parseInt(countResult.rows[0].count);

    // Get page with linked market count
    values.push(page_size, page * page_size);
    const dataResult = await db.query(
      `SELECT ce.*, 
              (SELECT COUNT(*) FROM market_links ml WHERE ml.canonical_event_id = ce.canonical_event_id) as market_count,
              (SELECT COUNT(*) FROM opportunities o WHERE o.canonical_event_id = ce.canonical_event_id AND o.status = 'open') as opportunity_count
       FROM canonical_events ce
       ${whereClause}
       ORDER BY updated_at DESC
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
    console.error('GET /api/canonical-events error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      ts: Date.now(),
    });
  }
});

// GET /api/canonical-events/:id - Get single canonical event
canonicalEventsRouter.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `SELECT * FROM canonical_events WHERE canonical_event_id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Canonical event not found',
        ts: Date.now(),
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
      ts: Date.now(),
    });
  } catch (error) {
    console.error('GET /api/canonical-events/:id error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      ts: Date.now(),
    });
  }
});

// GET /api/canonical-events/:id/markets - Get linked markets
canonicalEventsRouter.get('/:id/markets', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `SELECT ml.*, m.*
       FROM market_links ml
       JOIN pm_market_outcomes m ON m.venue = ml.venue AND m.outcome_id_native = ml.outcome_id_native
       WHERE ml.canonical_event_id = $1
       ORDER BY ml.confidence DESC`,
      [id]
    );

    res.json({
      success: true,
      data: result.rows,
      ts: Date.now(),
    });
  } catch (error) {
    console.error('GET /api/canonical-events/:id/markets error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      ts: Date.now(),
    });
  }
});

// GET /api/canonical-events/:id/opportunities - Get opportunities for event
canonicalEventsRouter.get('/:id/opportunities', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `SELECT * FROM opportunities 
       WHERE canonical_event_id = $1
       ORDER BY status, confidence_score DESC`,
      [id]
    );

    res.json({
      success: true,
      data: result.rows,
      ts: Date.now(),
    });
  } catch (error) {
    console.error('GET /api/canonical-events/:id/opportunities error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      ts: Date.now(),
    });
  }
});

// POST /api/canonical-events/:id/links - Add market link manually
canonicalEventsRouter.post('/:id/links', async (req, res) => {
  try {
    const { id } = req.params;
    const { venue, outcome_id_native, confidence, notes } = req.body;

    // Validate required fields
    if (!venue || !outcome_id_native) {
      return res.status(400).json({
        success: false,
        error: 'venue and outcome_id_native are required',
        ts: Date.now(),
      });
    }

    // Check canonical event exists
    const eventCheck = await db.query(
      `SELECT 1 FROM canonical_events WHERE canonical_event_id = $1`,
      [id]
    );
    if (eventCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Canonical event not found',
        ts: Date.now(),
      });
    }

    // Check market exists
    const marketCheck = await db.query(
      `SELECT 1 FROM pm_market_outcomes WHERE venue = $1 AND outcome_id_native = $2`,
      [venue, outcome_id_native]
    );
    if (marketCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Market not found',
        ts: Date.now(),
      });
    }

    // Upsert link
    const result = await db.query(
      `INSERT INTO market_links (canonical_event_id, venue, outcome_id_native, confidence, notes)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (canonical_event_id, venue, outcome_id_native)
       DO UPDATE SET confidence = $4, notes = $5
       RETURNING *`,
      [id, venue, outcome_id_native, confidence || 1.0, notes || null]
    );

    res.json({
      success: true,
      data: result.rows[0],
      ts: Date.now(),
    });
  } catch (error) {
    console.error('POST /api/canonical-events/:id/links error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      ts: Date.now(),
    });
  }
});

