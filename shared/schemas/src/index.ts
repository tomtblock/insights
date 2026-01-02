/**
 * @arb/schemas - Canonical Schemas for Arbitrage Platform
 * 
 * All inbound adapter outputs MUST be validated against these schemas.
 * Invalid data is rejected at the boundary.
 */

import { z } from 'zod';

// ============================================================================
// Enums
// ============================================================================

export const VenueEnum = z.enum([
  'polymarket',
  'kalshi',
  'predictit',
  'manifold',
  'metaculus',
  'omen',
  'zeitgeist',
  'finfeed',
]);
export type Venue = z.infer<typeof VenueEnum>;

export const MarketMechanismEnum = z.enum(['CLOB', 'AMM']);
export type MarketMechanism = z.infer<typeof MarketMechanismEnum>;

export const QuoteCurrencyEnum = z.enum(['USD', 'USDC', 'ETH', 'USDT']);
export type QuoteCurrency = z.infer<typeof QuoteCurrencyEnum>;

export const MarketStatusEnum = z.enum(['open', 'closed', 'resolved', 'disputed', 'paused']);
export type MarketStatus = z.infer<typeof MarketStatusEnum>;

export const VolumeBucketEnum = z.enum(['1m', '5m', '15m', '1h', '4h', '24h', '7d']);
export type VolumeBucket = z.infer<typeof VolumeBucketEnum>;

export const DomainEnum = z.enum([
  'politics',
  'crypto',
  'sports',
  'economy',
  'tech',
  'science',
  'weather',
  'entertainment',
  'other',
]);
export type Domain = z.infer<typeof DomainEnum>;

export const EntityTypeEnum = z.enum([
  'company',
  'person',
  'team',
  'country',
  'metric',
  'organization',
  'index',
  'commodity',
]);
export type EntityType = z.infer<typeof EntityTypeEnum>;

export const EventStatusEnum = z.enum(['scheduled', 'ongoing', 'completed', 'cancelled', 'postponed']);
export type EventStatus = z.infer<typeof EventStatusEnum>;

export const TopicStatusEnum = z.enum(['proposed', 'approved', 'rejected', 'paused', 'archived']);
export type TopicStatus = z.infer<typeof TopicStatusEnum>;

export const UpdateFrequencyEnum = z.enum(['realtime', 'hourly', 'daily', 'weekly', 'on_event']);
export type UpdateFrequency = z.infer<typeof UpdateFrequencyEnum>;

export const OpportunityStatusEnum = z.enum(['open', 'expired', 'invalid', 'executed', 'dismissed']);
export type OpportunityStatus = z.infer<typeof OpportunityStatusEnum>;

export const AlertSeverityEnum = z.enum(['info', 'warning', 'high', 'critical']);
export type AlertSeverity = z.infer<typeof AlertSeverityEnum>;

export const HealthStatusEnum = z.enum(['green', 'yellow', 'red', 'unknown']);
export type HealthStatus = z.infer<typeof HealthStatusEnum>;

// ============================================================================
// Market Outcome Schema
// ============================================================================

export const MarketOutcomeSchema = z.object({
  id: z.string().uuid().optional(),
  venue: VenueEnum,
  market_id_native: z.string().min(1),
  outcome_id_native: z.string().min(1),
  title: z.string().min(1).max(500),
  description: z.string().max(5000).optional(),
  tags: z.array(z.string()).default([]),
  outcome_name: z.string().min(1),
  mechanism: MarketMechanismEnum,
  quote_currency: QuoteCurrencyEnum,
  fee_bps: z.number().int().min(0).max(10000).nullable(),
  tick_size: z.number().positive().nullable(),
  open_ts: z.number().int().positive(),
  close_ts: z.number().int().positive().nullable(),
  resolve_ts: z.number().int().positive().nullable(),
  status: MarketStatusEnum,
  resolution_source: z.string().min(1),
  truth_spec_text: z.string().max(10000),
  truth_ambiguity_score: z.number().min(0).max(1).default(0.5),
  created_at: z.number().int().positive().optional(),
  updated_at: z.number().int().positive().optional(),
});
export type MarketOutcome = z.infer<typeof MarketOutcomeSchema>;

// ============================================================================
// Liquidity Snapshot Schema
// ============================================================================

export const LiquiditySnapshotSchema = z.object({
  ts: z.number().int().positive(),
  venue: VenueEnum,
  outcome_id_native: z.string().min(1),
  best_bid: z.number().min(0).max(1).nullable(),
  best_ask: z.number().min(0).max(1).nullable(),
  mid: z.number().min(0).max(1).nullable(),
  spread: z.number().min(0).nullable(),
  depth_usd_1pct: z.number().min(0).nullable(),
  depth_usd_5pct: z.number().min(0).nullable(),
  amm_price: z.number().min(0).max(1).nullable(),
  amm_slippage_100: z.number().min(0).nullable(),
  amm_slippage_500: z.number().min(0).nullable(),
  amm_slippage_1000: z.number().min(0).nullable(),
  last_update_ts: z.number().int().positive(),
  snapshot_hash: z.string().optional(),
}).refine(
  (data) => {
    // CLOB must have bid/ask, AMM must have amm_price
    if (data.best_bid !== null && data.best_ask !== null) {
      return data.best_bid <= data.best_ask;
    }
    return true;
  },
  { message: 'best_bid must be <= best_ask' }
);
export type LiquiditySnapshot = z.infer<typeof LiquiditySnapshotSchema>;

// ============================================================================
// Volume Bucket Schema
// ============================================================================

export const VolumeBucketDataSchema = z.object({
  ts_bucket: z.number().int().positive(),
  bucket: VolumeBucketEnum,
  venue: VenueEnum,
  outcome_id_native: z.string().min(1),
  notional_usd: z.number().min(0),
  trade_count: z.number().int().min(0),
  vwap: z.number().min(0).max(1).nullable(),
});
export type VolumeBucketData = z.infer<typeof VolumeBucketDataSchema>;

// ============================================================================
// Stock Symbol Schema
// ============================================================================

export const StockSymbolSchema = z.object({
  symbol_id: z.string().min(1).max(20),
  exchange_id: z.string().min(1),
  name: z.string().min(1).max(200),
  country: z.string().length(2).optional(), // ISO country code
  asset_class: z.string().default('equity'),
  security_category: z.string().optional(),
  sector: z.string().nullable(),
  industry: z.string().nullable(),
  is_enabled: z.boolean().default(true),
  updated_at: z.number().int().positive().optional(),
});
export type StockSymbol = z.infer<typeof StockSymbolSchema>;

// ============================================================================
// Stock Price Snapshot Schema
// ============================================================================

export const StockPriceSnapshotSchema = z.object({
  ts: z.number().int().positive(),
  exchange_id: z.string().min(1),
  symbol_id: z.string().min(1),
  last_price: z.number().positive(),
  open: z.number().positive().nullable(),
  high: z.number().positive().nullable(),
  low: z.number().positive().nullable(),
  close: z.number().positive().nullable(),
  volume: z.number().min(0),
  vwap: z.number().positive().nullable(),
});
export type StockPriceSnapshot = z.infer<typeof StockPriceSnapshotSchema>;

// ============================================================================
// Canonical Event Schema
// ============================================================================

export const CanonicalEventSchema = z.object({
  event_id: z.string().uuid(),
  domain: DomainEnum,
  title: z.string().min(1).max(500),
  description: z.string().max(5000).optional(),
  entities: z.array(z.object({
    entity_id: z.string().uuid().optional(),
    type: EntityTypeEnum,
    name: z.string(),
    confidence: z.number().min(0).max(1).default(1),
  })).default([]),
  location: z.string().nullable(),
  start_ts: z.number().int().positive().nullable(),
  end_ts: z.number().int().positive().nullable(),
  updated_ts: z.number().int().positive(),
  event_type: z.string().min(1),
  status: EventStatusEnum,
  source: z.string().min(1),
  source_url: z.string().url().nullable(),
  confidence: z.number().min(0).max(1),
  tags: z.array(z.string()).default([]),
});
export type CanonicalEvent = z.infer<typeof CanonicalEventSchema>;

// ============================================================================
// Entity Schema
// ============================================================================

export const EntitySchema = z.object({
  entity_id: z.string().uuid(),
  type: EntityTypeEnum,
  name: z.string().min(1).max(200),
  aliases: z.array(z.string()).default([]),
  ticker: z.string().nullable(),
  metadata: z.record(z.unknown()).default({}),
  created_at: z.number().int().positive().optional(),
  updated_at: z.number().int().positive().optional(),
});
export type Entity = z.infer<typeof EntitySchema>;

// ============================================================================
// Entity Link Schema
// ============================================================================

export const EntityLinkSchema = z.object({
  source_type: z.enum(['market', 'event', 'topic', 'stock']),
  source_id: z.string().min(1),
  entity_id: z.string().uuid(),
  confidence: z.number().min(0).max(1),
  rationale: z.string().optional(),
});
export type EntityLink = z.infer<typeof EntityLinkSchema>;

// ============================================================================
// Topic Schema
// ============================================================================

export const TopicSchema = z.object({
  topic_id: z.string().uuid(),
  label: z.string().min(1).max(200),
  entities: z.array(z.object({
    type: EntityTypeEnum,
    name: z.string(),
    ticker: z.string().optional(),
  })).default([]),
  keywords: z.array(z.string()).default([]),
  queries: z.array(z.string()).min(1).max(20),
  authoritative_sources: z.array(z.string()).min(1),
  expected_event_types: z.array(z.string()).default([]),
  update_frequency: UpdateFrequencyEnum,
  confidence: z.number().min(0).max(1),
  status: TopicStatusEnum,
  created_by: z.string().default('llm'),
  rationale: z.string().optional(),
  created_at: z.number().int().positive().optional(),
  updated_at: z.number().int().positive().optional(),
});
export type Topic = z.infer<typeof TopicSchema>;

// ============================================================================
// Topic Pack Schema (LLM Output)
// ============================================================================

export const TopicPackSchema = z.object({
  market_id: z.string().min(1),
  market_title: z.string().min(1),
  topics: z.array(z.object({
    label: z.string().min(1).max(200),
    entities: z.array(z.object({
      type: EntityTypeEnum,
      name: z.string(),
      ticker: z.string().optional(),
    })),
    keywords: z.array(z.string()).min(1).max(30),
    queries: z.array(z.string()).min(5).max(15),
    authoritative_sources: z.array(z.string()).min(1),
    expected_catalysts: z.array(z.object({
      event: z.string(),
      expected_ts: z.number().int().positive().optional(),
      impact: z.enum(['high', 'medium', 'low']),
    })).default([]),
    update_frequency: UpdateFrequencyEnum,
    confidence: z.number().min(0).max(1),
    rationale: z.string(),
  })).min(1),
  generated_at: z.number().int().positive(),
  model: z.string(),
});
export type TopicPack = z.infer<typeof TopicPackSchema>;

// ============================================================================
// Topic Signal Schema
// ============================================================================

export const TopicSignalSchema = z.object({
  signal_id: z.string().uuid(),
  topic_id: z.string().uuid(),
  ts: z.number().int().positive(),
  source: z.string().min(1),
  source_url: z.string().url().optional(),
  payload: z.object({
    headline: z.string().optional(),
    summary: z.string().optional(),
    raw_content: z.string().optional(),
    entities_detected: z.array(z.string()).default([]),
    keywords_matched: z.array(z.string()).default([]),
  }),
  derived_event_id: z.string().uuid().nullable(),
  confidence: z.number().min(0).max(1),
});
export type TopicSignal = z.infer<typeof TopicSignalSchema>;

// ============================================================================
// Opportunity Schema
// ============================================================================

export const EdgeProfileSchema = z.object({
  q_buckets: z.array(z.object({
    q: z.number().positive(),
    buy_price: z.number().min(0).max(1),
    sell_price: z.number().min(0).max(1),
    gross_edge: z.number(),
    fees: z.number(),
    risk_buffer: z.number(),
    net_edge: z.number(),
    executable: z.boolean(),
  })),
  best_q: z.number().positive().nullable(),
  max_executable_size: z.number().min(0),
  total_fees_bps: z.number().min(0),
});
export type EdgeProfile = z.infer<typeof EdgeProfileSchema>;

export const OpportunitySchema = z.object({
  opportunity_id: z.string().uuid(),
  canonical_event_id: z.string().uuid(),
  buy_venue: VenueEnum,
  sell_venue: VenueEnum,
  buy_outcome_id: z.string().min(1),
  sell_outcome_id: z.string().min(1),
  created_ts: z.number().int().positive(),
  last_seen_ts: z.number().int().positive(),
  status: OpportunityStatusEnum,
  invalidation_reason: z.string().nullable(),
  confidence_score: z.number().min(0).max(100),
  edge_profile: EdgeProfileSchema,
  snapshot_refs: z.object({
    buy_snapshot_hash: z.string(),
    sell_snapshot_hash: z.string(),
    buy_ts: z.number().int().positive(),
    sell_ts: z.number().int().positive(),
  }),
  flags: z.object({
    stale: z.boolean().default(false),
    near_resolution: z.boolean().default(false),
    high_ambiguity: z.boolean().default(false),
    wide_spread: z.boolean().default(false),
    low_depth: z.boolean().default(false),
  }).default({}),
});
export type Opportunity = z.infer<typeof OpportunitySchema>;

// ============================================================================
// Trigger Rule Schema
// ============================================================================

export const ConditionNodeSchema: z.ZodType<ConditionNode> = z.lazy(() =>
  z.object({
    type: z.enum(['AND', 'OR', 'NOT', 'COMPARE', 'EXPR']),
    operator: z.enum(['>', '<', '>=', '<=', '==', '!=']).optional(),
    left: z.union([z.string(), ConditionNodeSchema]).optional(),
    right: z.union([z.number(), z.string(), ConditionNodeSchema]).optional(),
    children: z.array(ConditionNodeSchema).optional(),
  })
);
export type ConditionNode = {
  type: 'AND' | 'OR' | 'NOT' | 'COMPARE' | 'EXPR';
  operator?: '>' | '<' | '>=' | '<=' | '==' | '!=';
  left?: string | ConditionNode;
  right?: number | string | ConditionNode;
  children?: ConditionNode[];
};

export const AlgorithmVariableSchema = z.object({
  name: z.string().min(1),
  unit: z.string(),
  definition: z.string(),
  source_fields: z.array(z.string()),
  expr: z.string(),
});
export type AlgorithmVariable = z.infer<typeof AlgorithmVariableSchema>;

export const AlgorithmSpecSchema = z.object({
  variables: z.array(AlgorithmVariableSchema),
  formulas: z.array(z.object({
    name: z.string(),
    latex: z.string(),
    description: z.string(),
  })),
  inputs_used: z.array(z.object({
    venue: VenueEnum,
    outcome_id: z.string(),
    fields: z.array(z.string()),
    staleness_threshold_ms: z.number().int().positive(),
  })),
  constraints: z.array(z.string()),
});
export type AlgorithmSpec = z.infer<typeof AlgorithmSpecSchema>;

export const TriggerRuleSchema = z.object({
  rule_id: z.string().uuid(),
  name: z.string().min(1).max(200),
  enabled: z.boolean().default(false),
  template_type: z.string().min(1),
  scope: z.object({
    venues: z.array(VenueEnum).optional(),
    domains: z.array(DomainEnum).optional(),
    canonical_event_ids: z.array(z.string().uuid()).optional(),
  }).default({}),
  schedule: z.object({
    interval_ms: z.number().int().positive().default(1000),
    debounce_ms: z.number().int().min(0).default(2000),
    persistence_ms: z.number().int().min(0).default(1000),
  }).default({}),
  condition_ast: ConditionNodeSchema,
  algorithm_spec: AlgorithmSpecSchema,
  created_at: z.number().int().positive().optional(),
  updated_at: z.number().int().positive().optional(),
});
export type TriggerRule = z.infer<typeof TriggerRuleSchema>;

// ============================================================================
// Trigger Event Schema
// ============================================================================

export const TriggerEventSchema = z.object({
  event_id: z.string().uuid(),
  rule_id: z.string().uuid(),
  ts: z.number().int().positive(),
  inputs_hash: z.string(),
  canonical_event_id: z.string().uuid().nullable(),
  markets_involved: z.array(z.object({
    venue: VenueEnum,
    outcome_id_native: z.string(),
    snapshot_hash: z.string(),
  })),
  computed_metrics: z.record(z.number()),
  explanation: z.array(z.string()),
  severity: AlertSeverityEnum,
});
export type TriggerEvent = z.infer<typeof TriggerEventSchema>;

// ============================================================================
// Health Status Schema
// ============================================================================

export const VenueHealthSchema = z.object({
  venue: VenueEnum,
  status: HealthStatusEnum,
  completeness: z.number().min(0).max(1),
  liveness: z.number().min(0).max(1),
  local_market_count: z.number().int().min(0),
  upstream_market_count: z.number().int().min(0),
  missing_markets: z.array(z.string()),
  stale_markets: z.array(z.string()),
  error_message: z.string().nullable(),
  last_audit_ts: z.number().int().positive(),
});
export type VenueHealth = z.infer<typeof VenueHealthSchema>;

export const GlobalHealthSchema = z.object({
  status: HealthStatusEnum,
  venues: z.array(VenueHealthSchema),
  read_only_mode: z.boolean(),
  blocking_issues: z.array(z.string()),
  last_audit_ts: z.number().int().positive(),
});
export type GlobalHealth = z.infer<typeof GlobalHealthSchema>;

// ============================================================================
// Market Link Schema (Canonical Event Mapping)
// ============================================================================

export const MarketLinkSchema = z.object({
  canonical_event_id: z.string().uuid(),
  venue: VenueEnum,
  outcome_id_native: z.string().min(1),
  confidence: z.number().min(0).max(1),
  notes: z.string().optional(),
  created_at: z.number().int().positive().optional(),
});
export type MarketLink = z.infer<typeof MarketLinkSchema>;

// ============================================================================
// API Response Schemas
// ============================================================================

export const PaginationSchema = z.object({
  page: z.number().int().min(0),
  page_size: z.number().int().min(1).max(200),
  total: z.number().int().min(0),
  has_more: z.boolean(),
});
export type Pagination = z.infer<typeof PaginationSchema>;

export const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.nullable(),
    error: z.string().nullable(),
    ts: z.number().int().positive(),
    pagination: PaginationSchema.optional(),
  });

// ============================================================================
// Validation Helpers
// ============================================================================

export function validateMarketOutcome(data: unknown): MarketOutcome {
  return MarketOutcomeSchema.parse(data);
}

export function validateLiquiditySnapshot(data: unknown): LiquiditySnapshot {
  return LiquiditySnapshotSchema.parse(data);
}

export function validateTopicPack(data: unknown): TopicPack {
  return TopicPackSchema.parse(data);
}

export function validateOpportunity(data: unknown): Opportunity {
  return OpportunitySchema.parse(data);
}

export function validateTriggerRule(data: unknown): TriggerRule {
  return TriggerRuleSchema.parse(data);
}

export function safeValidate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

