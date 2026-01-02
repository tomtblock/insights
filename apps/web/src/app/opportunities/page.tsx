'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Search, RefreshCw, Filter, ArrowRight, TrendingUp, Clock, 
  AlertTriangle, CheckCircle, ExternalLink, Zap, Target
} from 'lucide-react';
import clsx from 'clsx';

interface Opportunity {
  id: string;
  event: string;
  buyVenue: string;
  sellVenue: string;
  buyPrice: number;
  sellPrice: number;
  edgeBps: number;
  confidence: number;
  maxSize: number;
  status: 'live' | 'stale' | 'expired';
  flags: string[];
  lastSeen: string;
  timeToExpiry?: string;
}

const MOCK_OPPORTUNITIES: Opportunity[] = [
  {
    id: 'opp-1',
    event: 'Will Bitcoin reach $100,000 by end of 2025?',
    buyVenue: 'Polymarket',
    sellVenue: 'Kalshi',
    buyPrice: 0.62,
    sellPrice: 0.67,
    edgeBps: 42,
    confidence: 87,
    maxSize: 15000,
    status: 'live',
    flags: [],
    lastSeen: '2 min ago',
    timeToExpiry: '11 months',
  },
  {
    id: 'opp-2',
    event: 'Fed rate cut in January 2025?',
    buyVenue: 'Kalshi',
    sellVenue: 'PredictIt',
    buyPrice: 0.23,
    sellPrice: 0.28,
    edgeBps: 38,
    confidence: 82,
    maxSize: 8500,
    status: 'live',
    flags: ['near_resolution'],
    lastSeen: '5 min ago',
    timeToExpiry: '27 days',
  },
  {
    id: 'opp-3',
    event: 'Will Trump win 2024 election?',
    buyVenue: 'PredictIt',
    sellVenue: 'Polymarket',
    buyPrice: 0.51,
    sellPrice: 0.54,
    edgeBps: 25,
    confidence: 75,
    maxSize: 22000,
    status: 'live',
    flags: ['high_volume'],
    lastSeen: '8 min ago',
  },
  {
    id: 'opp-4',
    event: 'Ethereum $5,000 by March 2025?',
    buyVenue: 'Polymarket',
    sellVenue: 'Kalshi',
    buyPrice: 0.40,
    sellPrice: 0.44,
    edgeBps: 32,
    confidence: 79,
    maxSize: 12000,
    status: 'live',
    flags: [],
    lastSeen: '12 min ago',
    timeToExpiry: '3 months',
  },
  {
    id: 'opp-5',
    event: 'Super Bowl 2025 - Chiefs win?',
    buyVenue: 'Kalshi',
    sellVenue: 'Polymarket',
    buyPrice: 0.26,
    sellPrice: 0.30,
    edgeBps: 28,
    confidence: 71,
    maxSize: 6500,
    status: 'stale',
    flags: ['stale_data'],
    lastSeen: '45 min ago',
    timeToExpiry: '5 weeks',
  },
  {
    id: 'opp-6',
    event: 'AI achieves AGI by 2025?',
    buyVenue: 'PredictIt',
    sellVenue: 'Polymarket',
    buyPrice: 0.06,
    sellPrice: 0.10,
    edgeBps: 35,
    confidence: 65,
    maxSize: 4000,
    status: 'live',
    flags: ['high_ambiguity'],
    lastSeen: '18 min ago',
    timeToExpiry: '11 months',
  },
];

function formatUSD(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(1)}K`;
  return `$${amount.toFixed(0)}`;
}

export default function OpportunitiesPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [minConfidence, setMinConfidence] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const filteredOpportunities = MOCK_OPPORTUNITIES
    .filter((o) => {
      if (statusFilter !== 'all' && o.status !== statusFilter) return false;
      if (o.confidence < minConfidence) return false;
      if (search) {
        return o.event.toLowerCase().includes(search.toLowerCase());
      }
      return true;
    })
    .sort((a, b) => b.edgeBps - a.edgeBps);

  const liveCount = MOCK_OPPORTUNITIES.filter((o) => o.status === 'live').length;
  const totalEdge = MOCK_OPPORTUNITIES.reduce((acc, o) => acc + o.edgeBps, 0);
  const avgEdge = Math.round(totalEdge / MOCK_OPPORTUNITIES.length);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  return (
    <div className="min-h-full bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
      <div className="p-8 space-y-6 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
              Opportunities
            </h1>
            <p className="text-zinc-500 mt-2">Cross-venue arbitrage opportunities in real-time</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-sm text-emerald-400 font-medium">{liveCount} Live</span>
            </div>
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white font-medium transition-colors"
            >
              <RefreshCw className={clsx('w-4 h-4', isRefreshing && 'animate-spin')} />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <Zap className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{liveCount}</p>
                <p className="text-sm text-zinc-500">Live Opportunities</p>
              </div>
            </div>
          </div>
          <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <TrendingUp className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{avgEdge} bps</p>
                <p className="text-sm text-zinc-500">Average Edge</p>
              </div>
            </div>
          </div>
          <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Target className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{formatUSD(MOCK_OPPORTUNITIES.reduce((acc, o) => acc + o.maxSize, 0))}</p>
                <p className="text-sm text-zinc-500">Total Opportunity Size</p>
              </div>
            </div>
          </div>
          <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <CheckCircle className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">78%</p>
                <p className="text-sm text-zinc-500">Avg Confidence</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl">
          <div className="relative flex-1 min-w-[280px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search opportunities..."
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-zinc-500" />
            <span className="text-sm text-zinc-500">Status:</span>
          </div>

          <div className="flex gap-2">
            {['all', 'live', 'stale'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={clsx(
                  'px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors',
                  statusFilter === status
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-600'
                )}
              >
                {status}
              </button>
            ))}
          </div>

          <div className="h-6 w-px bg-zinc-700" />

          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-500">Min confidence:</span>
            <select
              value={minConfidence}
              onChange={(e) => setMinConfidence(Number(e.target.value))}
              className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm"
            >
              <option value="0">Any</option>
              <option value="60">60%+</option>
              <option value="70">70%+</option>
              <option value="80">80%+</option>
            </select>
          </div>
        </div>

        {/* Opportunities list */}
        <div className="space-y-4">
          {filteredOpportunities.map((opp) => (
            <div 
              key={opp.id}
              className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-700 transition-colors"
            >
              <div className="p-6">
                <div className="flex items-start justify-between gap-6">
                  {/* Left: Event info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={clsx(
                        'px-2 py-0.5 rounded text-xs font-medium uppercase',
                        opp.status === 'live' && 'bg-emerald-500/20 text-emerald-400',
                        opp.status === 'stale' && 'bg-amber-500/20 text-amber-400',
                        opp.status === 'expired' && 'bg-red-500/20 text-red-400'
                      )}>
                        {opp.status}
                      </span>
                      {opp.flags.includes('near_resolution') && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 text-amber-400 text-xs rounded">
                          <Clock className="w-3 h-3" />
                          Near resolution
                        </span>
                      )}
                      {opp.flags.includes('high_ambiguity') && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-purple-500/10 text-purple-400 text-xs rounded">
                          <AlertTriangle className="w-3 h-3" />
                          High ambiguity
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-3">{opp.event}</h3>
                    
                    {/* Trade direction */}
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-lg">
                        <div>
                          <p className="text-xs text-zinc-500 mb-1">BUY on</p>
                          <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-sm font-medium rounded">
                            {opp.buyVenue}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-zinc-500 mb-1">at</p>
                          <p className="text-lg font-bold text-emerald-400 font-mono">
                            {(opp.buyPrice * 100).toFixed(0)}¢
                          </p>
                        </div>
                      </div>
                      
                      <ArrowRight className="w-6 h-6 text-zinc-600" />
                      
                      <div className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-lg">
                        <div>
                          <p className="text-xs text-zinc-500 mb-1">SELL on</p>
                          <span className="px-2 py-1 bg-red-500/20 text-red-400 text-sm font-medium rounded">
                            {opp.sellVenue}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-zinc-500 mb-1">at</p>
                          <p className="text-lg font-bold text-red-400 font-mono">
                            {(opp.sellPrice * 100).toFixed(0)}¢
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Edge & metrics */}
                  <div className="text-right min-w-[180px]">
                    <div className="text-4xl font-bold text-emerald-400 mb-1">
                      +{opp.edgeBps} <span className="text-lg">bps</span>
                    </div>
                    <p className="text-sm text-zinc-500 mb-4">Net edge after fees</p>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-500">Confidence</span>
                        <span className="font-medium text-white">{opp.confidence}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-500">Max size</span>
                        <span className="font-medium text-white font-mono">{formatUSD(opp.maxSize)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-500">Last seen</span>
                        <span className="font-medium text-white">{opp.lastSeen}</span>
                      </div>
                      {opp.timeToExpiry && (
                        <div className="flex justify-between text-sm">
                          <span className="text-zinc-500">Expires in</span>
                          <span className="font-medium text-white">{opp.timeToExpiry}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Confidence bar */}
                <div className="mt-6 pt-4 border-t border-zinc-800">
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex justify-between text-xs text-zinc-500 mb-1">
                        <span>Confidence Score</span>
                        <span>{opp.confidence}/100</span>
                      </div>
                      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div 
                          className={clsx(
                            'h-full rounded-full transition-all',
                            opp.confidence >= 80 ? 'bg-emerald-500' :
                            opp.confidence >= 60 ? 'bg-amber-500' : 'bg-red-500'
                          )}
                          style={{ width: `${opp.confidence}%` }}
                        />
                      </div>
                    </div>
                    <Link
                      href={`/algorithm?opp=${opp.id}`}
                      className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm text-zinc-300 transition-colors"
                    >
                      View algorithm <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
