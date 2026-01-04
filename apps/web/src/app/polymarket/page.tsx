'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  TrendingUp, TrendingDown, Search, Filter, ExternalLink, 
  Clock, DollarSign, Activity, BarChart3, RefreshCw,
  ChevronDown, ChevronUp, BookOpen, Zap, Users, Target,
  ArrowUpDown, Eye, Layers
} from 'lucide-react';
import clsx from 'clsx';

// Types
interface PolymarketMarket {
  id: string;
  question: string;
  slug: string;
  conditionId: string;
  volume: number;
  volume24hr: number;
  liquidity: number;
  outcomes: string[];
  outcomePrices: string[];
  spread: number;
  endDate: string;
  active: boolean;
  closed: boolean;
  featured: boolean;
  tags: { id: string; label: string; slug: string }[];
  image?: string;
  icon?: string;
  clob_token_ids?: string[];
}

interface OrderBookDepth {
  tokenId: string;
  bidDepth: number;
  askDepth: number;
  totalDepth: number;
  spread: number;
  midpoint: number;
}

interface MarketDetail {
  gamma: PolymarketMarket;
  clob: any;
  orderBooks: any[];
  trades: any[];
  depth: OrderBookDepth[];
  url: string;
}

// Mock data for demonstration
const MOCK_MARKETS: PolymarketMarket[] = [
  {
    id: '1',
    question: 'Will Donald Trump win the 2024 US Presidential Election?',
    slug: 'trump-2024-president',
    conditionId: '0x123...',
    volume: 125000000,
    volume24hr: 8500000,
    liquidity: 15000000,
    outcomes: ['Yes', 'No'],
    outcomePrices: ['0.52', '0.48'],
    spread: 0.01,
    endDate: '2024-11-05T00:00:00Z',
    active: true,
    closed: false,
    featured: true,
    tags: [{ id: '1', label: 'Politics', slug: 'politics' }, { id: '2', label: 'US Elections', slug: 'us-elections' }],
    clob_token_ids: ['token1', 'token2']
  },
  {
    id: '2',
    question: 'Will the Federal Reserve cut rates in January 2025?',
    slug: 'fed-rate-cut-jan-2025',
    conditionId: '0x456...',
    volume: 45000000,
    volume24hr: 3200000,
    liquidity: 8000000,
    outcomes: ['Yes', 'No'],
    outcomePrices: ['0.35', '0.65'],
    spread: 0.02,
    endDate: '2025-01-31T00:00:00Z',
    active: true,
    closed: false,
    featured: true,
    tags: [{ id: '3', label: 'Economics', slug: 'economics' }, { id: '4', label: 'Federal Reserve', slug: 'fed' }],
    clob_token_ids: ['token3', 'token4']
  },
  {
    id: '3',
    question: 'Will Bitcoin reach $100,000 before March 2025?',
    slug: 'bitcoin-100k-march-2025',
    conditionId: '0x789...',
    volume: 78000000,
    volume24hr: 5600000,
    liquidity: 12000000,
    outcomes: ['Yes', 'No'],
    outcomePrices: ['0.42', '0.58'],
    spread: 0.015,
    endDate: '2025-03-01T00:00:00Z',
    active: true,
    closed: false,
    featured: false,
    tags: [{ id: '5', label: 'Crypto', slug: 'crypto' }],
    clob_token_ids: ['token5', 'token6']
  },
  {
    id: '4',
    question: 'Will there be a ceasefire in Ukraine by end of 2025?',
    slug: 'ukraine-ceasefire-2025',
    conditionId: '0xabc...',
    volume: 32000000,
    volume24hr: 1800000,
    liquidity: 5500000,
    outcomes: ['Yes', 'No'],
    outcomePrices: ['0.28', '0.72'],
    spread: 0.025,
    endDate: '2025-12-31T00:00:00Z',
    active: true,
    closed: false,
    featured: false,
    tags: [{ id: '1', label: 'Politics', slug: 'politics' }, { id: '6', label: 'Geopolitics', slug: 'geopolitics' }],
    clob_token_ids: ['token7', 'token8']
  },
  {
    id: '5',
    question: 'Will OpenAI release GPT-5 in 2025?',
    slug: 'openai-gpt5-2025',
    conditionId: '0xdef...',
    volume: 22000000,
    volume24hr: 2100000,
    liquidity: 4200000,
    outcomes: ['Yes', 'No'],
    outcomePrices: ['0.68', '0.32'],
    spread: 0.02,
    endDate: '2025-12-31T00:00:00Z',
    active: true,
    closed: false,
    featured: false,
    tags: [{ id: '7', label: 'Technology', slug: 'technology' }, { id: '8', label: 'AI', slug: 'ai' }],
    clob_token_ids: ['token9', 'token10']
  },
  {
    id: '6',
    question: 'Will the S&P 500 close above 5500 in January 2025?',
    slug: 'sp500-5500-jan-2025',
    conditionId: '0xghi...',
    volume: 18500000,
    volume24hr: 1450000,
    liquidity: 3800000,
    outcomes: ['Yes', 'No'],
    outcomePrices: ['0.55', '0.45'],
    spread: 0.018,
    endDate: '2025-01-31T00:00:00Z',
    active: true,
    closed: false,
    featured: false,
    tags: [{ id: '9', label: 'Markets', slug: 'markets' }],
    clob_token_ids: ['token11', 'token12']
  }
];

const MOCK_TAGS = [
  { id: '1', label: 'Politics', slug: 'politics', count: 245 },
  { id: '3', label: 'Economics', slug: 'economics', count: 189 },
  { id: '5', label: 'Crypto', slug: 'crypto', count: 156 },
  { id: '7', label: 'Technology', slug: 'technology', count: 134 },
  { id: '9', label: 'Markets', slug: 'markets', count: 98 },
  { id: '6', label: 'Geopolitics', slug: 'geopolitics', count: 87 },
  { id: '10', label: 'Sports', slug: 'sports', count: 312 },
  { id: '11', label: 'Entertainment', slug: 'entertainment', count: 76 }
];

export default function PolymarketPage() {
  const [markets, setMarkets] = useState<PolymarketMarket[]>(MOCK_MARKETS);
  const [tags] = useState(MOCK_TAGS);
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'volume' | 'volume24hr' | 'liquidity' | 'spread'>('volume');
  const [selectedMarket, setSelectedMarket] = useState<PolymarketMarket | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const filteredMarkets = useMemo(() => {
    let filtered = [...markets];
    
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(m => 
        m.question.toLowerCase().includes(searchLower) ||
        m.tags.some(t => t.label.toLowerCase().includes(searchLower))
      );
    }
    
    if (selectedTag) {
      filtered = filtered.filter(m => m.tags.some(t => t.slug === selectedTag));
    }
    
    filtered.sort((a, b) => b[sortBy] - a[sortBy]);
    
    return filtered;
  }, [markets, search, selectedTag, sortBy]);

  const stats = useMemo(() => ({
    totalVolume: markets.reduce((sum, m) => sum + m.volume, 0),
    volume24h: markets.reduce((sum, m) => sum + m.volume24hr, 0),
    totalLiquidity: markets.reduce((sum, m) => sum + m.liquidity, 0),
    activeMarkets: markets.filter(m => m.active && !m.closed).length
  }), [markets]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // In production, fetch from API
    setTimeout(() => setIsRefreshing(false), 1500);
  };

  return (
    <div className="min-h-screen bg-zinc-950 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-xl border border-purple-500/30">
            <Target className="w-8 h-8 text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Polymarket Explorer</h1>
            <p className="text-sm text-zinc-400">Real-time prediction market data via Gamma, CLOB & Data APIs</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="https://docs.polymarket.com/developers"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm transition-colors"
          >
            <BookOpen className="w-4 h-4" />
            API Docs
          </a>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg text-purple-400 text-sm transition-colors"
          >
            <RefreshCw className={clsx('w-4 h-4', isRefreshing && 'animate-spin')} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total Volume"
          value={formatCurrency(stats.totalVolume)}
          icon={DollarSign}
          color="green"
        />
        <StatCard
          label="24h Volume"
          value={formatCurrency(stats.volume24h)}
          icon={Activity}
          color="blue"
          change={12.5}
        />
        <StatCard
          label="Total Liquidity"
          value={formatCurrency(stats.totalLiquidity)}
          icon={Layers}
          color="purple"
        />
        <StatCard
          label="Active Markets"
          value={stats.activeMarkets.toString()}
          icon={Target}
          color="amber"
        />
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
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedTag(null)}
            className={clsx(
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
              !selectedTag
                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-600'
            )}
          >
            All
          </button>
          {tags.slice(0, 6).map(tag => (
            <button
              key={tag.id}
              onClick={() => setSelectedTag(tag.slug === selectedTag ? null : tag.slug)}
              className={clsx(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                selectedTag === tag.slug
                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                  : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-600'
              )}
            >
              {tag.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-4 h-4 text-zinc-500" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm"
          >
            <option value="volume">Total Volume</option>
            <option value="volume24hr">24h Volume</option>
            <option value="liquidity">Liquidity</option>
            <option value="spread">Spread</option>
          </select>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Markets List */}
        <div className="lg:col-span-2 space-y-4">
          {filteredMarkets.map(market => (
            <MarketCard
              key={market.id}
              market={market}
              isSelected={selectedMarket?.id === market.id}
              onClick={() => setSelectedMarket(market)}
            />
          ))}
          {filteredMarkets.length === 0 && (
            <div className="text-center py-16 text-zinc-500">
              No markets match your filters.
            </div>
          )}
        </div>

        {/* Detail Panel */}
        <div className="lg:col-span-1">
          {selectedMarket ? (
            <MarketDetailPanel market={selectedMarket} />
          ) : (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-center sticky top-6">
              <Eye className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
              <p className="text-zinc-500">Select a market to view details</p>
              <p className="text-xs text-zinc-600 mt-2">Includes order book, trades, and depth analysis</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color, change }: {
  label: string;
  value: string;
  icon: any;
  color: string;
  change?: number;
}) {
  const colorClasses: Record<string, string> = {
    green: 'bg-emerald-500/10 text-emerald-400',
    blue: 'bg-blue-500/10 text-blue-400',
    purple: 'bg-purple-500/10 text-purple-400',
    amber: 'bg-amber-500/10 text-amber-400',
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
      <div className="flex items-center justify-between">
        <div className={clsx('p-2 rounded-lg', colorClasses[color])}>
          <Icon className="w-5 h-5" />
        </div>
        {change !== undefined && (
          <span className={clsx(
            'flex items-center gap-1 text-xs font-medium',
            change >= 0 ? 'text-emerald-400' : 'text-red-400'
          )}>
            {change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(change)}%
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

function MarketCard({ market, isSelected, onClick }: {
  market: PolymarketMarket;
  isSelected: boolean;
  onClick: () => void;
}) {
  const primaryPrice = parseFloat(market.outcomePrices[0]);
  const probability = Math.round(primaryPrice * 100);

  return (
    <div
      onClick={onClick}
      className={clsx(
        'bg-zinc-900 border rounded-xl overflow-hidden cursor-pointer transition-all',
        isSelected
          ? 'border-purple-500/50 ring-1 ring-purple-500/20'
          : 'border-zinc-800 hover:border-zinc-700'
      )}
    >
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {market.featured && (
                <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs font-bold rounded">
                  FEATURED
                </span>
              )}
              {market.tags.slice(0, 2).map(tag => (
                <span key={tag.id} className="px-2 py-0.5 bg-zinc-800 text-zinc-400 text-xs rounded">
                  {tag.label}
                </span>
              ))}
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">{market.question}</h3>
            
            {/* Outcomes */}
            <div className="space-y-2 mb-3">
              {market.outcomes.map((outcome, i) => {
                const price = parseFloat(market.outcomePrices[i]);
                const isLeading = i === 0 ? price > 0.5 : price >= 0.5;
                return (
                  <div key={outcome} className="flex items-center gap-3">
                    <span className="text-sm text-zinc-400 w-12">{outcome}</span>
                    <div className="flex-1 h-6 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className={clsx(
                          'h-full rounded-full transition-all',
                          isLeading ? 'bg-emerald-500/60' : 'bg-zinc-600'
                        )}
                        style={{ width: `${price * 100}%` }}
                      />
                    </div>
                    <span className={clsx(
                      'text-sm font-bold tabular-nums w-12 text-right',
                      isLeading ? 'text-emerald-400' : 'text-zinc-400'
                    )}>
                      {Math.round(price * 100)}¢
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Stats */}
          <div className="text-right">
            <div className="text-2xl font-bold text-white tabular-nums">{probability}%</div>
            <div className="text-xs text-zinc-500 mb-3">Yes probability</div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between gap-4">
                <span className="text-zinc-500">Volume</span>
                <span className="text-zinc-300 font-medium">{formatCurrency(market.volume)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-zinc-500">24h</span>
                <span className="text-emerald-400 font-medium">{formatCurrency(market.volume24hr)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-zinc-500">Liquidity</span>
                <span className="text-zinc-300 font-medium">{formatCurrency(market.liquidity)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-800">
          <div className="flex items-center gap-4 text-xs text-zinc-500">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Ends {new Date(market.endDate).toLocaleDateString()}
            </span>
            <span className="flex items-center gap-1">
              <BarChart3 className="w-3 h-3" />
              Spread: {(market.spread * 100).toFixed(1)}%
            </span>
          </div>
          <a
            href={`https://polymarket.com/event/${market.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300"
            onClick={(e) => e.stopPropagation()}
          >
            Trade on Polymarket <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
}

function MarketDetailPanel({ market }: { market: PolymarketMarket }) {
  const [activeTab, setActiveTab] = useState<'overview' | 'orderbook' | 'trades'>('overview');

  // Mock order book data
  const mockOrderBook = {
    bids: [
      { price: '0.51', size: '5000' },
      { price: '0.50', size: '12000' },
      { price: '0.49', size: '8500' },
      { price: '0.48', size: '15000' },
      { price: '0.47', size: '22000' },
    ],
    asks: [
      { price: '0.52', size: '4500' },
      { price: '0.53', size: '9000' },
      { price: '0.54', size: '7500' },
      { price: '0.55', size: '11000' },
      { price: '0.56', size: '18000' },
    ]
  };

  // Mock trades
  const mockTrades = [
    { side: 'BUY', price: '0.52', size: '500', time: '2 min ago' },
    { side: 'SELL', price: '0.51', size: '1200', time: '5 min ago' },
    { side: 'BUY', price: '0.52', size: '800', time: '8 min ago' },
    { side: 'BUY', price: '0.51', size: '2500', time: '12 min ago' },
    { side: 'SELL', price: '0.50', size: '1800', time: '15 min ago' },
  ];

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden sticky top-6">
      <div className="p-4 border-b border-zinc-800">
        <h3 className="font-semibold text-white truncate">{market.question}</h3>
        <div className="flex gap-2 mt-2">
          {['overview', 'orderbook', 'trades'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={clsx(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize',
                activeTab === tab
                  ? 'bg-purple-500/20 text-purple-400'
                  : 'text-zinc-500 hover:text-zinc-300'
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 max-h-[calc(100vh-300px)] overflow-y-auto">
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Probabilities */}
            <div>
              <h4 className="text-sm font-semibold text-zinc-300 mb-2">Probabilities</h4>
              <div className="space-y-2">
                {market.outcomes.map((outcome, i) => (
                  <div key={outcome} className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
                    <span className="font-medium text-white">{outcome}</span>
                    <span className="text-xl font-bold text-purple-400">
                      {Math.round(parseFloat(market.outcomePrices[i]) * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div>
              <h4 className="text-sm font-semibold text-zinc-300 mb-2">Market Stats</h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 bg-zinc-800/50 rounded-lg">
                  <p className="text-xs text-zinc-500">Total Volume</p>
                  <p className="text-lg font-bold text-white">{formatCurrency(market.volume)}</p>
                </div>
                <div className="p-3 bg-zinc-800/50 rounded-lg">
                  <p className="text-xs text-zinc-500">24h Volume</p>
                  <p className="text-lg font-bold text-emerald-400">{formatCurrency(market.volume24hr)}</p>
                </div>
                <div className="p-3 bg-zinc-800/50 rounded-lg">
                  <p className="text-xs text-zinc-500">Liquidity</p>
                  <p className="text-lg font-bold text-white">{formatCurrency(market.liquidity)}</p>
                </div>
                <div className="p-3 bg-zinc-800/50 rounded-lg">
                  <p className="text-xs text-zinc-500">Spread</p>
                  <p className="text-lg font-bold text-white">{(market.spread * 100).toFixed(2)}%</p>
                </div>
              </div>
            </div>

            {/* Tags */}
            <div>
              <h4 className="text-sm font-semibold text-zinc-300 mb-2">Categories</h4>
              <div className="flex flex-wrap gap-2">
                {market.tags.map(tag => (
                  <span key={tag.id} className="px-3 py-1 bg-zinc-800 text-zinc-400 rounded-full text-sm">
                    {tag.label}
                  </span>
                ))}
              </div>
            </div>

            {/* End Date */}
            <div className="p-3 bg-zinc-800/50 rounded-lg">
              <p className="text-xs text-zinc-500">Resolution Date</p>
              <p className="text-sm font-medium text-white">{new Date(market.endDate).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}</p>
            </div>
          </div>
        )}

        {activeTab === 'orderbook' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Bids */}
              <div>
                <h4 className="text-sm font-semibold text-emerald-400 mb-2">Bids</h4>
                <div className="space-y-1">
                  {mockOrderBook.bids.map((bid, i) => (
                    <div key={i} className="flex justify-between text-sm p-2 bg-emerald-500/10 rounded">
                      <span className="text-emerald-400">{bid.price}</span>
                      <span className="text-zinc-400">{parseInt(bid.size).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Asks */}
              <div>
                <h4 className="text-sm font-semibold text-red-400 mb-2">Asks</h4>
                <div className="space-y-1">
                  {mockOrderBook.asks.map((ask, i) => (
                    <div key={i} className="flex justify-between text-sm p-2 bg-red-500/10 rounded">
                      <span className="text-red-400">{ask.price}</span>
                      <span className="text-zinc-400">{parseInt(ask.size).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="p-3 bg-zinc-800/50 rounded-lg">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Bid Depth</span>
                <span className="text-emerald-400 font-medium">$62,500</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-zinc-500">Ask Depth</span>
                <span className="text-red-400 font-medium">$50,000</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'trades' && (
          <div className="space-y-2">
            {mockTrades.map((trade, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className={clsx(
                    'px-2 py-0.5 rounded text-xs font-bold',
                    trade.side === 'BUY' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                  )}>
                    {trade.side}
                  </span>
                  <span className="text-white font-medium">{trade.price}</span>
                </div>
                <div className="text-right">
                  <span className="text-zinc-300">{parseInt(trade.size).toLocaleString()}</span>
                  <span className="text-zinc-500 text-xs ml-2">{trade.time}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Trade Button */}
        <a
          href={`https://polymarket.com/event/${market.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full mt-4 p-3 bg-purple-500 hover:bg-purple-400 rounded-lg text-white font-medium transition-colors"
        >
          Trade on Polymarket <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}

function formatCurrency(value: number): string {
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

