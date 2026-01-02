'use client';

import { useState } from 'react';
import useSWR from 'swr';
import {
  X,
  ArrowRight,
  Clock,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import clsx from 'clsx';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface OpportunityDetailDrawerProps {
  opportunityId: string;
  onClose: () => void;
}

export function OpportunityDetailDrawer({ opportunityId, onClose }: OpportunityDetailDrawerProps) {
  const [replayResult, setReplayResult] = useState<any>(null);
  const [isReplaying, setIsReplaying] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data, error, isLoading } = useSWR(
    `${API_URL}/api/opportunities/${opportunityId}`,
    fetcher
  );

  const opportunity = data?.data;

  const handleReplay = async () => {
    setIsReplaying(true);
    try {
      const response = await fetch(`${API_URL}/api/opportunities/replay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opportunity_id: opportunityId }),
      });
      const result = await response.json();
      setReplayResult(result.data);
    } catch (error) {
      console.error('Replay failed:', error);
    } finally {
      setIsReplaying(false);
    }
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(opportunityId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="fixed inset-y-0 right-0 w-full max-w-xl bg-zinc-900 border-l border-zinc-800 shadow-2xl z-50 flex items-center justify-center">
        <div className="text-zinc-500">Loading...</div>
      </div>
    );
  }

  if (error || !opportunity) {
    return (
      <div className="fixed inset-y-0 right-0 w-full max-w-xl bg-zinc-900 border-l border-zinc-800 shadow-2xl z-50 p-6">
        <button onClick={onClose} className="btn btn-ghost btn-icon absolute top-4 right-4">
          <X className="w-5 h-5" />
        </button>
        <div className="text-red-400">Failed to load opportunity</div>
      </div>
    );
  }

  const bestBucket = opportunity.edge_profile?.q_buckets?.find(
    (b: any) => b.q === opportunity.edge_profile?.best_q
  );
  const edgeBps = bestBucket ? Math.round(bestBucket.net_edge * 10000) : 0;

  // Prepare chart data
  const chartData = opportunity.edge_profile?.q_buckets?.map((bucket: any) => ({
    q: bucket.q,
    edge: Math.round(bucket.net_edge * 10000),
    executable: bucket.executable,
  })) || [];

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-xl bg-zinc-900 border-l border-zinc-800 shadow-2xl z-50 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 p-4 border-b border-zinc-800 bg-zinc-900/95 backdrop-blur flex items-center justify-between">
        <h2 className="font-semibold">Opportunity Details</h2>
        <button onClick={onClose} className="btn btn-ghost btn-icon">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4 space-y-6">
        {/* Title & ID */}
        <div>
          <h3 className="text-lg font-semibold">
            {opportunity.canonical_event_label || 'Unmapped Event'}
          </h3>
          <div className="flex items-center gap-2 mt-2">
            <code className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">
              {opportunityId.slice(0, 8)}...
            </code>
            <button onClick={handleCopyId} className="text-zinc-400 hover:text-zinc-200">
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Route */}
        <div className="p-4 bg-zinc-800/50 rounded-lg">
          <div className="flex items-center justify-center gap-4">
            <div className="text-center">
              <p className="text-xs text-zinc-500 mb-1">Buy</p>
              <span className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg font-medium">
                {opportunity.buy_venue}
              </span>
            </div>
            <ArrowRight className="w-6 h-6 text-zinc-500" />
            <div className="text-center">
              <p className="text-xs text-zinc-500 mb-1">Sell</p>
              <span className="px-3 py-1.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg font-medium">
                {opportunity.sell_venue}
              </span>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-3 bg-zinc-800/30 rounded-lg text-center">
            <p className="text-xs text-zinc-500 mb-1">Edge</p>
            <p className={clsx(
              'text-2xl font-bold tabular-nums',
              edgeBps >= 20 ? 'text-emerald-400' : 'text-zinc-300'
            )}>
              +{edgeBps}
            </p>
            <p className="text-xs text-zinc-500">bps</p>
          </div>
          <div className="p-3 bg-zinc-800/30 rounded-lg text-center">
            <p className="text-xs text-zinc-500 mb-1">Score</p>
            <p className="text-2xl font-bold tabular-nums">{opportunity.confidence_score}</p>
            <p className="text-xs text-zinc-500">/100</p>
          </div>
          <div className="p-3 bg-zinc-800/30 rounded-lg text-center">
            <p className="text-xs text-zinc-500 mb-1">Best Q</p>
            <p className="text-2xl font-bold tabular-nums">
              ${opportunity.edge_profile?.best_q?.toLocaleString() || '-'}
            </p>
          </div>
        </div>

        {/* Edge Curve Chart */}
        <div className="card p-4">
          <h4 className="text-sm font-medium mb-4">Edge by Size (Q)</h4>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis
                  dataKey="q"
                  tickFormatter={(v) => `$${v}`}
                  tick={{ fill: '#71717a', fontSize: 10 }}
                />
                <YAxis
                  tick={{ fill: '#71717a', fontSize: 10 }}
                  tickFormatter={(v) => `${v}bp`}
                />
                <Tooltip
                  contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 8 }}
                  labelFormatter={(v) => `Q = $${v}`}
                  formatter={(v: any) => [`${v} bps`, 'Edge']}
                />
                <ReferenceLine y={0} stroke="#3f3f46" strokeDasharray="3 3" />
                <Line
                  type="monotone"
                  dataKey="edge"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: '#10b981', strokeWidth: 0, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Q Buckets Table */}
        <div className="card overflow-hidden">
          <table className="table text-sm">
            <thead>
              <tr>
                <th>Q Size</th>
                <th className="text-right">Buy @</th>
                <th className="text-right">Sell @</th>
                <th className="text-right">Net Edge</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {opportunity.edge_profile?.q_buckets?.map((bucket: any) => (
                <tr
                  key={bucket.q}
                  className={bucket.q === opportunity.edge_profile?.best_q ? 'bg-emerald-500/10' : ''}
                >
                  <td className="tabular-nums font-medium">${bucket.q.toLocaleString()}</td>
                  <td className="text-right tabular-nums text-emerald-400">
                    {(bucket.buy_price * 100).toFixed(1)}¢
                  </td>
                  <td className="text-right tabular-nums text-red-400">
                    {(bucket.sell_price * 100).toFixed(1)}¢
                  </td>
                  <td className="text-right tabular-nums">
                    <span className={bucket.net_edge > 0 ? 'text-emerald-400' : 'text-red-400'}>
                      {bucket.net_edge > 0 ? '+' : ''}{Math.round(bucket.net_edge * 10000)} bps
                    </span>
                  </td>
                  <td>
                    {bucket.executable ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <X className="w-4 h-4 text-zinc-600" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Flags */}
        {Object.entries(opportunity.flags || {}).some(([, v]) => v) && (
          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span className="font-medium text-amber-400">Warnings</span>
            </div>
            <ul className="text-sm space-y-1 text-amber-400/80">
              {opportunity.flags?.stale && <li>• Data may be stale</li>}
              {opportunity.flags?.near_resolution && <li>• Near resolution (&lt;30 min)</li>}
              {opportunity.flags?.high_ambiguity && <li>• High truth ambiguity</li>}
              {opportunity.flags?.wide_spread && <li>• Wide spread on one side</li>}
              {opportunity.flags?.low_depth && <li>• Low liquidity depth</li>}
            </ul>
          </div>
        )}

        {/* Snapshot References */}
        <div className="card p-4">
          <h4 className="text-sm font-medium mb-3">Snapshot References</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">Buy snapshot:</span>
              <code className="text-xs bg-zinc-800 px-2 py-0.5 rounded">
                {opportunity.snapshot_refs?.buy_snapshot_hash}
              </code>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">Sell snapshot:</span>
              <code className="text-xs bg-zinc-800 px-2 py-0.5 rounded">
                {opportunity.snapshot_refs?.sell_snapshot_hash}
              </code>
            </div>
          </div>
        </div>

        {/* Replay Button */}
        <button
          onClick={handleReplay}
          disabled={isReplaying}
          className="btn btn-secondary w-full"
        >
          {isReplaying ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          Replay & Verify
        </button>

        {/* Replay Result */}
        {replayResult && (
          <div className={clsx(
            'p-4 rounded-lg',
            replayResult.replay_status === 'MATCH'
              ? 'bg-emerald-500/10 border border-emerald-500/20'
              : 'bg-red-500/10 border border-red-500/20'
          )}>
            <div className="flex items-center gap-2 mb-2">
              {replayResult.replay_status === 'MATCH' ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-400" />
              )}
              <span className={clsx(
                'font-medium',
                replayResult.replay_status === 'MATCH' ? 'text-emerald-400' : 'text-red-400'
              )}>
                Replay {replayResult.replay_status}
              </span>
            </div>
            <p className="text-sm text-zinc-400">
              Edge diff: {replayResult.edge_diff_bps?.toFixed(2) || 0} bps
            </p>
          </div>
        )}

        {/* Timestamps */}
        <div className="text-xs text-zinc-500 space-y-1">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Created {formatDistanceToNow(new Date(opportunity.created_ts), { addSuffix: true })}
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Last seen {formatDistanceToNow(new Date(opportunity.last_seen_ts), { addSuffix: true })}
          </div>
        </div>
      </div>
    </div>
  );
}

