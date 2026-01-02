/**
 * Rules API Routes
 * Section 5.4 - GET/POST /api/rules
 */

import { Router } from 'express';
import { db } from '../server';
import { TriggerRuleSchema, AlgorithmSpecSchema } from '@arb/schemas';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

export const rulesRouter = Router();

// GET /api/rules - List all rules
rulesRouter.get('/', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT r.*, 
              (SELECT COUNT(*) FROM trigger_events te WHERE te.rule_id = r.rule_id) as event_count,
              (SELECT MAX(ts) FROM trigger_events te WHERE te.rule_id = r.rule_id) as last_triggered
       FROM trigger_rules r
       ORDER BY enabled DESC, created_at DESC`
    );

    res.json({
      success: true,
      data: result.rows,
      ts: Date.now(),
    });
  } catch (error) {
    console.error('GET /api/rules error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      ts: Date.now(),
    });
  }
});

// POST /api/rules - Create new rule
rulesRouter.post('/', async (req, res) => {
  try {
    const ruleData = req.body;

    // Validate with Zod schema
    const parsed = TriggerRuleSchema.omit({ rule_id: true }).safeParse(ruleData);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: `Validation failed: ${parsed.error.message}`,
        ts: Date.now(),
      });
    }

    const ruleId = uuidv4();
    const { name, enabled, template_type, scope, schedule, condition_ast, algorithm_spec } = parsed.data;

    const result = await db.query(
      `INSERT INTO trigger_rules 
       (rule_id, name, enabled, template_type, scope, schedule, condition_ast, algorithm_spec)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        ruleId,
        name,
        enabled || false,
        template_type,
        JSON.stringify(scope),
        JSON.stringify(schedule),
        JSON.stringify(condition_ast),
        JSON.stringify(algorithm_spec),
      ]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
      ts: Date.now(),
    });
  } catch (error) {
    console.error('POST /api/rules error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      ts: Date.now(),
    });
  }
});

// GET /api/rules/:id - Get single rule
rulesRouter.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `SELECT * FROM trigger_rules WHERE rule_id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Rule not found',
        ts: Date.now(),
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
      ts: Date.now(),
    });
  } catch (error) {
    console.error('GET /api/rules/:id error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      ts: Date.now(),
    });
  }
});

// PUT /api/rules/:id - Update rule
rulesRouter.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Build dynamic update query
    const allowedFields = ['name', 'scope', 'schedule', 'condition_ast', 'algorithm_spec'];
    const setClause: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        setClause.push(`${field} = $${paramIndex++}`);
        values.push(typeof updates[field] === 'object' ? JSON.stringify(updates[field]) : updates[field]);
      }
    }

    if (setClause.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid fields to update',
        ts: Date.now(),
      });
    }

    values.push(id);
    const result = await db.query(
      `UPDATE trigger_rules SET ${setClause.join(', ')}, updated_at = NOW()
       WHERE rule_id = $${paramIndex}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Rule not found',
        ts: Date.now(),
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
      ts: Date.now(),
    });
  } catch (error) {
    console.error('PUT /api/rules/:id error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      ts: Date.now(),
    });
  }
});

// POST /api/rules/:id/enable - Enable rule
rulesRouter.post('/:id/enable', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `UPDATE trigger_rules SET enabled = true, updated_at = NOW()
       WHERE rule_id = $1
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Rule not found',
        ts: Date.now(),
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
      ts: Date.now(),
    });
  } catch (error) {
    console.error('POST /api/rules/:id/enable error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      ts: Date.now(),
    });
  }
});

// POST /api/rules/:id/disable - Disable rule
rulesRouter.post('/:id/disable', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `UPDATE trigger_rules SET enabled = false, updated_at = NOW()
       WHERE rule_id = $1
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Rule not found',
        ts: Date.now(),
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
      ts: Date.now(),
    });
  } catch (error) {
    console.error('POST /api/rules/:id/disable error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      ts: Date.now(),
    });
  }
});

// POST /api/rules/:id/test - Test rule on latest snapshot
rulesRouter.post('/:id/test', async (req, res) => {
  try {
    const { id } = req.params;

    // Get rule
    const ruleResult = await db.query(
      `SELECT * FROM trigger_rules WHERE rule_id = $1`,
      [id]
    );

    if (ruleResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Rule not found',
        ts: Date.now(),
      });
    }

    const rule = ruleResult.rows[0];

    // Get latest snapshots for markets in scope
    // This is a simplified test - real implementation would evaluate condition_ast
    const snapshotsResult = await db.query(
      `SELECT DISTINCT ON (venue, outcome_id_native) *
       FROM pm_liquidity_snapshots
       ORDER BY venue, outcome_id_native, ts DESC
       LIMIT 100`
    );

    // Simulate rule evaluation
    const testResult = {
      rule_id: id,
      rule_name: rule.name,
      template_type: rule.template_type,
      evaluated_at: Date.now(),
      snapshots_checked: snapshotsResult.rows.length,
      condition_would_fire: false, // Placeholder
      computed_metrics: {}, // Placeholder
      explanation: ['Test evaluation - real implementation pending'],
    };

    res.json({
      success: true,
      data: testResult,
      ts: Date.now(),
    });
  } catch (error) {
    console.error('POST /api/rules/:id/test error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      ts: Date.now(),
    });
  }
});

// GET /api/rules/:id/events - Get trigger history for rule
rulesRouter.get('/:id/events', async (req, res) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page as string) || 0;
    const page_size = Math.min(parseInt(req.query.page_size as string) || 50, 100);

    const countResult = await db.query(
      `SELECT COUNT(*) FROM trigger_events WHERE rule_id = $1`,
      [id]
    );
    const total = parseInt(countResult.rows[0].count);

    const dataResult = await db.query(
      `SELECT * FROM trigger_events
       WHERE rule_id = $1
       ORDER BY ts DESC
       LIMIT $2 OFFSET $3`,
      [id, page_size, page * page_size]
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
    console.error('GET /api/rules/:id/events error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      ts: Date.now(),
    });
  }
});

