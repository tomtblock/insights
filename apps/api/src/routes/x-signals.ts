/**
 * X Signal Intelligence API Routes
 * 
 * Endpoints for X/Twitter signal processing and event detection
 */

import { Router } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// ============ TYPES ============

const AccountSchema = z.object({
  account_id: z.string(),
  handle: z.string(),
  display_name: z.string().optional(),
  category: z.enum(['Economy', 'Politics', 'Sports', 'Tech', 'M&A', 'Crypto']),
  subdomain: z.string(),
  tier: z.number().min(1).max(3),
  credibility_score: z.number().min(0).max(1),
  region: z.string().optional(),
  active: z.boolean(),
  notes: z.string().optional(),
});

const SignalSchema = z.object({
  signal_id: z.string(),
  tweet_id: z.string(),
  account_id: z.string(),
  handle: z.string(),
  text: z.string(),
  timestamp: z.string(),
  matched_keywords: z.array(z.string()),
  keyword_bundle: z.string(),
  keyword_confidence: z.number(),
  velocity_score: z.number(),
  is_spike: z.boolean(),
  source_tier: z.number(),
  source_credibility: z.number(),
  confirmation_count: z.number(),
  confirmed_by: z.array(z.string()),
  overall_confidence: z.number(),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
});

const EventSchema = z.object({
  event_id: z.string(),
  event_type: z.string(),
  category: z.string(),
  headline: z.string(),
  summary: z.string(),
  confidence: z.number(),
  status: z.enum(['rumor', 'developing', 'confirmed', 'denied', 'resolved']),
  sources: z.array(z.string()),
  first_seen: z.string(),
  market_impact: z.object({
    direction: z.string(),
    magnitude: z.string(),
    sectors: z.array(z.string()),
    assets: z.array(z.string()),
  }).optional(),
});

// ============ MOCK DATA ============

const MOCK_ACCOUNTS = [
  { account_id: 'javierblas', handle: '@JavierBlas', display_name: 'Javier Blas', category: 'Economy', subdomain: 'Commodities', tier: 1, credibility_score: 0.95, region: 'Global', active: true, notes: 'Bloomberg commodities lead' },
  { account_id: 'sentdefender', handle: '@sentdefender', display_name: 'OSINTdefender', category: 'Politics', subdomain: 'Conflict OSINT', tier: 1, credibility_score: 0.90, region: 'Global', active: true, notes: 'Early escalation detection' },
  { account_id: 'wojespn', handle: '@wojespn', display_name: 'Adrian Wojnarowski', category: 'Sports', subdomain: 'NBA', tier: 1, credibility_score: 0.97, region: 'US', active: true, notes: 'NBA trades' },
  { account_id: 'sama', handle: '@sama', display_name: 'Sam Altman', category: 'Tech', subdomain: 'AI', tier: 1, credibility_score: 0.98, region: 'US', active: true, notes: 'OpenAI CEO' },
  { account_id: 'dealbook', handle: '@dealbook', display_name: 'DealBook', category: 'M&A', subdomain: 'M&A', tier: 1, credibility_score: 0.95, region: 'Global', active: true, notes: 'NYT deals' },
  { account_id: 'theblock', handle: '@TheBlock__', display_name: 'The Block', category: 'Crypto', subdomain: 'Crypto News', tier: 1, credibility_score: 0.90, region: 'Global', active: true, notes: 'Crypto M&A' },
];

const MOCK_SIGNALS = [
  {
    signal_id: uuidv4(),
    tweet_id: '12345678901',
    account_id: 'sentdefender',
    handle: '@sentdefender',
    text: 'BREAKING: Houthi forces launch multiple drones toward Red Sea shipping lanes. US Navy monitoring situation.',
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    matched_keywords: ['drone attack', 'Red Sea', 'shipping', 'Houthi', 'military'],
    keyword_bundle: 'Politics',
    keyword_confidence: 0.85,
    velocity_score: 0.78,
    is_spike: true,
    source_tier: 1,
    source_credibility: 0.90,
    confirmation_count: 2,
    confirmed_by: ['@Reuters', '@ELINTNews'],
    overall_confidence: 0.88,
    severity: 'critical' as const,
  },
  {
    signal_id: uuidv4(),
    tweet_id: '12345678902',
    account_id: 'javierblas',
    handle: '@JavierBlas',
    text: 'OPEC+ emergency meeting called for tomorrow. Sources indicate 500k-1M bpd production cut being discussed.',
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    matched_keywords: ['OPEC', 'production cut', 'emergency meeting', 'oil', 'bpd'],
    keyword_bundle: 'Economy',
    keyword_confidence: 0.92,
    velocity_score: 0.65,
    is_spike: false,
    source_tier: 1,
    source_credibility: 0.95,
    confirmation_count: 1,
    confirmed_by: ['@EnergyIntel'],
    overall_confidence: 0.92,
    severity: 'high' as const,
  },
];

const MOCK_EVENTS = [
  {
    event_id: uuidv4(),
    event_type: 'military_strike',
    category: 'Politics',
    headline: '[Politics] military strike: drone attack, Red Sea, shipping',
    summary: 'Houthi forces launch multiple drones toward Red Sea shipping lanes. US Navy monitoring situation.',
    confidence: 0.88,
    status: 'developing' as const,
    sources: ['@sentdefender', '@Reuters'],
    first_seen: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    market_impact: {
      direction: 'bullish',
      magnitude: 'significant',
      sectors: ['Energy', 'Shipping', 'Insurance'],
      assets: ['$OIL', '$SHIPPING'],
    },
  },
  {
    event_id: uuidv4(),
    event_type: 'production_cut',
    category: 'Economy',
    headline: '[Economy] production cut: OPEC, emergency meeting, oil',
    summary: 'OPEC+ emergency meeting called for tomorrow with production cuts on the table.',
    confidence: 0.92,
    status: 'confirmed' as const,
    sources: ['@JavierBlas', '@EnergyIntel'],
    first_seen: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    market_impact: {
      direction: 'bullish',
      magnitude: 'major',
      sectors: ['Energy', 'Commodities'],
      assets: ['$CL', '$XLE'],
    },
  },
];

// ============ ENDPOINTS ============

// GET /api/x-signals/accounts
// List all monitored accounts
router.get('/accounts', async (req, res) => {
  try {
    const { category, tier, active } = req.query;
    
    let accounts = [...MOCK_ACCOUNTS];
    
    if (category) {
      accounts = accounts.filter(a => a.category === category);
    }
    if (tier) {
      accounts = accounts.filter(a => a.tier === Number(tier));
    }
    if (active !== undefined) {
      accounts = accounts.filter(a => a.active === (active === 'true'));
    }
    
    res.json({
      success: true,
      data: accounts,
      count: accounts.length,
      ts: Date.now(),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/x-signals/accounts/:id
// Get single account
router.get('/accounts/:id', async (req, res) => {
  try {
    const account = MOCK_ACCOUNTS.find(a => a.account_id === req.params.id);
    
    if (!account) {
      return res.status(404).json({ success: false, error: 'Account not found' });
    }
    
    res.json({ success: true, data: account, ts: Date.now() });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/x-signals/accounts
// Add new account
router.post('/accounts', async (req, res) => {
  try {
    const account = AccountSchema.parse({
      account_id: uuidv4(),
      ...req.body,
    });
    
    // In production, this would persist to DB
    MOCK_ACCOUNTS.push(account);
    
    res.status(201).json({ success: true, data: account, ts: Date.now() });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// GET /api/x-signals/signals
// List recent signals
router.get('/signals', async (req, res) => {
  try {
    const { category, severity, limit, since } = req.query;
    
    let signals = [...MOCK_SIGNALS];
    
    if (category) {
      signals = signals.filter(s => s.keyword_bundle === category);
    }
    if (severity) {
      signals = signals.filter(s => s.severity === severity);
    }
    if (since) {
      const sinceDate = new Date(since as string);
      signals = signals.filter(s => new Date(s.timestamp) >= sinceDate);
    }
    
    // Sort by timestamp desc
    signals.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    // Apply limit
    if (limit) {
      signals = signals.slice(0, Number(limit));
    }
    
    res.json({
      success: true,
      data: signals,
      count: signals.length,
      ts: Date.now(),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/x-signals/signals/:id
// Get single signal
router.get('/signals/:id', async (req, res) => {
  try {
    const signal = MOCK_SIGNALS.find(s => s.signal_id === req.params.id);
    
    if (!signal) {
      return res.status(404).json({ success: false, error: 'Signal not found' });
    }
    
    res.json({ success: true, data: signal, ts: Date.now() });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/x-signals/events
// List normalized events
router.get('/events', async (req, res) => {
  try {
    const { category, status, min_confidence, limit } = req.query;
    
    let events = [...MOCK_EVENTS];
    
    if (category) {
      events = events.filter(e => e.category === category);
    }
    if (status) {
      events = events.filter(e => e.status === status);
    }
    if (min_confidence) {
      events = events.filter(e => e.confidence >= Number(min_confidence));
    }
    
    // Sort by first_seen desc
    events.sort((a, b) => new Date(b.first_seen).getTime() - new Date(a.first_seen).getTime());
    
    if (limit) {
      events = events.slice(0, Number(limit));
    }
    
    res.json({
      success: true,
      data: events,
      count: events.length,
      ts: Date.now(),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/x-signals/events/:id
// Get single event
router.get('/events/:id', async (req, res) => {
  try {
    const event = MOCK_EVENTS.find(e => e.event_id === req.params.id);
    
    if (!event) {
      return res.status(404).json({ success: false, error: 'Event not found' });
    }
    
    res.json({ success: true, data: event, ts: Date.now() });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/x-signals/keywords
// List keyword bundles
router.get('/keywords', async (req, res) => {
  try {
    const bundles = [
      {
        category: 'Economy',
        version: '1.0',
        keywords: ['supply disruption', 'force majeure', 'export ban', 'production cut', 'OPEC', 'rate hike', 'inflation'],
        phrases: ['emergency meeting', 'production quota', 'strategic reserve'],
      },
      {
        category: 'Politics',
        version: '1.0',
        keywords: ['state of emergency', 'martial law', 'sanctions', 'military escalation', 'ceasefire', 'mobilization'],
        phrases: ['breaking news', 'confirmed reports', 'military operation'],
      },
      {
        category: 'Sports',
        version: '1.0',
        keywords: ['out indefinitely', 'trade finalized', 'transfer agreed', 'coach fired', 'suspended', 'injury'],
        phrases: ['here we go', 'deal done', 'per sources'],
      },
      {
        category: 'Tech',
        version: '1.0',
        keywords: ['model released', 'training compute', 'export controls', 'AI regulation', 'antitrust probe', 'acquisition'],
        phrases: ['just announced', 'now available', 'rolling out'],
      },
      {
        category: 'M&A',
        version: '1.0',
        keywords: ['acquired for', 'term sheet', 'strategic investment', 'regulatory approval', 'deal collapsed', 'IPO'],
        phrases: ['deal value', 'all-cash offer', 'hostile takeover'],
      },
      {
        category: 'Crypto',
        version: '1.0',
        keywords: ['hack', 'exploit', 'rug pull', 'ETF approved', 'SEC', 'depeg', 'liquidation'],
        phrases: ['funds are safu', 'protocol exploit', 'governance vote'],
      },
    ];
    
    res.json({
      success: true,
      data: bundles,
      count: bundles.length,
      ts: Date.now(),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/x-signals/stats
// Get signal statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = {
      total_signals: MOCK_SIGNALS.length,
      total_events: MOCK_EVENTS.length,
      active_accounts: MOCK_ACCOUNTS.filter(a => a.active).length,
      by_category: {
        Economy: MOCK_SIGNALS.filter(s => s.keyword_bundle === 'Economy').length,
        Politics: MOCK_SIGNALS.filter(s => s.keyword_bundle === 'Politics').length,
        Sports: MOCK_SIGNALS.filter(s => s.keyword_bundle === 'Sports').length,
        Tech: MOCK_SIGNALS.filter(s => s.keyword_bundle === 'Tech').length,
        'M&A': MOCK_SIGNALS.filter(s => s.keyword_bundle === 'M&A').length,
        Crypto: MOCK_SIGNALS.filter(s => s.keyword_bundle === 'Crypto').length,
      },
      by_severity: {
        critical: MOCK_SIGNALS.filter(s => s.severity === 'critical').length,
        high: MOCK_SIGNALS.filter(s => s.severity === 'high').length,
        medium: MOCK_SIGNALS.filter(s => s.severity === 'medium').length,
        low: MOCK_SIGNALS.filter(s => s.severity === 'low').length,
      },
      by_status: {
        confirmed: MOCK_EVENTS.filter(e => e.status === 'confirmed').length,
        developing: MOCK_EVENTS.filter(e => e.status === 'developing').length,
        rumor: MOCK_EVENTS.filter(e => e.status === 'rumor').length,
        denied: MOCK_EVENTS.filter(e => e.status === 'denied').length,
      },
      avg_confidence: MOCK_SIGNALS.reduce((sum, s) => sum + s.overall_confidence, 0) / MOCK_SIGNALS.length || 0,
      last_signal_at: MOCK_SIGNALS.length > 0 
        ? MOCK_SIGNALS.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0].timestamp
        : null,
    };
    
    res.json({ success: true, data: stats, ts: Date.now() });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/x-signals/process
// Process a raw tweet (for testing/manual injection)
router.post('/process', async (req, res) => {
  try {
    const { tweet_id, account_id, handle, text, timestamp } = req.body;
    
    if (!text || !handle) {
      return res.status(400).json({ success: false, error: 'text and handle are required' });
    }
    
    // Mock signal processing
    const signal = {
      signal_id: uuidv4(),
      tweet_id: tweet_id || uuidv4(),
      account_id: account_id || handle.replace('@', '').toLowerCase(),
      handle,
      text,
      timestamp: timestamp || new Date().toISOString(),
      matched_keywords: text.toLowerCase().includes('breaking') ? ['breaking news'] : ['general'],
      keyword_bundle: 'Politics',
      keyword_confidence: 0.5,
      velocity_score: 0.3,
      is_spike: false,
      source_tier: 2,
      source_credibility: 0.75,
      confirmation_count: 0,
      confirmed_by: [],
      overall_confidence: 0.5,
      severity: 'medium' as const,
    };
    
    MOCK_SIGNALS.push(signal);
    
    res.status(201).json({ success: true, data: signal, ts: Date.now() });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/x-signals/alerts
// Get active alerts
router.get('/alerts', async (req, res) => {
  try {
    const alerts = MOCK_SIGNALS
      .filter(s => s.severity === 'critical' || s.severity === 'high')
      .map(s => ({
        alert_id: uuidv4(),
        signal_id: s.signal_id,
        severity: s.severity === 'critical' ? 'critical' : 'warning',
        trigger: s.source_tier === 1 ? 'tier1_override' : 'confidence_threshold',
        title: `${s.keyword_bundle}: ${s.matched_keywords.slice(0, 2).join(', ')}`,
        message: s.text.slice(0, 200),
        created_at: s.timestamp,
        acknowledged: false,
      }));
    
    res.json({
      success: true,
      data: alerts,
      count: alerts.length,
      ts: Date.now(),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export { router as xSignalsRouter };

