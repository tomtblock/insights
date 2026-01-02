'use client';

import { ArrowRight, AlertTriangle, Clock, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import clsx from 'clsx';

interface Opportunity {
  opportunity_id: string;
  canonical_event_label?: string;
  buy_venue: string;
  sell_venue: string;
  buy_outcome_id: string;
  sell_outcome_id: string;
  confidence_score: number;
  edge_profile: {
    best_q: number | null;
    max_executable_size: number;
    q_buckets: Array<{
      q: number;
      buy_price: number;
      sell_price: number;
      net_edge: number;
      executable: boolean;
    }>;
  };
  flags: {
    stale?: boolean;
    near_resolution?: boolean;
    high_ambiguity?: boolean;
    wide_spread?: boolean;
    low_depth?: boolean;
  };
  last_seen_ts: string;
  created_ts: string;
}

interface OpportunityTableProps {
  opportunities: Opportunity[];
  onSelect: (id: string) => void;
}

const venueColors: Record<string, string> = {
  polymarket: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  kalshi: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  predictit: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  finfeed: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
};

export function OpportunityTable({ opportunities, onSelect }: OpportunityTableProps) {
  return (
    <div className="card overflow-hidden">
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Event / Market</th>
              <th>Route</th>
              <th className="text-right">Best Edge</th>
              <th className="text-right">Best Q</th>
              <th className="text-right">Score</th>
              <th className="text-right">Buy @ / Sell @</th>
              <th>Flags</th>
              <th className="text-right">Updated</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {opportunities.map((opp) => {
              const bestBucket = opp.edge_profile.q_buckets.find(
                (b) => b.q === opp.edge_profile.best_q
              );
              const edgeBps = bestBucket ? Math.round(bestBucket.net_edge * 10000) : 0;
              const flagCount = Object.values(opp.flags).filter(Boolean).length;

              return (
                <tr
                  key={opp.opportunity_id}
                  onClick={() => onSelect(opp.opportunity_id)}
                  className="cursor-pointer"
                >
                  <td>
                    <div className="max-w-xs">
                      <p className="font-medium truncate">
                        {opp.canonical_event_label || 'Unmapped Event'}
                      </p>
                      <p className="text-xs text-zinc-500 truncate mt-0.5">
                        {opp.buy_outcome_id}
                      </p>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <span className={clsx(
                        'px-2 py-0.5 rounded text-xs font-medium border',
                        venueColors[opp.buy_venue] || 'bg-zinc-700 text-zinc-300'
                      )}>
                        {opp.buy_venue}
                      </span>
                      <ArrowRight className="w-3 h-3 text-zinc-500" />
                      <span className={clsx(
                        'px-2 py-0.5 rounded text-xs font-medium border',
                        venueColors[opp.sell_venue] || 'bg-zinc-700 text-zinc-300'
                      )}>
                        {opp.sell_venue}
                      </span>
                    </div>
                  </td>
                  <td className="text-right">
                    <span className={clsx(
                      'text-lg font-bold tabular-nums',
                      edgeBps >= 20 ? 'text-emerald-400' :
                      edgeBps >= 10 ? 'text-emerald-500' :
                      'text-zinc-400'
                    )}>
                      +{edgeBps}
                    </span>
                    <span className="text-xs text-zinc-500 ml-1">bps</span>
                  </td>
                  <td className="text-right tabular-nums">
                    ${opp.edge_profile.best_q?.toLocaleString() || '-'}
                  </td>
                  <td className="text-right">
                    <div className={clsx(
                      'inline-flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold',
                      opp.confidence_score >= 80 ? 'bg-emerald-500/20 text-emerald-400' :
                      opp.confidence_score >= 60 ? 'bg-amber-500/20 text-amber-400' :
                      'bg-red-500/20 text-red-400'
                    )}>
                      {opp.confidence_score}
                    </div>
                  </td>
                  <td className="text-right tabular-nums text-sm">
                    {bestBucket && (
                      <>
                        <span className="text-emerald-400">{(bestBucket.buy_price * 100).toFixed(1)}¢</span>
                        <span className="text-zinc-600 mx-1">/</span>
                        <span className="text-red-400">{(bestBucket.sell_price * 100).toFixed(1)}¢</span>
                      </>
                    )}
                  </td>
                  <td>
                    {flagCount > 0 && (
                      <div className="flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                        <span className="text-xs text-amber-400">{flagCount}</span>
                      </div>
                    )}
                  </td>
                  <td className="text-right text-sm text-zinc-500">
                    <div className="flex items-center gap-1 justify-end">
                      <Clock className="w-3 h-3" />
                      {formatDistanceToNow(new Date(opp.last_seen_ts), { addSuffix: true })}
                    </div>
                  </td>
                  <td>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelect(opp.opportunity_id);
                      }}
                      className="btn btn-ghost btn-sm"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

