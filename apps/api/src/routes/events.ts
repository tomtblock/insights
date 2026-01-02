/**
 * Events API Routes
 * Section 5.7 - GET /api/events
 */

import { Router } from 'express';
import { db } from '../server';
import { z } from 'zod';

export const eventsRouter = Router();

// Query params schema
const EventsQuerySchema = z.object({
  q: z.string().optional(),
  domain: z.string().optional(),
  status: z.enum(['scheduled', 'ongoing', 'completed', 'cancelled', 'postponed']).optional(),
  startFrom: z.coerce.number().int().positive().optional(),
  startTo: z.coerce.number().int().positive().optional(),
  page: z.coerce.number().int().min(0).default(0),
  page_size: z.coerce.number().int().min(1).max(100).default(50),
});

// GET /api/events - List events with filters
eventsRouter.get('/', async (req, res) => {
  try {
    const params = EventsQuerySchema.parse(req.query);
    const { q, domain, status, startFrom, startTo, page, page_size } = params;

    let whereClause = 'WHERE 1=1';
    const values: any[] = [];
    let paramIndex = 1;

    if (q) {
      whereClause += ` AND (title ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`;
      values.push(`%${q}%`);
      paramIndex++;
    }
    if (domain) {
      whereClause += ` AND domain = $${paramIndex}`;
      values.push(domain);
      paramIndex++;
    }
    if (status) {
      whereClause += ` AND status = $${paramIndex}`;
      values.push(status);
      paramIndex++;
    }
    if (startFrom) {
      whereClause += ` AND start_ts >= to_timestamp($${paramIndex})`;
      values.push(startFrom / 1000);
      paramIndex++;
    }
    if (startTo) {
      whereClause += ` AND start_ts <= to_timestamp($${paramIndex})`;
      values.push(startTo / 1000);
      paramIndex++;
    }

    // Get total count
    const countResult = await db.query(
      `SELECT COUNT(*) FROM events_current ${whereClause}`,
      values
    );
    const total = parseInt(countResult.rows[0].count);

    // Get page of results
    values.push(page_size, page * page_size);
    const dataResult = await db.query(
      `SELECT e.*,
              (SELECT COUNT(*) FROM entity_links el WHERE el.source_type = 'event' AND el.source_id = e.event_id::text) as entity_count
       FROM events_current e
       ${whereClause}
       ORDER BY COALESCE(start_ts, updated_ts) DESC
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
    console.error('GET /api/events error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      ts: Date.now(),
    });
  }
});

// GET /api/events/:id - Get single event
eventsRouter.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `SELECT e.*,
              (SELECT jsonb_agg(
                jsonb_build_object(
                  'entity_id', ent.entity_id,
                  'type', ent.type,
                  'name', ent.name,
                  'ticker', ent.ticker,
                  'confidence', el.confidence
                )
              ) FROM entity_links el 
               JOIN entities ent ON ent.entity_id = el.entity_id
               WHERE el.source_type = 'event' AND el.source_id = e.event_id::text
              ) as linked_entities
       FROM events_current e
       WHERE event_id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Event not found',
        ts: Date.now(),
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
      ts: Date.now(),
    });
  } catch (error) {
    console.error('GET /api/events/:id error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      ts: Date.now(),
    });
  }
});

// POST /api/events/link - Link event to entity
eventsRouter.post('/link', async (req, res) => {
  try {
    const { event_id, entity_id, confidence, rationale } = req.body;

    if (!event_id || !entity_id) {
      return res.status(400).json({
        success: false,
        error: 'event_id and entity_id are required',
        ts: Date.now(),
      });
    }

    // Check event exists
    const eventCheck = await db.query(
      `SELECT 1 FROM events_current WHERE event_id = $1`,
      [event_id]
    );
    if (eventCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Event not found',
        ts: Date.now(),
      });
    }

    // Check entity exists
    const entityCheck = await db.query(
      `SELECT 1 FROM entities WHERE entity_id = $1`,
      [entity_id]
    );
    if (entityCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Entity not found',
        ts: Date.now(),
      });
    }

    // Upsert link
    const result = await db.query(
      `INSERT INTO entity_links (source_type, source_id, entity_id, confidence, rationale)
       VALUES ('event', $1, $2, $3, $4)
       ON CONFLICT (source_type, source_id, entity_id)
       DO UPDATE SET confidence = $3, rationale = $4
       RETURNING *`,
      [event_id, entity_id, confidence || 1.0, rationale || null]
    );

    res.json({
      success: true,
      data: result.rows[0],
      ts: Date.now(),
    });
  } catch (error) {
    console.error('POST /api/events/link error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      ts: Date.now(),
    });
  }
});

