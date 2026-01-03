'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  Globe, RefreshCw, Search, Filter, AlertTriangle, TrendingUp, 
  Clock, ExternalLink, ChevronRight, Zap, Shield, DollarSign,
  Radio, Target, BarChart3, AlertCircle, CheckCircle, XCircle,
  Newspaper, MapPin, Building, Cpu, Ship, Users, Scale
} from 'lucide-react';
import clsx from 'clsx';

// Types
interface IntelligenceItem {
  id: string;
  title: string;
  summary: string;
  sourceName: string;
  url: string;
  publishedAt: Date;
  primaryDomain: string;
  domains: string[];
  assessment?: {
    severity: number;
    relevance: number;
    impact: number;
    urgency: number;
    compositeScore: number;
    impactType: string;
    timeHorizon: string;
    affectedRegions: string[];
    affectedSectors: string[];
    keyPoints: string[];
    risks: string[];
    escalationPotential: string;
    reasoning: string;
    marketImplications: Array<{
      asset: string;
      direction: string;
      magnitude: string;
      rationale: string;
    }>;
  };
  flagged: boolean;
}

// Domain categories for filtering
const DOMAIN_CATEGORIES = {
  'US Politics': ['us_presidential_power', 'us_congress_budget', 'us_foreign_policy'],
  'China & Indo-Pacific': ['china_ccp_policy', 'taiwan_strait', 'south_china_sea', 'japan_defense', 'korean_peninsula', 'india_rise', 'pakistan_stability'],
  'Europe & Russia': ['russia_ukraine_war', 'nato_posture', 'eu_integration'],
  'Middle East': ['middle_east_wars', 'iran_nuclear'],
  'Defense & Security': ['nuclear_deterrence', 'military_modernization', 'arms_transfers', 'cyber_conflict', 'space_security', 'terrorism'],
  'Economic Security': ['sanctions_regimes', 'trade_wars', 'supply_chain', 'critical_minerals', 'energy_security', 'opec_decisions', 'central_bank_policy', 'sovereign_debt', 'currency_wars', 'inflation_shocks'],
  'Technology': ['ai_competition', 'semiconductor_controls'],
  'Maritime & Trade': ['maritime_chokepoints', 'piracy'],
  'Stability': ['migration_borders', 'pandemics', 'disinformation', 'coups_backsliding', 'civil_wars'],
};

const DOMAIN_LABELS: Record<string, string> = {
  us_presidential_power: 'US Presidential Power',
  us_congress_budget: 'US Congress & Budget',
  us_foreign_policy: 'US Foreign Policy',
  china_ccp_policy: 'China CCP Policy',
  taiwan_strait: 'Taiwan Strait',
  south_china_sea: 'South China Sea',
  japan_defense: 'Japan Defense',
  korean_peninsula: 'Korean Peninsula',
  india_rise: 'India Rise',
  pakistan_stability: 'Pakistan Stability',
  russia_ukraine_war: 'Russia-Ukraine War',
  nato_posture: 'NATO Posture',
  eu_integration: 'EU Integration',
  middle_east_wars: 'Middle East Conflicts',
  iran_nuclear: 'Iran Nuclear',
  nuclear_deterrence: 'Nuclear Deterrence',
  military_modernization: 'Military Modernization',
  arms_transfers: 'Arms Transfers',
  cyber_conflict: 'Cyber Conflict',
  space_security: 'Space Security',
  terrorism: 'Terrorism',
  sanctions_regimes: 'Sanctions',
  trade_wars: 'Trade Wars',
  supply_chain: 'Supply Chain',
  critical_minerals: 'Critical Minerals',
  energy_security: 'Energy Security',
  opec_decisions: 'OPEC+ Decisions',
  central_bank_policy: 'Central Banks',
  sovereign_debt: 'Sovereign Debt',
  currency_wars: 'Currency Wars',
  inflation_shocks: 'Inflation Shocks',
  ai_competition: 'AI Competition',
  semiconductor_controls: 'Semiconductor Controls',
  maritime_chokepoints: 'Maritime Chokepoints',
  piracy: 'Piracy',
  migration_borders: 'Migration & Borders',
  pandemics: 'Pandemics',
  disinformation: 'Disinformation',
  coups_backsliding: 'Coups & Backsliding',
  civil_wars: 'Civil Wars',
};

// Mock data
const MOCK_ITEMS: IntelligenceItem[] = [
  {
    id: '1',
    title: 'China Conducts Military Exercises Near Taiwan Strait',
    summary: 'PLA Eastern Theater Command announces live-fire drills in waters near Taiwan, raising regional tensions. Multiple naval vessels and aircraft participating in exercises described as routine training.',
    sourceName: 'Reuters',
    url: 'https://reuters.com',
    publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    primaryDomain: 'taiwan_strait',
    domains: ['taiwan_strait', 'china_ccp_policy', 'military_modernization'],
    assessment: {
      severity: 7,
      relevance: 9,
      impact: 7,
      urgency: 8,
      compositeScore: 7.6,
      impactType: 'conflict_escalation',
      timeHorizon: 'immediate',
      affectedRegions: ['Taiwan', 'China', 'United States', 'Japan'],
      affectedSectors: ['Defense', 'Semiconductors', 'Shipping'],
      keyPoints: ['Live-fire exercises announced', 'Multiple naval vessels deployed', 'US monitoring closely'],
      risks: ['Accidental escalation', 'Supply chain disruption', 'Semiconductor production risk'],
      escalationPotential: 'high',
      reasoning: 'Significant military activity near Taiwan represents elevated escalation risk and potential supply chain implications for global semiconductor industry.',
      marketImplications: [
        { asset: 'Taiwan Dollar', direction: 'bearish', magnitude: 'moderate', rationale: 'Geopolitical risk premium' },
        { asset: 'Defense Stocks', direction: 'bullish', magnitude: 'moderate', rationale: 'Regional tension escalation' },
        { asset: 'TSM', direction: 'bearish', magnitude: 'minor', rationale: 'Production risk concerns' }
      ]
    },
    flagged: true
  },
  {
    id: '2',
    title: 'Federal Reserve Signals Potential Rate Cut Timeline',
    summary: 'Fed Chair indicates conditions may support rate reductions in coming months, citing cooling inflation and balanced labor market conditions.',
    sourceName: 'Bloomberg',
    url: 'https://bloomberg.com',
    publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
    primaryDomain: 'central_bank_policy',
    domains: ['central_bank_policy', 'currency_wars'],
    assessment: {
      severity: 6,
      relevance: 10,
      impact: 8,
      urgency: 5,
      compositeScore: 7.2,
      impactType: 'policy_shift',
      timeHorizon: 'short_term',
      affectedRegions: ['United States', 'Global'],
      affectedSectors: ['Banking', 'Real Estate', 'Technology'],
      keyPoints: ['Rate cut timeline discussed', 'Inflation trending toward target', 'Labor market remains resilient'],
      risks: ['Inflation resurgence', 'Market overreaction'],
      escalationPotential: 'low',
      reasoning: 'Major monetary policy signal with significant implications for global asset prices and capital flows.',
      marketImplications: [
        { asset: 'S&P 500', direction: 'bullish', magnitude: 'moderate', rationale: 'Lower rates support valuations' },
        { asset: 'US Treasury Bonds', direction: 'bullish', magnitude: 'significant', rationale: 'Rate cut expectations' },
        { asset: 'USD', direction: 'bearish', magnitude: 'moderate', rationale: 'Interest rate differential narrowing' }
      ]
    },
    flagged: false
  },
  {
    id: '3',
    title: 'Houthi Attacks Disrupt Red Sea Shipping Routes',
    summary: 'Multiple container ships rerouted around Cape of Good Hope following missile and drone attacks on commercial vessels. Major shipping lines suspending Red Sea transits.',
    sourceName: 'Reuters',
    url: 'https://reuters.com',
    publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
    primaryDomain: 'maritime_chokepoints',
    domains: ['maritime_chokepoints', 'middle_east_wars', 'supply_chain', 'energy_security'],
    assessment: {
      severity: 8,
      relevance: 9,
      impact: 8,
      urgency: 9,
      compositeScore: 8.3,
      impactType: 'supply_disruption',
      timeHorizon: 'immediate',
      affectedRegions: ['Middle East', 'Europe', 'Asia'],
      affectedSectors: ['Shipping', 'Retail', 'Manufacturing', 'Energy'],
      keyPoints: ['Major shipping lines avoiding Red Sea', 'Freight rates surging', 'US naval presence increased'],
      risks: ['Conflict escalation', 'Insurance costs spike', 'Extended disruption'],
      escalationPotential: 'high',
      reasoning: 'Critical chokepoint disruption affecting 12% of global trade with immediate supply chain and inflation implications.',
      marketImplications: [
        { asset: 'Container Shipping', direction: 'bullish', magnitude: 'significant', rationale: 'Higher freight rates' },
        { asset: 'Oil', direction: 'bullish', magnitude: 'moderate', rationale: 'Supply route disruption' },
        { asset: 'European Retailers', direction: 'bearish', magnitude: 'moderate', rationale: 'Supply chain delays' }
      ]
    },
    flagged: true
  },
  {
    id: '4',
    title: 'EU Announces New Semiconductor Subsidy Package',
    summary: 'European Commission unveils €10 billion chip manufacturing initiative to reduce Asian supply dependency and boost domestic production capacity.',
    sourceName: 'Financial Times',
    url: 'https://ft.com',
    publishedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
    primaryDomain: 'semiconductor_controls',
    domains: ['semiconductor_controls', 'eu_integration', 'supply_chain'],
    assessment: {
      severity: 5,
      relevance: 8,
      impact: 6,
      urgency: 3,
      compositeScore: 5.6,
      impactType: 'policy_shift',
      timeHorizon: 'long_term',
      affectedRegions: ['European Union', 'Taiwan', 'South Korea'],
      affectedSectors: ['Semiconductors', 'Automotive', 'Technology'],
      keyPoints: ['€10B subsidy package', 'Focus on advanced nodes', 'Multi-year implementation'],
      risks: ['Execution challenges', 'Competitive response'],
      escalationPotential: 'low',
      reasoning: 'Significant industrial policy development but long implementation timeline limits immediate impact.',
      marketImplications: [
        { asset: 'European Chip Stocks', direction: 'bullish', magnitude: 'moderate', rationale: 'Subsidy support' },
        { asset: 'ASML', direction: 'bullish', magnitude: 'minor', rationale: 'Equipment demand' }
      ]
    },
    flagged: false
  },
  {
    id: '5',
    title: 'Russia Announces New Hypersonic Missile Deployment',
    summary: 'Defense Ministry confirms operational deployment of Zircon hypersonic missiles to Northern Fleet vessels, expanding strategic strike capabilities.',
    sourceName: 'Reuters',
    url: 'https://reuters.com',
    publishedAt: new Date(Date.now() - 18 * 60 * 60 * 1000),
    primaryDomain: 'military_modernization',
    domains: ['military_modernization', 'russia_ukraine_war', 'nuclear_deterrence', 'nato_posture'],
    assessment: {
      severity: 7,
      relevance: 8,
      impact: 6,
      urgency: 4,
      compositeScore: 6.5,
      impactType: 'security_threat',
      timeHorizon: 'medium_term',
      affectedRegions: ['Russia', 'NATO', 'Arctic'],
      affectedSectors: ['Defense', 'Aerospace'],
      keyPoints: ['Hypersonic capability confirmed', 'Naval deployment', 'NATO monitoring response'],
      risks: ['Arms race escalation', 'Deterrence stability concerns'],
      escalationPotential: 'medium',
      reasoning: 'Notable military development affecting strategic balance but no immediate crisis trigger.',
      marketImplications: [
        { asset: 'Defense Stocks', direction: 'bullish', magnitude: 'minor', rationale: 'Arms race dynamics' },
        { asset: 'European Equities', direction: 'bearish', magnitude: 'minor', rationale: 'Security concerns' }
      ]
    },
    flagged: false
  },
  {
    id: '6',
    title: 'OPEC+ Agrees to Extended Production Cuts',
    summary: 'Oil cartel extends voluntary production cuts through Q2, with Saudi Arabia maintaining additional 1 million barrel reduction.',
    sourceName: 'Reuters',
    url: 'https://reuters.com',
    publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    primaryDomain: 'opec_decisions',
    domains: ['opec_decisions', 'energy_security'],
    assessment: {
      severity: 6,
      relevance: 9,
      impact: 7,
      urgency: 6,
      compositeScore: 6.8,
      impactType: 'supply_disruption',
      timeHorizon: 'short_term',
      affectedRegions: ['Middle East', 'Global'],
      affectedSectors: ['Energy', 'Transportation', 'Chemicals'],
      keyPoints: ['Production cuts extended', 'Saudi voluntary cuts maintained', 'Compliance monitoring'],
      risks: ['Demand weakness', 'Non-OPEC supply growth'],
      escalationPotential: 'low',
      reasoning: 'Supply management decision supporting oil prices with clear market implications.',
      marketImplications: [
        { asset: 'Brent Crude', direction: 'bullish', magnitude: 'moderate', rationale: 'Supply tightening' },
        { asset: 'Energy Stocks', direction: 'bullish', magnitude: 'moderate', rationale: 'Higher oil prices' },
        { asset: 'Airlines', direction: 'bearish', magnitude: 'minor', rationale: 'Fuel cost pressure' }
      ]
    },
    flagged: false
  }
];

export default function IntelligencePage() {
  const [items] = useState<IntelligenceItem[]>(MOCK_ITEMS);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [minSeverity, setMinSeverity] = useState(1);
  const [selectedItem, setSelectedItem] = useState<IntelligenceItem | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      if (search) {
        const searchLower = search.toLowerCase();
        if (!item.title.toLowerCase().includes(searchLower) &&
            !item.summary.toLowerCase().includes(searchLower)) {
          return false;
        }
      }
      if (selectedCategory) {
        const categoryDomains = DOMAIN_CATEGORIES[selectedCategory as keyof typeof DOMAIN_CATEGORIES] || [];
        if (!item.domains.some(d => categoryDomains.includes(d))) {
          return false;
        }
      }
      if (item.assessment && item.assessment.severity < minSeverity) {
        return false;
      }
      return true;
    }).sort((a, b) => {
      // Sort by composite score, then by date
      const scoreA = a.assessment?.compositeScore || 0;
      const scoreB = b.assessment?.compositeScore || 0;
      if (scoreB !== scoreA) return scoreB - scoreA;
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    });
  }, [items, search, selectedCategory, minSeverity]);

  const stats = useMemo(() => {
    const assessed = items.filter(i => i.assessment);
    return {
      total: items.length,
      critical: assessed.filter(i => (i.assessment?.severity || 0) >= 8).length,
      high: assessed.filter(i => (i.assessment?.severity || 0) >= 6 && (i.assessment?.severity || 0) < 8).length,
      avgSeverity: assessed.length > 0 
        ? (assessed.reduce((acc, i) => acc + (i.assessment?.severity || 0), 0) / assessed.length).toFixed(1)
        : '0'
    };
  }, [items]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 2000);
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900/50 sticky top-0 z-10 backdrop-blur-sm">
        <div className="max-w-[1800px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <Globe className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Geopolitical Intelligence Monitor</h1>
                <p className="text-sm text-zinc-400">AI-powered threat assessment and analysis</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span className="text-sm text-emerald-400 font-medium">Live Monitoring</span>
              </div>
              <button
                onClick={handleRefresh}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
              >
                <RefreshCw className={clsx('w-4 h-4', isRefreshing && 'animate-spin')} />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1800px] mx-auto px-6 py-6">
        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <StatCard 
            label="Total Items" 
            value={stats.total} 
            icon={Newspaper}
            color="zinc"
          />
          <StatCard 
            label="Critical Alerts" 
            value={stats.critical} 
            icon={AlertTriangle}
            color="red"
          />
          <StatCard 
            label="High Severity" 
            value={stats.high} 
            icon={AlertCircle}
            color="orange"
          />
          <StatCard 
            label="Avg Severity" 
            value={stats.avgSeverity} 
            icon={BarChart3}
            color="blue"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 mb-6 p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
          <div className="relative flex-1 min-w-[300px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search intelligence..."
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm focus:outline-none focus:border-red-500"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSelectedCategory(null)}
              className={clsx(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                !selectedCategory
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-600'
              )}
            >
              All
            </button>
            {Object.keys(DOMAIN_CATEGORIES).map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category === selectedCategory ? null : category)}
                className={clsx(
                  'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                  selectedCategory === category
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                    : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-600'
                )}
              >
                {category}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-500">Min Severity:</span>
            <select
              value={minSeverity}
              onChange={(e) => setMinSeverity(Number(e.target.value))}
              className="px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm"
            >
              {[1, 3, 5, 7, 9].map(v => (
                <option key={v} value={v}>{v}+</option>
              ))}
            </select>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Feed */}
          <div className="lg:col-span-2 space-y-4">
            {filteredItems.map(item => (
              <IntelligenceCard
                key={item.id}
                item={item}
                isSelected={selectedItem?.id === item.id}
                onClick={() => setSelectedItem(item)}
              />
            ))}
            {filteredItems.length === 0 && (
              <div className="text-center py-16 text-zinc-500">
                No intelligence items match your filters.
              </div>
            )}
          </div>

          {/* Detail Panel */}
          <div className="lg:col-span-1">
            {selectedItem ? (
              <DetailPanel item={selectedItem} onClose={() => setSelectedItem(null)} />
            ) : (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-center">
                <Target className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                <p className="text-zinc-500">Select an item to view detailed assessment</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }: { 
  label: string; 
  value: number | string; 
  icon: any;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    zinc: 'bg-zinc-500/10 text-zinc-400',
    red: 'bg-red-500/10 text-red-400',
    orange: 'bg-orange-500/10 text-orange-400',
    blue: 'bg-blue-500/10 text-blue-400',
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
      <div className="flex items-center gap-3">
        <div className={clsx('p-2 rounded-lg', colorClasses[color])}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-2xl font-bold text-white">{value}</p>
          <p className="text-sm text-zinc-500">{label}</p>
        </div>
      </div>
    </div>
  );
}

function IntelligenceCard({ item, isSelected, onClick }: { 
  item: IntelligenceItem; 
  isSelected: boolean;
  onClick: () => void;
}) {
  const severity = item.assessment?.severity || 0;
  const severityColor = getSeverityColor(severity);

  return (
    <div 
      onClick={onClick}
      className={clsx(
        'bg-zinc-900 border rounded-xl overflow-hidden cursor-pointer transition-all',
        isSelected ? 'border-red-500/50 ring-1 ring-red-500/20' : 'border-zinc-800 hover:border-zinc-700'
      )}
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {item.flagged && (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-red-500/20 text-red-400 text-xs font-bold rounded">
                  <AlertTriangle className="w-3 h-3" />
                  CRITICAL
                </span>
              )}
              <span className="text-xs text-zinc-500">{item.sourceName}</span>
              <span className="text-xs text-zinc-600">•</span>
              <span className="text-xs text-zinc-500">{formatTimeAgo(item.publishedAt)}</span>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2">{item.title}</h3>
            <p className="text-sm text-zinc-400 line-clamp-2">{item.summary}</p>
          </div>
          
          {item.assessment && (
            <div className="flex-shrink-0 text-center">
              <div className={clsx(
                'w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold',
                severityColor.bg, severityColor.text
              )}>
                {severity}
              </div>
              <p className="text-xs text-zinc-500 mt-1">Severity</p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className={clsx(
            'px-2 py-0.5 rounded text-xs font-medium',
            getDomainColor(item.primaryDomain)
          )}>
            {DOMAIN_LABELS[item.primaryDomain] || item.primaryDomain}
          </span>
          {item.assessment && (
            <>
              <span className="px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded text-xs">
                {item.assessment.impactType.replace('_', ' ')}
              </span>
              <span className={clsx(
                'px-2 py-0.5 rounded text-xs',
                item.assessment.escalationPotential === 'high' || item.assessment.escalationPotential === 'critical'
                  ? 'bg-red-500/20 text-red-400'
                  : item.assessment.escalationPotential === 'medium'
                  ? 'bg-yellow-500/20 text-yellow-400'
                  : 'bg-zinc-800 text-zinc-400'
              )}>
                {item.assessment.escalationPotential} escalation
              </span>
            </>
          )}
        </div>

        {item.assessment && item.assessment.marketImplications.length > 0 && (
          <div className="mt-3 pt-3 border-t border-zinc-800">
            <p className="text-xs text-zinc-500 mb-2">Market Implications:</p>
            <div className="flex gap-2 flex-wrap">
              {item.assessment.marketImplications.slice(0, 3).map((impl, i) => (
                <span 
                  key={i}
                  className={clsx(
                    'px-2 py-0.5 rounded text-xs font-medium',
                    impl.direction === 'bullish' ? 'bg-emerald-500/20 text-emerald-400' :
                    impl.direction === 'bearish' ? 'bg-red-500/20 text-red-400' :
                    'bg-zinc-700 text-zinc-300'
                  )}
                >
                  {impl.asset} {impl.direction === 'bullish' ? '↑' : impl.direction === 'bearish' ? '↓' : '~'}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DetailPanel({ item, onClose }: { item: IntelligenceItem; onClose: () => void }) {
  const assessment = item.assessment;
  if (!assessment) return null;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden sticky top-24">
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
        <h3 className="font-semibold text-white">Assessment Details</h3>
        <button onClick={onClose} className="p-1 hover:bg-zinc-800 rounded">
          <XCircle className="w-5 h-5 text-zinc-500" />
        </button>
      </div>
      
      <div className="p-4 max-h-[calc(100vh-200px)] overflow-y-auto space-y-4">
        {/* Scores Grid */}
        <div className="grid grid-cols-2 gap-3">
          <ScoreBox label="Severity" value={assessment.severity} max={10} color="red" />
          <ScoreBox label="Relevance" value={assessment.relevance} max={10} color="blue" />
          <ScoreBox label="Impact" value={assessment.impact} max={10} color="orange" />
          <ScoreBox label="Urgency" value={assessment.urgency} max={10} color="yellow" />
        </div>

        <div className="p-3 bg-zinc-800/50 rounded-lg">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-zinc-400">Composite Score</span>
            <span className="text-xl font-bold text-white">{assessment.compositeScore}</span>
          </div>
          <div className="w-full h-2 bg-zinc-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 via-yellow-500 to-red-500"
              style={{ width: `${assessment.compositeScore * 10}%` }}
            />
          </div>
        </div>

        {/* Reasoning */}
        <div>
          <h4 className="text-sm font-semibold text-zinc-300 mb-2">AI Analysis</h4>
          <p className="text-sm text-zinc-400">{assessment.reasoning}</p>
        </div>

        {/* Key Points */}
        <div>
          <h4 className="text-sm font-semibold text-zinc-300 mb-2">Key Points</h4>
          <ul className="space-y-1">
            {assessment.keyPoints.map((point, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-zinc-400">
                <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                {point}
              </li>
            ))}
          </ul>
        </div>

        {/* Risks */}
        {assessment.risks.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-zinc-300 mb-2">Risks</h4>
            <ul className="space-y-1">
              {assessment.risks.map((risk, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-zinc-400">
                  <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  {risk}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Market Implications */}
        <div>
          <h4 className="text-sm font-semibold text-zinc-300 mb-2">Market Implications</h4>
          <div className="space-y-2">
            {assessment.marketImplications.map((impl, i) => (
              <div key={i} className="p-2 bg-zinc-800/50 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-white">{impl.asset}</span>
                  <span className={clsx(
                    'px-2 py-0.5 rounded text-xs font-bold uppercase',
                    impl.direction === 'bullish' ? 'bg-emerald-500/20 text-emerald-400' :
                    impl.direction === 'bearish' ? 'bg-red-500/20 text-red-400' :
                    'bg-zinc-700 text-zinc-300'
                  )}>
                    {impl.direction} ({impl.magnitude})
                  </span>
                </div>
                <p className="text-xs text-zinc-500">{impl.rationale}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Affected Areas */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <h4 className="text-sm font-semibold text-zinc-300 mb-2">Regions</h4>
            <div className="flex flex-wrap gap-1">
              {assessment.affectedRegions.map((region, i) => (
                <span key={i} className="px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded text-xs">
                  {region}
                </span>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-zinc-300 mb-2">Sectors</h4>
            <div className="flex flex-wrap gap-1">
              {assessment.affectedSectors.map((sector, i) => (
                <span key={i} className="px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded text-xs">
                  {sector}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Source Link */}
        <a 
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full p-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-medium transition-colors"
        >
          Read Full Article <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}

function ScoreBox({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const colorClasses: Record<string, string> = {
    red: 'text-red-400',
    blue: 'text-blue-400',
    orange: 'text-orange-400',
    yellow: 'text-yellow-400',
  };

  return (
    <div className="p-3 bg-zinc-800/50 rounded-lg text-center">
      <p className={clsx('text-2xl font-bold', colorClasses[color])}>{value}</p>
      <p className="text-xs text-zinc-500">{label}</p>
    </div>
  );
}

function getSeverityColor(severity: number): { bg: string; text: string } {
  if (severity >= 9) return { bg: 'bg-red-500/20', text: 'text-red-400' };
  if (severity >= 7) return { bg: 'bg-orange-500/20', text: 'text-orange-400' };
  if (severity >= 5) return { bg: 'bg-yellow-500/20', text: 'text-yellow-400' };
  if (severity >= 3) return { bg: 'bg-blue-500/20', text: 'text-blue-400' };
  return { bg: 'bg-zinc-500/20', text: 'text-zinc-400' };
}

function getDomainColor(domain: string): string {
  const colorMap: Record<string, string> = {
    taiwan_strait: 'bg-red-500/20 text-red-400',
    china_ccp_policy: 'bg-red-500/20 text-red-400',
    russia_ukraine_war: 'bg-orange-500/20 text-orange-400',
    middle_east_wars: 'bg-orange-500/20 text-orange-400',
    central_bank_policy: 'bg-blue-500/20 text-blue-400',
    semiconductor_controls: 'bg-purple-500/20 text-purple-400',
    maritime_chokepoints: 'bg-cyan-500/20 text-cyan-400',
    energy_security: 'bg-amber-500/20 text-amber-400',
  };
  return colorMap[domain] || 'bg-zinc-500/20 text-zinc-400';
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

