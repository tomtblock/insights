'use client';

import useSWR from 'swr';
import { Zap, AlertTriangle, Info, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import clsx from 'clsx';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface TriggerEvent {
  event_id: string;
  rule_id: string;
  ts: string;
  severity: 'info' | 'warning' | 'high' | 'critical';
  explanation: string[];
}

export function RecentTriggers() {
  const { data } = useSWR(`${API_URL}/api/rules`, fetcher, {
    refreshInterval: 30000,
  });

  // Get recent trigger events from all rules
  // In production, this would be a dedicated endpoint
  const triggers: TriggerEvent[] = [];

  return (
    <div className="divide-y divide-zinc-800">
      {triggers.length === 0 ? (
        <div className="p-4 text-center text-zinc-500 text-sm">
          No recent triggers
        </div>
      ) : (
        triggers.slice(0, 5).map((trigger) => (
          <div key={trigger.event_id} className="p-3 hover:bg-zinc-800/30">
            <div className="flex items-start gap-3">
              <div className={clsx(
                'p-1.5 rounded-lg',
                trigger.severity === 'critical' ? 'bg-red-500/10 text-red-400' :
                trigger.severity === 'high' ? 'bg-amber-500/10 text-amber-400' :
                trigger.severity === 'warning' ? 'bg-yellow-500/10 text-yellow-400' :
                'bg-zinc-800 text-zinc-400'
              )}>
                {trigger.severity === 'critical' ? <AlertCircle className="w-4 h-4" /> :
                 trigger.severity === 'high' ? <AlertTriangle className="w-4 h-4" /> :
                 trigger.severity === 'warning' ? <AlertTriangle className="w-4 h-4" /> :
                 <Info className="w-4 h-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {trigger.explanation[0] || 'Trigger fired'}
                </p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {formatDistanceToNow(new Date(trigger.ts), { addSuffix: true })}
                </p>
              </div>
            </div>
          </div>
        ))
      )}

      {/* Placeholder for demo */}
      <div className="p-3 hover:bg-zinc-800/30">
        <div className="flex items-start gap-3">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
            <Zap className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              Cross-venue edge detected: +15 bps
            </p>
            <p className="text-xs text-zinc-500 mt-0.5">
              2 minutes ago
            </p>
          </div>
        </div>
      </div>
      <div className="p-3 hover:bg-zinc-800/30">
        <div className="flex items-start gap-3">
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              Wide spread alert: Kalshi BTC 80k
            </p>
            <p className="text-xs text-zinc-500 mt-0.5">
              5 minutes ago
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

