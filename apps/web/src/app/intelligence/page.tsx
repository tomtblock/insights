'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { 
  Globe, RefreshCw, Search, Filter, AlertTriangle, TrendingUp, 
  Clock, ExternalLink, ChevronRight, Zap, Shield, DollarSign,
  Radio, Target, BarChart3, AlertCircle, CheckCircle, XCircle,
  Newspaper, MapPin, Building, Cpu, Ship, Users, Scale, Activity,
  ChevronDown, ChevronUp, Flame, Gauge, TrendingDown, Minus,
  Crosshair, Bomb, Banknote, Wheat, Wifi, Vote, Crown
} from 'lucide-react';
import clsx from 'clsx';

// ============ TYPES ============
interface IntelligenceItem {
  id: string;
  title: string;
  summary: string;
  sourceName: string;
  url: string;
  publishedAt: Date;
  primaryDomain: string;
  domains: string[];
  assessment?: Assessment;
  flagged: boolean;
}

interface Assessment {
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
  marketImplications: MarketImplication[];
}

interface MarketImplication {
  asset: string;
  direction: string;
  magnitude: string;
  rationale: string;
}

interface MacroCategory {
  name: string;
  icon: any;
  color: string;
  status: 'critical' | 'elevated' | 'moderate' | 'stable';
  score: number;
  trend: 'up' | 'down' | 'stable';
  topRisks: string[];
  itemCount: number;
}

// ============ CONSTANTS ============
const DOMAIN_CATEGORIES = {
  'Great Power': ['us_foreign_policy', 'china_ccp_policy', 'russia_ukraine_war', 'great_power_summitry', 'taiwan_strait', 'us_presidential_power'],
  'Military & Nuclear': ['nuclear_deterrence', 'strategic_missile_testing', 'military_modernization', 'nato_posture', 'military_doctrine', 'nuclear_incidents'],
  'Economic Warfare': ['sanctions_regimes', 'trade_wars', 'semiconductor_controls', 'export_controls', 'central_bank_policy', 'banking_contagion'],
  'Energy & Resources': ['energy_security', 'opec_decisions', 'critical_minerals', 'food_security_diplomacy', 'fertilizer_geopolitics', 'maritime_chokepoints'],
  'Regional Hotspots': ['middle_east_wars', 'korean_peninsula', 'south_china_sea', 'africa_stability', 'regional_power_competition'],
  'Cyber & Tech': ['cyber_conflict', 'ai_competition', 'undersea_cables', 'ransomware_retaliation', 'telecom_standards'],
  'Stability & Governance': ['coups_backsliding', 'legitimacy_crises', 'election_interference', 'authoritarian_succession', 'civil_wars'],
  'Information War': ['disinformation', 'censorship_crackdowns', 'press_freedom', 'state_surveillance'],
};

const DOMAIN_LABELS: Record<string, string> = {
  us_presidential_power: 'US Presidential Power',
  us_congress_budget: 'US Congress & Budget',
  us_foreign_policy: 'US Foreign Policy',
  us_constitutional_crisis: 'Constitutional Crisis',
  great_power_summitry: 'Great Power Summitry',
  backchannel_negotiations: 'Backchannel Talks',
  ceasefire_talks: 'Ceasefire Negotiations',
  china_ccp_policy: 'China CCP Policy',
  taiwan_strait: 'Taiwan Strait',
  south_china_sea: 'South China Sea',
  japan_defense: 'Japan Defense',
  korean_peninsula: 'Korean Peninsula',
  russia_ukraine_war: 'Russia-Ukraine War',
  russia_domestic_stability: 'Russia Domestic',
  nato_posture: 'NATO Posture',
  eu_integration: 'EU Integration',
  middle_east_wars: 'Middle East Conflicts',
  iran_nuclear: 'Iran Nuclear',
  nuclear_deterrence: 'Nuclear Deterrence',
  military_modernization: 'Military Modernization',
  strategic_missile_testing: 'Missile Testing',
  cyber_conflict: 'Cyber Conflict',
  sanctions_regimes: 'Sanctions',
  trade_wars: 'Trade Wars',
  semiconductor_controls: 'Semiconductor Controls',
  export_controls: 'Export Controls',
  central_bank_policy: 'Central Banks',
  energy_security: 'Energy Security',
  opec_decisions: 'OPEC+ Decisions',
  critical_minerals: 'Critical Minerals',
  maritime_chokepoints: 'Maritime Chokepoints',
  ai_competition: 'AI Competition',
  coups_backsliding: 'Coups & Backsliding',
  legitimacy_crises: 'Legitimacy Crises',
  election_interference: 'Election Interference',
  disinformation: 'Disinformation',
  food_security_diplomacy: 'Food Security',
  authoritarian_succession: 'Authoritarian Succession',
  civil_wars: 'Civil Wars',
  africa_stability: 'Africa Stability',
  regional_power_competition: 'Regional Power Competition',
  military_doctrine: 'Military Doctrine',
  nuclear_incidents: 'Nuclear Incidents',
  banking_contagion: 'Banking Contagion',
  fertilizer_geopolitics: 'Fertilizer Geopolitics',
  undersea_cables: 'Undersea Cables',
  ransomware_retaliation: 'Ransomware',
  telecom_standards: 'Telecom Standards',
  censorship_crackdowns: 'Censorship',
  press_freedom: 'Press Freedom',
  state_surveillance: 'State Surveillance',
};

// ============ MOCK DATA ============
const MOCK_ITEMS: IntelligenceItem[] = [
  {
    id: '1',
    title: 'China Conducts Largest Military Exercises Near Taiwan Since 2022',
    summary: 'PLA Eastern Theater Command announces unprecedented live-fire drills involving carrier strike group in waters near Taiwan, US Navy monitoring closely.',
    sourceName: 'Reuters',
    url: '#',
    publishedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
    primaryDomain: 'taiwan_strait',
    domains: ['taiwan_strait', 'china_ccp_policy', 'military_modernization', 'asia_pacific_alliances'],
    assessment: {
      severity: 8, relevance: 10, impact: 8, urgency: 9, compositeScore: 8.5,
      impactType: 'conflict_escalation', timeHorizon: 'immediate',
      affectedRegions: ['Taiwan', 'China', 'United States', 'Japan'],
      affectedSectors: ['Defense', 'Semiconductors', 'Shipping', 'Insurance'],
      keyPoints: ['Largest exercises since Pelosi visit', 'Carrier strike group deployed', 'US and Japan assets repositioning'],
      risks: ['Accidental escalation', 'TSMC production disruption', 'Regional conflict'],
      escalationPotential: 'critical',
      reasoning: 'Unprecedented scale of military activity represents highest Taiwan Strait tensions in years with direct implications for global semiconductor supply.',
      marketImplications: [
        { asset: 'TSM', direction: 'bearish', magnitude: 'significant', rationale: 'Production risk' },
        { asset: 'Defense ETFs', direction: 'bullish', magnitude: 'moderate', rationale: 'Regional tension' },
        { asset: 'TWD', direction: 'bearish', magnitude: 'moderate', rationale: 'Risk premium' }
      ]
    },
    flagged: true
  },
  {
    id: '2',
    title: 'Federal Reserve Signals Extended Pause Amid Banking Stress',
    summary: 'Fed Chair indicates rates may stay higher for longer while monitoring regional bank stress, markets reprice rate cut expectations.',
    sourceName: 'Bloomberg',
    url: '#',
    publishedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
    primaryDomain: 'central_bank_policy',
    domains: ['central_bank_policy', 'banking_contagion', 'geopolitical_risk_markets'],
    assessment: {
      severity: 7, relevance: 10, impact: 8, urgency: 7, compositeScore: 7.8,
      impactType: 'policy_shift', timeHorizon: 'short_term',
      affectedRegions: ['United States', 'Global'],
      affectedSectors: ['Banking', 'Real Estate', 'Technology', 'EM'],
      keyPoints: ['Higher for longer messaging', 'Regional bank monitoring', 'Rate cut repricing'],
      risks: ['Banking stress acceleration', 'EM capital flight', 'Credit crunch'],
      escalationPotential: 'medium',
      reasoning: 'Fed policy shift with banking stability concerns creates cross-asset volatility and EM spillover risks.',
      marketImplications: [
        { asset: 'Regional Banks', direction: 'bearish', magnitude: 'significant', rationale: 'NIM pressure' },
        { asset: 'Gold', direction: 'bullish', magnitude: 'moderate', rationale: 'Haven demand' },
        { asset: 'EM FX', direction: 'bearish', magnitude: 'moderate', rationale: 'Dollar strength' }
      ]
    },
    flagged: true
  },
  {
    id: '3',
    title: 'Houthi Forces Strike Multiple Vessels in Red Sea Escalation',
    summary: 'Iranian-backed Houthis launch coordinated attacks on commercial shipping, major carriers suspend Red Sea transits indefinitely.',
    sourceName: 'Reuters',
    url: '#',
    publishedAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
    primaryDomain: 'maritime_chokepoints',
    domains: ['maritime_chokepoints', 'middle_east_wars', 'energy_security', 'shipping_insurance'],
    assessment: {
      severity: 8, relevance: 9, impact: 8, urgency: 9, compositeScore: 8.3,
      impactType: 'supply_disruption', timeHorizon: 'immediate',
      affectedRegions: ['Middle East', 'Europe', 'Asia'],
      affectedSectors: ['Shipping', 'Retail', 'Energy', 'Insurance'],
      keyPoints: ['12% of global trade affected', 'Insurance premiums spiking', 'Cape route adds 10+ days'],
      risks: ['Prolonged disruption', 'Military escalation', 'Inflation resurgence'],
      escalationPotential: 'high',
      reasoning: 'Critical chokepoint disruption with immediate inflation and supply chain implications globally.',
      marketImplications: [
        { asset: 'Container Shipping', direction: 'bullish', magnitude: 'major', rationale: 'Rate surge' },
        { asset: 'Brent', direction: 'bullish', magnitude: 'moderate', rationale: 'Supply risk' },
        { asset: 'European Retail', direction: 'bearish', magnitude: 'moderate', rationale: 'Inventory delays' }
      ]
    },
    flagged: true
  },
  {
    id: '4',
    title: 'US Announces New Semiconductor Export Controls Targeting China',
    summary: 'Commerce Department expands chip export restrictions to include advanced AI accelerators and semiconductor manufacturing equipment.',
    sourceName: 'Reuters',
    url: '#',
    publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
    primaryDomain: 'semiconductor_controls',
    domains: ['semiconductor_controls', 'export_controls', 'ai_competition', 'trade_wars'],
    assessment: {
      severity: 7, relevance: 9, impact: 7, urgency: 6, compositeScore: 7.2,
      impactType: 'regulatory_change', timeHorizon: 'medium_term',
      affectedRegions: ['United States', 'China', 'Netherlands', 'Japan'],
      affectedSectors: ['Semiconductors', 'AI', 'Defense'],
      keyPoints: ['AI accelerator restrictions', 'Equipment ban expansion', 'Allied coordination'],
      risks: ['Retaliation measures', 'Supply chain bifurcation'],
      escalationPotential: 'medium',
      reasoning: 'Escalation in tech decoupling with significant implications for AI development and chip industry.',
      marketImplications: [
        { asset: 'NVIDIA', direction: 'bearish', magnitude: 'moderate', rationale: 'China revenue loss' },
        { asset: 'ASML', direction: 'volatile', magnitude: 'moderate', rationale: 'Regulatory uncertainty' }
      ]
    },
    flagged: false
  },
  {
    id: '5',
    title: 'Russia Conducts ICBM Test Amid NATO Nuclear Exercise',
    summary: 'Russian Strategic Rocket Forces test RS-28 Sarmat ICBM as NATO conducts Steadfast Noon nuclear deterrence exercise.',
    sourceName: 'Reuters',
    url: '#',
    publishedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
    primaryDomain: 'nuclear_deterrence',
    domains: ['nuclear_deterrence', 'strategic_missile_testing', 'russia_ukraine_war', 'nato_posture'],
    assessment: {
      severity: 7, relevance: 8, impact: 6, urgency: 5, compositeScore: 6.7,
      impactType: 'security_threat', timeHorizon: 'medium_term',
      affectedRegions: ['Russia', 'NATO', 'Europe'],
      affectedSectors: ['Defense'],
      keyPoints: ['Sarmat "Satan II" test', 'Concurrent NATO exercise', 'Deterrence signaling'],
      risks: ['Miscalculation', 'Escalation spiral'],
      escalationPotential: 'medium',
      reasoning: 'Strategic signaling amid heightened tensions, though part of established deterrence posturing.',
      marketImplications: [
        { asset: 'Defense Stocks', direction: 'bullish', magnitude: 'minor', rationale: 'Deterrence spending' }
      ]
    },
    flagged: false
  },
  {
    id: '6',
    title: 'Mass Protests Erupt Following Disputed Election Results',
    summary: 'Tens of thousands take to streets in major capital after opposition alleges widespread electoral fraud, security forces deployed.',
    sourceName: 'AP',
    url: '#',
    publishedAt: new Date(Date.now() - 16 * 60 * 60 * 1000),
    primaryDomain: 'legitimacy_crises',
    domains: ['legitimacy_crises', 'coups_backsliding', 'election_interference'],
    assessment: {
      severity: 6, relevance: 7, impact: 6, urgency: 7, compositeScore: 6.4,
      impactType: 'political_instability', timeHorizon: 'short_term',
      affectedRegions: ['Eastern Europe'],
      affectedSectors: ['Regional Banking', 'FDI'],
      keyPoints: ['Opposition rejects results', 'International observers concerned', 'Military stance unclear'],
      risks: ['Violent crackdown', 'Constitutional crisis', 'Regional spillover'],
      escalationPotential: 'high',
      reasoning: 'Democratic backsliding event with potential for escalation depending on security force response.',
      marketImplications: [
        { asset: 'Regional ETFs', direction: 'bearish', magnitude: 'moderate', rationale: 'Political risk' }
      ]
    },
    flagged: false
  },
  {
    id: '7',
    title: 'OPEC+ Agrees Deeper Production Cuts Through 2025',
    summary: 'Saudi Arabia leads coalition to extend and deepen oil production cuts, citing weak demand outlook and market stabilization goals.',
    sourceName: 'Reuters',
    url: '#',
    publishedAt: new Date(Date.now() - 20 * 60 * 60 * 1000),
    primaryDomain: 'opec_decisions',
    domains: ['opec_decisions', 'energy_security', 'commodity_cartels'],
    assessment: {
      severity: 6, relevance: 9, impact: 7, urgency: 6, compositeScore: 6.8,
      impactType: 'supply_disruption', timeHorizon: 'short_term',
      affectedRegions: ['Middle East', 'Global'],
      affectedSectors: ['Energy', 'Transportation', 'Chemicals'],
      keyPoints: ['Extended cuts through 2025', 'Saudi voluntary reduction', 'Compliance monitoring'],
      risks: ['Demand weakness', 'Non-OPEC supply'],
      escalationPotential: 'low',
      reasoning: 'Supply management supporting prices with clear market implications.',
      marketImplications: [
        { asset: 'Brent', direction: 'bullish', magnitude: 'moderate', rationale: 'Supply tightening' },
        { asset: 'Energy Stocks', direction: 'bullish', magnitude: 'moderate', rationale: 'Margin support' }
      ]
    },
    flagged: false
  },
  {
    id: '8',
    title: 'Major Cyberattack Disrupts Critical Infrastructure in NATO Member',
    summary: 'State-sponsored hackers breach energy grid and government systems, officials attribute attack to hostile state actor.',
    sourceName: 'Reuters',
    url: '#',
    publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    primaryDomain: 'cyber_conflict',
    domains: ['cyber_conflict', 'ransomware_retaliation', 'undersea_cables', 'nato_posture'],
    assessment: {
      severity: 7, relevance: 8, impact: 7, urgency: 8, compositeScore: 7.3,
      impactType: 'security_threat', timeHorizon: 'immediate',
      affectedRegions: ['Europe', 'NATO'],
      affectedSectors: ['Utilities', 'Government', 'Cybersecurity'],
      keyPoints: ['Critical infrastructure targeted', 'State attribution', 'Article 5 discussions'],
      risks: ['Retaliatory cycle', 'Infrastructure cascades'],
      escalationPotential: 'high',
      reasoning: 'Significant cyber escalation against NATO member with potential for broader conflict.',
      marketImplications: [
        { asset: 'Cybersecurity ETFs', direction: 'bullish', magnitude: 'moderate', rationale: 'Spending surge' }
      ]
    },
    flagged: false
  }
];

// ============ MACRO STATUS COMPONENT ============
function MacroStatusReport({ items, onCategoryClick }: { 
  items: IntelligenceItem[]; 
  onCategoryClick: (category: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = useMemo((): MacroCategory[] => {
    const catConfig: Record<string, { icon: any; color: string }> = {
      'Great Power': { icon: Crown, color: 'red' },
      'Military & Nuclear': { icon: Bomb, color: 'orange' },
      'Economic Warfare': { icon: Banknote, color: 'yellow' },
      'Energy & Resources': { icon: Flame, color: 'amber' },
      'Regional Hotspots': { icon: MapPin, color: 'red' },
      'Cyber & Tech': { icon: Wifi, color: 'purple' },
      'Stability & Governance': { icon: Vote, color: 'blue' },
      'Information War': { icon: Radio, color: 'cyan' }
    };

    return Object.entries(DOMAIN_CATEGORIES).map(([name, domains]) => {
      const catItems = items.filter(i => i.domains.some(d => domains.includes(d)));
      const assessed = catItems.filter(i => i.assessment);
      const avgSeverity = assessed.length > 0
        ? assessed.reduce((acc, i) => acc + (i.assessment?.severity || 0), 0) / assessed.length
        : 0;
      
      const topItems = assessed
        .sort((a, b) => (b.assessment?.compositeScore || 0) - (a.assessment?.compositeScore || 0))
        .slice(0, 3);

      return {
        name,
        icon: catConfig[name]?.icon || Globe,
        color: catConfig[name]?.color || 'zinc',
        status: avgSeverity >= 7.5 ? 'critical' : avgSeverity >= 6 ? 'elevated' : avgSeverity >= 4 ? 'moderate' : 'stable',
        score: Math.round(avgSeverity * 10) / 10,
        trend: Math.random() > 0.5 ? 'up' : Math.random() > 0.5 ? 'down' : 'stable',
        topRisks: topItems.map(i => i.title.slice(0, 60) + (i.title.length > 60 ? '...' : '')),
        itemCount: catItems.length
      };
    });
  }, [items]);

  const overallScore = useMemo(() => {
    const assessed = items.filter(i => i.assessment);
    if (assessed.length === 0) return 0;
    return Math.round(
      assessed.reduce((acc, i) => acc + (i.assessment?.compositeScore || 0), 0) / assessed.length * 10
    ) / 10;
  }, [items]);

  const overallStatus = overallScore >= 7.5 ? 'CRITICAL' : overallScore >= 6 ? 'ELEVATED' : overallScore >= 4 ? 'MODERATE' : 'STABLE';
  const statusColor = overallScore >= 7.5 ? 'red' : overallScore >= 6 ? 'orange' : overallScore >= 4 ? 'yellow' : 'emerald';

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden mb-6">
      {/* Header */}
      <div 
        className="p-4 border-b border-zinc-800 cursor-pointer hover:bg-zinc-800/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={clsx(
              'p-3 rounded-xl',
              statusColor === 'red' && 'bg-red-500/20',
              statusColor === 'orange' && 'bg-orange-500/20',
              statusColor === 'yellow' && 'bg-yellow-500/20',
              statusColor === 'emerald' && 'bg-emerald-500/20'
            )}>
              <Gauge className={clsx(
                'w-8 h-8',
                statusColor === 'red' && 'text-red-400',
                statusColor === 'orange' && 'text-orange-400',
                statusColor === 'yellow' && 'text-yellow-400',
                statusColor === 'emerald' && 'text-emerald-400'
              )} />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-white">Global Macro Risk Assessment</h2>
                <span className={clsx(
                  'px-3 py-1 rounded-full text-sm font-bold uppercase tracking-wide animate-pulse',
                  statusColor === 'red' && 'bg-red-500/20 text-red-400',
                  statusColor === 'orange' && 'bg-orange-500/20 text-orange-400',
                  statusColor === 'yellow' && 'bg-yellow-500/20 text-yellow-400',
                  statusColor === 'emerald' && 'bg-emerald-500/20 text-emerald-400'
                )}>
                  {overallStatus}
                </span>
              </div>
              <p className="text-sm text-zinc-400 mt-0.5">
                Real-time synthesis across {items.length} intelligence items • Updated {new Date().toLocaleTimeString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-3xl font-bold text-white tabular-nums">{overallScore}</p>
              <p className="text-xs text-zinc-500">Composite Score</p>
            </div>
            {expanded ? <ChevronUp className="w-5 h-5 text-zinc-500" /> : <ChevronDown className="w-5 h-5 text-zinc-500" />}
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="p-4">
          {/* Category Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            {categories.map(cat => (
              <CategoryCard 
                key={cat.name} 
                category={cat} 
                selected={selectedCategory === cat.name}
                onClick={() => {
                  setSelectedCategory(selectedCategory === cat.name ? null : cat.name);
                  onCategoryClick(cat.name);
                }}
              />
            ))}
          </div>

          {/* Selected Category Detail */}
          {selectedCategory && (
            <div className="p-4 bg-zinc-800/50 rounded-xl border border-zinc-700">
              <h3 className="font-semibold text-white mb-3">{selectedCategory} - Top Risks</h3>
              <div className="space-y-2">
                {categories.find(c => c.name === selectedCategory)?.topRisks.map((risk, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                    <span className="text-zinc-300">{risk}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Key Metrics Row */}
          <div className="grid grid-cols-4 gap-3 mt-4">
            <MiniStat 
              label="Critical Items" 
              value={items.filter(i => (i.assessment?.severity || 0) >= 8).length}
              icon={AlertTriangle}
              color="red"
            />
            <MiniStat 
              label="High Urgency" 
              value={items.filter(i => (i.assessment?.urgency || 0) >= 7).length}
              icon={Clock}
              color="orange"
            />
            <MiniStat 
              label="Market Impact" 
              value={items.filter(i => (i.assessment?.impact || 0) >= 7).length}
              icon={TrendingUp}
              color="yellow"
            />
            <MiniStat 
              label="Escalation Risk" 
              value={items.filter(i => i.assessment?.escalationPotential === 'high' || i.assessment?.escalationPotential === 'critical').length}
              icon={Activity}
              color="purple"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function CategoryCard({ category, selected, onClick }: { 
  category: MacroCategory; 
  selected: boolean;
  onClick: () => void;
}) {
  const Icon = category.icon;
  const statusColors: Record<string, { bg: string; text: string; border: string }> = {
    critical: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/50' },
    elevated: { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/50' },
    moderate: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/50' },
    stable: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/50' }
  };
  const colors = statusColors[category.status];

  return (
    <div 
      onClick={onClick}
      className={clsx(
        'p-3 rounded-xl border cursor-pointer transition-all',
        selected 
          ? `${colors.bg} ${colors.border} ring-1 ring-offset-1 ring-offset-zinc-900 ${colors.border.replace('border-', 'ring-')}`
          : 'bg-zinc-800/50 border-zinc-700 hover:border-zinc-600'
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <div className={clsx('p-1.5 rounded-lg', colors.bg)}>
          <Icon className={clsx('w-4 h-4', colors.text)} />
        </div>
        <div className="flex items-center gap-1">
          {category.trend === 'up' && <TrendingUp className="w-3 h-3 text-red-400" />}
          {category.trend === 'down' && <TrendingDown className="w-3 h-3 text-emerald-400" />}
          {category.trend === 'stable' && <Minus className="w-3 h-3 text-zinc-500" />}
          <span className={clsx('text-lg font-bold', colors.text)}>{category.score || '-'}</span>
        </div>
      </div>
      <p className="text-sm font-medium text-white truncate">{category.name}</p>
      <div className="flex items-center justify-between mt-1">
        <span className={clsx('text-xs font-medium uppercase', colors.text)}>{category.status}</span>
        <span className="text-xs text-zinc-500">{category.itemCount} items</span>
      </div>
    </div>
  );
}

function MiniStat({ label, value, icon: Icon, color }: { label: string; value: number; icon: any; color: string }) {
  const colorClasses: Record<string, string> = {
    red: 'bg-red-500/10 text-red-400',
    orange: 'bg-orange-500/10 text-orange-400',
    yellow: 'bg-yellow-500/10 text-yellow-400',
    purple: 'bg-purple-500/10 text-purple-400',
  };

  return (
    <div className="p-3 bg-zinc-800/50 rounded-lg flex items-center gap-3">
      <div className={clsx('p-2 rounded-lg', colorClasses[color])}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className="text-xl font-bold text-white">{value}</p>
        <p className="text-xs text-zinc-500">{label}</p>
      </div>
    </div>
  );
}

// ============ MAIN PAGE ============
export default function IntelligencePage() {
  const [items] = useState<IntelligenceItem[]>(MOCK_ITEMS);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [minSeverity, setMinSeverity] = useState(1);
  const [selectedItem, setSelectedItem] = useState<IntelligenceItem | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setLastUpdated(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

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
      const scoreA = a.assessment?.compositeScore || 0;
      const scoreB = b.assessment?.compositeScore || 0;
      if (scoreB !== scoreA) return scoreB - scoreA;
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    });
  }, [items, search, selectedCategory, minSeverity]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      setLastUpdated(new Date());
    }, 2000);
  };

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(prev => prev === category ? null : category);
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900/50 sticky top-0 z-10 backdrop-blur-sm">
        <div className="max-w-[1800px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-lg border border-red-500/30">
                <Globe className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Geopolitical Intelligence Monitor</h1>
                <p className="text-sm text-zinc-400">AI-powered threat assessment • 100+ domains • Real-time analysis</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span className="text-sm text-emerald-400 font-medium">Live</span>
              </div>
              <span className="text-sm text-zinc-500">Updated {lastUpdated.toLocaleTimeString()}</span>
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
        {/* Macro Status Report */}
        <MacroStatusReport items={items} onCategoryClick={handleCategoryClick} />

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
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-center sticky top-24">
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

// ============ INTELLIGENCE CARD ============
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
                <span className="flex items-center gap-1 px-2 py-0.5 bg-red-500/20 text-red-400 text-xs font-bold rounded animate-pulse">
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
                {item.assessment.impactType.replace(/_/g, ' ')}
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
            <div className="flex gap-2 flex-wrap">
              {item.assessment.marketImplications.slice(0, 4).map((impl, i) => (
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

// ============ DETAIL PANEL ============
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
        <div className="grid grid-cols-2 gap-3">
          <ScoreBox label="Severity" value={assessment.severity} color="red" />
          <ScoreBox label="Relevance" value={assessment.relevance} color="blue" />
          <ScoreBox label="Impact" value={assessment.impact} color="orange" />
          <ScoreBox label="Urgency" value={assessment.urgency} color="yellow" />
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

        <div>
          <h4 className="text-sm font-semibold text-zinc-300 mb-2">AI Analysis</h4>
          <p className="text-sm text-zinc-400">{assessment.reasoning}</p>
        </div>

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

function ScoreBox({ label, value, color }: { label: string; value: number; color: string }) {
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

// ============ UTILITIES ============
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
    nuclear_deterrence: 'bg-red-500/20 text-red-400',
    cyber_conflict: 'bg-purple-500/20 text-purple-400',
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
