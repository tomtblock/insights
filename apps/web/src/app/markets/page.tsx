'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, RefreshCw, ExternalLink, Filter, ArrowUpDown, ChevronLeft, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react';
import clsx from 'clsx';

interface Market {
  id: string;
  title: string;
  description: string;
  venue: string;
  category: string;
  status: 'active' | 'closed' | 'resolved';
  yesPrice: number;
  noPrice: number;
  volume24h: number;
  liquidity: number;
  change24h: number;
  endDate?: string;
}

const MOCK_MARKETS: Market[] = [
  {
    id: '1',
    title: 'Will Bitcoin reach $100,000 by end of 2025?',
    description: 'Market resolves YES if BTC/USD exceeds $100,000 on any major exchange before Jan 1, 2026',
    venue: 'polymarket',
    category: 'Crypto',
    status: 'active',
    yesPrice: 0.65,
    noPrice: 0.35,
    volume24h: 2_150_000,
    liquidity: 8_500_000,
    change24h: 2.3,
    endDate: '2025-12-31',
  },
  {
    id: '2',
    title: 'Will Trump win 2024 Presidential Election?',
    description: 'Market resolves based on official Electoral College results',
    venue: 'polymarket',
    category: 'Politics',
    status: 'active',
    yesPrice: 0.52,
    noPrice: 0.48,
    volume24h: 3_400_000,
    liquidity: 12_000_000,
    change24h: 0.8,
    endDate: '2024-11-05',
  },
  {
    id: '3',
    title: 'Fed rate cut in January 2025?',
    description: 'Will the Federal Reserve cut interest rates at January 2025 FOMC meeting?',
    venue: 'kalshi',
    category: 'Economy',
    status: 'active',
    yesPrice: 0.25,
    noPrice: 0.75,
    volume24h: 890_000,
    liquidity: 3_200_000,
    change24h: -1.2,
    endDate: '2025-01-29',
  },
  {
    id: '4',
    title: 'Will Ethereum reach $5,000 by March 2025?',
    description: 'Market resolves YES if ETH/USD exceeds $5,000 before April 1, 2025',
    venue: 'polymarket',
    category: 'Crypto',
    status: 'active',
    yesPrice: 0.42,
    noPrice: 0.58,
    volume24h: 1_200_000,
    liquidity: 4_800_000,
    change24h: 4.1,
    endDate: '2025-03-31',
  },
  {
    id: '5',
    title: 'Super Bowl 2025 - Will Kansas City Chiefs win?',
    description: 'Market resolves based on Super Bowl LIX outcome',
    venue: 'kalshi',
    category: 'Sports',
    status: 'active',
    yesPrice: 0.28,
    noPrice: 0.72,
    volume24h: 540_000,
    liquidity: 1_800_000,
    change24h: -0.5,
    endDate: '2025-02-09',
  },
  {
    id: '6',
    title: 'Will an AI system achieve AGI by end of 2025?',
    description: 'Resolves YES if a reputable AI organization claims AGI achievement',
    venue: 'predictit',
    category: 'Technology',
    status: 'active',
    yesPrice: 0.08,
    noPrice: 0.92,
    volume24h: 250_000,
    liquidity: 950_000,
    change24h: 1.5,
    endDate: '2025-12-31',
  },
  {
    id: '7',
    title: 'US CPI above 3% in January 2025?',
    description: 'Market resolves based on official BLS data release',
    venue: 'kalshi',
    category: 'Economy',
    status: 'active',
    yesPrice: 0.35,
    noPrice: 0.65,
    volume24h: 420_000,
    liquidity: 1_500_000,
    change24h: 0.3,
    endDate: '2025-02-12',
  },
  {
    id: '8',
    title: 'Apple stock above $200 by Q2 2025?',
    description: 'AAPL closing price above $200 before July 1, 2025',
    venue: 'polymarket',
    category: 'Stocks',
    status: 'active',
    yesPrice: 0.58,
    noPrice: 0.42,
    volume24h: 680_000,
    liquidity: 2_200_000,
    change24h: 1.8,
    endDate: '2025-06-30',
  },
];

const VENUES = ['All', 'Polymarket', 'Kalshi', 'PredictIt'];
const CATEGORIES = ['All', 'Crypto', 'Politics', 'Economy', 'Sports', 'Technology', 'Stocks'];

function formatUSD(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount.toFixed(0)}`;
}

export default function MarketsPage() {
  const [search, setSearch] = useState('');
  const [selectedVenue, setSelectedVenue] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortField, setSortField] = useState<'volume24h' | 'liquidity' | 'yesPrice'>('volume24h');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const filteredMarkets = MOCK_MARKETS
    .filter((m) => {
      if (selectedVenue !== 'All' && m.venue.toLowerCase() !== selectedVenue.toLowerCase()) return false;
      if (selectedCategory !== 'All' && m.category !== selectedCategory) return false;
      if (search) {
        const s = search.toLowerCase();
        return m.title.toLowerCase().includes(s) || m.description.toLowerCase().includes(s);
      }
      return true;
    })
    .sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      return sortDir === 'desc' ? bVal - aVal : aVal - bVal;
    });

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

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
              Markets
            </h1>
            <p className="text-zinc-500 mt-2">Browse prediction markets from all venues</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-sm">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-emerald-400 font-medium">Live</span>
              <span className="text-zinc-500">• {filteredMarkets.length} markets</span>
            </span>
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
            >
              <RefreshCw className={clsx('w-4 h-4', isRefreshing && 'animate-spin')} />
              Refresh
            </button>
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
              placeholder="Search markets..."
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-zinc-500" />
            <span className="text-sm text-zinc-500">Filters:</span>
          </div>

          <div className="flex gap-2">
            {VENUES.map((venue) => (
              <button
                key={venue}
                onClick={() => setSelectedVenue(venue)}
                className={clsx(
                  'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                  selectedVenue === venue
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-600'
                )}
              >
                {venue}
              </button>
            ))}
          </div>

          <div className="h-6 w-px bg-zinc-700" />

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Markets table */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/50">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                    Market
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                    Venue
                  </th>
                  <th 
                    className="px-6 py-4 text-right text-xs font-semibold text-zinc-500 uppercase tracking-wider cursor-pointer hover:text-zinc-300"
                    onClick={() => handleSort('yesPrice')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Yes / No
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th 
                    className="px-6 py-4 text-right text-xs font-semibold text-zinc-500 uppercase tracking-wider cursor-pointer hover:text-zinc-300"
                    onClick={() => handleSort('volume24h')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      24h Volume
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th 
                    className="px-6 py-4 text-right text-xs font-semibold text-zinc-500 uppercase tracking-wider cursor-pointer hover:text-zinc-300"
                    onClick={() => handleSort('liquidity')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Liquidity
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                    24h Change
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {filteredMarkets.map((market) => (
                  <tr 
                    key={market.id}
                    className="hover:bg-zinc-800/30 transition-colors cursor-pointer group"
                  >
                    <td className="px-6 py-5">
                      <div className="max-w-md">
                        <div className="flex items-start gap-3">
                          <div className="flex-1">
                            <p className="font-medium text-white group-hover:text-emerald-400 transition-colors line-clamp-1">
                              {market.title}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={clsx(
                                'px-2 py-0.5 rounded text-xs font-medium',
                                market.category === 'Crypto' && 'bg-amber-500/20 text-amber-400',
                                market.category === 'Politics' && 'bg-purple-500/20 text-purple-400',
                                market.category === 'Economy' && 'bg-blue-500/20 text-blue-400',
                                market.category === 'Sports' && 'bg-orange-500/20 text-orange-400',
                                market.category === 'Technology' && 'bg-cyan-500/20 text-cyan-400',
                                market.category === 'Stocks' && 'bg-emerald-500/20 text-emerald-400',
                              )}>
                                {market.category}
                              </span>
                              {market.endDate && (
                                <span className="text-xs text-zinc-500">
                                  Ends {new Date(market.endDate).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={clsx(
                        'px-2.5 py-1 rounded text-xs font-medium',
                        market.venue === 'polymarket' && 'bg-purple-500/20 text-purple-400',
                        market.venue === 'kalshi' && 'bg-blue-500/20 text-blue-400',
                        market.venue === 'predictit' && 'bg-orange-500/20 text-orange-400',
                      )}>
                        {market.venue.charAt(0).toUpperCase() + market.venue.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-3 font-mono">
                        <span className="text-emerald-400 font-medium">
                          {(market.yesPrice * 100).toFixed(0)}¢
                        </span>
                        <span className="text-zinc-600">/</span>
                        <span className="text-red-400 font-medium">
                          {(market.noPrice * 100).toFixed(0)}¢
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right font-mono text-zinc-300">
                      {formatUSD(market.volume24h)}
                    </td>
                    <td className="px-6 py-5 text-right font-mono text-zinc-300">
                      {formatUSD(market.liquidity)}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className={clsx(
                        'inline-flex items-center gap-1 font-mono font-medium',
                        market.change24h >= 0 ? 'text-emerald-400' : 'text-red-400'
                      )}>
                        {market.change24h >= 0 ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                        {market.change24h >= 0 ? '+' : ''}{market.change24h}%
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className={clsx(
                        'px-2.5 py-1 rounded text-xs font-medium',
                        market.status === 'active' && 'bg-emerald-500/20 text-emerald-400',
                        market.status === 'closed' && 'bg-zinc-500/20 text-zinc-400',
                        market.status === 'resolved' && 'bg-blue-500/20 text-blue-400',
                      )}>
                        {market.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-800 bg-zinc-900/30">
            <p className="text-sm text-zinc-500">
              Showing {filteredMarkets.length} of {MOCK_MARKETS.length} markets
            </p>
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-zinc-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg text-sm font-medium">1</span>
              <button className="p-2 hover:bg-zinc-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
