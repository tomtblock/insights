-- ============================================================================
-- Arb Platform - Initial Database Schema
-- ============================================================================
-- This migration creates all tables for the arbitrage intelligence platform.
-- PostgreSQL 15+ required for jsonb and partition features.

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================================
-- 4.1 Prediction Market Registry
-- ============================================================================

CREATE TYPE market_mechanism AS ENUM ('CLOB', 'AMM');
CREATE TYPE market_status AS ENUM ('open', 'closed', 'resolved', 'disputed', 'paused');

CREATE TABLE pm_market_outcomes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venue TEXT NOT NULL,
  market_id_native TEXT NOT NULL,
  outcome_id_native TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  outcome_name TEXT NOT NULL,
  mechanism market_mechanism NOT NULL,
  quote_currency TEXT NOT NULL DEFAULT 'USD',
  fee_bps INTEGER,
  tick_size NUMERIC,
  open_ts TIMESTAMPTZ NOT NULL,
  close_ts TIMESTAMPTZ,
  resolve_ts TIMESTAMPTZ,
  status market_status NOT NULL DEFAULT 'open',
  resolution_source TEXT NOT NULL,
  truth_spec_text TEXT NOT NULL,
  truth_ambiguity_score NUMERIC DEFAULT 0.5 CHECK (truth_ambiguity_score >= 0 AND truth_ambiguity_score <= 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(venue, outcome_id_native)
);

CREATE INDEX idx_pm_markets_venue_status ON pm_market_outcomes(venue, status);
CREATE INDEX idx_pm_markets_resolve_ts ON pm_market_outcomes(resolve_ts);
CREATE INDEX idx_pm_markets_tags ON pm_market_outcomes USING GIN(tags);
CREATE INDEX idx_pm_markets_title_trgm ON pm_market_outcomes USING GIN(title gin_trgm_ops);
CREATE INDEX idx_pm_markets_desc_trgm ON pm_market_outcomes USING GIN(description gin_trgm_ops);

-- ============================================================================
-- 4.2 Liquidity Snapshots (Time-Series)
-- ============================================================================

CREATE TABLE pm_liquidity_snapshots (
  id BIGSERIAL,
  ts TIMESTAMPTZ NOT NULL,
  venue TEXT NOT NULL,
  outcome_id_native TEXT NOT NULL,
  best_bid NUMERIC CHECK (best_bid IS NULL OR (best_bid >= 0 AND best_bid <= 1)),
  best_ask NUMERIC CHECK (best_ask IS NULL OR (best_ask >= 0 AND best_ask <= 1)),
  mid NUMERIC CHECK (mid IS NULL OR (mid >= 0 AND mid <= 1)),
  spread NUMERIC CHECK (spread IS NULL OR spread >= 0),
  depth_usd_1pct NUMERIC CHECK (depth_usd_1pct IS NULL OR depth_usd_1pct >= 0),
  depth_usd_5pct NUMERIC CHECK (depth_usd_5pct IS NULL OR depth_usd_5pct >= 0),
  amm_price NUMERIC CHECK (amm_price IS NULL OR (amm_price >= 0 AND amm_price <= 1)),
  amm_slippage_100 NUMERIC,
  amm_slippage_500 NUMERIC,
  amm_slippage_1000 NUMERIC,
  last_update_ts TIMESTAMPTZ NOT NULL,
  snapshot_hash TEXT,
  PRIMARY KEY (id, ts),
  CONSTRAINT valid_bid_ask CHECK (best_bid IS NULL OR best_ask IS NULL OR best_bid <= best_ask)
) PARTITION BY RANGE (ts);

-- Create partitions for the next 90 days (run as maintenance job)
CREATE TABLE pm_liquidity_snapshots_default PARTITION OF pm_liquidity_snapshots DEFAULT;

CREATE INDEX idx_liq_venue_outcome_ts ON pm_liquidity_snapshots(venue, outcome_id_native, ts DESC);
CREATE INDEX idx_liq_ts ON pm_liquidity_snapshots(ts DESC);

-- ============================================================================
-- 4.3 Volume Buckets
-- ============================================================================

CREATE TYPE volume_bucket_type AS ENUM ('1m', '5m', '15m', '1h', '4h', '24h', '7d');

CREATE TABLE pm_volume_buckets (
  id BIGSERIAL PRIMARY KEY,
  ts_bucket TIMESTAMPTZ NOT NULL,
  bucket volume_bucket_type NOT NULL,
  venue TEXT NOT NULL,
  outcome_id_native TEXT NOT NULL,
  notional_usd NUMERIC NOT NULL CHECK (notional_usd >= 0),
  trade_count INTEGER NOT NULL CHECK (trade_count >= 0),
  vwap NUMERIC CHECK (vwap IS NULL OR (vwap >= 0 AND vwap <= 1)),
  UNIQUE(venue, outcome_id_native, ts_bucket, bucket)
);

CREATE INDEX idx_vol_venue_outcome_ts ON pm_volume_buckets(venue, outcome_id_native, ts_bucket DESC, bucket);

-- ============================================================================
-- 4.4 Stocks Registry
-- ============================================================================

CREATE TABLE stocks_symbols (
  symbol_id TEXT NOT NULL,
  exchange_id TEXT NOT NULL,
  name TEXT NOT NULL,
  country TEXT,
  asset_class TEXT DEFAULT 'equity',
  security_category TEXT,
  sector TEXT,
  industry TEXT,
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (exchange_id, symbol_id)
);

CREATE INDEX idx_stocks_symbol_trgm ON stocks_symbols USING GIN(symbol_id gin_trgm_ops);
CREATE INDEX idx_stocks_name_trgm ON stocks_symbols USING GIN(name gin_trgm_ops);
CREATE INDEX idx_stocks_enabled ON stocks_symbols(is_enabled);

-- ============================================================================
-- 4.5 Stock Price Snapshots
-- ============================================================================

CREATE TABLE stocks_price_snapshots (
  id BIGSERIAL,
  ts TIMESTAMPTZ NOT NULL,
  exchange_id TEXT NOT NULL,
  symbol_id TEXT NOT NULL,
  last_price NUMERIC NOT NULL CHECK (last_price > 0),
  open NUMERIC,
  high NUMERIC,
  low NUMERIC,
  close NUMERIC,
  volume NUMERIC DEFAULT 0 CHECK (volume >= 0),
  vwap NUMERIC,
  PRIMARY KEY (id, ts)
) PARTITION BY RANGE (ts);

CREATE TABLE stocks_price_snapshots_default PARTITION OF stocks_price_snapshots DEFAULT;

CREATE INDEX idx_stocks_price_ts ON stocks_price_snapshots(exchange_id, symbol_id, ts DESC);

-- ============================================================================
-- 4.6 Canonical Events
-- ============================================================================

CREATE TYPE event_domain AS ENUM (
  'politics', 'crypto', 'sports', 'economy', 'tech', 'science', 'weather', 'entertainment', 'other'
);
CREATE TYPE event_status AS ENUM ('scheduled', 'ongoing', 'completed', 'cancelled', 'postponed');

CREATE TABLE events_current (
  event_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  domain event_domain NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  entities JSONB DEFAULT '[]'::jsonb,
  location TEXT,
  start_ts TIMESTAMPTZ,
  end_ts TIMESTAMPTZ,
  updated_ts TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  event_type TEXT NOT NULL,
  status event_status NOT NULL DEFAULT 'scheduled',
  source TEXT NOT NULL,
  source_url TEXT,
  confidence NUMERIC NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  tags JSONB DEFAULT '[]'::jsonb
);

CREATE INDEX idx_events_domain_status ON events_current(domain, status);
CREATE INDEX idx_events_entities ON events_current USING GIN(entities);
CREATE INDEX idx_events_title_trgm ON events_current USING GIN(title gin_trgm_ops);
CREATE INDEX idx_events_start_ts ON events_current(start_ts);

-- Events history (append-only audit log)
CREATE TABLE events_history (
  id BIGSERIAL PRIMARY KEY,
  event_id UUID NOT NULL,
  domain event_domain NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  entities JSONB,
  location TEXT,
  start_ts TIMESTAMPTZ,
  end_ts TIMESTAMPTZ,
  updated_ts TIMESTAMPTZ NOT NULL,
  event_type TEXT NOT NULL,
  status event_status NOT NULL,
  source TEXT NOT NULL,
  source_url TEXT,
  confidence NUMERIC NOT NULL,
  tags JSONB,
  observed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_events_history_event_id ON events_history(event_id, observed_at DESC);

-- ============================================================================
-- 4.7 Entity Layer (Glue)
-- ============================================================================

CREATE TYPE entity_type AS ENUM (
  'company', 'person', 'team', 'country', 'metric', 'organization', 'index', 'commodity'
);

CREATE TABLE entities (
  entity_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type entity_type NOT NULL,
  name TEXT NOT NULL,
  aliases JSONB DEFAULT '[]'::jsonb,
  ticker TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_entities_aliases ON entities USING GIN(aliases);
CREATE INDEX idx_entities_name_trgm ON entities USING GIN(name gin_trgm_ops);
CREATE INDEX idx_entities_ticker ON entities(ticker) WHERE ticker IS NOT NULL;

CREATE TYPE entity_link_source AS ENUM ('market', 'event', 'topic', 'stock');

CREATE TABLE entity_links (
  id BIGSERIAL PRIMARY KEY,
  source_type entity_link_source NOT NULL,
  source_id TEXT NOT NULL,
  entity_id UUID NOT NULL REFERENCES entities(entity_id) ON DELETE CASCADE,
  confidence NUMERIC NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  rationale TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(source_type, source_id, entity_id)
);

CREATE INDEX idx_entity_links_source ON entity_links(source_type, source_id);
CREATE INDEX idx_entity_links_entity ON entity_links(entity_id);

-- ============================================================================
-- 4.8 Market Matching (Canonical Event Mapping)
-- ============================================================================

CREATE TABLE canonical_events (
  canonical_event_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  label TEXT NOT NULL,
  domain event_domain NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_canonical_events_domain ON canonical_events(domain);
CREATE INDEX idx_canonical_events_label_trgm ON canonical_events USING GIN(label gin_trgm_ops);

CREATE TABLE market_links (
  id BIGSERIAL PRIMARY KEY,
  canonical_event_id UUID NOT NULL REFERENCES canonical_events(canonical_event_id) ON DELETE CASCADE,
  venue TEXT NOT NULL,
  outcome_id_native TEXT NOT NULL,
  confidence NUMERIC NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(canonical_event_id, venue, outcome_id_native)
);

CREATE INDEX idx_market_links_canonical ON market_links(canonical_event_id);
CREATE INDEX idx_market_links_venue ON market_links(venue, outcome_id_native);

-- ============================================================================
-- 4.9 Rules & Triggers
-- ============================================================================

CREATE TABLE trigger_rules (
  rule_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  enabled BOOLEAN DEFAULT false,
  template_type TEXT NOT NULL,
  scope JSONB DEFAULT '{}'::jsonb,
  schedule JSONB DEFAULT '{"interval_ms": 1000, "debounce_ms": 2000, "persistence_ms": 1000}'::jsonb,
  condition_ast JSONB NOT NULL,
  algorithm_spec JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rules_enabled_template ON trigger_rules(enabled, template_type);

CREATE TYPE alert_severity AS ENUM ('info', 'warning', 'high', 'critical');

CREATE TABLE trigger_events (
  event_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rule_id UUID NOT NULL REFERENCES trigger_rules(rule_id) ON DELETE CASCADE,
  ts TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  inputs_hash TEXT NOT NULL,
  canonical_event_id UUID REFERENCES canonical_events(canonical_event_id),
  markets_involved JSONB NOT NULL,
  computed_metrics JSONB NOT NULL,
  explanation JSONB NOT NULL,
  severity alert_severity NOT NULL DEFAULT 'info'
);

CREATE INDEX idx_trigger_events_rule_ts ON trigger_events(rule_id, ts DESC);
CREATE INDEX idx_trigger_events_ts ON trigger_events(ts DESC);

-- ============================================================================
-- 4.10 Opportunities
-- ============================================================================

CREATE TYPE opportunity_status AS ENUM ('open', 'expired', 'invalid', 'executed', 'dismissed');

CREATE TABLE opportunities (
  opportunity_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  canonical_event_id UUID NOT NULL REFERENCES canonical_events(canonical_event_id),
  buy_venue TEXT NOT NULL,
  sell_venue TEXT NOT NULL,
  buy_outcome_id TEXT NOT NULL,
  sell_outcome_id TEXT NOT NULL,
  created_ts TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_ts TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status opportunity_status NOT NULL DEFAULT 'open',
  invalidation_reason TEXT,
  confidence_score NUMERIC NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 100),
  edge_profile JSONB NOT NULL,
  snapshot_refs JSONB NOT NULL,
  flags JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_opps_status_score ON opportunities(status, confidence_score DESC);
CREATE INDEX idx_opps_canonical_status ON opportunities(canonical_event_id, status);
CREATE INDEX idx_opps_venues ON opportunities(buy_venue, sell_venue);

-- ============================================================================
-- 4.11 Topic Governance & Monitoring
-- ============================================================================

CREATE TYPE topic_status AS ENUM ('proposed', 'approved', 'rejected', 'paused', 'archived');
CREATE TYPE update_frequency AS ENUM ('realtime', 'hourly', 'daily', 'weekly', 'on_event');

CREATE TABLE topics (
  topic_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  label TEXT NOT NULL,
  entities JSONB DEFAULT '[]'::jsonb,
  keywords JSONB DEFAULT '[]'::jsonb,
  queries JSONB NOT NULL,
  authoritative_sources JSONB NOT NULL,
  expected_event_types JSONB DEFAULT '[]'::jsonb,
  update_frequency update_frequency NOT NULL DEFAULT 'daily',
  confidence NUMERIC NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  status topic_status NOT NULL DEFAULT 'proposed',
  created_by TEXT NOT NULL DEFAULT 'llm',
  rationale TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_topics_status_freq ON topics(status, update_frequency);
CREATE INDEX idx_topics_label_trgm ON topics USING GIN(label gin_trgm_ops);

CREATE TABLE topic_market_links (
  id BIGSERIAL PRIMARY KEY,
  topic_id UUID NOT NULL REFERENCES topics(topic_id) ON DELETE CASCADE,
  venue TEXT NOT NULL,
  outcome_id_native TEXT NOT NULL,
  confidence NUMERIC NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  rationale TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(topic_id, venue, outcome_id_native)
);

CREATE INDEX idx_topic_market_links_topic ON topic_market_links(topic_id);

CREATE TABLE llm_topic_runs (
  run_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ts TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  model TEXT NOT NULL,
  input_market_ids JSONB NOT NULL,
  prompt_hash TEXT NOT NULL,
  response_json JSONB NOT NULL,
  validation_passed BOOLEAN NOT NULL,
  errors JSONB DEFAULT '[]'::jsonb
);

CREATE INDEX idx_llm_runs_ts ON llm_topic_runs(ts DESC);

CREATE TABLE topic_signals (
  signal_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  topic_id UUID NOT NULL REFERENCES topics(topic_id) ON DELETE CASCADE,
  ts TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source TEXT NOT NULL,
  source_url TEXT,
  payload JSONB NOT NULL,
  derived_event_id UUID REFERENCES events_current(event_id),
  confidence NUMERIC NOT NULL CHECK (confidence >= 0 AND confidence <= 1)
);

CREATE INDEX idx_topic_signals_topic_ts ON topic_signals(topic_id, ts DESC);

-- ============================================================================
-- Health Audit Tables
-- ============================================================================

CREATE TYPE health_status AS ENUM ('green', 'yellow', 'red', 'unknown');

CREATE TABLE health_audit_runs (
  id BIGSERIAL PRIMARY KEY,
  ts TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  venue TEXT NOT NULL,
  audit_type TEXT NOT NULL, -- 'completeness' or 'liveness'
  status health_status NOT NULL,
  local_count INTEGER,
  upstream_count INTEGER,
  missing_ids JSONB DEFAULT '[]'::jsonb,
  stale_ids JSONB DEFAULT '[]'::jsonb,
  error_message TEXT,
  duration_ms INTEGER
);

CREATE INDEX idx_health_audit_venue_ts ON health_audit_runs(venue, ts DESC);
CREATE INDEX idx_health_audit_ts ON health_audit_runs(ts DESC);

CREATE TABLE health_state (
  venue TEXT PRIMARY KEY,
  status health_status NOT NULL DEFAULT 'unknown',
  completeness NUMERIC DEFAULT 1.0,
  liveness NUMERIC DEFAULT 1.0,
  last_audit_ts TIMESTAMPTZ,
  error_message TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- Triggers for updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_pm_markets_updated_at BEFORE UPDATE ON pm_market_outcomes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_stocks_updated_at BEFORE UPDATE ON stocks_symbols
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_entities_updated_at BEFORE UPDATE ON entities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_canonical_events_updated_at BEFORE UPDATE ON canonical_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_rules_updated_at BEFORE UPDATE ON trigger_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_topics_updated_at BEFORE UPDATE ON topics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_health_state_updated_at BEFORE UPDATE ON health_state
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- Initial Data: Venue Health State
-- ============================================================================

INSERT INTO health_state (venue, status) VALUES
  ('polymarket', 'unknown'),
  ('kalshi', 'unknown'),
  ('predictit', 'unknown'),
  ('manifold', 'unknown'),
  ('metaculus', 'unknown'),
  ('finfeed', 'unknown');

-- ============================================================================
-- Comments for documentation
-- ============================================================================

COMMENT ON TABLE pm_market_outcomes IS 'Registry of all prediction market outcomes across venues';
COMMENT ON TABLE pm_liquidity_snapshots IS 'Time-series liquidity data, partitioned by day';
COMMENT ON TABLE opportunities IS 'Detected arbitrage opportunities with full edge profiles';
COMMENT ON TABLE topics IS 'LLM-generated monitoring topics with governance workflow';
COMMENT ON TABLE topic_signals IS 'Signals from topic monitoring that may become events';
COMMENT ON TABLE health_state IS 'Current health status per venue, updated by audit jobs';

