'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, RefreshCw, Calendar, ExternalLink, ChevronRight, Tag, Clock } from 'lucide-react';
import clsx from 'clsx';

interface Event {
  id: string;
  title: string;
  description: string;
  category: string;
  status: 'upcoming' | 'live' | 'concluded';
  eventDate: string;
  linkedMarkets: number;
  source: string;
  confidence: number;
}

const MOCK_EVENTS: Event[] = [
  {
    id: '1',
    title: 'Federal Reserve FOMC Meeting - January 2025',
    description: 'Federal Reserve will announce interest rate decision and updated economic projections.',
    category: 'Economy',
    status: 'upcoming',
    eventDate: '2025-01-29',
    linkedMarkets: 8,
    source: 'Federal Reserve',
    confidence: 98,
  },
  {
    id: '2',
    title: 'Super Bowl LIX',
    description: 'NFL Championship game between conference winners.',
    category: 'Sports',
    status: 'upcoming',
    eventDate: '2025-02-09',
    linkedMarkets: 12,
    source: 'NFL',
    confidence: 100,
  },
  {
    id: '3',
    title: 'US CPI Data Release - January 2025',
    description: 'Bureau of Labor Statistics releases Consumer Price Index data.',
    category: 'Economy',
    status: 'upcoming',
    eventDate: '2025-02-12',
    linkedMarkets: 5,
    source: 'BLS',
    confidence: 99,
  },
  {
    id: '4',
    title: 'Bitcoin Halving 2024',
    description: 'Bitcoin block reward halves from 6.25 to 3.125 BTC.',
    category: 'Crypto',
    status: 'concluded',
    eventDate: '2024-04-20',
    linkedMarkets: 15,
    source: 'Bitcoin Network',
    confidence: 100,
  },
  {
    id: '5',
    title: 'US Presidential Election 2024',
    description: 'US citizens vote for the next President of the United States.',
    category: 'Politics',
    status: 'concluded',
    eventDate: '2024-11-05',
    linkedMarkets: 25,
    source: 'Federal Election Commission',
    confidence: 100,
  },
  {
    id: '6',
    title: 'Ethereum Dencun Upgrade',
    description: 'Major Ethereum network upgrade introducing proto-danksharding.',
    category: 'Crypto',
    status: 'concluded',
    eventDate: '2024-03-13',
    linkedMarkets: 6,
    source: 'Ethereum Foundation',
    confidence: 100,
  },
];

const CATEGORIES = ['All', 'Economy', 'Politics', 'Crypto', 'Sports', 'Technology'];
const STATUSES = ['All', 'Upcoming', 'Live', 'Concluded'];

export default function EventsPage() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const filteredEvents = MOCK_EVENTS.filter((e) => {
    if (selectedCategory !== 'All' && e.category !== selectedCategory) return false;
    if (selectedStatus !== 'All' && e.status !== selectedStatus.toLowerCase()) return false;
    if (search) {
      return e.title.toLowerCase().includes(search.toLowerCase()) ||
             e.description.toLowerCase().includes(search.toLowerCase());
    }
    return true;
  });

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
            <h1 className="text-3xl font-bold text-white">Events</h1>
            <p className="text-zinc-400 mt-1">Track canonical events linked to prediction markets</p>
          </div>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
          <div className="relative flex-1 min-w-[280px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search events..."
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
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
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-600'
                )}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>

        {filteredEvents.length === 0 && (
          <div className="text-center py-16 text-zinc-500">
            No events found matching your filters.
          </div>
        )}
      </div>
    </div>
  );
}

function EventCard({ event }: { event: Event }) {
  const statusColors = {
    upcoming: 'bg-blue-500/20 text-blue-400',
    live: 'bg-emerald-500/20 text-emerald-400',
    concluded: 'bg-zinc-500/20 text-zinc-400',
  };

  const categoryColors: Record<string, string> = {
    'Economy': 'bg-blue-500/20 text-blue-400',
    'Politics': 'bg-purple-500/20 text-purple-400',
    'Crypto': 'bg-amber-500/20 text-amber-400',
    'Sports': 'bg-orange-500/20 text-orange-400',
    'Technology': 'bg-cyan-500/20 text-cyan-400',
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-700 transition-colors">
      <div className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className={clsx('px-2 py-0.5 rounded text-xs font-medium uppercase', statusColors[event.status])}>
            {event.status}
          </span>
          <span className={clsx('px-2 py-0.5 rounded text-xs font-medium', categoryColors[event.category] || 'bg-zinc-700 text-zinc-400')}>
            {event.category}
          </span>
        </div>

        <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2">{event.title}</h3>
        <p className="text-sm text-zinc-400 mb-4 line-clamp-2">{event.description}</p>

        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-zinc-500 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              Event Date
            </span>
            <span className="text-white font-medium">{new Date(event.eventDate).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-zinc-500 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5" />
              Linked Markets
            </span>
            <span className="text-emerald-400 font-medium">{event.linkedMarkets}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-zinc-500">Source</span>
            <span className="text-zinc-300">{event.source}</span>
          </div>
        </div>
      </div>

      <div className="px-5 py-3 bg-zinc-800/50 border-t border-zinc-800">
        <Link href={`/events/${event.id}`} className="text-emerald-400 hover:text-emerald-300 text-sm flex items-center gap-1">
          View details <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
