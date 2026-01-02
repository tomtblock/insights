'use client';

import clsx from 'clsx';
import Link from 'next/link';

interface VenueHealth {
  venue: string;
  status: 'green' | 'yellow' | 'red' | 'unknown';
  completeness: number;
  liveness: number;
  local_market_count?: number;
  error_message?: string;
}

interface VenueHealthGridProps {
  venues: VenueHealth[];
}

const venueLabels: Record<string, string> = {
  polymarket: 'Polymarket',
  kalshi: 'Kalshi',
  predictit: 'PredictIt',
  manifold: 'Manifold',
  metaculus: 'Metaculus',
  finfeed: 'FinFeed',
};

export function VenueHealthGrid({ venues }: VenueHealthGridProps) {
  if (venues.length === 0) {
    return (
      <div className="p-4 text-center text-zinc-500 text-sm">
        No venue data available
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      {venues.map((venue) => (
        <Link
          key={venue.venue}
          href={`/health?venue=${venue.venue}`}
          className="block p-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={clsx(
                'w-2 h-2 rounded-full',
                venue.status === 'green' ? 'bg-emerald-500 animate-pulse' :
                venue.status === 'yellow' ? 'bg-amber-500' :
                venue.status === 'red' ? 'bg-red-500' :
                'bg-zinc-500'
              )} />
              <span className="font-medium">{venueLabels[venue.venue] || venue.venue}</span>
            </div>
            <span className="text-xs text-zinc-500">
              {venue.local_market_count || 0} markets
            </span>
          </div>

          <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-zinc-500">Completeness</span>
              <div className="mt-1 h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                <div
                  className={clsx(
                    'h-full rounded-full transition-all',
                    venue.completeness >= 0.99 ? 'bg-emerald-500' :
                    venue.completeness >= 0.95 ? 'bg-amber-500' :
                    'bg-red-500'
                  )}
                  style={{ width: `${venue.completeness * 100}%` }}
                />
              </div>
            </div>
            <div>
              <span className="text-zinc-500">Liveness</span>
              <div className="mt-1 h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                <div
                  className={clsx(
                    'h-full rounded-full transition-all',
                    venue.liveness >= 0.99 ? 'bg-emerald-500' :
                    venue.liveness >= 0.95 ? 'bg-amber-500' :
                    'bg-red-500'
                  )}
                  style={{ width: `${venue.liveness * 100}%` }}
                />
              </div>
            </div>
          </div>

          {venue.error_message && (
            <p className="mt-2 text-xs text-red-400 truncate">
              {venue.error_message}
            </p>
          )}
        </Link>
      ))}
    </div>
  );
}

