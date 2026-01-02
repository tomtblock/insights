'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X, TrendingUp, Target, Calendar, BarChart3, Compass } from 'lucide-react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface SearchResult {
  type: 'market' | 'event' | 'stock' | 'opportunity' | 'topic';
  id: string;
  title: string;
  subtitle?: string;
  href: string;
}

interface GlobalSearchProps {
  onClose: () => void;
}

export function GlobalSearch({ onClose }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' && results[selectedIndex]) {
        router.push(results[selectedIndex].href);
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [results, selectedIndex, router, onClose]);

  // Search effect
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const search = async () => {
      setIsSearching(true);
      try {
        // Search across multiple endpoints in parallel
        const [marketsRes, eventsRes, stocksRes] = await Promise.all([
          fetch(`${API_URL}/api/markets?q=${encodeURIComponent(query)}&page_size=5`),
          fetch(`${API_URL}/api/events?q=${encodeURIComponent(query)}&page_size=5`),
          fetch(`${API_URL}/api/stocks/symbols?q=${encodeURIComponent(query)}&page_size=5`),
        ]);

        const [marketsData, eventsData, stocksData] = await Promise.all([
          marketsRes.json(),
          eventsRes.json(),
          stocksRes.json(),
        ]);

        const combinedResults: SearchResult[] = [];

        // Add markets
        if (marketsData.data) {
          combinedResults.push(...marketsData.data.slice(0, 5).map((m: any) => ({
            type: 'market' as const,
            id: `${m.venue}-${m.outcome_id_native}`,
            title: m.title,
            subtitle: m.venue,
            href: `/markets/${m.venue}/${m.outcome_id_native}`,
          })));
        }

        // Add events
        if (eventsData.data) {
          combinedResults.push(...eventsData.data.slice(0, 5).map((e: any) => ({
            type: 'event' as const,
            id: e.event_id,
            title: e.title,
            subtitle: e.domain,
            href: `/events/${e.event_id}`,
          })));
        }

        // Add stocks
        if (stocksData.data) {
          combinedResults.push(...stocksData.data.slice(0, 5).map((s: any) => ({
            type: 'stock' as const,
            id: `${s.exchange_id}-${s.symbol_id}`,
            title: `${s.symbol_id} - ${s.name}`,
            subtitle: s.exchange_id,
            href: `/stocks/${s.exchange_id}/${s.symbol_id}`,
          })));
        }

        setResults(combinedResults);
        setSelectedIndex(0);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsSearching(false);
      }
    };

    const debounce = setTimeout(search, 200);
    return () => clearTimeout(debounce);
  }, [query]);

  const getIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'market': return Target;
      case 'event': return Calendar;
      case 'stock': return BarChart3;
      case 'opportunity': return TrendingUp;
      case 'topic': return Compass;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Search modal */}
      <div className="relative w-full max-w-2xl mx-4 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden">
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800">
          <Search className="w-5 h-5 text-zinc-500" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search markets, events, stocks, topics..."
            className="flex-1 bg-transparent text-lg outline-none placeholder-zinc-500"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 hover:bg-zinc-800 rounded"
            >
              <X className="w-4 h-4 text-zinc-500" />
            </button>
          )}
          <kbd className="px-2 py-1 bg-zinc-800 rounded text-xs text-zinc-500">ESC</kbd>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="max-h-96 overflow-y-auto">
            {results.map((result, index) => {
              const Icon = getIcon(result.type);
              return (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => {
                    router.push(result.href);
                    onClose();
                  }}
                  className={clsx(
                    'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
                    index === selectedIndex ? 'bg-zinc-800' : 'hover:bg-zinc-800/50'
                  )}
                >
                  <div className="p-2 bg-zinc-700 rounded-lg">
                    <Icon className="w-4 h-4 text-zinc-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{result.title}</p>
                    {result.subtitle && (
                      <p className="text-sm text-zinc-500">{result.subtitle}</p>
                    )}
                  </div>
                  <span className="badge badge-gray">{result.type}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Empty state */}
        {query.length >= 2 && !isSearching && results.length === 0 && (
          <div className="p-8 text-center text-zinc-500">
            No results found for "{query}"
          </div>
        )}

        {/* Loading */}
        {isSearching && (
          <div className="p-4 text-center text-zinc-500">
            Searching...
          </div>
        )}

        {/* Hints */}
        {query.length < 2 && (
          <div className="p-4 text-sm text-zinc-500">
            <p>Type at least 2 characters to search across:</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="badge badge-gray">Markets</span>
              <span className="badge badge-gray">Events</span>
              <span className="badge badge-gray">Stocks</span>
              <span className="badge badge-gray">Topics</span>
              <span className="badge badge-gray">Opportunities</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

