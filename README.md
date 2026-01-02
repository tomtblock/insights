# Arb Platform - Market Intelligence System

A fully functioning arbitrage market intelligence platform with prediction market data, cross-venue opportunity detection, LLM-powered topic scanning, and deterministic computation.

## 🎯 What This Does

1. **See all markets, live, with health indicators** - Real-time data from Polymarket, Kalshi, and other prediction markets via FinFeed API
2. **Create rules and generate replayable opportunities** - Deterministic edge calculations with full audit trail
3. **Browse stocks and link them to market entities** - Cross-context intelligence across assets
4. **See events and topics connected to markets** - Entity linking and relationship mapping
5. **ChatGPT Topic Scanner** - AI-generated monitoring topics with governance workflow
6. **Explainable alerts** - Every opportunity is traceable to stored inputs and deterministic math

## 🏗️ Architecture

```
/apps/web                  # Next.js/React UI
/apps/api                  # HTTP API gateway (BFF)
/services/ingest-markets    # Prediction market ingestion workers
/services/ingest-stocks     # Stock ingestion workers
/services/ingest-events     # Events ingestion workers
/services/health-audit      # Liveness/completeness audits
/services/matching          # Entity + market mapping services
/services/arb-engine        # Deterministic edge calc + opportunity engine
/services/rule-engine       # Rule evaluation + trigger events
/services/topics-llm        # Topic scanning + governance
/services/topics-monitor    # Runs topics queries → signals/events
/shared/schemas             # Zod schemas for all types
/shared/math                # Pure math functions (edge calculation)
/infra                      # Docker, env, deploy manifests
```

**Hard rule: UI never runs core math. It calls /apps/api.**

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 16 (or use Docker)
- Redis 7 (or use Docker)

### 1. Start Infrastructure

```bash
cd infra
docker-compose up -d postgres redis
```

### 2. Run Database Migrations

```bash
psql postgresql://arb:arb_secret@localhost:5432/arb_platform < infra/db/migrations/001_initial_schema.sql
```

### 3. Install Dependencies

```bash
npm install
npm run build
```

### 4. Start Services

```bash
# Terminal 1: API Gateway
cd apps/api && npm run dev

# Terminal 2: Market Ingestion
cd services/ingest-markets && npm run dev

# Terminal 3: Arb Engine
cd services/arb-engine && npm run dev

# Terminal 4: Web UI
cd apps/web && npm run dev
```

### 5. Open Dashboard

Visit [http://localhost:3000](http://localhost:3000)

## 🔧 Configuration

### Environment Variables

```bash
# Database
DATABASE_URL=postgresql://arb:arb_secret@localhost:5432/arb_platform

# Redis
REDIS_URL=redis://localhost:6379

# FinFeed API
FINFEED_API_KEY=a5d8925b-027f-42c0-a000-421699c8c86d

# OpenAI (for topic scanner)
OPENAI_API_KEY=sk-...

# API
API_PORT=4000
CORS_ORIGIN=http://localhost:3000
```

## 📊 Key Features

### Opportunity Detection

- Cross-venue arbitrage detection (Polymarket ↔ Kalshi)
- Deterministic edge calculation at Q buckets: $100, $250, $500, $1000, $2500, $5000
- Confidence scoring (0-100) based on edge, depth, freshness, ambiguity
- Full snapshot replay for verification

### Rule Engine

Pre-configured rule templates:
- Cross-Venue Arbitrage (Q=250, net edge ≥ 10 bps)
- Arb Threshold tiers (8/15/30 bps)
- Liquidity Depth Alert
- Wide Spread Alert
- Data Staleness Alert
- Volume Spike
- Resolution Approaching

### LLM Topic Scanner

- Analyzes open prediction markets
- Generates monitoring topics with entities, keywords, queries
- Proposes authoritative sources
- **Requires human approval** (governance workflow)
- Does NOT make trading decisions

### Health Audit

- Market completeness: 100% or SEV-1
- Per-venue staleness thresholds (Kalshi: 2s, Polymarket: 5s)
- Read-only mode when health is RED
- Blocks opportunity engine during unhealthy states

## 📡 API Endpoints

### Markets
- `GET /api/markets` - List with filters
- `GET /api/markets/:venue/:outcomeId` - Single market
- `GET /api/markets/:venue/:outcomeId/liquidity` - Liquidity history

### Opportunities
- `GET /api/opportunities` - List opportunities
- `GET /api/opportunities/:id` - Single opportunity
- `POST /api/opportunities/:id/ack` - Mark reviewed
- `POST /api/opportunities/replay` - Recompute from snapshots

### Rules
- `GET /api/rules` - List rules
- `POST /api/rules` - Create rule
- `POST /api/rules/:id/enable` - Enable rule
- `POST /api/rules/:id/test` - Test on latest snapshot

### Topics
- `GET /api/topics` - List topics
- `POST /api/topics/scan` - Trigger LLM scan
- `POST /api/topics/:id/approve` - Approve topic
- `POST /api/topics/:id/reject` - Reject topic

### Health
- `GET /api/health/summary` - Global health
- `GET /api/health/venues` - Per-venue health
- `GET /api/health/venues/:venue/missing` - Missing markets

## 🧮 Algorithm Specification

### Edge Calculation

```latex
Edge(Q) = P_sell(Q) - P_buy(Q) - Fees - RiskBuffer
```

Where:
- `P_buy(Q)` = Execution price walking asks to fill Q
- `P_sell(Q)` = Execution price walking bids to fill Q
- `Fees` = Combined venue fees (bps)
- `RiskBuffer` = Safety margin (default 15 bps)

### Confidence Score (0-100)

| Component | Weight |
|-----------|--------|
| Edge margin beyond buffer | 0-40 |
| Depth robustness | 0-25 |
| Freshness | 0-15 |
| Truth ambiguity | 0-10 |
| Resolution buffer | 0-10 |

Opportunities below 60 are hidden by default.

## 🧪 Testing

```bash
# Run all tests
npm run test

# Test specific package
cd shared/math && npm run test
```

### Replayability Test

Every trigger event stores snapshot hashes. Use the `/api/opportunities/replay` endpoint to verify deterministic computation matches within tolerance.

## 📚 Runbooks

- [Venue feed stale → diagnose](docs/runbooks/stale-feed.md)
- [Missing markets detected → resync steps](docs/runbooks/missing-markets.md)
- [Opportunity spam → adjust persistence/debounce](docs/runbooks/opportunity-spam.md)
- [LLM output invalid → prompt tuning](docs/runbooks/llm-invalid.md)

## ⚠️ Critical Notes

### LLM Boundaries

The ChatGPT Topic Scanner is bounded:
- ✅ Proposes topics and queries
- ✅ Suggests authoritative sources
- ❌ Does NOT decide trades
- ❌ Does NOT set thresholds
- ❌ Does NOT overwrite mappings without human approval

**It is a research assistant inside a deterministic system.**

### Data Integrity

- All inbound data is validated against Zod schemas
- Invalid data is rejected at the boundary
- Snapshot hashes enable full replay
- Health audit runs continuously

## 📄 License

MIT

