/**
 * Market Comparison Routes
 * Compare markets across Polymarket and Kalshi
 */

import { Router, Request, Response } from 'express';
import axios from 'axios';

const router = Router();

const GAMMA_API = 'https://gamma-api.polymarket.com';
const KALSHI_API = 'https://api.elections.kalshi.com/trade-api/v2';

// Fetch helpers
async function fetchPolymarketMarkets(limit: number = 100) {
  const response = await axios.get(`${GAMMA_API}/markets`, {
    params: { active: true, closed: false, limit, order: 'volume', ascending: false },
    timeout: 30000
  });
  return response.data;
}

async function fetchKalshiMarkets(limit: number = 100) {
  const response = await axios.get(`${KALSHI_API}/markets`, {
    params: { status: 'open', limit },
    timeout: 30000
  });
  return response.data.markets;
}

// Normalize market titles for matching
function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Extract key terms from title
function extractKeyTerms(title: string): string[] {
  const normalized = normalizeTitle(title);
  const stopWords = new Set(['will', 'the', 'be', 'a', 'an', 'to', 'in', 'on', 'at', 'by', 'for', 'of', 'or', 'and', 'before', 'after', 'during']);
  return normalized
    .split(' ')
    .filter(word => word.length > 2 && !stopWords.has(word));
}

// Calculate similarity score between two markets
function calculateSimilarity(title1: string, title2: string): number {
  const terms1 = new Set(extractKeyTerms(title1));
  const terms2 = new Set(extractKeyTerms(title2));
  
  if (terms1.size === 0 || terms2.size === 0) return 0;
  
  const intersection = [...terms1].filter(t => terms2.has(t));
  const union = new Set([...terms1, ...terms2]);
  
  return intersection.length / union.size;
}

// Find matching markets
function findMatches(polymarkets: any[], kalshiMarkets: any[], threshold: number = 0.4) {
  const matches: any[] = [];
  const usedKalshi = new Set<string>();

  for (const pm of polymarkets) {
    let bestMatch: any = null;
    let bestScore = 0;

    for (const km of kalshiMarkets) {
      if (usedKalshi.has(km.ticker)) continue;
      
      const score = calculateSimilarity(pm.question, km.title);
      if (score > bestScore && score >= threshold) {
        bestScore = score;
        bestMatch = km;
      }
    }

    if (bestMatch) {
      usedKalshi.add(bestMatch.ticker);
      
      const pmYesPrice = parseFloat(pm.outcomePrices?.[0] || '0');
      const kmYesPrice = bestMatch.yes_bid ? (bestMatch.yes_bid + bestMatch.yes_ask) / 2 / 100 : null;
      
      const priceDiff = kmYesPrice !== null ? Math.abs(pmYesPrice - kmYesPrice) : null;
      
      // Check for arb opportunity (price diff > spread on both sides)
      const pmSpread = pm.spread || 0.02;
      const kmSpread = bestMatch.yes_ask && bestMatch.yes_bid 
        ? (bestMatch.yes_ask - bestMatch.yes_bid) / 100 
        : 0.02;
      
      const arbThreshold = (pmSpread + kmSpread) / 2;
      const hasArb = priceDiff !== null && priceDiff > arbThreshold;

      matches.push({
        id: `${pm.id}_${bestMatch.ticker}`,
        matchScore: Math.round(bestScore * 100),
        polymarket: {
          id: pm.id,
          question: pm.question,
          slug: pm.slug,
          yesPrice: pmYesPrice,
          noPrice: parseFloat(pm.outcomePrices?.[1] || '0'),
          spread: pmSpread,
          volume: pm.volume,
          volume24h: pm.volume24hr,
          liquidity: pm.liquidity,
          endDate: pm.endDate,
          url: `https://polymarket.com/event/${pm.slug}`,
          tags: pm.tags?.map((t: any) => t.label) || []
        },
        kalshi: {
          ticker: bestMatch.ticker,
          eventTicker: bestMatch.event_ticker,
          title: bestMatch.title,
          yesPrice: kmYesPrice,
          yesBid: bestMatch.yes_bid / 100,
          yesAsk: bestMatch.yes_ask / 100,
          noBid: bestMatch.no_bid / 100,
          noAsk: bestMatch.no_ask / 100,
          spread: kmSpread,
          volume: bestMatch.volume,
          volume24h: bestMatch.volume_24h,
          liquidity: bestMatch.liquidity,
          openInterest: bestMatch.open_interest,
          closeTime: bestMatch.close_time,
          url: `https://kalshi.com/markets/${bestMatch.event_ticker}/${bestMatch.ticker}`
        },
        comparison: {
          priceDiff: priceDiff !== null ? Math.round(priceDiff * 10000) / 100 : null, // in percentage points
          priceDiffDirection: priceDiff !== null 
            ? (pmYesPrice > kmYesPrice! ? 'polymarket_higher' : 'kalshi_higher')
            : null,
          hasArbOpportunity: hasArb,
          arbEdge: hasArb && priceDiff !== null 
            ? Math.round((priceDiff - arbThreshold) * 10000) / 100 
            : null,
          volumeRatio: bestMatch.volume > 0 ? pm.volume / bestMatch.volume : null,
          liquidityRatio: bestMatch.liquidity > 0 ? pm.liquidity / bestMatch.liquidity : null
        }
      });
    }
  }

  return matches;
}

/**
 * GET /compare/markets
 * Get side-by-side comparison of markets
 */
router.get('/markets', async (req: Request, res: Response) => {
  try {
    const { limit = '50', minMatch = '40' } = req.query;
    const matchThreshold = parseInt(minMatch as string) / 100;

    // Fetch markets from both platforms in parallel
    const [polymarkets, kalshiMarkets] = await Promise.all([
      fetchPolymarketMarkets(parseInt(limit as string) * 2),
      fetchKalshiMarkets(200)
    ]);

    // Find matching markets
    const matches = findMatches(polymarkets, kalshiMarkets, matchThreshold);

    // Sort by match score, then by arb opportunity
    matches.sort((a, b) => {
      if (a.comparison.hasArbOpportunity !== b.comparison.hasArbOpportunity) {
        return a.comparison.hasArbOpportunity ? -1 : 1;
      }
      return b.matchScore - a.matchScore;
    });

    // Stats
    const stats = {
      totalMatches: matches.length,
      arbOpportunities: matches.filter(m => m.comparison.hasArbOpportunity).length,
      avgPriceDiff: matches
        .filter(m => m.comparison.priceDiff !== null)
        .reduce((sum, m) => sum + m.comparison.priceDiff!, 0) / matches.length || 0,
      polymarketOnly: polymarkets.length - matches.length,
      kalshiMarketsSearched: kalshiMarkets.length
    };

    res.json({
      matches: matches.slice(0, parseInt(limit as string)),
      stats,
      lastUpdated: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Comparison error:', error.message);
    res.status(500).json({ error: 'Failed to compare markets', details: error.message });
  }
});

/**
 * GET /compare/arb-opportunities
 * Get only markets with arbitrage opportunities
 */
router.get('/arb-opportunities', async (req: Request, res: Response) => {
  try {
    const { minEdge = '0.5' } = req.query;
    const minEdgeValue = parseFloat(minEdge as string);

    const [polymarkets, kalshiMarkets] = await Promise.all([
      fetchPolymarketMarkets(200),
      fetchKalshiMarkets(200)
    ]);

    const matches = findMatches(polymarkets, kalshiMarkets, 0.35);
    
    const opportunities = matches
      .filter(m => m.comparison.hasArbOpportunity && (m.comparison.arbEdge || 0) >= minEdgeValue)
      .sort((a, b) => (b.comparison.arbEdge || 0) - (a.comparison.arbEdge || 0));

    res.json({
      opportunities,
      count: opportunities.length,
      lastUpdated: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to find arb opportunities', details: error.message });
  }
});

/**
 * GET /compare/stats
 * Get comparison statistics
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const [polymarkets, kalshiMarkets] = await Promise.all([
      fetchPolymarketMarkets(500),
      fetchKalshiMarkets(500)
    ]);

    const matches = findMatches(polymarkets, kalshiMarkets, 0.4);

    // Category breakdown
    const categoryStats: Record<string, { count: number; avgPriceDiff: number }> = {};
    
    for (const match of matches) {
      const category = match.polymarket.tags?.[0] || 'Other';
      if (!categoryStats[category]) {
        categoryStats[category] = { count: 0, avgPriceDiff: 0 };
      }
      categoryStats[category].count++;
      if (match.comparison.priceDiff !== null) {
        categoryStats[category].avgPriceDiff += match.comparison.priceDiff;
      }
    }

    for (const cat of Object.keys(categoryStats)) {
      categoryStats[cat].avgPriceDiff /= categoryStats[cat].count;
    }

    res.json({
      polymarket: {
        totalMarkets: polymarkets.length,
        totalVolume: polymarkets.reduce((sum: number, m: any) => sum + (m.volume || 0), 0),
        totalLiquidity: polymarkets.reduce((sum: number, m: any) => sum + (m.liquidity || 0), 0)
      },
      kalshi: {
        totalMarkets: kalshiMarkets.length,
        totalVolume: kalshiMarkets.reduce((sum: number, m: any) => sum + (m.volume || 0), 0),
        totalOpenInterest: kalshiMarkets.reduce((sum: number, m: any) => sum + (m.open_interest || 0), 0)
      },
      comparison: {
        matchedMarkets: matches.length,
        arbOpportunities: matches.filter(m => m.comparison.hasArbOpportunity).length,
        avgMatchScore: matches.reduce((sum, m) => sum + m.matchScore, 0) / matches.length || 0,
        avgPriceDiff: matches
          .filter(m => m.comparison.priceDiff !== null)
          .reduce((sum, m) => sum + m.comparison.priceDiff!, 0) / matches.filter(m => m.comparison.priceDiff !== null).length || 0,
        categoryBreakdown: categoryStats
      },
      lastUpdated: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to get stats', details: error.message });
  }
});

/**
 * GET /compare/search
 * Search for matching markets
 */
router.get('/search', async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    const query = (q as string).toLowerCase();

    const [polymarkets, kalshiMarkets] = await Promise.all([
      fetchPolymarketMarkets(200),
      fetchKalshiMarkets(200)
    ]);

    // Filter by search query
    const filteredPoly = polymarkets.filter((m: any) => 
      m.question.toLowerCase().includes(query)
    );
    
    const filteredKalshi = kalshiMarkets.filter((m: any) => 
      m.title.toLowerCase().includes(query)
    );

    const matches = findMatches(filteredPoly, filteredKalshi, 0.3);

    res.json({
      matches,
      polymarketOnly: filteredPoly
        .filter((m: any) => !matches.some(match => match.polymarket.id === m.id))
        .slice(0, 20)
        .map((m: any) => ({
          id: m.id,
          question: m.question,
          yesPrice: parseFloat(m.outcomePrices?.[0] || '0'),
          volume: m.volume,
          url: `https://polymarket.com/event/${m.slug}`
        })),
      kalshiOnly: filteredKalshi
        .filter((m: any) => !matches.some(match => match.kalshi.ticker === m.ticker))
        .slice(0, 20)
        .map((m: any) => ({
          ticker: m.ticker,
          title: m.title,
          yesPrice: m.yes_bid ? (m.yes_bid + m.yes_ask) / 2 / 100 : null,
          volume: m.volume,
          url: `https://kalshi.com/markets/${m.event_ticker}/${m.ticker}`
        })),
      lastUpdated: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Search failed', details: error.message });
  }
});

export default router;

