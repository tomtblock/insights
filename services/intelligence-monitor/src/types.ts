import { MonitoringDomain } from './sources';

// Core Intelligence Item Structure
export interface IntelligenceItem {
  id: string;
  sourceId: string;
  sourceName: string;
  
  // Content
  title: string;
  summary: string;
  content?: string;
  url: string;
  imageUrl?: string;
  
  // Timestamps
  publishedAt: Date;
  scrapedAt: Date;
  assessedAt?: Date;
  
  // Classification
  domains: MonitoringDomain[];
  primaryDomain: MonitoringDomain;
  
  // AI Assessment
  assessment?: IntelligenceAssessment;
  
  // Status
  status: 'pending' | 'assessed' | 'flagged' | 'archived';
  flagged: boolean;
  flagReason?: string;
}

export interface IntelligenceAssessment {
  // Core Scores (1-10)
  severity: number;        // How serious is this development?
  relevance: number;       // How relevant to markets/geopolitics?
  impact: number;          // Potential market/policy impact
  urgency: number;         // Time sensitivity
  confidence: number;      // AI confidence in assessment
  
  // Composite Score (calculated)
  compositeScore: number;  // Weighted combination
  
  // Classification
  impactType: ImpactType;
  timeHorizon: TimeHorizon;
  affectedRegions: string[];
  affectedSectors: string[];
  
  // Market Implications
  marketImplications: MarketImplication[];
  
  // Analysis
  keyPoints: string[];
  risks: string[];
  opportunities: string[];
  
  // Connections
  relatedEvents: string[];
  escalationPotential: 'low' | 'medium' | 'high' | 'critical';
  
  // AI Reasoning
  reasoning: string;
  uncertainties: string[];
}

export type ImpactType = 
  | 'market_shock'
  | 'policy_shift'
  | 'conflict_escalation'
  | 'diplomatic_breakthrough'
  | 'regulatory_change'
  | 'supply_disruption'
  | 'leadership_change'
  | 'economic_crisis'
  | 'security_threat'
  | 'technology_shift'
  | 'humanitarian_crisis'
  | 'environmental_event';

export type TimeHorizon =
  | 'immediate'    // Hours to days
  | 'short_term'   // Days to weeks
  | 'medium_term'  // Weeks to months
  | 'long_term';   // Months to years

export interface MarketImplication {
  asset: string;           // e.g., "Oil", "USD/CNY", "Defense stocks"
  direction: 'bullish' | 'bearish' | 'volatile' | 'neutral';
  magnitude: 'minor' | 'moderate' | 'significant' | 'major';
  rationale: string;
}

// Alert Configuration
export interface AlertRule {
  id: string;
  name: string;
  enabled: boolean;
  
  // Triggers
  minSeverity?: number;
  minCompositeScore?: number;
  domains?: MonitoringDomain[];
  impactTypes?: ImpactType[];
  keywords?: string[];
  
  // Actions
  actions: AlertAction[];
}

export type AlertAction = 
  | { type: 'highlight' }
  | { type: 'notify'; channel: string }
  | { type: 'webhook'; url: string }
  | { type: 'email'; address: string };

// Dashboard Statistics
export interface IntelligenceStats {
  totalItems: number;
  itemsToday: number;
  criticalAlerts: number;
  highSeverityCount: number;
  
  byDomain: Record<MonitoringDomain, number>;
  bySource: Record<string, number>;
  byImpactType: Record<ImpactType, number>;
  
  avgSeverity: number;
  avgCompositeScore: number;
  
  trendingDomains: MonitoringDomain[];
  recentEscalations: IntelligenceItem[];
}

// Severity Level Definitions
export const SEVERITY_LEVELS = {
  1: { label: 'Minimal', color: 'zinc', description: 'Routine news, limited significance' },
  2: { label: 'Minor', color: 'zinc', description: 'Minor development, low impact expected' },
  3: { label: 'Low', color: 'blue', description: 'Notable but contained' },
  4: { label: 'Moderate', color: 'blue', description: 'Meaningful development worth monitoring' },
  5: { label: 'Elevated', color: 'yellow', description: 'Significant, potential for escalation' },
  6: { label: 'High', color: 'yellow', description: 'Major development, likely market impact' },
  7: { label: 'Serious', color: 'orange', description: 'Serious situation, clear implications' },
  8: { label: 'Severe', color: 'orange', description: 'Severe, immediate attention required' },
  9: { label: 'Critical', color: 'red', description: 'Critical crisis, major disruption' },
  10: { label: 'Extreme', color: 'red', description: 'Extreme emergency, systemic risk' }
} as const;

