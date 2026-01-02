'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  TrendingUp, Target, BarChart3, Activity, Clock, 
  ArrowRight, Zap, ExternalLink, RefreshCw, ChevronRight
} from 'lucide-react';

// Format time for display
function useCurrentTime() {
  const [time, setTime] = useState('');
  
  useEffect(() => {
    const update = () => {
      setTime(new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      }));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);
  
  return time;
}

export default function DashboardPage() {
  const currentTime = useCurrentTime();
  const [isRefreshing, setIsRefreshing] = useState(false);

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
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
            <p className="text-zinc-400 mt-1">Real-time market intelligence overview</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-400">
              <Clock className="w-4 h-4" />
              <span className="font-mono">{currentTime || '--:--:--'}</span>
            </div>
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="Open Opportunities" 
            value="12" 
            change="+3 today"
            icon={TrendingUp}
            color="emerald"
          />
          <StatCard 
            title="Active Markets" 
            value="574" 
            change="+28 this week"
            icon={Target}
            color="blue"
          />
          <StatCard 
            title="Avg Edge (bps)" 
            value="35" 
            change="+5 from yesterday"
            icon={BarChart3}
            color="purple"
          />
          <StatCard 
            title="System Status" 
            value="HEALTHY" 
            change="All venues online"
            icon={Activity}
            color="green"
          />
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - 2 cols wide */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Live Opportunities */}
            <section className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <h2 className="text-lg font-semibold text-white">Live Opportunities</h2>
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs font-medium rounded-full">3 active</span>
                </div>
                <Link href="/opportunities" className="text-emerald-400 hover:text-emerald-300 text-sm flex items-center gap-1">
                  View all <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="divide-y divide-zinc-800">
                <OpportunityRow 
                  event="Will Bitcoin reach $100k by 2025?"
                  buyVenue="Polymarket"
                  sellVenue="Kalshi"
                  buyPrice={62}
                  sellPrice={67}
                  edge={42}
                  confidence={87}
                />
                <OpportunityRow 
                  event="Fed rate cut January 2025?"
                  buyVenue="Kalshi"
                  sellVenue="PredictIt"
                  buyPrice={23}
                  sellPrice={28}
                  edge={38}
                  confidence={82}
                />
                <OpportunityRow 
                  event="Trump wins 2024 election?"
                  buyVenue="PredictIt"
                  sellVenue="Polymarket"
                  buyPrice={51}
                  sellPrice={54}
                  edge={25}
                  confidence={75}
                />
              </div>
            </section>

            {/* Top Markets */}
            <section className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Top Markets by Volume</h2>
                <Link href="/markets" className="text-emerald-400 hover:text-emerald-300 text-sm flex items-center gap-1">
                  Browse all <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="text-xs text-zinc-500 uppercase border-b border-zinc-800">
                    <th className="px-6 py-3 text-left font-medium">Market</th>
                    <th className="px-6 py-3 text-left font-medium">Venue</th>
                    <th className="px-6 py-3 text-right font-medium">Price</th>
                    <th className="px-6 py-3 text-right font-medium">24h Volume</th>
                    <th className="px-6 py-3 text-right font-medium">Change</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  <MarketRow title="Bitcoin $100k 2025" venue="Polymarket" price={65} volume="$2.1M" change={2.3} />
                  <MarketRow title="Trump 2024 Winner" venue="PredictIt" price={52} volume="$3.4M" change={0.8} />
                  <MarketRow title="Fed Rate Cut Jan" venue="Kalshi" price={25} volume="$890K" change={-1.2} />
                  <MarketRow title="ETH $5k March 2025" venue="Polymarket" price={42} volume="$1.2M" change={4.1} />
                  <MarketRow title="Super Bowl Chiefs" venue="Kalshi" price={28} volume="$540K" change={-0.5} />
                </tbody>
              </table>
            </section>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            
            {/* Venue Health */}
            <section className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-zinc-800">
                <h2 className="text-lg font-semibold text-white">Venue Health</h2>
              </div>
              <div className="p-4 space-y-3">
                <VenueCard name="Polymarket" status="green" markets={156} latency="45ms" />
                <VenueCard name="Kalshi" status="green" markets={89} latency="62ms" />
                <VenueCard name="PredictIt" status="yellow" markets={42} latency="180ms" />
                <VenueCard name="FinFeed API" status="green" markets={287} latency="38ms" />
              </div>
              <div className="px-4 pb-4">
                <Link 
                  href="/health" 
                  className="flex items-center justify-center gap-2 w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-sm transition-colors"
                >
                  View detailed health <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </section>

            {/* Recent Triggers */}
            <section className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Recent Triggers</h2>
                <Link href="/rules" className="text-emerald-400 hover:text-emerald-300 text-sm">Manage →</Link>
              </div>
              <div className="divide-y divide-zinc-800">
                <TriggerRow rule="Cross-Venue Arb" event="BTC $100k" type="opportunity" time="2 min ago" />
                <TriggerRow rule="Volume Spike" event="Fed Rate Cut" type="alert" time="15 min ago" />
                <TriggerRow rule="Price Deviation" event="Trump 2024" type="warning" time="1 hour ago" />
              </div>
            </section>

            {/* Quick Actions */}
            <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
              <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide">Quick Actions</h3>
              <Link href="/rules" className="flex items-center gap-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/20 transition-colors">
                <Zap className="w-5 h-5 text-emerald-400" />
                <span className="text-emerald-400 font-medium">Create New Rule</span>
              </Link>
              <Link href="/markets" className="flex items-center gap-3 p-3 bg-zinc-800 border border-zinc-700 rounded-lg hover:bg-zinc-700 transition-colors">
                <Target className="w-5 h-5 text-zinc-400" />
                <span className="text-zinc-300 font-medium">Browse Markets</span>
              </Link>
              <Link href="/topics" className="flex items-center gap-3 p-3 bg-zinc-800 border border-zinc-700 rounded-lg hover:bg-zinc-700 transition-colors">
                <Activity className="w-5 h-5 text-zinc-400" />
                <span className="text-zinc-300 font-medium">AI Topic Scanner</span>
              </Link>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({ title, value, change, icon: Icon, color }: {
  title: string;
  value: string;
  change: string;
  icon: any;
  color: 'emerald' | 'blue' | 'purple' | 'green';
}) {
  const colors = {
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    green: 'bg-green-500/10 text-green-400 border-green-500/20',
  };
  
  return (
    <div className={`p-6 rounded-xl border ${colors[color]}`}>
      <div className="flex items-center justify-between mb-4">
        <Icon className="w-6 h-6" />
      </div>
      <p className="text-3xl font-bold text-white mb-1">{value}</p>
      <p className="text-sm text-zinc-400">{title}</p>
      <p className="text-xs text-zinc-500 mt-2">{change}</p>
    </div>
  );
}

// Opportunity Row Component
function OpportunityRow({ event, buyVenue, sellVenue, buyPrice, sellPrice, edge, confidence }: {
  event: string;
  buyVenue: string;
  sellVenue: string;
  buyPrice: number;
  sellPrice: number;
  edge: number;
  confidence: number;
}) {
  return (
    <div className="p-4 hover:bg-zinc-800/50 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <p className="font-medium text-white mb-2">{event}</p>
          <div className="flex items-center gap-2 text-sm">
            <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded text-xs font-medium">{buyVenue}</span>
            <span className="text-zinc-600">{buyPrice}¢</span>
            <ArrowRight className="w-4 h-4 text-zinc-600" />
            <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs font-medium">{sellVenue}</span>
            <span className="text-zinc-600">{sellPrice}¢</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold text-emerald-400">+{edge} bps</p>
          <p className="text-xs text-zinc-500">{confidence}% confidence</p>
        </div>
      </div>
    </div>
  );
}

// Market Row Component
function MarketRow({ title, venue, price, volume, change }: {
  title: string;
  venue: string;
  price: number;
  volume: string;
  change: number;
}) {
  const venueColors: Record<string, string> = {
    'Polymarket': 'bg-purple-500/20 text-purple-400',
    'Kalshi': 'bg-blue-500/20 text-blue-400',
    'PredictIt': 'bg-orange-500/20 text-orange-400',
  };
  
  return (
    <tr className="hover:bg-zinc-800/50 transition-colors">
      <td className="px-6 py-4 text-white font-medium">{title}</td>
      <td className="px-6 py-4">
        <span className={`px-2 py-1 rounded text-xs font-medium ${venueColors[venue] || 'bg-zinc-700 text-zinc-400'}`}>
          {venue}
        </span>
      </td>
      <td className="px-6 py-4 text-right font-mono text-white">{price}¢</td>
      <td className="px-6 py-4 text-right font-mono text-zinc-400">{volume}</td>
      <td className={`px-6 py-4 text-right font-mono font-medium ${change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
        {change >= 0 ? '+' : ''}{change}%
      </td>
    </tr>
  );
}

// Venue Card Component
function VenueCard({ name, status, markets, latency }: {
  name: string;
  status: 'green' | 'yellow' | 'red';
  markets: number;
  latency: string;
}) {
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
    <div className="p-4 bg-zinc-800/50 rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${statusColors[status]}`}></div>
          <span className="font-medium text-white">{name}</span>
        </div>
        <span className={`px-2 py-0.5 rounded text-xs font-medium uppercase ${statusBg[status]}`}>
          {status}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <p className="text-zinc-500">Markets</p>
          <p className="text-white font-mono">{markets}</p>
        </div>
        <div>
          <p className="text-zinc-500">Latency</p>
          <p className="text-white font-mono">{latency}</p>
        </div>
      </div>
    </div>
  );
}

// Trigger Row Component
function TriggerRow({ rule, event, type, time }: {
  rule: string;
  event: string;
  type: 'opportunity' | 'alert' | 'warning';
  time: string;
}) {
  const typeColors = {
    opportunity: 'bg-emerald-500/10 text-emerald-400',
    alert: 'bg-blue-500/10 text-blue-400',
    warning: 'bg-amber-500/10 text-amber-400',
  };
  
  return (
    <div className="p-4 hover:bg-zinc-800/50 transition-colors">
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${typeColors[type]}`}>
          <Zap className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-medium text-sm">{rule}</p>
          <p className="text-zinc-500 text-xs truncate">{event}</p>
        </div>
        <span className="text-zinc-500 text-xs flex-shrink-0">{time}</span>
      </div>
    </div>
  );
}
