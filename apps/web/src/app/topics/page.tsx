'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Compass, RefreshCw, Search, Plus, CheckCircle, XCircle, 
  Clock, Sparkles, ExternalLink, Tag, AlertCircle
} from 'lucide-react';
import clsx from 'clsx';

interface Topic {
  id: string;
  title: string;
  description: string;
  category: string;
  status: 'proposed' | 'approved' | 'rejected';
  source: string;
  linkedMarkets: number;
  signals: number;
  createdAt: string;
  confidence: number;
}

const MOCK_TOPICS: Topic[] = [
  {
    id: '1',
    title: 'Federal Reserve Policy Decisions',
    description: 'Monitoring Fed FOMC meetings, rate decisions, and economic projections',
    category: 'Economy',
    status: 'approved',
    source: 'AI Scanner',
    linkedMarkets: 12,
    signals: 45,
    createdAt: '2024-12-20',
    confidence: 95,
  },
  {
    id: '2',
    title: 'Bitcoin Price Milestones',
    description: 'Tracking Bitcoin reaching significant price levels ($100k, $150k, etc.)',
    category: 'Crypto',
    status: 'approved',
    source: 'AI Scanner',
    linkedMarkets: 8,
    signals: 127,
    createdAt: '2024-12-18',
    confidence: 92,
  },
  {
    id: '3',
    title: '2024 US Election Outcomes',
    description: 'Presidential and congressional election results and related events',
    category: 'Politics',
    status: 'approved',
    source: 'Manual',
    linkedMarkets: 25,
    signals: 312,
    createdAt: '2024-10-15',
    confidence: 98,
  },
  {
    id: '4',
    title: 'Ethereum Network Upgrades',
    description: 'Major Ethereum protocol changes and their market implications',
    category: 'Crypto',
    status: 'proposed',
    source: 'AI Scanner',
    linkedMarkets: 5,
    signals: 23,
    createdAt: '2024-12-28',
    confidence: 78,
  },
  {
    id: '5',
    title: 'AI Model Capabilities',
    description: 'Tracking AGI claims and AI benchmark achievements',
    category: 'Technology',
    status: 'proposed',
    source: 'AI Scanner',
    linkedMarkets: 3,
    signals: 15,
    createdAt: '2024-12-29',
    confidence: 65,
  },
  {
    id: '6',
    title: 'Climate Event Predictions',
    description: 'Weather patterns and climate-related market events',
    category: 'Environment',
    status: 'rejected',
    source: 'AI Scanner',
    linkedMarkets: 0,
    signals: 0,
    createdAt: '2024-12-25',
    confidence: 45,
  },
];

const CATEGORIES = ['All', 'Economy', 'Crypto', 'Politics', 'Technology', 'Sports', 'Environment'];
const STATUSES = ['All', 'Proposed', 'Approved', 'Rejected'];

export default function TopicsPage() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  const filteredTopics = MOCK_TOPICS.filter((t) => {
    if (selectedCategory !== 'All' && t.category !== selectedCategory) return false;
    if (selectedStatus !== 'All' && t.status !== selectedStatus.toLowerCase()) return false;
    if (search) {
      return t.title.toLowerCase().includes(search.toLowerCase()) ||
             t.description.toLowerCase().includes(search.toLowerCase());
    }
    return true;
  });

  const proposedCount = MOCK_TOPICS.filter((t) => t.status === 'proposed').length;
  const approvedCount = MOCK_TOPICS.filter((t) => t.status === 'approved').length;

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleScan = () => {
    setIsScanning(true);
    setTimeout(() => setIsScanning(false), 3000);
  };

  return (
    <div className="min-h-screen bg-zinc-950 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-white">Topics</h1>
              <span className="px-2.5 py-1 bg-purple-500/20 text-purple-400 text-xs font-bold rounded-lg uppercase">
                AI Powered
              </span>
            </div>
            <p className="text-zinc-400 mt-1">AI-discovered topics linked to prediction markets</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={handleScan}
              disabled={isScanning}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              <Sparkles className={`w-4 h-4 ${isScanning ? 'animate-pulse' : ''}`} />
              {isScanning ? 'Scanning...' : 'Scan Markets'}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <Clock className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{proposedCount}</p>
                <p className="text-sm text-zinc-500">Pending Review</p>
              </div>
            </div>
          </div>
          <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{approvedCount}</p>
                <p className="text-sm text-zinc-500">Approved Topics</p>
              </div>
            </div>
          </div>
          <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Sparkles className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{MOCK_TOPICS.reduce((acc, t) => acc + t.signals, 0)}</p>
                <p className="text-sm text-zinc-500">Total Signals</p>
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
              placeholder="Search topics..."
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm focus:outline-none focus:border-purple-500"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <div className="flex gap-2">
            {STATUSES.map((status) => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={clsx(
                  'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                  selectedStatus === status
                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                    : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-600'
                )}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Topics List */}
        <div className="space-y-4">
          {filteredTopics.map((topic) => (
            <TopicCard key={topic.id} topic={topic} />
          ))}
        </div>

        {filteredTopics.length === 0 && (
          <div className="text-center py-16 text-zinc-500">
            No topics found. Run the AI scanner to discover new topics.
          </div>
        )}
      </div>
    </div>
  );
}

function TopicCard({ topic }: { topic: Topic }) {
  const statusConfig = {
    proposed: { color: 'bg-amber-500/20 text-amber-400', icon: Clock },
    approved: { color: 'bg-emerald-500/20 text-emerald-400', icon: CheckCircle },
    rejected: { color: 'bg-red-500/20 text-red-400', icon: XCircle },
  };

  const categoryColors: Record<string, string> = {
    'Economy': 'bg-blue-500/20 text-blue-400',
    'Crypto': 'bg-amber-500/20 text-amber-400',
    'Politics': 'bg-purple-500/20 text-purple-400',
    'Technology': 'bg-cyan-500/20 text-cyan-400',
    'Sports': 'bg-orange-500/20 text-orange-400',
    'Environment': 'bg-emerald-500/20 text-emerald-400',
  };

  const StatusIcon = statusConfig[topic.status].icon;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-700 transition-colors">
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className={clsx('flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium', statusConfig[topic.status].color)}>
                <StatusIcon className="w-3 h-3" />
                {topic.status}
              </span>
              <span className={clsx('px-2 py-0.5 rounded text-xs font-medium', categoryColors[topic.category] || 'bg-zinc-700 text-zinc-400')}>
                {topic.category}
              </span>
              {topic.source === 'AI Scanner' && (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-purple-500/10 text-purple-400 text-xs rounded">
                  <Sparkles className="w-3 h-3" />
                  AI
                </span>
              )}
            </div>

            <h3 className="text-lg font-semibold text-white mb-1">{topic.title}</h3>
            <p className="text-sm text-zinc-400 mb-3">{topic.description}</p>

            <div className="flex items-center gap-4 text-sm text-zinc-500">
              <span className="flex items-center gap-1">
                <Tag className="w-3.5 h-3.5" />
                {topic.linkedMarkets} markets
              </span>
              <span className="flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {topic.signals} signals
              </span>
              <span>Confidence: {topic.confidence}%</span>
            </div>
          </div>

          {topic.status === 'proposed' && (
            <div className="flex gap-2">
              <button className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded-lg text-sm font-medium transition-colors">
                Approve
              </button>
              <button className="px-3 py-1.5 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg text-sm font-medium transition-colors">
                Reject
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="px-5 py-3 bg-zinc-800/50 border-t border-zinc-800 flex items-center justify-between">
        <span className="text-xs text-zinc-500">Created {new Date(topic.createdAt).toLocaleDateString()}</span>
        <Link href={`/topics/${topic.id}`} className="text-purple-400 hover:text-purple-300 text-sm flex items-center gap-1">
          View details <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
