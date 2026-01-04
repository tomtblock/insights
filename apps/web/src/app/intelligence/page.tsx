'use client';

import { useState, useMemo, useEffect } from 'react';
import { 
  Globe, RefreshCw, Search, AlertTriangle, TrendingUp, 
  Clock, ExternalLink, ChevronRight, Zap, Shield, DollarSign,
  Radio, Target, BarChart3, AlertCircle, CheckCircle, XCircle,
  Newspaper, MapPin, Building, Cpu, Ship, Users, Scale, Activity,
  ChevronDown, ChevronUp, Flame, Gauge, TrendingDown, Minus,
  Crosshair, Bomb, Banknote, Wheat, Wifi, Vote, Crown, Twitter,
  MessageCircle, Repeat2, Heart, ExternalLink as LinkIcon, Hash,
  Filter, Layers, Star, Eye
} from 'lucide-react';
import clsx from 'clsx';

// ============ TYPES ============
type DataSource = 'all' | 'news' | 'x-signals';
type SignalCategory = 'Economy' | 'Politics' | 'Sports' | 'Tech' | 'M&A' | 'Crypto';

interface IntelligenceItem {
  id: string;
  type: 'news' | 'x-signal';
  title: string;
  summary: string;
  source: string;
  sourceHandle?: string;
  sourceTier?: 1 | 2 | 3;
  url: string;
  timestamp: Date;
  category: string;
  subcategory?: string;
  severity: number;
  confidence: number;
  status: 'rumor' | 'developing' | 'confirmed' | 'denied';
  keywords: string[];
  entities?: string[];
  marketImpact?: {
    assets: string[];
    direction: 'bullish' | 'bearish' | 'neutral' | 'volatile';
    magnitude: string;
    sectors: string[];
  };
  engagement?: {
    retweets: number;
    replies: number;
    likes: number;
  };
  confirmations?: string[];
}

// ============ MOCK DATA ============
const MOCK_ITEMS: IntelligenceItem[] = [
  // X Signals
  {
    id: 'x1',
    type: 'x-signal',
    title: 'BREAKING: Houthi forces launch multiple drones toward Red Sea shipping',
    summary: 'Multiple commercial vessels reporting drone activity in Bab el-Mandeb strait. US Navy monitoring situation. Shipping insurance rates spiking.',
    source: 'OSINTdefender',
    sourceHandle: '@sentdefender',
    sourceTier: 1,
    url: 'https://x.com/sentdefender/status/123',
    timestamp: new Date(Date.now() - 15 * 60 * 1000),
    category: 'Politics',
    subcategory: 'Conflict OSINT',
    severity: 9,
    confidence: 0.88,
    status: 'developing',
    keywords: ['drone attack', 'Red Sea', 'shipping', 'Houthi'],
    entities: ['Bab el-Mandeb', 'US Navy', 'Yemen'],
    marketImpact: {
      assets: ['$OIL', '$SHIPPING'],
      direction: 'bullish',
      magnitude: 'significant',
      sectors: ['Energy', 'Shipping', 'Insurance']
    },
    engagement: { retweets: 2847, replies: 412, likes: 5621 },
    confirmations: ['@Reuters', '@ELINTNews']
  },
  {
    id: 'x2',
    type: 'x-signal',
    title: 'OPEC+ emergency meeting called for tomorrow - production cuts on table',
    summary: 'Saudi-led bloc convening emergency session. Sources indicate 500k-1M bpd cut being discussed. Market bracing for announcement.',
    source: 'Javier Blas',
    sourceHandle: '@JavierBlas',
    sourceTier: 1,
    url: 'https://x.com/JavierBlas/status/456',
    timestamp: new Date(Date.now() - 45 * 60 * 1000),
    category: 'Economy',
    subcategory: 'Commodities',
    severity: 8,
    confidence: 0.92,
    status: 'confirmed',
    keywords: ['OPEC', 'production cut', 'emergency meeting', 'oil'],
    entities: ['Saudi Arabia', 'OPEC+', 'Russia'],
    marketImpact: {
      assets: ['$CL', '$XLE', '$OXY'],
      direction: 'bullish',
      magnitude: 'major',
      sectors: ['Energy', 'Commodities']
    },
    engagement: { retweets: 4521, replies: 876, likes: 12340 },
    confirmations: ['@EnergyIntel', '@Reuters']
  },
  {
    id: 'x3',
    type: 'x-signal',
    title: 'Woj: Lakers finalizing trade for All-Star center - deal imminent',
    summary: 'Sources tell ESPN the Lakers are finalizing a blockbuster trade. Official announcement expected within hours. Salary matching involves 3 teams.',
    source: 'Adrian Wojnarowski',
    sourceHandle: '@wojespn',
    sourceTier: 1,
    url: 'https://x.com/wojespn/status/789',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    category: 'Sports',
    subcategory: 'NBA',
    severity: 6,
    confidence: 0.96,
    status: 'developing',
    keywords: ['trade', 'Lakers', 'NBA', 'blockbuster'],
    entities: ['Lakers', 'ESPN'],
    marketImpact: {
      assets: [],
      direction: 'neutral',
      magnitude: 'minor',
      sectors: ['Sports Betting']
    },
    engagement: { retweets: 15234, replies: 8745, likes: 45678 }
  },
  {
    id: 'x4',
    type: 'x-signal',
    title: 'GPT-5 training run completed - internal testing phase beginning',
    summary: 'Sources familiar confirm OpenAI has completed initial GPT-5 training. Internal red team testing underway. No timeline for release.',
    source: 'Sam Altman',
    sourceHandle: '@sama',
    sourceTier: 1,
    url: 'https://x.com/sama/status/101',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
    category: 'Tech',
    subcategory: 'AI',
    severity: 7,
    confidence: 0.85,
    status: 'rumor',
    keywords: ['GPT-5', 'training', 'OpenAI', 'AI model'],
    entities: ['OpenAI', 'GPT-5'],
    marketImpact: {
      assets: ['$MSFT', '$NVDA'],
      direction: 'bullish',
      magnitude: 'moderate',
      sectors: ['AI', 'Tech']
    },
    engagement: { retweets: 8921, replies: 2341, likes: 34567 }
  },
  {
    id: 'x5',
    type: 'x-signal',
    title: 'Stripe in advanced acquisition talks with major fintech - $10B+ valuation',
    summary: 'Exclusive: Stripe holding advanced discussions to acquire [redacted] fintech. Deal would be largest in company history. Regulatory approval key hurdle.',
    source: 'DealBook',
    sourceHandle: '@dealbook',
    sourceTier: 1,
    url: 'https://x.com/dealbook/status/202',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
    category: 'M&A',
    subcategory: 'Deals',
    severity: 7,
    confidence: 0.78,
    status: 'rumor',
    keywords: ['acquisition', 'Stripe', 'fintech', 'deal'],
    entities: ['Stripe', 'Patrick Collison'],
    marketImpact: {
      assets: [],
      direction: 'bullish',
      magnitude: 'significant',
      sectors: ['Fintech', 'Payments']
    },
    engagement: { retweets: 3456, replies: 567, likes: 8901 }
  },
  // News Items
  {
    id: 'n1',
    type: 'news',
    title: 'China Conducts Largest Military Exercises Near Taiwan Since 2022',
    summary: 'PLA Eastern Theater Command announces unprecedented live-fire drills involving carrier strike group in waters near Taiwan.',
    source: 'Reuters',
    url: 'https://reuters.com/world/asia',
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
    category: 'Politics',
    subcategory: 'Taiwan Strait',
    severity: 8,
    confidence: 0.95,
    status: 'confirmed',
    keywords: ['Taiwan', 'military', 'China', 'exercises'],
    entities: ['Taiwan', 'China', 'PLA'],
    marketImpact: {
      assets: ['$TSM', '$EWT'],
      direction: 'bearish',
      magnitude: 'significant',
      sectors: ['Semiconductors', 'Defense']
    }
  },
  {
    id: 'n2',
    type: 'news',
    title: 'Federal Reserve Signals Extended Pause Amid Banking Stress',
    summary: 'Fed Chair indicates rates may stay higher for longer while monitoring regional bank stress.',
    source: 'Bloomberg',
    url: 'https://bloomberg.com/markets',
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
    category: 'Economy',
    subcategory: 'Central Banks',
    severity: 7,
    confidence: 0.98,
    status: 'confirmed',
    keywords: ['Fed', 'rates', 'banking', 'pause'],
    entities: ['Federal Reserve', 'Jerome Powell'],
    marketImpact: {
      assets: ['$SPY', '$TLT', '$KRE'],
      direction: 'volatile',
      magnitude: 'moderate',
      sectors: ['Banking', 'Equities', 'Rates']
    }
  }
];

const CATEGORIES = ['All', 'Economy', 'Politics', 'Sports', 'Tech', 'M&A', 'Crypto'];

// ============ MAIN PAGE ============
export default function IntelligencePage() {
  const [items, setItems] = useState<IntelligenceItem[]>(MOCK_ITEMS);
  const [dataSource, setDataSource] = useState<DataSource>('all');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [minSeverity, setMinSeverity] = useState(1);
  const [selectedItem, setSelectedItem] = useState<IntelligenceItem | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAccountRegistry, setShowAccountRegistry] = useState(false);

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      if (dataSource === 'news' && item.type !== 'news') return false;
      if (dataSource === 'x-signals' && item.type !== 'x-signal') return false;
      if (selectedCategory !== 'All' && item.category !== selectedCategory) return false;
      if (item.severity < minSeverity) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!item.title.toLowerCase().includes(q) && 
            !item.summary.toLowerCase().includes(q) &&
            !item.keywords.some(k => k.toLowerCase().includes(q))) {
          return false;
        }
      }
      return true;
    }).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [items, dataSource, selectedCategory, search, minSeverity]);

  const stats = useMemo(() => ({
    total: filteredItems.length,
    xSignals: filteredItems.filter(i => i.type === 'x-signal').length,
    news: filteredItems.filter(i => i.type === 'news').length,
    critical: filteredItems.filter(i => i.severity >= 8).length,
    confirmed: filteredItems.filter(i => i.status === 'confirmed').length
  }), [filteredItems]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1500);
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-zinc-950/95 backdrop-blur border-b border-zinc-800">
        <div className="max-w-[1800px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-xl border border-red-500/30">
                <Globe className="w-7 h-7 text-red-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Intelligence Monitor</h1>
                <div className="flex items-center gap-3 text-sm text-zinc-400">
                  <span>News + X Signals • Real-time Market Intelligence</span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    Live
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowAccountRegistry(!showAccountRegistry)}
                className="flex items-center gap-2 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm transition-colors"
              >
                <Users className="w-4 h-4" />
                Account Registry
              </button>
              <button
                onClick={handleRefresh}
                className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm font-medium transition-colors"
              >
                <RefreshCw className={clsx('w-4 h-4', isRefreshing && 'animate-spin')} />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1800px] mx-auto px-6 py-6">
        {/* Data Source Tabs */}
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => setDataSource('all')}
            className={clsx(
              'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all',
              dataSource === 'all'
                ? 'bg-zinc-800 text-white'
                : 'text-zinc-500 hover:text-zinc-300'
            )}
          >
            <Layers className="w-4 h-4" />
            All Sources
            <span className="px-1.5 py-0.5 bg-zinc-700 rounded text-xs">{stats.total}</span>
          </button>
          <button
            onClick={() => setDataSource('x-signals')}
            className={clsx(
              'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all',
              dataSource === 'x-signals'
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                : 'text-zinc-500 hover:text-zinc-300'
            )}
          >
            <Twitter className="w-4 h-4" />
            X Signals
            <span className={clsx(
              'px-1.5 py-0.5 rounded text-xs',
              dataSource === 'x-signals' ? 'bg-blue-500/30' : 'bg-zinc-700'
            )}>{stats.xSignals}</span>
          </button>
          <button
            onClick={() => setDataSource('news')}
            className={clsx(
              'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all',
              dataSource === 'news'
                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                : 'text-zinc-500 hover:text-zinc-300'
            )}
          >
            <Newspaper className="w-4 h-4" />
            News
            <span className={clsx(
              'px-1.5 py-0.5 rounded text-xs',
              dataSource === 'news' ? 'bg-purple-500/30' : 'bg-zinc-700'
            )}>{stats.news}</span>
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-2 text-sm">
            <span className="text-zinc-500">Critical:</span>
            <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded font-bold">{stats.critical}</span>
            <span className="text-zinc-500 ml-2">Confirmed:</span>
            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded font-bold">{stats.confirmed}</span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 mb-6 p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search signals, keywords, entities..."
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm focus:outline-none focus:border-red-500/50"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={clsx(
                  'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                  selectedCategory === cat
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                    : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-600'
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-500">Min Severity:</span>
            <select
              value={minSeverity}
              onChange={(e) => setMinSeverity(Number(e.target.value))}
              className="px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm"
            >
              {[1, 3, 5, 7, 9].map(v => (
                <option key={v} value={v}>{v}+</option>
              ))}
            </select>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Feed */}
          <div className="lg:col-span-2 space-y-4">
            {filteredItems.map(item => (
              <SignalCard
                key={item.id}
                item={item}
                isSelected={selectedItem?.id === item.id}
                onClick={() => setSelectedItem(item)}
              />
            ))}
            {filteredItems.length === 0 && (
              <div className="text-center py-16 text-zinc-500">
                No signals match your filters
              </div>
            )}
          </div>

          {/* Detail Panel */}
          <div className="lg:col-span-1">
            {selectedItem ? (
              <DetailPanel item={selectedItem} onClose={() => setSelectedItem(null)} />
            ) : (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-center sticky top-24">
                <Target className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                <p className="text-zinc-500">Select a signal to view details</p>
                <p className="text-xs text-zinc-600 mt-2">Includes source info, market impact, and keywords</p>
              </div>
            )}
          </div>
        </div>

        {/* Account Registry Modal */}
        {showAccountRegistry && (
          <AccountRegistryModal onClose={() => setShowAccountRegistry(false)} />
        )}
      </div>
    </div>
  );
}

// ============ SIGNAL CARD ============
function SignalCard({ item, isSelected, onClick }: {
  item: IntelligenceItem;
  isSelected: boolean;
  onClick: () => void;
}) {
  const isXSignal = item.type === 'x-signal';
  const severityColor = getSeverityColor(item.severity);

  return (
    <div
      onClick={onClick}
      className={clsx(
        'bg-zinc-900 border rounded-xl overflow-hidden cursor-pointer transition-all',
        isSelected ? 'border-red-500/50 ring-1 ring-red-500/20' : 'border-zinc-800 hover:border-zinc-700',
        item.severity >= 8 && 'ring-1 ring-red-500/20'
      )}
    >
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {/* Source Badge */}
              <div className={clsx(
                'flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium',
                isXSignal ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'
              )}>
                {isXSignal ? <Twitter className="w-3 h-3" /> : <Newspaper className="w-3 h-3" />}
                {item.source}
                {item.sourceTier && (
                  <span className="ml-1 px-1 bg-zinc-800 rounded text-[10px]">T{item.sourceTier}</span>
                )}
              </div>
              
              {/* Status */}
              <span className={clsx(
                'px-2 py-0.5 rounded text-xs font-medium',
                item.status === 'confirmed' && 'bg-emerald-500/20 text-emerald-400',
                item.status === 'developing' && 'bg-yellow-500/20 text-yellow-400',
                item.status === 'rumor' && 'bg-zinc-700 text-zinc-400',
                item.status === 'denied' && 'bg-red-500/20 text-red-400'
              )}>
                {item.status}
              </span>

              {/* Category */}
              <span className="px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded text-xs">
                {item.category}
              </span>

              {/* Time */}
              <span className="text-xs text-zinc-500">
                {formatTimeAgo(item.timestamp)}
              </span>
            </div>

            <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
            <p className="text-sm text-zinc-400 line-clamp-2">{item.summary}</p>
          </div>

          {/* Severity Score */}
          <div className="flex-shrink-0 text-center">
            <div className={clsx(
              'w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold',
              severityColor.bg, severityColor.text
            )}>
              {item.severity}
            </div>
            <p className="text-xs text-zinc-500 mt-1">Severity</p>
          </div>
        </div>

        {/* Keywords */}
        <div className="flex items-center gap-2 flex-wrap mb-3">
          {item.keywords.slice(0, 5).map((kw, i) => (
            <span key={i} className="flex items-center gap-1 px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded text-xs">
              <Hash className="w-3 h-3" />
              {kw}
            </span>
          ))}
        </div>

        {/* Market Impact */}
        {item.marketImpact && (
          <div className="flex items-center gap-2 flex-wrap mb-3">
            <span className={clsx(
              'px-2 py-0.5 rounded text-xs font-medium',
              item.marketImpact.direction === 'bullish' && 'bg-emerald-500/20 text-emerald-400',
              item.marketImpact.direction === 'bearish' && 'bg-red-500/20 text-red-400',
              item.marketImpact.direction === 'volatile' && 'bg-amber-500/20 text-amber-400',
              item.marketImpact.direction === 'neutral' && 'bg-zinc-700 text-zinc-400'
            )}>
              {item.marketImpact.direction} • {item.marketImpact.magnitude}
            </span>
            {item.marketImpact.assets.map((asset, i) => (
              <span key={i} className="px-2 py-0.5 bg-zinc-700 text-zinc-300 rounded text-xs font-mono">
                {asset}
              </span>
            ))}
            {item.marketImpact.sectors.slice(0, 3).map((sector, i) => (
              <span key={i} className="px-2 py-0.5 bg-zinc-800 text-zinc-500 rounded text-xs">
                {sector}
              </span>
            ))}
          </div>
        )}

        {/* X Signal Engagement */}
        {isXSignal && item.engagement && (
          <div className="flex items-center gap-4 pt-3 border-t border-zinc-800">
            <span className="flex items-center gap-1.5 text-xs text-zinc-500">
              <Repeat2 className="w-3.5 h-3.5" />
              {formatNumber(item.engagement.retweets)}
            </span>
            <span className="flex items-center gap-1.5 text-xs text-zinc-500">
              <MessageCircle className="w-3.5 h-3.5" />
              {formatNumber(item.engagement.replies)}
            </span>
            <span className="flex items-center gap-1.5 text-xs text-zinc-500">
              <Heart className="w-3.5 h-3.5" />
              {formatNumber(item.engagement.likes)}
            </span>
            {item.confirmations && item.confirmations.length > 0 && (
              <span className="flex items-center gap-1.5 text-xs text-emerald-400 ml-auto">
                <CheckCircle className="w-3.5 h-3.5" />
                Confirmed by {item.confirmations.length}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ============ DETAIL PANEL ============
function DetailPanel({ item, onClose }: { item: IntelligenceItem; onClose: () => void }) {
  const isXSignal = item.type === 'x-signal';

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden sticky top-24">
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
        <h3 className="font-semibold text-white">Signal Details</h3>
        <button onClick={onClose} className="p-1 hover:bg-zinc-800 rounded">
          <XCircle className="w-5 h-5 text-zinc-500" />
        </button>
      </div>

      <div className="p-4 max-h-[calc(100vh-200px)] overflow-y-auto space-y-4">
        {/* Source Info */}
        <div className="p-3 bg-zinc-800/50 rounded-lg">
          <div className="flex items-center gap-3 mb-2">
            {isXSignal ? (
              <Twitter className="w-5 h-5 text-blue-400" />
            ) : (
              <Newspaper className="w-5 h-5 text-purple-400" />
            )}
            <div>
              <p className="font-medium text-white">{item.source}</p>
              {item.sourceHandle && (
                <p className="text-sm text-zinc-400">{item.sourceHandle}</p>
              )}
            </div>
            {item.sourceTier && (
              <span className={clsx(
                'ml-auto px-2 py-1 rounded text-xs font-bold',
                item.sourceTier === 1 && 'bg-emerald-500/20 text-emerald-400',
                item.sourceTier === 2 && 'bg-blue-500/20 text-blue-400',
                item.sourceTier === 3 && 'bg-zinc-700 text-zinc-400'
              )}>
                Tier {item.sourceTier}
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-500">{item.subcategory}</p>
        </div>

        {/* Confidence & Severity */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-zinc-800/50 rounded-lg text-center">
            <p className="text-2xl font-bold text-white">{item.severity}</p>
            <p className="text-xs text-zinc-500">Severity</p>
          </div>
          <div className="p-3 bg-zinc-800/50 rounded-lg text-center">
            <p className="text-2xl font-bold text-white">{Math.round(item.confidence * 100)}%</p>
            <p className="text-xs text-zinc-500">Confidence</p>
          </div>
        </div>

        {/* Confirmations */}
        {item.confirmations && item.confirmations.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-zinc-300 mb-2">Confirmed By</h4>
            <div className="flex flex-wrap gap-2">
              {item.confirmations.map((handle, i) => (
                <span key={i} className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded text-xs">
                  {handle}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Keywords */}
        <div>
          <h4 className="text-sm font-semibold text-zinc-300 mb-2">Keywords Matched</h4>
          <div className="flex flex-wrap gap-2">
            {item.keywords.map((kw, i) => (
              <span key={i} className="px-2 py-1 bg-zinc-800 text-zinc-400 rounded text-xs">
                {kw}
              </span>
            ))}
          </div>
        </div>

        {/* Entities */}
        {item.entities && item.entities.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-zinc-300 mb-2">Entities</h4>
            <div className="flex flex-wrap gap-2">
              {item.entities.map((entity, i) => (
                <span key={i} className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">
                  {entity}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Market Impact */}
        {item.marketImpact && (
          <div>
            <h4 className="text-sm font-semibold text-zinc-300 mb-2">Market Impact</h4>
            <div className="p-3 bg-zinc-800/50 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-500">Direction</span>
                <span className={clsx(
                  'px-2 py-0.5 rounded text-xs font-bold uppercase',
                  item.marketImpact.direction === 'bullish' && 'bg-emerald-500/20 text-emerald-400',
                  item.marketImpact.direction === 'bearish' && 'bg-red-500/20 text-red-400',
                  item.marketImpact.direction === 'volatile' && 'bg-amber-500/20 text-amber-400'
                )}>
                  {item.marketImpact.direction}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-500">Magnitude</span>
                <span className="text-sm text-white">{item.marketImpact.magnitude}</span>
              </div>
              {item.marketImpact.assets.length > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-500">Assets</span>
                  <span className="text-sm font-mono text-white">
                    {item.marketImpact.assets.join(', ')}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-500">Sectors</span>
                <span className="text-sm text-white">{item.marketImpact.sectors.join(', ')}</span>
              </div>
            </div>
          </div>
        )}

        {/* Engagement (X Signals) */}
        {isXSignal && item.engagement && (
          <div>
            <h4 className="text-sm font-semibold text-zinc-300 mb-2">Engagement</h4>
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2 bg-zinc-800/50 rounded-lg text-center">
                <Repeat2 className="w-4 h-4 mx-auto text-zinc-500 mb-1" />
                <p className="text-lg font-bold text-white">{formatNumber(item.engagement.retweets)}</p>
                <p className="text-[10px] text-zinc-500">Retweets</p>
              </div>
              <div className="p-2 bg-zinc-800/50 rounded-lg text-center">
                <MessageCircle className="w-4 h-4 mx-auto text-zinc-500 mb-1" />
                <p className="text-lg font-bold text-white">{formatNumber(item.engagement.replies)}</p>
                <p className="text-[10px] text-zinc-500">Replies</p>
              </div>
              <div className="p-2 bg-zinc-800/50 rounded-lg text-center">
                <Heart className="w-4 h-4 mx-auto text-zinc-500 mb-1" />
                <p className="text-lg font-bold text-white">{formatNumber(item.engagement.likes)}</p>
                <p className="text-[10px] text-zinc-500">Likes</p>
              </div>
            </div>
          </div>
        )}

        {/* View Source */}
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full p-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-medium transition-colors"
        >
          View Source <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}

// ============ ACCOUNT REGISTRY MODAL ============
function AccountRegistryModal({ onClose }: { onClose: () => void }) {
  const [filterCategory, setFilterCategory] = useState<string>('All');

  const accounts = [
    // Economy
    { handle: '@JavierBlas', name: 'Javier Blas', category: 'Economy', subdomain: 'Commodities', tier: 1, credibility: 0.95 },
    { handle: '@EnergyIntel', name: 'Energy Intelligence', category: 'Economy', subdomain: 'Energy', tier: 1, credibility: 0.92 },
    { handle: '@MacroAlf', name: 'Alfonso Peccatiello', category: 'Economy', subdomain: 'Macro', tier: 2, credibility: 0.88 },
    // Politics
    { handle: '@Reuters', name: 'Reuters', category: 'Politics', subdomain: 'Global', tier: 1, credibility: 0.98 },
    { handle: '@sentdefender', name: 'OSINTdefender', category: 'Politics', subdomain: 'Conflict OSINT', tier: 1, credibility: 0.90 },
    { handle: '@NatashaBertrand', name: 'Natasha Bertrand', category: 'Politics', subdomain: 'Security', tier: 1, credibility: 0.92 },
    // Sports
    { handle: '@FabrizioRomano', name: 'Fabrizio Romano', category: 'Sports', subdomain: 'Soccer', tier: 1, credibility: 0.96 },
    { handle: '@wojespn', name: 'Adrian Wojnarowski', category: 'Sports', subdomain: 'NBA', tier: 1, credibility: 0.97 },
    { handle: '@AdamSchefter', name: 'Adam Schefter', category: 'Sports', subdomain: 'NFL', tier: 1, credibility: 0.95 },
    // Tech
    { handle: '@sama', name: 'Sam Altman', category: 'Tech', subdomain: 'AI', tier: 1, credibility: 0.98 },
    { handle: '@karpathy', name: 'Andrej Karpathy', category: 'Tech', subdomain: 'AI Research', tier: 1, credibility: 0.96 },
    // M&A
    { handle: '@dealbook', name: 'DealBook', category: 'M&A', subdomain: 'Deals', tier: 1, credibility: 0.95 },
    { handle: '@axios', name: 'Axios', category: 'M&A', subdomain: 'Deals', tier: 1, credibility: 0.92 },
    // Crypto
    { handle: '@TheBlock__', name: 'The Block', category: 'Crypto', subdomain: 'Crypto News', tier: 1, credibility: 0.90 },
  ];

  const filtered = filterCategory === 'All' 
    ? accounts 
    : accounts.filter(a => a.category === filterCategory);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden">
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-400" />
              X Account Registry
            </h2>
            <p className="text-sm text-zinc-400 mt-1">Curated high-signal accounts for market intelligence</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-lg">
            <XCircle className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        <div className="p-4 border-b border-zinc-800">
          <div className="flex gap-2">
            {['All', 'Economy', 'Politics', 'Sports', 'Tech', 'M&A', 'Crypto'].map(cat => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={clsx(
                  'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                  filterCategory === cat
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'text-zinc-500 hover:text-zinc-300'
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 overflow-y-auto max-h-[50vh]">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-zinc-500 uppercase tracking-wide">
                <th className="pb-3">Account</th>
                <th className="pb-3">Category</th>
                <th className="pb-3">Subdomain</th>
                <th className="pb-3 text-center">Tier</th>
                <th className="pb-3 text-right">Credibility</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {filtered.map((acc, i) => (
                <tr key={i} className="hover:bg-zinc-800/30">
                  <td className="py-3">
                    <div>
                      <p className="font-medium text-white">{acc.name}</p>
                      <p className="text-sm text-blue-400">{acc.handle}</p>
                    </div>
                  </td>
                  <td className="py-3">
                    <span className="px-2 py-1 bg-zinc-800 rounded text-xs text-zinc-400">
                      {acc.category}
                    </span>
                  </td>
                  <td className="py-3 text-sm text-zinc-400">{acc.subdomain}</td>
                  <td className="py-3 text-center">
                    <span className={clsx(
                      'px-2 py-1 rounded text-xs font-bold',
                      acc.tier === 1 && 'bg-emerald-500/20 text-emerald-400',
                      acc.tier === 2 && 'bg-blue-500/20 text-blue-400',
                      acc.tier === 3 && 'bg-zinc-700 text-zinc-400'
                    )}>
                      T{acc.tier}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <span className="font-mono text-sm text-white">{(acc.credibility * 100).toFixed(0)}%</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-zinc-800 bg-zinc-800/30">
          <p className="text-xs text-zinc-500">
            <strong>Tier 1:</strong> Primary sources, high accuracy, breaking news.{' '}
            <strong>Tier 2:</strong> Interpreters, analysts, domain experts.{' '}
            <strong>Tier 3:</strong> Aggregators, catch-all coverage.
          </p>
        </div>
      </div>
    </div>
  );
}

// ============ HELPERS ============
function getSeverityColor(severity: number): { bg: string; text: string } {
  if (severity >= 9) return { bg: 'bg-red-500/20', text: 'text-red-400' };
  if (severity >= 7) return { bg: 'bg-orange-500/20', text: 'text-orange-400' };
  if (severity >= 5) return { bg: 'bg-yellow-500/20', text: 'text-yellow-400' };
  if (severity >= 3) return { bg: 'bg-blue-500/20', text: 'text-blue-400' };
  return { bg: 'bg-zinc-500/20', text: 'text-zinc-400' };
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

function formatNumber(n: number): string {
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toString();
}
