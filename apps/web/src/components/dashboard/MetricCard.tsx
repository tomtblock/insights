'use client';

import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import clsx from 'clsx';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

export function MetricCard({ title, value, change, icon: Icon, trend, variant = 'default' }: MetricCardProps) {
  return (
    <div className="card p-4">
      <div className="flex items-start justify-between">
        <div className={clsx(
          'p-2 rounded-lg',
          variant === 'success' ? 'bg-emerald-500/10' :
          variant === 'warning' ? 'bg-amber-500/10' :
          variant === 'danger' ? 'bg-red-500/10' :
          'bg-zinc-800'
        )}>
          <Icon className={clsx(
            'w-5 h-5',
            variant === 'success' ? 'text-emerald-400' :
            variant === 'warning' ? 'text-amber-400' :
            variant === 'danger' ? 'text-red-400' :
            'text-zinc-400'
          )} />
        </div>
        {change !== undefined && (
          <div className={clsx(
            'flex items-center gap-1 text-xs font-medium',
            trend === 'up' ? 'text-emerald-400' :
            trend === 'down' ? 'text-red-400' :
            'text-zinc-400'
          )}>
            {trend === 'up' && <TrendingUp className="w-3 h-3" />}
            {trend === 'down' && <TrendingDown className="w-3 h-3" />}
            {change > 0 ? '+' : ''}{change}%
          </div>
        )}
      </div>
      <div className="mt-3">
        <p className="text-2xl font-bold tabular-nums">{value}</p>
        <p className="text-sm text-zinc-500 mt-1">{title}</p>
      </div>
    </div>
  );
}

