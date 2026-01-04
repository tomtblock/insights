/**
 * @arb/api - BFF API Gateway
 * 
 * All UI calls go through this gateway. UI never runs core math.
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { Pool } from 'pg';
import { createClient as createRedisClient } from 'redis';

// Import route handlers
import { marketsRouter } from './routes/markets';
import { canonicalEventsRouter } from './routes/canonical-events';
import { opportunitiesRouter } from './routes/opportunities';
import { rulesRouter } from './routes/rules';
import { healthRouter } from './routes/health';
import { stocksRouter } from './routes/stocks';
import { eventsRouter } from './routes/events';
import { topicsRouter } from './routes/topics';
import polymarketRouter from './routes/polymarket';
import kalshiRouter from './routes/kalshi';
import compareRouter from './routes/compare';
import { xSignalsRouter } from './routes/x-signals';

// Configuration
const PORT = process.env.API_PORT || 4000;
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://localhost:5432/arb_platform';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Initialize database pool
export const db = new Pool({
  connectionString: DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Initialize Redis client
export const redis = createRedisClient({ url: REDIS_URL });

// Express app
const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', ts: Date.now() });
});

// API Routes (Section 5 of spec)
app.use('/api/markets', marketsRouter);
app.use('/api/canonical-events', canonicalEventsRouter);
app.use('/api/opportunities', opportunitiesRouter);
app.use('/api/rules', rulesRouter);
app.use('/api/health', healthRouter);
app.use('/api/stocks', stocksRouter);
app.use('/api/events', eventsRouter);
app.use('/api/topics', topicsRouter);
app.use('/api/polymarket', polymarketRouter);
app.use('/api/kalshi', kalshiRouter);
app.use('/api/compare', compareRouter);
app.use('/api/x-signals', xSignalsRouter);

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('API Error:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error',
    ts: Date.now(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not found',
    ts: Date.now(),
  });
});

// Start server
async function start() {
  try {
    // Test database connection
    const client = await db.connect();
    console.log('✅ Database connected');
    client.release();

    // Connect Redis (non-blocking)
    redis.connect().then(() => {
      console.log('✅ Redis connected');
    }).catch((err) => {
      console.warn('⚠️ Redis connection failed, running without cache:', err.message);
    });

    app.listen(PORT, () => {
      console.log(`🚀 API Gateway running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();

export default app;

