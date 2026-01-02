'use client';

import { useState } from 'react';
import { Search, RefreshCw, TrendingUp, TrendingDown, ExternalLink, Filter, ArrowUpDown } from 'lucide-react';
import clsx from 'clsx';

interface Stock {
  symbol: string;
  name: string;
  exchange: string;
  price: number;
  change: number;
  changePercent: number;
  volume: string;
  marketCap: string;
  sector: string;
  linkedMarkets: number;
}

const MOCK_STOCKS: Stock[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ', price: 189.45, change: 2.34, changePercent: 1.25, volume: '$4.2B', marketCap: '$2.98T', sector: 'Technology', linkedMarkets: 5 },
  { symbol: 'MSFT', name: 'Microsoft Corporation', exchange: 'NASDAQ', price: 378.91, change: -1.23, changePercent: -0.32, volume: '$2.8B', marketCap: '$2.81T', sector: 'Technology', linkedMarkets: 4 },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', exchange: 'NASDAQ', price: 141.80, change: 3.45, changePercent: 2.50, volume: '$1.9B', marketCap: '$1.78T', sector: 'Technology', linkedMarkets: 3 },
  { symbol: 'TSLA', name: 'Tesla, Inc.', exchange: 'NASDAQ', price: 248.50, change: 8.20, changePercent: 3.41, volume: '$5.1B', marketCap: '$791B', sector: 'Automotive', linkedMarkets: 8 },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', exchange: 'NASDAQ', price: 495.22, change: 12.45, changePercent: 2.58, volume: '$3.4B', marketCap: '$1.22T', sector: 'Technology', linkedMarkets: 6 },
  { symbol: 'META', name: 'Meta Platforms, Inc.', exchange: 'NASDAQ', price: 353.96, change: -2.18, changePercent: -0.61, volume: '$2.1B', marketCap: '$907B', sector: 'Technology', linkedMarkets: 2 },
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.', exchange: 'NYSE', price: 170.23, change: 0.89, changePercent: 0.53, volume: '$1.2B', marketCap: '$489B', sector: 'Finance', linkedMarkets: 3 },
  { symbol: 'V', name: 'Visa Inc.', exchange: 'NYSE', price: 260.45, change: 1.56, changePercent: 0.60, volume: '$890M', marketCap: '$534B', sector: 'Finance', linkedMarkets: 1 },
];

const SECTORS = ['All', 'Technology', 'Finance', 'Automotive', 'Healthcare', 'Energy'];
const EXCHANGES = ['All', 'NASDAQ', 'NYSE'];

export default function StocksPage() {
  const [search, setSearch] = useState('');
  const [selectedSector, setSelectedSector] = useState('All');
  const [selectedExchange, setSelectedExchange] = useState('All');
  const [sortBy, setSortBy] = useState<'symbol' | 'price' | 'changePercent' | 'linkedMarkets'>('symbol');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const filteredStocks = MOCK_STOCKS
    .filter((s) => {
      if (selectedSector !== 'All' && s.sector !== selectedSector) return false;
      if (selectedExchange !== 'All' && s.exchange !== selectedExchange) return false;
      if (search) {
        return s.symbol.toLowerCase().includes(search.toLowerCase()) ||
               s.name.toLowerCase().includes(search.toLowerCase());
      }
      return true;
    })
    .sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortDir === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDir('asc');
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  return (
    <div className="min-h-screen bg-zinc-950 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Stocks</h1>
            <p className="text-zinc-400 mt-1">Market research and context layer for prediction markets</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-sm text-emerald-400 font-medium">Live Data</span>
            </div>
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
          <div className="relative flex-1 min-w-[280px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ticker or name..."
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-zinc-500" />
          </div>

          <select
            value={selectedExchange}
            onChange={(e) => setSelectedExchange(e.target.value)}
            className="px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm"
          >
            {EXCHANGES.map((ex) => (
              <option key={ex} value={ex}>{ex}</option>
            ))}
          </select>

          <select
            value={selectedSector}
            onChange={(e) => setSelectedSector(e.target.value)}
            className="px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm"
          >
            {SECTORS.map((sector) => (
              <option key={sector} value={sector}>{sector}</option>
            ))}
          </select>
        </div>

        {/* Stocks Table */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/50">
                  <th 
                    className="px-6 py-4 text-left text-xs font-semibold text-zinc-500 uppercase cursor-pointer hover:text-zinc-300"
                    onClick={() => handleSort('symbol')}
                  >
                    <div className="flex items-center gap-1">
                      Symbol <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-500 uppercase">
                    Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-500 uppercase">
                    Exchange
                  </th>
                  <th 
                    className="px-6 py-4 text-right text-xs font-semibold text-zinc-500 uppercase cursor-pointer hover:text-zinc-300"
                    onClick={() => handleSort('price')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Price <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th 
                    className="px-6 py-4 text-right text-xs font-semibold text-zinc-500 uppercase cursor-pointer hover:text-zinc-300"
                    onClick={() => handleSort('changePercent')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Change <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-zinc-500 uppercase">
                    Volume
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-500 uppercase">
                    Sector
                  </th>
                  <th 
                    className="px-6 py-4 text-right text-xs font-semibold text-zinc-500 uppercase cursor-pointer hover:text-zinc-300"
                    onClick={() => handleSort('linkedMarkets')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Markets <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {filteredStocks.map((stock) => (
                  <tr key={stock.symbol} className="hover:bg-zinc-800/50 transition-colors cursor-pointer">
                    <td className="px-6 py-4">
                      <span className="font-bold text-cyan-400">{stock.symbol}</span>
                    </td>
                    <td className="px-6 py-4 text-white">{stock.name}</td>
                    <td className="px-6 py-4">
                      <span className={clsx(
                        'px-2 py-0.5 rounded text-xs font-medium',
                        stock.exchange === 'NASDAQ' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'
                      )}>
                        {stock.exchange}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-white">
                      ${stock.price.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className={clsx(
                        'inline-flex items-center gap-1 font-mono font-medium',
                        stock.changePercent >= 0 ? 'text-emerald-400' : 'text-red-400'
                      )}>
                        {stock.changePercent >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-zinc-400">{stock.volume}</td>
                    <td className="px-6 py-4">
                      <span className="text-zinc-400">{stock.sector}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {stock.linkedMarkets > 0 ? (
                        <span className="text-emerald-400 font-medium">{stock.linkedMarkets}</span>
                      ) : (
                        <span className="text-zinc-600">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredStocks.length === 0 && (
          <div className="text-center py-16 text-zinc-500">
            No stocks found matching your filters.
          </div>
        )}
      </div>
    </div>
  );
}
