'use client';

import { ArrowRight, Clock, AlertTriangle } from 'lucide-react';
import clsx from 'clsx';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

interface Opportunity {
  opportunity_id: string;
  canonical_event_label?: string;
  buy_venue: string;
  sell_venue: string;
  confidence_score: number;
  edge_profile: {
    best_q: number | null;
    q_buckets: Array<{
      q: number;
      net_edge: number;
      executable: boolean;
    }>;
  };
  flags: {
    stale?: boolean;
    near_resolution?: boolean;
    high_ambiguity?: boolean;
  };
  last_seen_ts: string;
}

interface OpportunityFeedProps {
  opportunities: Opportunity[];
}

export function OpportunityFeed({ opportunities }: OpportunityFeedProps) {
  if (opportunities.length === 0) {
    return (
      <div className="p-8 text-center text-zinc-500">
        <p>No opportunities detected</p>
        <p className="text-sm mt-1">Opportunities will appear here when cross-venue edges are found</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-zinc-800">
      {opportunities.map((opp) => {
        const bestBucket = opp.edge_profile.q_buckets.find(
          (b) => b.q === opp.edge_profile.best_q
        );
        const edgeBps = bestBucket ? Math.round(bestBucket.net_edge * 10000) : 0;
        const hasWarnings = opp.flags?.stale || opp.flags?.near_resolution || opp.flags?.high_ambiguity;

        return (
          <Link
            key={opp.opportunity_id}
            href={`/opportunities/${opp.opportunity_id}`}
            className="block p-4 hover:bg-zinc-800/30 transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">
                  {opp.canonical_event_label || 'Unmapped Event'}
                </p>
                <div className="flex items-center gap-2 mt-1 text-sm text-zinc-400">
                  <span className="badge badge-blue">{opp.buy_venue}</span>
                  <ArrowRight className="w-3 h-3" />
                  <span className="badge badge-green">{opp.sell_venue}</span>
                  {hasWarnings && (
                    <AlertTriangle className="w-4 h-4 text-amber-400 ml-2" />
                  )}
                </div>
              </div>

              <div className="text-right">
                <div className={clsx(
                  'text-lg font-bold tabular-nums',
                  edgeBps >= 20 ? 'text-emerald-400' :
                  edgeBps >= 10 ? 'text-emerald-500' :
                  'text-zinc-400'
                )}>
                  +{edgeBps} bps
                </div>
                <div className="flex items-center gap-1 text-xs text-zinc-500 mt-1">
                  <Clock className="w-3 h-3" />
                  {formatDistanceToNow(new Date(opp.last_seen_ts), { addSuffix: true })}
                </div>
              </div>
            </div>

            {/* Edge curve mini preview */}
            <div className="mt-3 flex items-center gap-1">
              {opp.edge_profile.q_buckets.slice(0, 5).map((bucket, i) => (
                <div
                  key={bucket.q}
                  className={clsx(
                    'h-4 rounded-sm flex-1',
                    bucket.executable
                      ? bucket.net_edge >= 0.002 ? 'bg-emerald-500'
                        : bucket.net_edge >= 0.001 ? 'bg-emerald-600'
                        : 'bg-emerald-700'
                      : 'bg-zinc-700'
                  )}
                  title={`Q${bucket.q}: ${Math.round(bucket.net_edge * 10000)} bps`}
                />
              ))}
            </div>

            <div className="flex items-center justify-between mt-2 text-xs text-zinc-500">
              <span>Score: {opp.confidence_score}/100</span>
              <span>Best Q: ${opp.edge_profile.best_q || 'N/A'}</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

