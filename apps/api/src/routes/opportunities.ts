/**
 * Opportunities API Routes
 * Section 5.3 - GET/POST /api/opportunities
 */

import { Router } from 'express';
import { db } from '../server';
import { calculateEdgeProfile, calculateConfidenceScore } from '@arb/math';
import { z } from 'zod';

export const opportunitiesRouter = Router();

// Query params schema
const OpportunitiesQuerySchema = z.object({
  minEdge: z.coerce.number().min(0).optional(),
  minScore: z.coerce.number().min(0).max(100).default(60),
  venuePair: z.string().optional(), // e.g. "polymarket:kalshi"
  domain: z.string().optional(),
  status: z.enum(['open', 'expired', 'invalid', 'executed', 'dismissed']).default('open'),
  page: z.coerce.number().int().min(0).default(0),
  page_size: z.coerce.number().int().min(1).max(100).default(50),
});

// GET /api/opportunities - List opportunities with filters
opportunitiesRouter.get('/', async (req, res) => {
  try {
    const params = OpportunitiesQuerySchema.parse(req.query);
    const { minEdge, minScore, venuePair, domain, status, page, page_size } = params;

    let whereClause = 'WHERE status = $1 AND confidence_score >= $2';
    const values: any[] = [status, minScore];
    let paramIndex = 3;

    if (venuePair) {
      const [buyVenue, sellVenue] = venuePair.split(':');
      if (buyVenue && sellVenue) {
        whereClause += ` AND buy_venue = $${paramIndex++} AND sell_venue = $${paramIndex++}`;
        values.push(buyVenue, sellVenue);
      }
    }

    // TODO: Add domain filter via join with canonical_events

    // Get total count
    const countResult = await db.query(
      `SELECT COUNT(*) FROM opportunities ${whereClause}`,
      values
    );
    const total = parseInt(countResult.rows[0].count);

    // Get page of results with edge profile
    values.push(page_size, page * page_size);
    const dataResult = await db.query(
      `SELECT o.*, ce.label as canonical_event_label, ce.domain
       FROM opportunities o
       LEFT JOIN canonical_events ce ON o.canonical_event_id = ce.canonical_event_id
       ${whereClause}
       ORDER BY confidence_score DESC, last_seen_ts DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      values
    );

    // Filter by minEdge if specified
    let filteredRows = dataResult.rows;
    if (minEdge !== undefined) {
      filteredRows = dataResult.rows.filter((row: any) => {
        const bestBucket = row.edge_profile?.q_buckets?.find(
          (b: any) => b.q === row.edge_profile?.best_q
        );
        return bestBucket && bestBucket.net_edge * 10000 >= minEdge;
      });
    }

    res.json({
      success: true,
      data: filteredRows,
      pagination: {
        page,
        page_size,
        total,
        has_more: (page + 1) * page_size < total,
      },
      ts: Date.now(),
    });
  } catch (error) {
    console.error('GET /api/opportunities error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      ts: Date.now(),
    });
  }
});

// GET /api/opportunities/:id - Get single opportunity
opportunitiesRouter.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `SELECT o.*, ce.label as canonical_event_label, ce.domain
       FROM opportunities o
       LEFT JOIN canonical_events ce ON o.canonical_event_id = ce.canonical_event_id
       WHERE o.opportunity_id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Opportunity not found',
        ts: Date.now(),
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
      ts: Date.now(),
    });
  } catch (error) {
    console.error('GET /api/opportunities/:id error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      ts: Date.now(),
    });
  }
});

// POST /api/opportunities/:id/ack - Mark opportunity as reviewed
opportunitiesRouter.post('/:id/ack', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `UPDATE opportunities 
       SET flags = flags || '{"acknowledged": true}'::jsonb, last_seen_ts = NOW()
       WHERE opportunity_id = $1
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Opportunity not found',
        ts: Date.now(),
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
      ts: Date.now(),
    });
  } catch (error) {
    console.error('POST /api/opportunities/:id/ack error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      ts: Date.now(),
    });
  }
});

// POST /api/opportunities/replay - Recompute opportunity from stored snapshots
opportunitiesRouter.post('/replay', async (req, res) => {
  try {
    const { opportunity_id } = req.body;

    if (!opportunity_id) {
      return res.status(400).json({
        success: false,
        error: 'opportunity_id required',
        ts: Date.now(),
      });
    }

    // Get opportunity
    const oppResult = await db.query(
      `SELECT * FROM opportunities WHERE opportunity_id = $1`,
      [opportunity_id]
    );

    if (oppResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Opportunity not found',
        ts: Date.now(),
      });
    }

    const opp = oppResult.rows[0];
    const { snapshot_refs, buy_venue, sell_venue, buy_outcome_id, sell_outcome_id } = opp;

    // Get snapshots by hash
    const buySnapshot = await db.query(
      `SELECT * FROM pm_liquidity_snapshots 
       WHERE venue = $1 AND outcome_id_native = $2 AND snapshot_hash = $3
       ORDER BY ts DESC LIMIT 1`,
      [buy_venue, buy_outcome_id, snapshot_refs.buy_snapshot_hash]
    );

    const sellSnapshot = await db.query(
      `SELECT * FROM pm_liquidity_snapshots 
       WHERE venue = $1 AND outcome_id_native = $2 AND snapshot_hash = $3
       ORDER BY ts DESC LIMIT 1`,
      [sell_venue, sell_outcome_id, snapshot_refs.sell_snapshot_hash]
    );

    if (buySnapshot.rows.length === 0 || sellSnapshot.rows.length === 0) {
      return res.json({
        success: true,
        data: {
          opportunity_id,
          replay_status: 'SNAPSHOT_NOT_FOUND',
          message: 'Could not find original snapshots for replay',
        },
        ts: Date.now(),
      });
    }

    // Recalculate edge profile
    // Note: In production, we'd need to retrieve full order books by hash
    const replayedEdge = calculateEdgeProfile({
      buySnapshot: buySnapshot.rows[0],
      sellSnapshot: sellSnapshot.rows[0],
      buyFeesBps: 0, // TODO: Get from market registry
      sellFeesBps: 0,
      riskBufferBps: 15,
    });

    // Compare with stored
    const originalBestQ = opp.edge_profile?.best_q;
    const replayedBestQ = replayedEdge.best_q;

    const originalEdge = opp.edge_profile?.q_buckets?.find(
      (b: any) => b.q === originalBestQ
    )?.net_edge;
    const replayedNetEdge = replayedEdge.q_buckets.find(
      (b) => b.q === replayedBestQ
    )?.net_edge;

    const edgeDiff = Math.abs((originalEdge || 0) - (replayedNetEdge || 0));
    const isReplayable = edgeDiff < 0.0001; // 1 bps tolerance

    res.json({
      success: true,
      data: {
        opportunity_id,
        replay_status: isReplayable ? 'MATCH' : 'MISMATCH',
        original_edge_profile: opp.edge_profile,
        replayed_edge_profile: replayedEdge,
        edge_diff_bps: edgeDiff * 10000,
        snapshot_refs,
      },
      ts: Date.now(),
    });
  } catch (error) {
    console.error('POST /api/opportunities/replay error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      ts: Date.now(),
    });
  }
});

