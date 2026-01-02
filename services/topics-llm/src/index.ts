/**
 * LLM Topic Scanner Service
 * 
 * Uses ChatGPT to analyze open prediction markets and generate monitoring topics.
 * Topics go through governance (proposed → approved/rejected) before monitoring.
 * 
 * This is a RESEARCH ASSISTANT, not a trading system:
 * - Proposes topics and queries
 * - Does NOT decide trades
 * - Does NOT set thresholds
 * - Does NOT overwrite mappings without human approval
 */

import { Pool } from 'pg';
import OpenAI from 'openai';
import { TopicPackSchema, TopicSchema } from '@arb/schemas';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

// Configuration
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://localhost:5432/arb_platform';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Initialize
const db = new Pool({ connectionString: DATABASE_URL, max: 5 });
const openai = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

// Scan schedule
const SCAN_INTERVAL_MS = 24 * 60 * 60 * 1000; // Daily
const SCAN_TIME_UTC = 7; // 07:00 UTC

/**
 * System prompt for topic generation
 * Deterministic, structured output focused.
 */
const SYSTEM_PROMPT = `You are a research assistant that analyzes prediction markets and identifies topics to monitor for relevant external events.

Your task is to:
1. Extract topics that correspond to OBSERVABLE external events
2. Propose queries and sources that are AUTHORITATIVE (official sources, not social media)
3. Estimate update frequency based on the nature of the event
4. List entities (companies, people, organizations, places) mentioned
5. Avoid speculation, sentiment, or predictions

For each market, generate 1-3 monitoring topics with:
- label: Short descriptive name
- entities: Array of {type, name, ticker?}
- keywords: 10-20 relevant search terms
- queries: 5-15 specific search queries to monitor
- authoritative_sources: Official data sources (domains like reuters.com, bls.gov, etc.)
- expected_catalysts: Known upcoming events with dates if available
- update_frequency: realtime|hourly|daily|weekly|on_event
- confidence: 0-1 score for topic relevance
- rationale: Explanation of why this topic matters for the market

OUTPUT FORMAT: JSON array of topic objects. No markdown, no explanation outside JSON.

RULES:
- For politics/elections: use official government sources, election boards
- For crypto/markets: use exchange data, Federal Reserve, SEC filings
- For sports: use official league sites, sports databases
- For weather: use NWS, NOAA, official meteorological services
- For macro/economy: use BLS, BEA, FRED, official statistical agencies
- NEVER suggest social media as authoritative
- NEVER include sentiment analysis
- NEVER make predictions about outcomes`;

interface MarketForScan {
  id: string;
  venue: string;
  title: string;
  description: string;
  tags: string[];
  status: string;
  resolve_ts: Date | null;
}

/**
 * Select candidate markets for scanning
 * As per section 10.2 of the spec
 */
async function selectCandidateMarkets(): Promise<MarketForScan[]> {
  const result = await db.query(`
    SELECT id, venue, title, description, tags, status, resolve_ts
    FROM pm_market_outcomes
    WHERE status = 'open'
      AND (resolve_ts IS NULL OR resolve_ts > NOW() + INTERVAL '7 days')
    ORDER BY 
      -- Prioritize by volume/activity (placeholder: use updated_at)
      updated_at DESC
    LIMIT 50
  `);

  return result.rows;
}

/**
 * Generate topics for a batch of markets using GPT-4
 */
async function generateTopicsForMarkets(markets: MarketForScan[]): Promise<any[]> {
  if (!openai) {
    console.warn('OpenAI not configured, using mock topics');
    return generateMockTopics(markets);
  }

  const userPrompt = `Analyze these prediction markets and generate monitoring topics:

${markets.map((m, i) => `
[Market ${i + 1}]
Title: ${m.title}
Description: ${m.description || 'N/A'}
Tags: ${m.tags?.join(', ') || 'N/A'}
Resolution Date: ${m.resolve_ts?.toISOString() || 'Unknown'}
`).join('\n')}

Generate 1-3 topics per market. Return a JSON array.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3, // Lower temperature for more consistent output
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Empty response from OpenAI');
    }

    const parsed = JSON.parse(content);
    return parsed.topics || parsed;
  } catch (error) {
    console.error('OpenAI API error:', error);
    return generateMockTopics(markets);
  }
}

/**
 * Mock topic generator (fallback when OpenAI unavailable)
 */
function generateMockTopics(markets: MarketForScan[]): any[] {
  return markets.flatMap((market) => {
    const topics = [];

    // Generate topic based on market title keywords
    if (market.title.toLowerCase().includes('bitcoin') || market.title.toLowerCase().includes('btc')) {
      topics.push({
        label: 'Bitcoin Price Movements',
        entities: [
          { type: 'commodity', name: 'Bitcoin', ticker: 'BTC' },
        ],
        keywords: ['bitcoin', 'btc', 'cryptocurrency', 'crypto price', 'bitcoin etf', 'btc usd'],
        queries: [
          'bitcoin price today',
          'btc all time high',
          'bitcoin etf approval',
          'cryptocurrency regulation news',
          'federal reserve crypto policy',
        ],
        authoritative_sources: ['coinmarketcap.com', 'coingecko.com', 'sec.gov', 'federalreserve.gov'],
        expected_catalysts: [
          { event: 'Bitcoin halving', expected_ts: null, impact: 'high' },
          { event: 'ETF decision dates', expected_ts: null, impact: 'high' },
        ],
        update_frequency: 'hourly',
        confidence: 0.9,
        rationale: 'Bitcoin price is directly observable and has known catalyst events',
      });
    }

    if (market.title.toLowerCase().includes('trump') || market.title.toLowerCase().includes('election')) {
      topics.push({
        label: 'US Presidential Election 2024',
        entities: [
          { type: 'person', name: 'Donald Trump' },
          { type: 'person', name: 'Joe Biden' },
          { type: 'country', name: 'United States' },
        ],
        keywords: ['election', 'presidential', 'trump', 'biden', 'electoral college', 'polling'],
        queries: [
          'presidential election polls 2024',
          'trump campaign news',
          'electoral college predictions',
          'state primary results',
          'candidate debate schedule',
        ],
        authoritative_sources: ['fec.gov', 'realclearpolitics.com', 'fivethirtyeight.com', 'ap.org', 'congress.gov'],
        expected_catalysts: [
          { event: 'Super Tuesday', expected_ts: null, impact: 'high' },
          { event: 'National Convention', expected_ts: null, impact: 'medium' },
          { event: 'Election Day', expected_ts: new Date('2024-11-05').getTime(), impact: 'high' },
        ],
        update_frequency: 'daily',
        confidence: 0.95,
        rationale: 'Election outcomes are officially reported with clear resolution criteria',
      });
    }

    if (market.title.toLowerCase().includes('fed') || market.title.toLowerCase().includes('rate')) {
      topics.push({
        label: 'Federal Reserve Interest Rate Decisions',
        entities: [
          { type: 'organization', name: 'Federal Reserve' },
          { type: 'metric', name: 'Federal Funds Rate' },
        ],
        keywords: ['fomc', 'federal reserve', 'interest rate', 'rate cut', 'rate hike', 'monetary policy'],
        queries: [
          'FOMC meeting schedule 2025',
          'fed rate decision',
          'jerome powell speech',
          'federal reserve minutes',
          'inflation data cpi',
        ],
        authoritative_sources: ['federalreserve.gov', 'bls.gov', 'treasury.gov', 'fred.stlouisfed.org'],
        expected_catalysts: [
          { event: 'FOMC Meeting', expected_ts: null, impact: 'high' },
          { event: 'CPI Release', expected_ts: null, impact: 'medium' },
          { event: 'Jobs Report', expected_ts: null, impact: 'medium' },
        ],
        update_frequency: 'on_event',
        confidence: 0.95,
        rationale: 'Fed decisions are publicly announced with exact dates and times',
      });
    }

    // Default topic if no keywords matched
    if (topics.length === 0) {
      topics.push({
        label: `Monitoring: ${market.title.slice(0, 50)}`,
        entities: [],
        keywords: market.title.toLowerCase().split(' ').filter((w) => w.length > 3),
        queries: [`${market.title} news`, `${market.title} latest`],
        authoritative_sources: ['reuters.com', 'apnews.com'],
        expected_catalysts: [],
        update_frequency: 'daily',
        confidence: 0.5,
        rationale: 'Generic monitoring topic - manual review recommended',
      });
    }

    return topics;
  });
}

/**
 * Validate topic against schema
 * Section 10.5 of spec
 */
function validateTopic(topic: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!topic.queries || topic.queries.length === 0) {
    errors.push('queries list empty');
  }

  if (!topic.authoritative_sources || topic.authoritative_sources.length === 0) {
    // Allow for some domains
    if (!['entertainment', 'sports'].includes(topic.domain)) {
      errors.push('authoritative_sources empty for non-entertainment domain');
    }
  }

  if (topic.confidence === undefined || topic.confidence < 0 || topic.confidence > 1) {
    errors.push('confidence missing or out of range');
  }

  // Check for prohibited content (social media as authoritative)
  const prohibitedSources = ['twitter.com', 'reddit.com', 'facebook.com', 'tiktok.com'];
  if (topic.authoritative_sources?.some((s: string) => prohibitedSources.some((p) => s.includes(p)))) {
    errors.push('social media listed as authoritative source');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Store topics and record LLM run
 */
async function storeTopics(
  topics: any[],
  marketIds: string[],
  model: string
): Promise<{ stored: number; rejected: number }> {
  let stored = 0;
  let rejected = 0;
  const runId = uuidv4();
  const promptHash = crypto.createHash('sha256')
    .update(JSON.stringify(marketIds))
    .digest('hex')
    .slice(0, 16);

  const allErrors: string[] = [];

  for (const topic of topics) {
    const validation = validateTopic(topic);

    if (!validation.valid) {
      allErrors.push(...validation.errors);
      rejected++;
      continue;
    }

    const topicId = uuidv4();
    try {
      await db.query(`
        INSERT INTO topics (
          topic_id, label, entities, keywords, queries,
          authoritative_sources, expected_event_types, update_frequency,
          confidence, status, created_by, rationale
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'proposed', 'llm', $10)
      `, [
        topicId,
        topic.label,
        JSON.stringify(topic.entities || []),
        JSON.stringify(topic.keywords || []),
        JSON.stringify(topic.queries),
        JSON.stringify(topic.authoritative_sources),
        JSON.stringify(topic.expected_catalysts?.map((c: any) => c.event) || []),
        topic.update_frequency,
        topic.confidence,
        topic.rationale,
      ]);
      stored++;
    } catch (error) {
      console.error('Failed to store topic:', error);
      rejected++;
    }
  }

  // Record LLM run
  await db.query(`
    INSERT INTO llm_topic_runs (
      run_id, model, input_market_ids, prompt_hash,
      response_json, validation_passed, errors
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
  `, [
    runId,
    model,
    JSON.stringify(marketIds),
    promptHash,
    JSON.stringify(topics),
    rejected === 0,
    JSON.stringify(allErrors),
  ]);

  return { stored, rejected };
}

/**
 * Run topic scan
 */
async function runTopicScan() {
  console.log('🔍 Starting topic scan...');

  try {
    // 1. Select candidate markets
    const markets = await selectCandidateMarkets();
    console.log(`Found ${markets.length} candidate markets`);

    if (markets.length === 0) {
      console.log('No markets to scan');
      return;
    }

    // 2. Generate topics using LLM
    const topics = await generateTopicsForMarkets(markets);
    console.log(`Generated ${topics.length} topics`);

    // 3. Store topics (as 'proposed' status)
    const { stored, rejected } = await storeTopics(
      topics,
      markets.map((m) => m.id),
      openai ? 'gpt-4o' : 'mock'
    );

    console.log(`✅ Topic scan complete: ${stored} stored, ${rejected} rejected`);
  } catch (error) {
    console.error('❌ Topic scan failed:', error);
  }
}

/**
 * Schedule next scan
 */
function scheduleNextScan() {
  const now = new Date();
  const nextScan = new Date(now);
  nextScan.setUTCHours(SCAN_TIME_UTC, 0, 0, 0);

  if (nextScan <= now) {
    nextScan.setDate(nextScan.getDate() + 1);
  }

  const delay = nextScan.getTime() - now.getTime();
  console.log(`Next scan scheduled for ${nextScan.toISOString()} (in ${Math.round(delay / 1000 / 60)} minutes)`);

  setTimeout(() => {
    runTopicScan().then(scheduleNextScan);
  }, delay);
}

/**
 * Main entry point
 */
async function main() {
  console.log('🚀 LLM Topic Scanner Service starting...');

  try {
    // Test database connection
    const client = await db.connect();
    console.log('✅ Database connected');
    client.release();

    // Check OpenAI
    if (openai) {
      console.log('✅ OpenAI configured');
    } else {
      console.warn('⚠️ OpenAI not configured, will use mock topics');
    }

    // Run initial scan
    await runTopicScan();

    // Schedule daily scans
    scheduleNextScan();

    console.log('✅ LLM Topic Scanner Service running');
  } catch (error) {
    console.error('❌ Failed to start service:', error);
    process.exit(1);
  }
}

// Handle shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down...');
  await db.end();
  process.exit(0);
});

main();

