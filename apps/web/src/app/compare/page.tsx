'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeftRight, RefreshCw, Search, Zap, DollarSign, Activity,
  ExternalLink, AlertTriangle, TrendingUp, TrendingDown, Calculator,
  Eye, Target, ChevronDown, ChevronUp, ArrowRight, Check, X,
  Scale, Percent, Clock, BarChart2
} from 'lucide-react';
import clsx from 'clsx';

// Types
interface MatchedMarket {
  id: string;
  question: string;
  category: string;
  endDate: string;
  matchScore: number;
  polymarket: {
    yesPrice: number;
    noPrice: number;
    yesBid: number;
    yesAsk: number;
    noBid: number;
    noAsk: number;
    spread: number;
    volume24h: number;
    liquidity: number;
    url: string;
  };
  kalshi: {
    yesPrice: number;
    noPrice: number;
    yesBid: number;
    yesAsk: number;
    noBid: number;
    noAsk: number;
    spread: number;
    volume24h: number;
    openInterest: number;
    url: string;
  };
  arb: {
    hasOpportunity: boolean;
    strategy: 'buy_poly_yes_sell_kalshi_yes' | 'buy_kalshi_yes_sell_poly_yes' | 'none';
    grossEdge: number;
    netEdge: number;
    profitPer100: number;
    confidence: 'high' | 'medium' | 'low';
  };
}

// Mock data with realistic arbitrage scenarios
const MOCK_MARKETS: MatchedMarket[] = [
  {
    id: '1',
    question: 'Will Donald Trump win the 2024 Presidential Election?',
    category: 'Politics',
    endDate: '2024-11-05',
    matchScore: 98,
    polymarket: {
      yesPrice: 0.52, noPrice: 0.48,
      yesBid: 0.51, yesAsk: 0.53, noBid: 0.47, noAsk: 0.49,
      spread: 0.02, volume24h: 8500000, liquidity: 15000000,
      url: 'https://polymarket.com/event/trump-2024'
    },
    kalshi: {
      yesPrice: 0.55, noPrice: 0.45,
      yesBid: 0.54, yesAsk: 0.56, noBid: 0.44, noAsk: 0.46,
      spread: 0.02, volume24h: 3200000, openInterest: 12500000,
      url: 'https://kalshi.com/markets/PRES-24'
    },
    arb: {
      hasOpportunity: true,
      strategy: 'buy_poly_yes_sell_kalshi_yes',
      grossEdge: 3.0,
      netEdge: 1.0,
      profitPer100: 1.00,
      confidence: 'high'
    }
  },
  {
    id: '2',
    question: 'Will the Fed cut rates in January 2025?',
    category: 'Economics',
    endDate: '2025-01-29',
    matchScore: 95,
    polymarket: {
      yesPrice: 0.35, noPrice: 0.65,
      yesBid: 0.34, yesAsk: 0.36, noBid: 0.64, noAsk: 0.66,
      spread: 0.02, volume24h: 3200000, liquidity: 8000000,
      url: 'https://polymarket.com/event/fed-rate-cut'
    },
    kalshi: {
      yesPrice: 0.31, noPrice: 0.69,
      yesBid: 0.30, yesAsk: 0.32, noBid: 0.68, noAsk: 0.70,
      spread: 0.02, volume24h: 1800000, openInterest: 8200000,
      url: 'https://kalshi.com/markets/FED-25JAN'
    },
    arb: {
      hasOpportunity: true,
      strategy: 'buy_kalshi_yes_sell_poly_yes',
      grossEdge: 4.0,
      netEdge: 2.0,
      profitPer100: 2.00,
      confidence: 'high'
    }
  },
  {
    id: '3',
    question: 'Will Bitcoin exceed $100,000 by March 2025?',
    category: 'Crypto',
    endDate: '2025-03-01',
    matchScore: 92,
    polymarket: {
      yesPrice: 0.42, noPrice: 0.58,
      yesBid: 0.41, yesAsk: 0.43, noBid: 0.57, noAsk: 0.59,
      spread: 0.02, volume24h: 5600000, liquidity: 12000000,
      url: 'https://polymarket.com/event/bitcoin-100k'
    },
    kalshi: {
      yesPrice: 0.43, noPrice: 0.57,
      yesBid: 0.42, yesAsk: 0.44, noBid: 0.56, noAsk: 0.58,
      spread: 0.02, volume24h: 2400000, openInterest: 9500000,
      url: 'https://kalshi.com/markets/BTC-100K'
    },
    arb: {
      hasOpportunity: false,
      strategy: 'none',
      grossEdge: 1.0,
      netEdge: -1.0,
      profitPer100: 0,
      confidence: 'low'
    }
  },
  {
    id: '4',
    question: 'Will there be a Ukraine ceasefire in 2025?',
    category: 'Geopolitics',
    endDate: '2025-12-31',
    matchScore: 88,
    polymarket: {
      yesPrice: 0.28, noPrice: 0.72,
      yesBid: 0.27, yesAsk: 0.29, noBid: 0.71, noAsk: 0.73,
      spread: 0.02, volume24h: 1800000, liquidity: 5500000,
      url: 'https://polymarket.com/event/ukraine-ceasefire'
    },
    kalshi: {
      yesPrice: 0.24, noPrice: 0.76,
      yesBid: 0.23, yesAsk: 0.25, noBid: 0.75, noAsk: 0.77,
      spread: 0.02, volume24h: 950000, openInterest: 5100000,
      url: 'https://kalshi.com/markets/UKR-CEASE'
    },
    arb: {
      hasOpportunity: true,
      strategy: 'buy_kalshi_yes_sell_poly_yes',
      grossEdge: 4.0,
      netEdge: 2.0,
      profitPer100: 2.00,
      confidence: 'medium'
    }
  },
  {
    id: '5',
    question: 'Will OpenAI release GPT-5 in 2025?',
    category: 'Technology',
    endDate: '2025-12-31',
    matchScore: 85,
    polymarket: {
      yesPrice: 0.68, noPrice: 0.32,
      yesBid: 0.67, yesAsk: 0.69, noBid: 0.31, noAsk: 0.33,
      spread: 0.02, volume24h: 2100000, liquidity: 4200000,
      url: 'https://polymarket.com/event/gpt5-2025'
    },
    kalshi: {
      yesPrice: 0.65, noPrice: 0.35,
      yesBid: 0.64, yesAsk: 0.66, noBid: 0.34, noAsk: 0.36,
      spread: 0.02, volume24h: 1200000, openInterest: 3800000,
      url: 'https://kalshi.com/markets/GPT5-2025'
    },
    arb: {
      hasOpportunity: true,
      strategy: 'buy_kalshi_yes_sell_poly_yes',
      grossEdge: 3.0,
      netEdge: 1.0,
      profitPer100: 1.00,
      confidence: 'medium'
    }
  },
  {
    id: '6',
    question: 'Will S&P 500 close above 5500 in Q1 2025?',
    category: 'Markets',
    endDate: '2025-03-31',
    matchScore: 90,
    polymarket: {
      yesPrice: 0.58, noPrice: 0.42,
      yesBid: 0.57, yesAsk: 0.59, noBid: 0.41, noAsk: 0.43,
      spread: 0.02, volume24h: 1450000, liquidity: 3800000,
      url: 'https://polymarket.com/event/sp500-5500'
    },
    kalshi: {
      yesPrice: 0.56, noPrice: 0.44,
      yesBid: 0.55, yesAsk: 0.57, noBid: 0.43, noAsk: 0.45,
      spread: 0.02, volume24h: 980000, openInterest: 4200000,
      url: 'https://kalshi.com/markets/SP500-Q1'
    },
    arb: {
      hasOpportunity: false,
      strategy: 'none',
      grossEdge: 2.0,
      netEdge: 0.0,
      profitPer100: 0,
      confidence: 'low'
    }
  }
];

export default function ComparePage() {
  const [markets, setMarkets] = useState<MatchedMarket[]>(MOCK_MARKETS);
  const [search, setSearch] = useState('');
  const [showArbOnly, setShowArbOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'arb' | 'volume' | 'match'>('arb');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const filteredMarkets = useMemo(() => {
    let filtered = [...markets];
    
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(m => m.question.toLowerCase().includes(q));
    }
    
    if (showArbOnly) {
      filtered = filtered.filter(m => m.arb.hasOpportunity);
    }
    
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'arb': return b.arb.netEdge - a.arb.netEdge;
        case 'volume': return b.polymarket.volume24h - a.polymarket.volume24h;
        case 'match': return b.matchScore - a.matchScore;
        default: return 0;
      }
    });
    
    return filtered;
  }, [markets, search, showArbOnly, sortBy]);

  const stats = useMemo(() => {
    const arbMarkets = markets.filter(m => m.arb.hasOpportunity);
    return {
      total: markets.length,
      arbCount: arbMarkets.length,
      avgEdge: arbMarkets.length > 0 
        ? arbMarkets.reduce((s, m) => s + m.arb.netEdge, 0) / arbMarkets.length 
        : 0,
      totalProfit: arbMarkets.reduce((s, m) => s + m.arb.profitPer100, 0)
    };
  }, [markets]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      setLastUpdate(new Date());
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-zinc-950/95 backdrop-blur border-b border-zinc-800">
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 rounded-xl border border-emerald-500/30">
                <Scale className="w-7 h-7 text-emerald-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Arbitrage Scanner</h1>
                <div className="flex items-center gap-3 text-sm text-zinc-400">
                  <span>Polymarket vs Kalshi • Side-by-Side Odds</span>
                  <span className="w-1 h-1 bg-zinc-600 rounded-full" />
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    Live
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-zinc-500">
                Updated {lastUpdate.toLocaleTimeString()}
              </span>
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-lg text-emerald-400 text-sm font-medium transition-colors"
              >
                <RefreshCw className={clsx('w-4 h-4', isRefreshing && 'animate-spin')} />
                Refresh Odds
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 py-6">
        {/* Stats Bar */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <Target className="w-5 h-5 text-zinc-500" />
              <div>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
                <p className="text-xs text-zinc-500">Matched Markets</p>
              </div>
            </div>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <Zap className="w-5 h-5 text-emerald-400" />
              <div>
                <p className="text-2xl font-bold text-emerald-400">{stats.arbCount}</p>
                <p className="text-xs text-emerald-400/70">Arb Opportunities</p>
              </div>
            </div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <Percent className="w-5 h-5 text-blue-400" />
              <div>
                <p className="text-2xl font-bold text-white">{stats.avgEdge.toFixed(1)}%</p>
                <p className="text-xs text-zinc-500">Avg Net Edge</p>
              </div>
            </div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <DollarSign className="w-5 h-5 text-amber-400" />
              <div>
                <p className="text-2xl font-bold text-white">${stats.totalProfit.toFixed(2)}</p>
                <p className="text-xs text-zinc-500">Profit per $100 (all arbs)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search markets..."
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm focus:outline-none focus:border-emerald-500/50"
            />
          </div>
          <button
            onClick={() => setShowArbOnly(!showArbOnly)}
            className={clsx(
              'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all',
              showArbOnly
                ? 'bg-emerald-500 text-white'
                : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:border-zinc-700'
            )}
          >
            <Zap className="w-4 h-4" />
            Arb Only
          </button>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm"
          >
            <option value="arb">Sort: Best Edge</option>
            <option value="volume">Sort: Volume</option>
            <option value="match">Sort: Match Score</option>
          </select>
        </div>

        {/* Markets Table */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-zinc-800/50 border-b border-zinc-800 text-xs font-semibold text-zinc-500 uppercase tracking-wide">
            <div className="col-span-4">Market</div>
            <div className="col-span-3 text-center">
              <span className="text-purple-400">Polymarket</span>
            </div>
            <div className="col-span-3 text-center">
              <span className="text-blue-400">Kalshi</span>
            </div>
            <div className="col-span-2 text-center">Arb Edge</div>
          </div>

          {/* Market Rows */}
          {filteredMarkets.map((market) => (
            <MarketRow
              key={market.id}
              market={market}
              isExpanded={expandedId === market.id}
              onToggle={() => setExpandedId(expandedId === market.id ? null : market.id)}
            />
          ))}

          {filteredMarkets.length === 0 && (
            <div className="py-16 text-center text-zinc-500">
              No markets match your criteria
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="mt-6 flex items-center justify-center gap-8 text-xs text-zinc-500">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-emerald-500 rounded" />
            <span>Arb opportunity (buy low, sell high)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-purple-500 rounded" />
            <span>Polymarket price</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded" />
            <span>Kalshi price</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function MarketRow({ market, isExpanded, onToggle }: {
  market: MatchedMarket;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const { polymarket: pm, kalshi: k, arb } = market;
  const priceDiff = Math.abs(pm.yesPrice - k.yesPrice) * 100;
  const pmHigher = pm.yesPrice > k.yesPrice;

  return (
    <div className={clsx(
      'border-b border-zinc-800 last:border-b-0 transition-colors',
      arb.hasOpportunity && 'bg-emerald-500/5'
    )}>
      {/* Main Row */}
      <div 
        onClick={onToggle}
        className="grid grid-cols-12 gap-4 px-6 py-4 cursor-pointer hover:bg-zinc-800/30 transition-colors"
      >
        {/* Market Info */}
        <div className="col-span-4">
          <div className="flex items-start gap-3">
            {arb.hasOpportunity && (
              <div className="mt-1 p-1 bg-emerald-500/20 rounded">
                <Zap className="w-3 h-3 text-emerald-400" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-white truncate">{market.question}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2 py-0.5 bg-zinc-800 rounded text-xs text-zinc-400">
                  {market.category}
                </span>
                <span className="text-xs text-zinc-500">
                  Ends {new Date(market.endDate).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Polymarket Odds */}
        <div className="col-span-3">
          <div className="flex items-center justify-center gap-4">
            <OddsBox 
              label="YES" 
              price={pm.yesPrice}
              bid={pm.yesBid}
              ask={pm.yesAsk}
              color="purple"
              highlight={arb.hasOpportunity && !pmHigher}
              action={arb.hasOpportunity && !pmHigher ? 'SELL' : undefined}
            />
            <OddsBox 
              label="NO" 
              price={pm.noPrice}
              bid={pm.noBid}
              ask={pm.noAsk}
              color="purple"
            />
          </div>
        </div>

        {/* Kalshi Odds */}
        <div className="col-span-3">
          <div className="flex items-center justify-center gap-4">
            <OddsBox 
              label="YES" 
              price={k.yesPrice}
              bid={k.yesBid}
              ask={k.yesAsk}
              color="blue"
              highlight={arb.hasOpportunity && pmHigher}
              action={arb.hasOpportunity && pmHigher ? 'SELL' : undefined}
            />
            <OddsBox 
              label="NO" 
              price={k.noPrice}
              bid={k.noBid}
              ask={k.noAsk}
              color="blue"
            />
          </div>
        </div>

        {/* Arb Edge */}
        <div className="col-span-2 flex items-center justify-center">
          {arb.hasOpportunity ? (
            <div className="text-center">
              <div className="text-xl font-bold text-emerald-400">
                +{arb.netEdge.toFixed(1)}%
              </div>
              <div className="text-xs text-emerald-400/70">
                ${arb.profitPer100.toFixed(2)}/100
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div className="text-lg font-medium text-zinc-600">
                {priceDiff.toFixed(1)}%
              </div>
              <div className="text-xs text-zinc-600">diff</div>
            </div>
          )}
        </div>
      </div>

      {/* Expanded Detail */}
      {isExpanded && (
        <div className="px-6 pb-6 pt-2 bg-zinc-800/20">
          <div className="grid grid-cols-3 gap-6">
            {/* Strategy */}
            <div className="bg-zinc-800/50 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Calculator className="w-4 h-4 text-emerald-400" />
                Arbitrage Strategy
              </h4>
              {arb.hasOpportunity ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className={clsx(
                      'px-2 py-1 rounded text-xs font-bold',
                      arb.strategy.includes('poly_yes') && arb.strategy.includes('buy_poly')
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : arb.strategy.includes('poly_yes')
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-zinc-700 text-zinc-400'
                    )}>
                      {arb.strategy.includes('buy_poly') ? 'BUY' : 'SELL'}
                    </span>
                    <span className="text-sm text-purple-400">Polymarket YES</span>
                    <span className="text-sm text-zinc-400">@ {(arb.strategy.includes('buy_poly') ? pm.yesAsk : pm.yesBid) * 100}¢</span>
                  </div>
                  <div className="flex items-center justify-center">
                    <ArrowRight className="w-4 h-4 text-zinc-600" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={clsx(
                      'px-2 py-1 rounded text-xs font-bold',
                      arb.strategy.includes('kalshi_yes') && arb.strategy.includes('sell_kalshi')
                        ? 'bg-red-500/20 text-red-400'
                        : arb.strategy.includes('kalshi_yes')
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-zinc-700 text-zinc-400'
                    )}>
                      {arb.strategy.includes('sell_kalshi') ? 'SELL' : 'BUY'}
                    </span>
                    <span className="text-sm text-blue-400">Kalshi YES</span>
                    <span className="text-sm text-zinc-400">@ {(arb.strategy.includes('sell_kalshi') ? k.yesBid : k.yesAsk) * 100}¢</span>
                  </div>
                  <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-zinc-400">Gross Edge</span>
                      <span className="font-bold text-white">{arb.grossEdge.toFixed(1)}%</span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-sm text-zinc-400">After Spreads</span>
                      <span className="font-bold text-emerald-400">+{arb.netEdge.toFixed(1)}%</span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-sm text-zinc-400">Profit per $100</span>
                      <span className="font-bold text-emerald-400">${arb.profitPer100.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-zinc-500">
                  <X className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No arbitrage opportunity</p>
                  <p className="text-xs mt-1">Price diff: {priceDiff.toFixed(1)}% (less than spreads)</p>
                </div>
              )}
            </div>

            {/* Polymarket Details */}
            <div className="bg-purple-500/5 border border-purple-500/20 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-purple-400 mb-3">Polymarket Details</h4>
              <div className="space-y-2 text-sm">
                <DetailLine label="Yes Bid/Ask" value={`${(pm.yesBid*100).toFixed(0)}¢ / ${(pm.yesAsk*100).toFixed(0)}¢`} />
                <DetailLine label="No Bid/Ask" value={`${(pm.noBid*100).toFixed(0)}¢ / ${(pm.noAsk*100).toFixed(0)}¢`} />
                <DetailLine label="Spread" value={`${(pm.spread*100).toFixed(1)}%`} />
                <DetailLine label="24h Volume" value={formatCurrency(pm.volume24h)} />
                <DetailLine label="Liquidity" value={formatCurrency(pm.liquidity)} />
              </div>
              <a
                href={pm.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 flex items-center justify-center gap-2 w-full py-2 bg-purple-500 hover:bg-purple-400 rounded-lg text-white text-sm font-medium transition-colors"
              >
                Trade on Polymarket <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Kalshi Details */}
            <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-blue-400 mb-3">Kalshi Details</h4>
              <div className="space-y-2 text-sm">
                <DetailLine label="Yes Bid/Ask" value={`${(k.yesBid*100).toFixed(0)}¢ / ${(k.yesAsk*100).toFixed(0)}¢`} />
                <DetailLine label="No Bid/Ask" value={`${(k.noBid*100).toFixed(0)}¢ / ${(k.noAsk*100).toFixed(0)}¢`} />
                <DetailLine label="Spread" value={`${(k.spread*100).toFixed(1)}%`} />
                <DetailLine label="24h Volume" value={formatCurrency(k.volume24h)} />
                <DetailLine label="Open Interest" value={formatCurrency(k.openInterest)} />
              </div>
              <a
                href={k.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 flex items-center justify-center gap-2 w-full py-2 bg-blue-500 hover:bg-blue-400 rounded-lg text-white text-sm font-medium transition-colors"
              >
                Trade on Kalshi <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function OddsBox({ label, price, bid, ask, color, highlight, action }: {
  label: string;
  price: number;
  bid: number;
  ask: number;
  color: 'purple' | 'blue';
  highlight?: boolean;
  action?: 'BUY' | 'SELL';
}) {
  const colorClasses = {
    purple: {
      bg: highlight ? 'bg-purple-500/20 border-purple-500/50' : 'bg-zinc-800/50 border-zinc-700',
      text: 'text-purple-400',
      price: highlight ? 'text-purple-300' : 'text-white'
    },
    blue: {
      bg: highlight ? 'bg-blue-500/20 border-blue-500/50' : 'bg-zinc-800/50 border-zinc-700',
      text: 'text-blue-400',
      price: highlight ? 'text-blue-300' : 'text-white'
    }
  };
  const c = colorClasses[color];

  return (
    <div className={clsx('relative px-3 py-2 rounded-lg border text-center min-w-[70px]', c.bg)}>
      {action && (
        <div className={clsx(
          'absolute -top-2 -right-2 px-1.5 py-0.5 rounded text-[10px] font-bold',
          action === 'BUY' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
        )}>
          {action}
        </div>
      )}
      <div className={clsx('text-[10px] font-medium uppercase', c.text)}>{label}</div>
      <div className={clsx('text-lg font-bold tabular-nums', c.price)}>
        {(price * 100).toFixed(0)}¢
      </div>
      <div className="text-[10px] text-zinc-500 tabular-nums">
        {(bid * 100).toFixed(0)}/{(ask * 100).toFixed(0)}
      </div>
    </div>
  );
}

function DetailLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-zinc-500">{label}</span>
      <span className="text-white font-medium">{value}</span>
    </div>
  );
}

function formatCurrency(value: number): string {
  if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}
