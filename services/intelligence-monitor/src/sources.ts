// Geopolitical Intelligence Source Configuration
// Each source maps to specific monitoring domains

export interface IntelligenceSource {
  id: string;
  name: string;
  category: SourceCategory;
  domains: MonitoringDomain[];
  feedUrl?: string;
  scrapeUrl?: string;
  feedType: 'rss' | 'api' | 'scrape';
  updateFrequency: number; // minutes
  reliability: 'high' | 'medium' | 'low';
  paywall: boolean;
}

export type SourceCategory = 
  | 'wire_service'
  | 'business_financial'
  | 'defense_security'
  | 'regional_specialist'
  | 'broadcaster';

export type MonitoringDomain =
  // US Politics & Power
  | 'us_presidential_power'
  | 'us_congress_budget'
  | 'us_foreign_policy'
  // China & Indo-Pacific
  | 'china_ccp_policy'
  | 'taiwan_strait'
  | 'south_china_sea'
  | 'japan_defense'
  | 'korean_peninsula'
  | 'india_rise'
  | 'pakistan_stability'
  // Europe & Russia
  | 'russia_ukraine_war'
  | 'nato_posture'
  | 'eu_integration'
  // Middle East
  | 'middle_east_wars'
  | 'iran_nuclear'
  // Defense & Security
  | 'nuclear_deterrence'
  | 'military_modernization'
  | 'arms_transfers'
  | 'cyber_conflict'
  | 'space_security'
  | 'terrorism'
  // Economic & Trade
  | 'sanctions_regimes'
  | 'trade_wars'
  | 'supply_chain'
  | 'critical_minerals'
  | 'energy_security'
  | 'opec_decisions'
  | 'central_bank_policy'
  | 'sovereign_debt'
  | 'currency_wars'
  | 'inflation_shocks'
  // Climate & Resources
  | 'climate_policy'
  | 'extreme_weather'
  | 'water_stress'
  // Stability & Governance
  | 'migration_borders'
  | 'pandemics'
  | 'disinformation'
  | 'coups_backsliding'
  | 'civil_wars'
  | 'organized_crime'
  // Technology
  | 'ai_competition'
  | 'semiconductor_controls'
  // Maritime & Trade Routes
  | 'maritime_chokepoints'
  | 'piracy'
  // Regional
  | 'latin_america'
  | 'africa_stability'
  // International Order
  | 'un_dynamics'
  | 'international_law'
  | 'business_state'
  | 'geopolitical_risk_markets';

export const INTELLIGENCE_SOURCES: IntelligenceSource[] = [
  // REUTERS - Primary Wire Service
  {
    id: 'reuters-world',
    name: 'Reuters World News',
    category: 'wire_service',
    domains: [
      'us_presidential_power', 'us_congress_budget', 'china_ccp_policy',
      'south_china_sea', 'russia_ukraine_war', 'iran_nuclear',
      'sanctions_regimes', 'energy_security', 'opec_decisions',
      'sovereign_debt', 'currency_wars', 'migration_borders',
      'cyber_conflict', 'semiconductor_controls', 'maritime_chokepoints',
      'piracy', 'organized_crime', 'civil_wars', 'india_rise',
      'pakistan_stability', 'korean_peninsula', 'latin_america',
      'africa_stability', 'un_dynamics'
    ],
    feedUrl: 'https://www.reutersagency.com/feed/?taxonomy=best-sectors&post_type=best',
    feedType: 'rss',
    updateFrequency: 5,
    reliability: 'high',
    paywall: false
  },
  
  // BLOOMBERG - Financial & Political
  {
    id: 'bloomberg-politics',
    name: 'Bloomberg Politics',
    category: 'business_financial',
    domains: [
      'us_congress_budget', 'central_bank_policy', 'geopolitical_risk_markets'
    ],
    feedUrl: 'https://feeds.bloomberg.com/politics/news.rss',
    feedType: 'rss',
    updateFrequency: 10,
    reliability: 'high',
    paywall: true
  },
  
  // FINANCIAL TIMES - Business & Geopolitics
  {
    id: 'ft-world',
    name: 'Financial Times World',
    category: 'business_financial',
    domains: [
      'us_foreign_policy', 'nato_posture', 'eu_integration',
      'trade_wars', 'supply_chain', 'critical_minerals',
      'climate_policy', 'ai_competition', 'international_law',
      'business_state'
    ],
    feedUrl: 'https://www.ft.com/world?format=rss',
    feedType: 'rss',
    updateFrequency: 15,
    reliability: 'high',
    paywall: true
  },
  
  // AP NEWS - Global Coverage
  {
    id: 'ap-world',
    name: 'AP World News',
    category: 'wire_service',
    domains: [
      'middle_east_wars', 'inflation_shocks', 'extreme_weather',
      'pandemics', 'terrorism', 'coups_backsliding', 'water_stress'
    ],
    feedUrl: 'https://rsshub.app/apnews/topics/world-news',
    feedType: 'rss',
    updateFrequency: 5,
    reliability: 'high',
    paywall: false
  },
  
  // NIKKEI ASIA - Indo-Pacific Focus
  {
    id: 'nikkei-asia',
    name: 'Nikkei Asia',
    category: 'regional_specialist',
    domains: [
      'taiwan_strait', 'japan_defense'
    ],
    feedUrl: 'https://asia.nikkei.com/rss/feed/nar',
    feedType: 'rss',
    updateFrequency: 30,
    reliability: 'high',
    paywall: true
  },
  
  // JANES - Defense & Security Intelligence
  {
    id: 'janes-defense',
    name: 'Janes Defense',
    category: 'defense_security',
    domains: [
      'nuclear_deterrence', 'military_modernization', 'arms_transfers',
      'space_security'
    ],
    scrapeUrl: 'https://www.janes.com/defence-news',
    feedType: 'scrape',
    updateFrequency: 60,
    reliability: 'high',
    paywall: true
  },
  
  // BBC - Investigations & Verify
  {
    id: 'bbc-world',
    name: 'BBC World Service',
    category: 'broadcaster',
    domains: [
      'disinformation'
    ],
    feedUrl: 'https://feeds.bbci.co.uk/news/world/rss.xml',
    feedType: 'rss',
    updateFrequency: 10,
    reliability: 'high',
    paywall: false
  }
];

// Domain metadata for UI display and filtering
export const DOMAIN_METADATA: Record<MonitoringDomain, {
  label: string;
  category: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
}> = {
  // US Politics
  us_presidential_power: {
    label: 'US Presidential Power',
    category: 'US Politics',
    description: 'Executive actions, policy shifts, leadership decisions',
    priority: 'critical'
  },
  us_congress_budget: {
    label: 'US Congress & Budget',
    category: 'US Politics',
    description: 'Legislative action, shutdown risk, appropriations',
    priority: 'high'
  },
  us_foreign_policy: {
    label: 'US Foreign Policy',
    category: 'US Politics',
    description: 'Alliances, strategic posture, doctrine shifts',
    priority: 'critical'
  },
  
  // China & Indo-Pacific
  china_ccp_policy: {
    label: 'China CCP Policy',
    category: 'China & Indo-Pacific',
    description: 'Leadership decisions, party direction, internal politics',
    priority: 'critical'
  },
  taiwan_strait: {
    label: 'Taiwan Strait',
    category: 'China & Indo-Pacific',
    description: 'Cross-strait tensions, military activity, diplomacy',
    priority: 'critical'
  },
  south_china_sea: {
    label: 'South China Sea',
    category: 'China & Indo-Pacific',
    description: 'Maritime disputes, territorial claims, naval activity',
    priority: 'high'
  },
  japan_defense: {
    label: 'Japan Defense',
    category: 'China & Indo-Pacific',
    description: 'Military modernization, alliance coordination',
    priority: 'high'
  },
  korean_peninsula: {
    label: 'Korean Peninsula',
    category: 'China & Indo-Pacific',
    description: 'DPRK missiles, deterrence, diplomacy',
    priority: 'critical'
  },
  india_rise: {
    label: 'India Rise',
    category: 'China & Indo-Pacific',
    description: 'Economic growth, strategic posture, regional influence',
    priority: 'high'
  },
  pakistan_stability: {
    label: 'Pakistan Stability',
    category: 'China & Indo-Pacific',
    description: 'Political stability, nuclear security, crisis risk',
    priority: 'critical'
  },
  
  // Europe & Russia
  russia_ukraine_war: {
    label: 'Russia-Ukraine War',
    category: 'Europe & Russia',
    description: 'Military operations, diplomatic efforts, escalation risk',
    priority: 'critical'
  },
  nato_posture: {
    label: 'NATO Posture',
    category: 'Europe & Russia',
    description: 'Alliance readiness, burden-sharing, expansion',
    priority: 'high'
  },
  eu_integration: {
    label: 'EU Integration',
    category: 'Europe & Russia',
    description: 'Regulatory changes, strategic autonomy, enlargement',
    priority: 'medium'
  },
  
  // Middle East
  middle_east_wars: {
    label: 'Middle East Conflicts',
    category: 'Middle East',
    description: 'Active conflicts, ceasefires, regional realignments',
    priority: 'critical'
  },
  iran_nuclear: {
    label: 'Iran Nuclear',
    category: 'Middle East',
    description: 'Nuclear program, Gulf security, sanctions',
    priority: 'critical'
  },
  
  // Defense & Security
  nuclear_deterrence: {
    label: 'Nuclear Deterrence',
    category: 'Defense & Security',
    description: 'Arms control, posture shifts, proliferation',
    priority: 'critical'
  },
  military_modernization: {
    label: 'Military Modernization',
    category: 'Defense & Security',
    description: 'Great power capabilities, force structure',
    priority: 'high'
  },
  arms_transfers: {
    label: 'Arms Transfers',
    category: 'Defense & Security',
    description: 'Defense trade, industrial capacity',
    priority: 'medium'
  },
  cyber_conflict: {
    label: 'Cyber Conflict',
    category: 'Defense & Security',
    description: 'State-backed hacking, critical infrastructure',
    priority: 'high'
  },
  space_security: {
    label: 'Space Security',
    category: 'Defense & Security',
    description: 'ASAT tests, satellite warfare, debris',
    priority: 'high'
  },
  terrorism: {
    label: 'Terrorism',
    category: 'Defense & Security',
    description: 'Attack threats, counterterror operations',
    priority: 'high'
  },
  
  // Economic & Trade
  sanctions_regimes: {
    label: 'Sanctions Regimes',
    category: 'Economic Security',
    description: 'New sanctions, enforcement, evasion',
    priority: 'high'
  },
  trade_wars: {
    label: 'Trade Wars',
    category: 'Economic Security',
    description: 'Tariffs, export controls, trade disputes',
    priority: 'high'
  },
  supply_chain: {
    label: 'Supply Chain',
    category: 'Economic Security',
    description: 'De-risking, reshoring, fragmentation',
    priority: 'high'
  },
  critical_minerals: {
    label: 'Critical Minerals',
    category: 'Economic Security',
    description: 'Rare earths, lithium, cobalt supply',
    priority: 'high'
  },
  energy_security: {
    label: 'Energy Security',
    category: 'Economic Security',
    description: 'Oil/gas shocks, supply disruptions',
    priority: 'critical'
  },
  opec_decisions: {
    label: 'OPEC+ Decisions',
    category: 'Economic Security',
    description: 'Production cuts, producer politics',
    priority: 'high'
  },
  central_bank_policy: {
    label: 'Central Bank Policy',
    category: 'Economic Security',
    description: 'Fed/ECB/BoJ decisions, rate changes',
    priority: 'critical'
  },
  sovereign_debt: {
    label: 'Sovereign Debt',
    category: 'Economic Security',
    description: 'EM crises, restructuring, defaults',
    priority: 'high'
  },
  currency_wars: {
    label: 'Currency Wars',
    category: 'Economic Security',
    description: 'FX crises, capital controls, devaluations',
    priority: 'high'
  },
  inflation_shocks: {
    label: 'Inflation Shocks',
    category: 'Economic Security',
    description: 'Food prices, political unrest',
    priority: 'high'
  },
  
  // Climate & Resources
  climate_policy: {
    label: 'Climate Policy',
    category: 'Climate & Resources',
    description: 'Carbon borders, net-zero commitments',
    priority: 'medium'
  },
  extreme_weather: {
    label: 'Extreme Weather',
    category: 'Climate & Resources',
    description: 'Disasters, stability impacts',
    priority: 'high'
  },
  water_stress: {
    label: 'Water Stress',
    category: 'Climate & Resources',
    description: 'Transboundary disputes, scarcity',
    priority: 'medium'
  },
  
  // Stability & Governance
  migration_borders: {
    label: 'Migration & Borders',
    category: 'Stability',
    description: 'Migration surges, border politics',
    priority: 'medium'
  },
  pandemics: {
    label: 'Pandemics',
    category: 'Stability',
    description: 'Health security, cross-border spread',
    priority: 'high'
  },
  disinformation: {
    label: 'Disinformation',
    category: 'Stability',
    description: 'Election interference, info ops',
    priority: 'high'
  },
  coups_backsliding: {
    label: 'Coups & Backsliding',
    category: 'Stability',
    description: 'Democratic erosion, military takeovers',
    priority: 'high'
  },
  civil_wars: {
    label: 'Civil Wars',
    category: 'Stability',
    description: 'Insurgencies, internal conflicts',
    priority: 'high'
  },
  organized_crime: {
    label: 'Organized Crime',
    category: 'Stability',
    description: 'Criminal networks, state impacts',
    priority: 'medium'
  },
  
  // Technology
  ai_competition: {
    label: 'AI Competition',
    category: 'Technology',
    description: 'AI race, compute controls, model governance',
    priority: 'high'
  },
  semiconductor_controls: {
    label: 'Semiconductor Controls',
    category: 'Technology',
    description: 'Chip export controls, tech decoupling',
    priority: 'critical'
  },
  
  // Maritime
  maritime_chokepoints: {
    label: 'Maritime Chokepoints',
    category: 'Maritime Security',
    description: 'Suez, Hormuz, Malacca disruptions',
    priority: 'critical'
  },
  piracy: {
    label: 'Piracy',
    category: 'Maritime Security',
    description: 'Maritime security threats',
    priority: 'medium'
  },
  
  // Regional
  latin_america: {
    label: 'Latin America',
    category: 'Regional',
    description: 'Brazil, Mexico, Andes macro politics',
    priority: 'medium'
  },
  africa_stability: {
    label: 'Africa Stability',
    category: 'Regional',
    description: 'Sahel, Great Lakes, Horn crises',
    priority: 'high'
  },
  
  // International Order
  un_dynamics: {
    label: 'UN Dynamics',
    category: 'International Order',
    description: 'Security Council, multilateral legitimacy',
    priority: 'medium'
  },
  international_law: {
    label: 'International Law',
    category: 'International Order',
    description: 'ICJ/ICC rulings, treaty disputes',
    priority: 'medium'
  },
  business_state: {
    label: 'Business-State Relations',
    category: 'International Order',
    description: 'Industrial policy, subsidies, state capitalism',
    priority: 'medium'
  },
  geopolitical_risk_markets: {
    label: 'Geopolitical Risk Markets',
    category: 'International Order',
    description: 'Risk as market driver, cross-asset impact',
    priority: 'high'
  }
};

