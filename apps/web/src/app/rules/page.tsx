'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Plus, Zap, RefreshCw, Edit, Trash2, Play, Pause, 
  AlertCircle, Search, Clock, Target, TrendingUp
} from 'lucide-react';
import clsx from 'clsx';

interface Rule {
  id: string;
  name: string;
  description: string;
  templateType: string;
  status: 'active' | 'paused' | 'disabled';
  triggerCount: number;
  lastTriggered: string | null;
  createdAt: string;
  conditions: string;
}

const MOCK_RULES: Rule[] = [
  {
    id: '1',
    name: 'Cross-Venue BTC Arbitrage',
    description: 'Detects price discrepancies for Bitcoin markets across Polymarket and Kalshi',
    templateType: 'cross_venue_arb',
    status: 'active',
    triggerCount: 47,
    lastTriggered: '2 hours ago',
    createdAt: '2024-12-15',
    conditions: 'Edge > 20 bps, Depth > $5,000',
  },
  {
    id: '2',
    name: 'Volume Spike Alert',
    description: 'Alerts when 24h volume exceeds 3x the 7-day average',
    templateType: 'volume_spike',
    status: 'active',
    triggerCount: 12,
    lastTriggered: '5 hours ago',
    createdAt: '2024-12-20',
    conditions: 'Volume > 3x 7d avg',
  },
  {
    id: '3',
    name: 'Fed Rate Market Monitor',
    description: 'Monitors all Federal Reserve rate decision markets',
    templateType: 'event_window',
    status: 'active',
    triggerCount: 8,
    lastTriggered: '1 day ago',
    createdAt: '2024-12-22',
    conditions: 'Category = Economy, Near resolution',
  },
  {
    id: '4',
    name: 'Price Momentum',
    description: 'Detects sustained price movements over 5% in 24 hours',
    templateType: 'price_momentum',
    status: 'paused',
    triggerCount: 23,
    lastTriggered: '3 days ago',
    createdAt: '2024-12-10',
    conditions: 'Change > 5% in 24h',
  },
  {
    id: '5',
    name: 'Low Liquidity Warning',
    description: 'Warns when market depth falls below threshold',
    templateType: 'market_quality',
    status: 'active',
    triggerCount: 5,
    lastTriggered: '12 hours ago',
    createdAt: '2024-12-25',
    conditions: 'Depth < $1,000',
  },
];

const TEMPLATE_TYPES: Record<string, { label: string; color: string }> = {
  cross_venue_arb: { label: 'Cross-Venue Arb', color: 'bg-emerald-500/20 text-emerald-400' },
  volume_spike: { label: 'Volume Spike', color: 'bg-blue-500/20 text-blue-400' },
  event_window: { label: 'Event Window', color: 'bg-purple-500/20 text-purple-400' },
  price_momentum: { label: 'Price Momentum', color: 'bg-amber-500/20 text-amber-400' },
  market_quality: { label: 'Market Quality', color: 'bg-orange-500/20 text-orange-400' },
};

export default function RulesPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const filteredRules = MOCK_RULES.filter((r) => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (search) {
      return r.name.toLowerCase().includes(search.toLowerCase()) ||
             r.description.toLowerCase().includes(search.toLowerCase());
    }
    return true;
  });

  const activeCount = MOCK_RULES.filter((r) => r.status === 'active').length;
  const totalTriggers = MOCK_RULES.reduce((acc, r) => acc + r.triggerCount, 0);

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
            <h1 className="text-3xl font-bold text-white">Rules</h1>
            <p className="text-zinc-400 mt-1">Manage automated trading and alert rules</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <Link
              href="/rules/new"
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Rule
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <Zap className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{activeCount}</p>
                <p className="text-sm text-zinc-500">Active Rules</p>
              </div>
            </div>
          </div>
          <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <TrendingUp className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{totalTriggers}</p>
                <p className="text-sm text-zinc-500">Total Triggers</p>
              </div>
            </div>
          </div>
          <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Target className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{MOCK_RULES.length}</p>
                <p className="text-sm text-zinc-500">Total Rules</p>
              </div>
            </div>
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
              placeholder="Search rules..."
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex gap-2">
            {['all', 'active', 'paused'].map((status) => (
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
        </div>

        {/* Rules List */}
        <div className="space-y-4">
          {filteredRules.map((rule) => (
            <RuleCard key={rule.id} rule={rule} />
          ))}
        </div>

        {filteredRules.length === 0 && (
          <div className="text-center py-16 text-zinc-500">
            No rules found. Create your first rule to get started.
          </div>
        )}
      </div>
    </div>
  );
}

function RuleCard({ rule }: { rule: Rule }) {
  const templateConfig = TEMPLATE_TYPES[rule.templateType] || { label: rule.templateType, color: 'bg-zinc-700 text-zinc-400' };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-700 transition-colors">
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className={clsx(
                'px-2 py-0.5 rounded text-xs font-medium uppercase',
                rule.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' :
                rule.status === 'paused' ? 'bg-amber-500/20 text-amber-400' :
                'bg-zinc-500/20 text-zinc-400'
              )}>
                {rule.status}
              </span>
              <span className={clsx('px-2 py-0.5 rounded text-xs font-medium', templateConfig.color)}>
                {templateConfig.label}
              </span>
            </div>

            <h3 className="text-lg font-semibold text-white mb-1">{rule.name}</h3>
            <p className="text-sm text-zinc-400 mb-3">{rule.description}</p>

            <div className="flex items-center gap-4 text-sm text-zinc-500">
              <span className="flex items-center gap-1">
                <Target className="w-3.5 h-3.5" />
                {rule.conditions}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Last: {rule.lastTriggered || 'Never'}
              </span>
            </div>
          </div>

          <div className="text-right">
            <p className="text-2xl font-bold text-white">{rule.triggerCount}</p>
            <p className="text-xs text-zinc-500">triggers</p>
          </div>
        </div>
      </div>

      <div className="px-5 py-3 bg-zinc-800/50 border-t border-zinc-800 flex items-center justify-between">
        <span className="text-xs text-zinc-500">Created {new Date(rule.createdAt).toLocaleDateString()}</span>
        <div className="flex items-center gap-2">
          <button className={clsx(
            'p-1.5 rounded-lg transition-colors',
            rule.status === 'active' ? 'text-amber-400 hover:bg-amber-500/20' : 'text-emerald-400 hover:bg-emerald-500/20'
          )}>
            {rule.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <button className="p-1.5 rounded-lg text-blue-400 hover:bg-blue-500/20 transition-colors">
            <Edit className="w-4 h-4" />
          </button>
          <button className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/20 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
