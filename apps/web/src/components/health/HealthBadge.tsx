'use client';

import { useStore } from '@/lib/store';
import { AlertTriangle, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import clsx from 'clsx';

export function HealthBadge() {
  const healthStatus = useStore((s) => s.healthStatus);
  const readOnlyMode = useStore((s) => s.readOnlyMode);

  if (healthStatus === 'unknown') return null;

  return (
    <div className={clsx(
      'fixed bottom-4 right-4 flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium shadow-lg z-50',
      healthStatus === 'green' && !readOnlyMode
        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
        : healthStatus === 'yellow'
        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
        : 'bg-red-500/20 text-red-400 border border-red-500/30 glow-red'
    )}>
      {healthStatus === 'green' && !readOnlyMode ? (
        <CheckCircle className="w-4 h-4" />
      ) : healthStatus === 'yellow' ? (
        <AlertTriangle className="w-4 h-4" />
      ) : (
        <AlertCircle className="w-4 h-4" />
      )}
      <span>
        {readOnlyMode ? 'READ ONLY' : healthStatus.toUpperCase()}
      </span>
    </div>
  );
}

