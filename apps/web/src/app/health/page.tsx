'use client';

import { useState } from 'react';
import { 
  Activity, Shield, AlertTriangle, CheckCircle, XCircle, RefreshCw, 
  Clock, Server, Database, Wifi, AlertCircle as Alert
} from 'lucide-react';
import clsx from 'clsx';

interface VenueHealth {
  name: string;
  status: 'green' | 'yellow' | 'red';
  localMarkets: number;
  upstreamMarkets: number;
  latency: string;
  completeness: number;
  lastSync: string;
  issues: string[];
}

interface SystemMetric {
  name: string;
  value: string;
  status: 'good' | 'warning' | 'critical';
  target: string;
}

const MOCK_VENUES: VenueHealth[] = [
  {
    name: 'Polymarket',
    status: 'green',
    localMarkets: 156,
    upstreamMarkets: 158,
    latency: '45ms',
    completeness: 98.7,
    lastSync: '30 sec ago',
    issues: [],
  },
  {
    name: 'Kalshi',
    status: 'green',
    localMarkets: 89,
    upstreamMarkets: 89,
    latency: '62ms',
    completeness: 100,
    lastSync: '45 sec ago',
    issues: [],
  },
  {
    name: 'PredictIt',
    status: 'yellow',
    localMarkets: 42,
    upstreamMarkets: 48,
    latency: '180ms',
    completeness: 87.5,
    lastSync: '2 min ago',
    issues: ['6 markets missing', 'High latency'],
  },
  {
    name: 'FinFeed API',
    status: 'green',
    localMarkets: 287,
    upstreamMarkets: 290,
    latency: '38ms',
    completeness: 99.0,
    lastSync: '15 sec ago',
    issues: [],
  },
];

const MOCK_METRICS: SystemMetric[] = [
  { name: 'API Response Time', value: '45ms', status: 'good', target: '< 100ms' },
  { name: 'Data Freshness', value: '98.5%', status: 'good', target: '> 95%' },
  { name: 'Error Rate', value: '0.02%', status: 'good', target: '< 1%' },
  { name: 'Uptime (30d)', value: '99.97%', status: 'good', target: '> 99.9%' },
];

export default function HealthPage() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const globalStatus = MOCK_VENUES.some((v) => v.status === 'red') ? 'red' :
                       MOCK_VENUES.some((v) => v.status === 'yellow') ? 'yellow' : 'green';
  const readOnlyMode = globalStatus === 'red';

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
            <h1 className="text-3xl font-bold text-white">System Health</h1>
            <p className="text-zinc-400 mt-1">Monitor operational status of the Arb Platform</p>
          </div>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Global Status Banner */}
        <div className={clsx(
          'p-6 rounded-xl border flex items-center justify-between',
          globalStatus === 'green' && 'bg-emerald-500/10 border-emerald-500/20',
          globalStatus === 'yellow' && 'bg-amber-500/10 border-amber-500/20',
          globalStatus === 'red' && 'bg-red-500/10 border-red-500/20'
        )}>
          <div className="flex items-center gap-4">
            <div className={clsx(
              'p-3 rounded-xl',
              globalStatus === 'green' && 'bg-emerald-500/20',
              globalStatus === 'yellow' && 'bg-amber-500/20',
              globalStatus === 'red' && 'bg-red-500/20'
            )}>
              {globalStatus === 'green' && <CheckCircle className="w-8 h-8 text-emerald-400" />}
              {globalStatus === 'yellow' && <AlertTriangle className="w-8 h-8 text-amber-400" />}
              {globalStatus === 'red' && <XCircle className="w-8 h-8 text-red-400" />}
            </div>
            <div>
              <h2 className={clsx(
                'text-2xl font-bold',
                globalStatus === 'green' && 'text-emerald-400',
                globalStatus === 'yellow' && 'text-amber-400',
                globalStatus === 'red' && 'text-red-400'
              )}>
                {globalStatus === 'green' && 'All Systems Operational'}
                {globalStatus === 'yellow' && 'Degraded Performance'}
                {globalStatus === 'red' && 'System Issues Detected'}
              </h2>
              <p className="text-zinc-400 mt-1">
                {readOnlyMode ? 'Read-only mode active - rule execution paused' : 'All automated systems running normally'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-zinc-500" />
            <span className="text-sm text-zinc-500">Last check: 10 sec ago</span>
          </div>
        </div>

        {/* System Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {MOCK_METRICS.map((metric) => (
            <div key={metric.name} className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-zinc-400">{metric.name}</span>
                <span className={clsx(
                  'w-2 h-2 rounded-full',
                  metric.status === 'good' && 'bg-emerald-500',
                  metric.status === 'warning' && 'bg-amber-500',
                  metric.status === 'critical' && 'bg-red-500'
                )} />
              </div>
              <p className="text-2xl font-bold text-white">{metric.value}</p>
              <p className="text-xs text-zinc-500 mt-1">Target: {metric.target}</p>
            </div>
          ))}
        </div>

        {/* Venue Health */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-800">
            <h2 className="text-lg font-semibold text-white">Venue Health</h2>
          </div>
          <div className="divide-y divide-zinc-800">
            {MOCK_VENUES.map((venue) => (
              <VenueRow key={venue.name} venue={venue} />
            ))}
          </div>
        </div>

        {/* Service Status */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-800">
            <h2 className="text-lg font-semibold text-white">Service Status</h2>
          </div>
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <ServiceCard name="API Gateway" status="operational" icon={Server} />
            <ServiceCard name="Database" status="operational" icon={Database} />
            <ServiceCard name="Market Ingest" status="operational" icon={Activity} />
            <ServiceCard name="Rule Engine" status="operational" icon={Shield} />
          </div>
        </div>
      </div>
    </div>
  );
}

function VenueRow({ venue }: { venue: VenueHealth }) {
  const statusColors = {
    green: 'bg-emerald-500',
    yellow: 'bg-amber-500',
    red: 'bg-red-500',
  };

  const statusBg = {
    green: 'bg-emerald-500/20 text-emerald-400',
    yellow: 'bg-amber-500/20 text-amber-400',
    red: 'bg-red-500/20 text-red-400',
  };

  return (
    <div className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className={clsx('w-3 h-3 rounded-full', statusColors[venue.status])} />
          <div>
            <h3 className="font-semibold text-white">{venue.name}</h3>
            <p className="text-sm text-zinc-500">Last sync: {venue.lastSync}</p>
          </div>
        </div>

        <span className={clsx('px-2.5 py-1 rounded text-xs font-medium uppercase', statusBg[venue.status])}>
          {venue.status}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
        <div>
          <p className="text-zinc-500">Local Markets</p>
          <p className="text-white font-mono">{venue.localMarkets}</p>
        </div>
        <div>
          <p className="text-zinc-500">Upstream Markets</p>
          <p className="text-white font-mono">{venue.upstreamMarkets}</p>
        </div>
        <div>
          <p className="text-zinc-500">Latency</p>
          <p className="text-white font-mono">{venue.latency}</p>
        </div>
        <div>
          <p className="text-zinc-500">Completeness</p>
          <p className={clsx(
            'font-mono font-medium',
            venue.completeness >= 95 ? 'text-emerald-400' :
            venue.completeness >= 80 ? 'text-amber-400' : 'text-red-400'
          )}>{venue.completeness}%</p>
        </div>
      </div>

      {venue.issues.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {venue.issues.map((issue, i) => (
            <span key={i} className="flex items-center gap-1 px-2 py-1 bg-amber-500/10 text-amber-400 text-xs rounded">
              <Alert className="w-3 h-3" />
              {issue}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function ServiceCard({ name, status, icon: Icon }: { name: string; status: string; icon: any }) {
  return (
    <div className="p-4 bg-zinc-800/50 rounded-lg">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-emerald-500/10 rounded-lg">
          <Icon className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <p className="text-white font-medium">{name}</p>
          <p className="text-xs text-emerald-400 capitalize">{status}</p>
        </div>
      </div>
    </div>
  );
}
