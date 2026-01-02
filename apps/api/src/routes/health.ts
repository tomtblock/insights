/**
 * Health API Routes
 * Section 5.5 - GET /api/health
 */

import { Router } from 'express';
import { db, redis } from '../server';
import { HealthStatusEnum } from '@arb/schemas';

export const healthRouter = Router();

// GET /api/health/summary - Global health summary
healthRouter.get('/summary', async (req, res) => {
  try {
    // Get all venue health states
    const healthResult = await db.query(
      `SELECT * FROM health_state ORDER BY venue`
    );

    const venues = healthResult.rows;
    
    // Calculate global status
    const hasRed = venues.some((v: any) => v.status === 'red');
    const hasYellow = venues.some((v: any) => v.status === 'yellow');
    const globalStatus = hasRed ? 'red' : hasYellow ? 'yellow' : 'green';

    // Get blocking issues
    const blockingIssues: string[] = [];
    for (const venue of venues) {
      if (venue.status === 'red') {
        blockingIssues.push(`${venue.venue}: ${venue.error_message || 'Health check failed'}`);
      }
    }

    // Determine read-only mode
    const readOnlyMode = hasRed;

    // Get latest audit timestamp
    const latestAuditResult = await db.query(
      `SELECT MAX(ts) as last_audit FROM health_audit_runs`
    );
    const lastAuditTs = latestAuditResult.rows[0]?.last_audit?.getTime() || null;

    res.json({
      success: true,
      data: {
        status: globalStatus,
        read_only_mode: readOnlyMode,
        blocking_issues: blockingIssues,
        venues: venues.map((v: any) => ({
          venue: v.venue,
          status: v.status,
          completeness: parseFloat(v.completeness) || 1.0,
          liveness: parseFloat(v.liveness) || 1.0,
          last_audit_ts: v.last_audit_ts?.getTime() || null,
          error_message: v.error_message,
        })),
        last_audit_ts: lastAuditTs,
      },
      ts: Date.now(),
    });
  } catch (error) {
    console.error('GET /api/health/summary error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      ts: Date.now(),
    });
  }
});

// GET /api/health/venues - List all venue health states
healthRouter.get('/venues', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT hs.*, 
              (SELECT COUNT(*) FROM pm_market_outcomes m WHERE m.venue = hs.venue) as local_market_count
       FROM health_state hs
       ORDER BY venue`
    );

    res.json({
      success: true,
      data: result.rows,
      ts: Date.now(),
    });
  } catch (error) {
    console.error('GET /api/health/venues error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      ts: Date.now(),
    });
  }
});

// GET /api/health/venues/:venue/missing - Get missing markets for venue
healthRouter.get('/venues/:venue/missing', async (req, res) => {
  try {
    const { venue } = req.params;

    // Get latest completeness audit for venue
    const auditResult = await db.query(
      `SELECT * FROM health_audit_runs
       WHERE venue = $1 AND audit_type = 'completeness'
       ORDER BY ts DESC
       LIMIT 1`,
      [venue]
    );

    if (auditResult.rows.length === 0) {
      return res.json({
        success: true,
        data: {
          venue,
          missing_ids: [],
          message: 'No completeness audit found',
        },
        ts: Date.now(),
      });
    }

    const audit = auditResult.rows[0];

    res.json({
      success: true,
      data: {
        venue,
        missing_ids: audit.missing_ids || [],
        local_count: audit.local_count,
        upstream_count: audit.upstream_count,
        audit_ts: audit.ts?.getTime(),
      },
      ts: Date.now(),
    });
  } catch (error) {
    console.error('GET /api/health/venues/:venue/missing error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      ts: Date.now(),
    });
  }
});

// GET /api/health/venues/:venue/stale - Get stale markets for venue
healthRouter.get('/venues/:venue/stale', async (req, res) => {
  try {
    const { venue } = req.params;

    // Get latest liveness audit for venue
    const auditResult = await db.query(
      `SELECT * FROM health_audit_runs
       WHERE venue = $1 AND audit_type = 'liveness'
       ORDER BY ts DESC
       LIMIT 1`,
      [venue]
    );

    if (auditResult.rows.length === 0) {
      return res.json({
        success: true,
        data: {
          venue,
          stale_ids: [],
          message: 'No liveness audit found',
        },
        ts: Date.now(),
      });
    }

    const audit = auditResult.rows[0];

    // Also get current stale markets from snapshots
    const stalenessThresholds: Record<string, number> = {
      kalshi: 2000,
      polymarket: 5000,
      predictit: 30000,
      manifold: 60000,
      metaculus: 60000,
      finfeed: 10000,
    };
    const threshold = stalenessThresholds[venue] || 30000;

    const staleResult = await db.query(
      `SELECT DISTINCT outcome_id_native, last_update_ts
       FROM pm_liquidity_snapshots
       WHERE venue = $1 
         AND last_update_ts < NOW() - INTERVAL '${threshold} milliseconds'
       ORDER BY last_update_ts ASC
       LIMIT 100`,
      [venue]
    );

    res.json({
      success: true,
      data: {
        venue,
        stale_ids: staleResult.rows.map((r: any) => r.outcome_id_native),
        threshold_ms: threshold,
        audit_stale_ids: audit.stale_ids || [],
        audit_ts: audit.ts?.getTime(),
      },
      ts: Date.now(),
    });
  } catch (error) {
    console.error('GET /api/health/venues/:venue/stale error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      ts: Date.now(),
    });
  }
});

// POST /api/health/audit - Trigger manual audit (for testing)
healthRouter.post('/audit', async (req, res) => {
  try {
    const { venue, audit_type } = req.body;

    if (!venue) {
      return res.status(400).json({
        success: false,
        error: 'venue is required',
        ts: Date.now(),
      });
    }

    // Record audit run (real audit would be done by health-audit service)
    const result = await db.query(
      `INSERT INTO health_audit_runs (venue, audit_type, status, local_count, upstream_count, duration_ms)
       VALUES ($1, $2, 'green', 0, 0, 0)
       RETURNING *`,
      [venue, audit_type || 'completeness']
    );

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Audit triggered - results pending',
      ts: Date.now(),
    });
  } catch (error) {
    console.error('POST /api/health/audit error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      ts: Date.now(),
    });
  }
});

