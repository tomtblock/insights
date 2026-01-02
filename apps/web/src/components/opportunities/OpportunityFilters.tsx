'use client';

import { X } from 'lucide-react';

interface FilterState {
  venues: string[];
  domains: string[];
  minEdge: number;
  minScore: number;
  status: string;
  timeWindow: string;
  onlyMapped: boolean;
  onlyHealthy: boolean;
}

interface OpportunityFiltersProps {
  filters: FilterState;
  onChange: (filters: Partial<FilterState>) => void;
  onClose: () => void;
}

const VENUES = ['polymarket', 'kalshi', 'predictit', 'manifold', 'finfeed'];
const DOMAINS = ['politics', 'crypto', 'sports', 'economy', 'tech', 'science'];

export function OpportunityFilters({ filters, onChange, onClose }: OpportunityFiltersProps) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Filters</h3>
        <button onClick={onClose} className="btn btn-ghost btn-icon">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Min Edge */}
        <div>
          <label className="block text-sm text-zinc-400 mb-2">Min Edge (bps)</label>
          <input
            type="number"
            value={filters.minEdge}
            onChange={(e) => onChange({ minEdge: parseInt(e.target.value) || 0 })}
            className="input input-sm"
            min={0}
          />
        </div>

        {/* Min Score */}
        <div>
          <label className="block text-sm text-zinc-400 mb-2">Min Score</label>
          <input
            type="number"
            value={filters.minScore}
            onChange={(e) => onChange({ minScore: parseInt(e.target.value) || 0 })}
            className="input input-sm"
            min={0}
            max={100}
          />
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm text-zinc-400 mb-2">Status</label>
          <select
            value={filters.status}
            onChange={(e) => onChange({ status: e.target.value })}
            className="input input-sm"
          >
            <option value="open">Open</option>
            <option value="expired">Expired</option>
            <option value="all">All</option>
          </select>
        </div>

        {/* Time Window */}
        <div>
          <label className="block text-sm text-zinc-400 mb-2">Time Window</label>
          <select
            value={filters.timeWindow}
            onChange={(e) => onChange({ timeWindow: e.target.value })}
            className="input input-sm"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
        </div>

        {/* Venues */}
        <div className="md:col-span-2">
          <label className="block text-sm text-zinc-400 mb-2">Venues</label>
          <div className="flex flex-wrap gap-2">
            {VENUES.map((venue) => (
              <button
                key={venue}
                onClick={() => {
                  const current = filters.venues;
                  const updated = current.includes(venue)
                    ? current.filter((v) => v !== venue)
                    : [...current, venue];
                  onChange({ venues: updated });
                }}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  filters.venues.includes(venue)
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                {venue}
              </button>
            ))}
          </div>
        </div>

        {/* Toggles */}
        <div className="md:col-span-2 flex flex-wrap gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.onlyMapped}
              onChange={(e) => onChange({ onlyMapped: e.target.checked })}
              className="rounded bg-zinc-800 border-zinc-700 text-emerald-500 focus:ring-emerald-500/20"
            />
            <span className="text-sm text-zinc-300">Only mapped events</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.onlyHealthy}
              onChange={(e) => onChange({ onlyHealthy: e.target.checked })}
              className="rounded bg-zinc-800 border-zinc-700 text-emerald-500 focus:ring-emerald-500/20"
            />
            <span className="text-sm text-zinc-300">Only healthy venues</span>
          </label>
        </div>
      </div>
    </div>
  );
}

