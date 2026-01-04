'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeftRight, RefreshCw, Search, Filter, TrendingUp, TrendingDown,
  ExternalLink, AlertTriangle, Zap, DollarSign, Activity, BarChart3,
  Check, X, Minus, ChevronDown, ChevronUp, Eye, Target, Scale
} from 'lucide-react';
import clsx from 'clsx';

// Types
interface MarketComparison {
  id: string;
  matchScore: number;
  polymarket: {
    id: string;
    question: string;
    slug: string;
    yesPrice: number;
    noPrice: number;
    spread: number;
    volume: number;
    volume24h: number;
    liquidity: number;
    endDate: string;
    url: string;
    tags: string[];
  };
  kalshi: {
    ticker: string;
    eventTicker: string;
    title: string;
    yesPrice: number | null;
    yesBid: number;
    yesAsk: number;
    noBid: number;
    noAsk: number;
    spread: number;
    volume: number;
    volume24h: number;
    liquidity: number;
    openInterest: number;
    closeTime: string;
    url: string;
  };
  comparison: {
    priceDiff: number | null;
    priceDiffDirection: 'polymarket_higher' | 'kalshi_higher' | null;
    hasArbOpportunity: boolean;
    arbEdge: number | null;
    volumeRatio: number | null;
    liquidityRatio: number | null;
  };
}

interface Stats {
  totalMatches: number;
  arbOpportunities: number;
  avgPriceDiff: number;
  polymarketOnly: number;
  kalshiMarketsSearched: number;
}

// Mock data
const MOCK_COMPARISONS: MarketComparison[] = [
  {
    id: '1',
    matchScore: 95,
    polymarket: {
      id: 'pm1',
      question: 'Will Donald Trump win the 2024 Presidential Election?',
      slug: 'trump-2024',
      yesPrice: 0.52,
      noPrice: 0.48,
      spread: 0.01,
      volume: 125000000,
      volume24h: 8500000,
      liquidity: 15000000,
      endDate: '2024-11-05',
      url: 'https://polymarket.com/event/trump-2024',
      tags: ['Politics', 'Elections']
    },
    kalshi: {
      ticker: 'PRES-24-DT-NH',
      eventTicker: 'PRES-24',
      title: 'Donald Trump wins 2024 US Presidential Election',
      yesPrice: 0.54,
      yesBid: 0.53,
      yesAsk: 0.55,
      noBid: 0.45,
      noAsk: 0.47,
      spread: 0.02,
      volume: 45000000,
      volume24h: 3200000,
      liquidity: 8000000,
      openInterest: 12500000,
      closeTime: '2024-11-05',
      url: 'https://kalshi.com/markets/PRES-24/PRES-24-DT-NH'
    },
    comparison: {
      priceDiff: 2.0,
      priceDiffDirection: 'kalshi_higher',
      hasArbOpportunity: true,
      arbEdge: 0.5,
      volumeRatio: 2.78,
      liquidityRatio: 1.88
    }
  },
  {
    id: '2',
    matchScore: 88,
    polymarket: {
      id: 'pm2',
      question: 'Will the Federal Reserve cut rates in January 2025?',
      slug: 'fed-rate-cut',
      yesPrice: 0.35,
      noPrice: 0.65,
      spread: 0.02,
      volume: 45000000,
      volume24h: 3200000,
      liquidity: 8000000,
      endDate: '2025-01-31',
      url: 'https://polymarket.com/event/fed-rate-cut',
      tags: ['Economics', 'Fed']
    },
    kalshi: {
      ticker: 'FED-25JAN-T25',
      eventTicker: 'FED-25JAN',
      title: 'Fed cuts rates at January 2025 FOMC meeting',
      yesPrice: 0.32,
      yesBid: 0.31,
      yesAsk: 0.33,
      noBid: 0.67,
      noAsk: 0.69,
      spread: 0.02,
      volume: 28000000,
      volume24h: 1800000,
      liquidity: 5500000,
      openInterest: 8200000,
      closeTime: '2025-01-29',
      url: 'https://kalshi.com/markets/FED-25JAN/FED-25JAN-T25'
    },
    comparison: {
      priceDiff: 3.0,
      priceDiffDirection: 'polymarket_higher',
      hasArbOpportunity: true,
      arbEdge: 1.0,
      volumeRatio: 1.61,
      liquidityRatio: 1.45
    }
  },
  {
    id: '3',
    matchScore: 82,
    polymarket: {
      id: 'pm3',
      question: 'Will Bitcoin reach $100,000 before March 2025?',
      slug: 'bitcoin-100k',
      yesPrice: 0.42,
      noPrice: 0.58,
      spread: 0.015,
      volume: 78000000,
      volume24h: 5600000,
      liquidity: 12000000,
      endDate: '2025-03-01',
      url: 'https://polymarket.com/event/bitcoin-100k',
      tags: ['Crypto']
    },
    kalshi: {
      ticker: 'BTC-25MAR-100K',
      eventTicker: 'BTC-25MAR',
      title: 'Bitcoin above $100,000 on March 1, 2025',
      yesPrice: 0.41,
      yesBid: 0.40,
      yesAsk: 0.42,
      noBid: 0.58,
      noAsk: 0.60,
      spread: 0.02,
      volume: 35000000,
      volume24h: 2400000,
      liquidity: 6800000,
      openInterest: 9500000,
      closeTime: '2025-03-01',
      url: 'https://kalshi.com/markets/BTC-25MAR/BTC-25MAR-100K'
    },
    comparison: {
      priceDiff: 1.0,
      priceDiffDirection: 'polymarket_higher',
      hasArbOpportunity: false,
      arbEdge: null,
      volumeRatio: 2.23,
      liquidityRatio: 1.76
    }
  },
  {
    id: '4',
    matchScore: 75,
    polymarket: {
      id: 'pm4',
      question: 'Will there be a ceasefire in Ukraine by end of 2025?',
      slug: 'ukraine-ceasefire',
      yesPrice: 0.28,
      noPrice: 0.72,
      spread: 0.025,
      volume: 32000000,
      volume24h: 1800000,
      liquidity: 5500000,
      endDate: '2025-12-31',
      url: 'https://polymarket.com/event/ukraine-ceasefire',
      tags: ['Politics', 'Geopolitics']
    },
    kalshi: {
      ticker: 'UKR-25-CEASE',
      eventTicker: 'UKR-25',
      title: 'Ukraine ceasefire announced before 2026',
      yesPrice: 0.25,
      yesBid: 0.24,
      yesAsk: 0.26,
      noBid: 0.74,
      noAsk: 0.76,
      spread: 0.02,
      volume: 18000000,
      volume24h: 950000,
      liquidity: 3200000,
      openInterest: 5100000,
      closeTime: '2025-12-31',
      url: 'https://kalshi.com/markets/UKR-25/UKR-25-CEASE'
    },
    comparison: {
      priceDiff: 3.0,
      priceDiffDirection: 'polymarket_higher',
      hasArbOpportunity: true,
      arbEdge: 0.75,
      volumeRatio: 1.78,
      liquidityRatio: 1.72
    }
  }
];

const MOCK_STATS: Stats = {
  totalMatches: 47,
  arbOpportunities: 8,
  avgPriceDiff: 2.3,
  polymarketOnly: 156,
  kalshiMarketsSearched: 312
};

export default function ComparePage() {
  const [comparisons, setComparisons] = useState<MarketComparison[]>(MOCK_COMPARISONS);
  const [stats, setStats] = useState<Stats>(MOCK_STATS);
  const [search, setSearch] = useState('');
  const [showArbOnly, setShowArbOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'matchScore' | 'priceDiff' | 'volume'>('matchScore');
  const [selectedComparison, setSelectedComparison] = useState<MarketComparison | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [wsStatus, setWsStatus] = useState<'connected' | 'connecting' | 'disconnected'>('disconnected');

  const filteredComparisons = useMemo(() => {
    let filtered = [...comparisons];

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(c =>
        c.polymarket.question.toLowerCase().includes(searchLower) ||
        c.kalshi.title.toLowerCase().includes(searchLower)
      );
    }

    if (showArbOnly) {
      filtered = filtered.filter(c => c.comparison.hasArbOpportunity);
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'priceDiff':
          return (b.comparison.priceDiff || 0) - (a.comparison.priceDiff || 0);
        case 'volume':
          return b.polymarket.volume - a.polymarket.volume;
        default:
          return b.matchScore - a.matchScore;
      }
    });

    return filtered;
  }, [comparisons, search, showArbOnly, sortBy]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setWsStatus('connecting');
    // Simulate WebSocket connection and data fetch
    setTimeout(() => {
      setIsRefreshing(false);
      setWsStatus('connected');
    }, 2000);
  };

  useEffect(() => {
    // Simulate initial connection
    handleRefresh();
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl border border-blue-500/30">
            <ArrowLeftRight className="w-8 h-8 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Market Comparison</h1>
            <p className="text-sm text-zinc-400">
              Real-time Polymarket vs Kalshi comparison • WebSocket: 
              <span className={clsx(
                'ml-1 font-medium',
                wsStatus === 'connected' && 'text-emerald-400',
                wsStatus === 'connecting' && 'text-yellow-400',
                wsStatus === 'disconnected' && 'text-red-400'
              )}>
                {wsStatus === 'connected' && '● Connected'}
                {wsStatus === 'connecting' && '○ Connecting...'}
                {wsStatus === 'disconnected' && '● Disconnected'}
              </span>
            </p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg text-blue-400 text-sm transition-colors"
        >
          <RefreshCw className={clsx('w-4 h-4', isRefreshing && 'animate-spin')} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        <StatCard label="Matched Markets" value={stats.totalMatches} icon={Target} color="blue" />
        <StatCard 
          label="Arb Opportunities" 
          value={stats.arbOpportunities} 
          icon={Zap} 
          color="emerald"
          highlight
        />
        <StatCard label="Avg Price Diff" value={`${stats.avgPriceDiff.toFixed(1)}%`} icon={Activity} color="purple" />
        <StatCard label="Polymarket Only" value={stats.polymarketOnly} icon={BarChart3} color="amber" />
        <StatCard label="Kalshi Searched" value={stats.kalshiMarketsSearched} icon={Search} color="zinc" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-6 p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
        <div className="relative flex-1 min-w-[300px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search markets..."
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm focus:outline-none focus:border-blue-500"
          />
        </div>

        <button
          onClick={() => setShowArbOnly(!showArbOnly)}
          className={clsx(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
            showArbOnly
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-600'
          )}
        >
          <Zap className="w-4 h-4" />
          Arb Only
        </button>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm"
        >
          <option value="matchScore">Match Score</option>
          <option value="priceDiff">Price Difference</option>
          <option value="volume">Volume</option>
        </select>
      </div>

      {/* Comparison Table */}
      <div className="space-y-4">
        {filteredComparisons.map(comp => (
          <ComparisonCard
            key={comp.id}
            comparison={comp}
            isSelected={selectedComparison?.id === comp.id}
            onClick={() => setSelectedComparison(comp)}
          />
        ))}
        
        {filteredComparisons.length === 0 && (
          <div className="text-center py-16 text-zinc-500">
            No matching markets found.
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedComparison && (
        <DetailModal
          comparison={selectedComparison}
          onClose={() => setSelectedComparison(null)}
        />
      )}
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color, highlight }: {
  label: string;
  value: string | number;
  icon: any;
  color: string;
  highlight?: boolean;
}) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-500/10 text-blue-400',
    emerald: 'bg-emerald-500/10 text-emerald-400',
    purple: 'bg-purple-500/10 text-purple-400',
    amber: 'bg-amber-500/10 text-amber-400',
    zinc: 'bg-zinc-500/10 text-zinc-400',
  };

  return (
    <div className={clsx(
      'bg-zinc-900 border rounded-xl p-4',
      highlight ? 'border-emerald-500/30' : 'border-zinc-800'
    )}>
      <div className="flex items-center justify-between">
        <div className={clsx('p-2 rounded-lg', colorClasses[color])}>
          <Icon className="w-5 h-5" />
        </div>
        {highlight && (
          <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded">
            LIVE
          </span>
        )}
      </div>
      <div className="mt-3">
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-sm text-zinc-500">{label}</p>
      </div>
    </div>
  );
}

function ComparisonCard({ comparison, isSelected, onClick }: {
  comparison: MarketComparison;
  isSelected: boolean;
  onClick: () => void;
}) {
  const { polymarket, kalshi, comparison: comp } = comparison;

  return (
    <div
      onClick={onClick}
      className={clsx(
        'bg-zinc-900 border rounded-xl overflow-hidden cursor-pointer transition-all',
        isSelected
          ? 'border-blue-500/50 ring-1 ring-blue-500/20'
          : 'border-zinc-800 hover:border-zinc-700',
        comp.hasArbOpportunity && 'ring-1 ring-emerald-500/20'
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-zinc-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className={clsx(
              'px-2 py-1 rounded text-xs font-bold',
              comparison.matchScore >= 80 ? 'bg-emerald-500/20 text-emerald-400' :
              comparison.matchScore >= 60 ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-zinc-700 text-zinc-400'
            )}>
              {comparison.matchScore}% Match
            </span>
            {comp.hasArbOpportunity && (
              <span className="flex items-center gap-1 px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded text-xs font-bold animate-pulse">
                <Zap className="w-3 h-3" />
                ARB +{comp.arbEdge?.toFixed(2)}%
              </span>
            )}
            {polymarket.tags.slice(0, 2).map(tag => (
              <span key={tag} className="px-2 py-1 bg-zinc-800 text-zinc-400 rounded text-xs">
                {tag}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            {comp.priceDiff !== null && (
              <span className={clsx(
                'font-medium',
                comp.priceDiff > 2 ? 'text-amber-400' : 'text-zinc-400'
              )}>
                Δ {comp.priceDiff.toFixed(1)}%
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Side by Side */}
      <div className="grid grid-cols-2 divide-x divide-zinc-800">
        {/* Polymarket */}
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center">
              <span className="text-xs font-bold text-purple-400">P</span>
            </div>
            <span className="text-sm font-semibold text-purple-400">Polymarket</span>
          </div>
          <h3 className="text-white font-medium mb-3 line-clamp-2">{polymarket.question}</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-500">Yes Price</span>
              <span className="text-lg font-bold text-white">{(polymarket.yesPrice * 100).toFixed(1)}¢</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-500">Spread</span>
              <span className="text-sm text-zinc-300">{(polymarket.spread * 100).toFixed(1)}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-500">Volume</span>
              <span className="text-sm text-zinc-300">{formatCurrency(polymarket.volume)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-500">Liquidity</span>
              <span className="text-sm text-zinc-300">{formatCurrency(polymarket.liquidity)}</span>
            </div>
          </div>
        </div>

        {/* Kalshi */}
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center">
              <span className="text-xs font-bold text-blue-400">K</span>
            </div>
            <span className="text-sm font-semibold text-blue-400">Kalshi</span>
          </div>
          <h3 className="text-white font-medium mb-3 line-clamp-2">{kalshi.title}</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-500">Yes Price</span>
              <span className="text-lg font-bold text-white">
                {kalshi.yesPrice !== null ? `${(kalshi.yesPrice * 100).toFixed(1)}¢` : '-'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-500">Spread</span>
              <span className="text-sm text-zinc-300">{(kalshi.spread * 100).toFixed(1)}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-500">Volume</span>
              <span className="text-sm text-zinc-300">{formatCurrency(kalshi.volume)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-500">Open Interest</span>
              <span className="text-sm text-zinc-300">{formatCurrency(kalshi.openInterest)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Price Comparison Bar */}
      <div className="px-4 pb-4">
        <div className="relative h-8 bg-zinc-800 rounded-lg overflow-hidden">
          <div 
            className="absolute left-0 top-0 h-full bg-purple-500/40 flex items-center justify-end pr-2"
            style={{ width: `${polymarket.yesPrice * 100}%` }}
          >
            <span className="text-xs font-bold text-purple-300">{(polymarket.yesPrice * 100).toFixed(0)}¢</span>
          </div>
          {kalshi.yesPrice !== null && (
            <div 
              className="absolute top-0 h-full w-1 bg-blue-400"
              style={{ left: `${kalshi.yesPrice * 100}%` }}
            />
          )}
        </div>
        <div className="flex justify-between text-xs text-zinc-500 mt-1">
          <span>0¢</span>
          <span className="text-blue-400">Kalshi: {kalshi.yesPrice !== null ? `${(kalshi.yesPrice * 100).toFixed(0)}¢` : '-'}</span>
          <span>100¢</span>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-3 bg-zinc-800/50 border-t border-zinc-800">
        <div className="flex gap-4">
          <a
            href={polymarket.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300"
            onClick={(e) => e.stopPropagation()}
          >
            Trade on Polymarket <ExternalLink className="w-3 h-3" />
          </a>
          <a
            href={kalshi.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
            onClick={(e) => e.stopPropagation()}
          >
            Trade on Kalshi <ExternalLink className="w-3 h-3" />
          </a>
        </div>
        <Eye className="w-4 h-4 text-zinc-500" />
      </div>
    </div>
  );
}

function DetailModal({ comparison, onClose }: {
  comparison: MarketComparison;
  onClose: () => void;
}) {
  const { polymarket, kalshi, comparison: comp } = comparison;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-zinc-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Scale className="w-6 h-6 text-blue-400" />
              <h2 className="text-xl font-bold text-white">Market Comparison Detail</h2>
              <span className={clsx(
                'px-2 py-1 rounded text-xs font-bold',
                comparison.matchScore >= 80 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-yellow-500/20 text-yellow-400'
              )}>
                {comparison.matchScore}% Match
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-zinc-400" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Arb Alert */}
          {comp.hasArbOpportunity && (
            <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
              <div className="flex items-center gap-3">
                <Zap className="w-6 h-6 text-emerald-400" />
                <div>
                  <h3 className="font-bold text-emerald-400">Arbitrage Opportunity Detected</h3>
                  <p className="text-sm text-zinc-400">
                    Estimated edge: <span className="font-bold text-emerald-400">+{comp.arbEdge?.toFixed(2)}%</span>
                    {' '}after spreads
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Side by Side Detail */}
          <div className="grid grid-cols-2 gap-6">
            {/* Polymarket */}
            <div className="bg-zinc-800/50 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <span className="font-bold text-purple-400">P</span>
                </div>
                <span className="text-lg font-bold text-purple-400">Polymarket</span>
              </div>
              <h3 className="text-white font-semibold mb-4">{polymarket.question}</h3>
              <div className="space-y-3">
                <DetailRow label="Yes Price" value={`${(polymarket.yesPrice * 100).toFixed(1)}¢`} />
                <DetailRow label="No Price" value={`${(polymarket.noPrice * 100).toFixed(1)}¢`} />
                <DetailRow label="Spread" value={`${(polymarket.spread * 100).toFixed(2)}%`} />
                <DetailRow label="24h Volume" value={formatCurrency(polymarket.volume24h)} />
                <DetailRow label="Total Volume" value={formatCurrency(polymarket.volume)} />
                <DetailRow label="Liquidity" value={formatCurrency(polymarket.liquidity)} />
                <DetailRow label="End Date" value={new Date(polymarket.endDate).toLocaleDateString()} />
              </div>
              <a
                href={polymarket.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 flex items-center justify-center gap-2 w-full p-3 bg-purple-500 hover:bg-purple-400 rounded-lg text-white font-medium transition-colors"
              >
                Trade on Polymarket <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            {/* Kalshi */}
            <div className="bg-zinc-800/50 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <span className="font-bold text-blue-400">K</span>
                </div>
                <span className="text-lg font-bold text-blue-400">Kalshi</span>
              </div>
              <h3 className="text-white font-semibold mb-4">{kalshi.title}</h3>
              <div className="space-y-3">
                <DetailRow label="Yes Bid/Ask" value={`${(kalshi.yesBid * 100).toFixed(0)}¢ / ${(kalshi.yesAsk * 100).toFixed(0)}¢`} />
                <DetailRow label="No Bid/Ask" value={`${(kalshi.noBid * 100).toFixed(0)}¢ / ${(kalshi.noAsk * 100).toFixed(0)}¢`} />
                <DetailRow label="Spread" value={`${(kalshi.spread * 100).toFixed(2)}%`} />
                <DetailRow label="24h Volume" value={formatCurrency(kalshi.volume24h)} />
                <DetailRow label="Total Volume" value={formatCurrency(kalshi.volume)} />
                <DetailRow label="Open Interest" value={formatCurrency(kalshi.openInterest)} />
                <DetailRow label="Close Time" value={new Date(kalshi.closeTime).toLocaleDateString()} />
              </div>
              <a
                href={kalshi.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 flex items-center justify-center gap-2 w-full p-3 bg-blue-500 hover:bg-blue-400 rounded-lg text-white font-medium transition-colors"
              >
                Trade on Kalshi <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Comparison Analysis */}
          <div className="mt-6 p-5 bg-zinc-800/50 rounded-xl">
            <h3 className="text-lg font-bold text-white mb-4">Price Analysis</h3>
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{comp.priceDiff?.toFixed(1) || '-'}%</p>
                <p className="text-sm text-zinc-500">Price Difference</p>
              </div>
              <div className="text-center">
                <p className={clsx(
                  'text-2xl font-bold',
                  comp.priceDiffDirection === 'polymarket_higher' ? 'text-purple-400' : 'text-blue-400'
                )}>
                  {comp.priceDiffDirection === 'polymarket_higher' ? 'Polymarket' : 'Kalshi'}
                </p>
                <p className="text-sm text-zinc-500">Higher Price</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{comp.volumeRatio?.toFixed(1) || '-'}x</p>
                <p className="text-sm text-zinc-500">Volume Ratio (PM/K)</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{comp.liquidityRatio?.toFixed(1) || '-'}x</p>
                <p className="text-sm text-zinc-500">Liquidity Ratio (PM/K)</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-zinc-500">{label}</span>
      <span className="text-sm font-medium text-white">{value}</span>
    </div>
  );
}

function formatCurrency(value: number): string {
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

