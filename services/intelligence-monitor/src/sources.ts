// Geopolitical Intelligence Source Configuration
// Comprehensive monitoring across 100+ domains

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
  | 'broadcaster'
  | 'policy_analysis'
  | 'investigative';

export type MonitoringDomain =
  // === US POLITICS & POWER ===
  | 'us_presidential_power'
  | 'us_congress_budget'
  | 'us_foreign_policy'
  | 'us_constitutional_crisis'
  
  // === GREAT POWER DIPLOMACY ===
  | 'great_power_summitry'
  | 'backchannel_negotiations'
  | 'ceasefire_talks'
  
  // === CHINA & INDO-PACIFIC ===
  | 'china_ccp_policy'
  | 'taiwan_strait'
  | 'south_china_sea'
  | 'japan_defense'
  | 'korean_peninsula'
  | 'india_rise'
  | 'pakistan_stability'
  | 'asia_pacific_alliances'
  
  // === EUROPE & RUSSIA ===
  | 'russia_ukraine_war'
  | 'russia_domestic_stability'
  | 'nato_posture'
  | 'eu_integration'
  | 'european_far_right'
  | 'us_eu_divergence'
  
  // === MIDDLE EAST ===
  | 'middle_east_wars'
  | 'iran_nuclear'
  | 'regional_power_competition'
  
  // === DEFENSE & MILITARY ===
  | 'nuclear_deterrence'
  | 'military_modernization'
  | 'arms_transfers'
  | 'defense_procurement'
  | 'military_doctrine'
  | 'strategic_missile_testing'
  | 'nuclear_incidents'
  
  // === SPACE & CYBER ===
  | 'cyber_conflict'
  | 'space_security'
  | 'space_launch_geopolitics'
  | 'undersea_cables'
  | 'ransomware_retaliation'
  
  // === TERRORISM & VIOLENCE ===
  | 'terrorism'
  | 'terror_safe_havens'
  | 'political_violence'
  
  // === ECONOMIC SECURITY ===
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
  | 'banking_contagion'
  | 'imf_conditionality'
  | 'shadow_banking'
  | 'crypto_sanctions'
  | 'sovereign_wealth_funds'
  
  // === INDUSTRIAL & TECH COMPETITION ===
  | 'ai_competition'
  | 'semiconductor_controls'
  | 'export_controls'
  | 'industrial_policy_race'
  | 'standards_wars'
  | 'machine_tools'
  | 'telecom_standards'
  | 'big_tech_regulation'
  | 'data_sovereignty'
  
  // === MARITIME & TRADE ===
  | 'maritime_chokepoints'
  | 'piracy'
  | 'shipping_insurance'
  | 'port_disruptions'
  | 'commodity_cartels'
  
  // === FOOD & RESOURCES ===
  | 'food_security_diplomacy'
  | 'fertilizer_geopolitics'
  | 'resource_nationalism'
  | 'energy_nationalization'
  | 'water_stress'
  | 'water_infrastructure'
  
  // === CLIMATE & ENVIRONMENT ===
  | 'climate_policy'
  | 'extreme_weather'
  | 'climate_instability'
  | 'biotech_biosecurity'
  
  // === GOVERNANCE & STABILITY ===
  | 'migration_borders'
  | 'pandemics'
  | 'legitimacy_crises'
  | 'coups_backsliding'
  | 'civil_wars'
  | 'authoritarian_succession'
  | 'anti_corruption_weapons'
  | 'border_disputes'
  
  // === INFORMATION & MEDIA ===
  | 'disinformation'
  | 'election_interference'
  | 'state_surveillance'
  | 'censorship_crackdowns'
  | 'press_freedom'
  | 'organized_crime'
  
  // === INFRASTRUCTURE & INFLUENCE ===
  | 'mega_project_diplomacy'
  | 'debt_trap_narratives'
  
  // === REGIONAL ===
  | 'latin_america'
  | 'africa_stability'
  
  // === INTERNATIONAL ORDER ===
  | 'un_dynamics'
  | 'international_law'
  | 'business_state'
  | 'geopolitical_risk_markets'
  | 'macro_narrative';

export const INTELLIGENCE_SOURCES: IntelligenceSource[] = [
  // ============ REUTERS - PRIMARY WIRE SERVICE ============
  {
    id: 'reuters-world',
    name: 'Reuters World',
    category: 'wire_service',
    domains: [
      'us_presidential_power', 'us_congress_budget', 'us_foreign_policy',
      'great_power_summitry', 'backchannel_negotiations', 'ceasefire_talks',
      'china_ccp_policy', 'south_china_sea', 'russia_ukraine_war',
      'iran_nuclear', 'nuclear_deterrence', 'strategic_missile_testing',
      'nuclear_incidents', 'space_launch_geopolitics', 'cyber_conflict',
      'ransomware_retaliation', 'sanctions_regimes', 'energy_security',
      'opec_decisions', 'sovereign_debt', 'currency_wars', 'shadow_banking',
      'crypto_sanctions', 'export_controls', 'maritime_chokepoints',
      'piracy', 'shipping_insurance', 'port_disruptions',
      'food_security_diplomacy', 'fertilizer_geopolitics',
      'energy_nationalization', 'water_infrastructure', 'climate_instability',
      'migration_borders', 'state_surveillance', 'press_freedom',
      'election_interference', 'political_violence', 'anti_corruption_weapons',
      'border_disputes', 'civil_wars', 'india_rise', 'pakistan_stability',
      'korean_peninsula', 'latin_america', 'africa_stability', 'un_dynamics'
    ],
    feedUrl: 'https://www.reutersagency.com/feed/?taxonomy=best-sectors&post_type=best',
    feedType: 'rss',
    updateFrequency: 5,
    reliability: 'high',
    paywall: false
  },
  
  // ============ BLOOMBERG - FINANCIAL & POLITICAL ============
  {
    id: 'bloomberg-politics',
    name: 'Bloomberg Politics',
    category: 'business_financial',
    domains: [
      'us_congress_budget', 'central_bank_policy', 'banking_contagion',
      'geopolitical_risk_markets'
    ],
    feedUrl: 'https://feeds.bloomberg.com/politics/news.rss',
    feedType: 'rss',
    updateFrequency: 10,
    reliability: 'high',
    paywall: true
  },
  {
    id: 'bloomberg-markets',
    name: 'Bloomberg Markets',
    category: 'business_financial',
    domains: [
      'central_bank_policy', 'banking_contagion', 'sovereign_debt',
      'currency_wars', 'geopolitical_risk_markets'
    ],
    feedUrl: 'https://feeds.bloomberg.com/markets/news.rss',
    feedType: 'rss',
    updateFrequency: 10,
    reliability: 'high',
    paywall: true
  },
  
  // ============ FINANCIAL TIMES - GEOPOLITICS & BUSINESS ============
  {
    id: 'ft-world',
    name: 'Financial Times World',
    category: 'business_financial',
    domains: [
      'us_foreign_policy', 'nato_posture', 'eu_integration',
      'european_far_right', 'us_eu_divergence', 'trade_wars',
      'supply_chain', 'critical_minerals', 'imf_conditionality',
      'sovereign_wealth_funds', 'industrial_policy_race', 'standards_wars',
      'machine_tools', 'undersea_cables', 'telecom_standards',
      'big_tech_regulation', 'data_sovereignty', 'commodity_cartels',
      'resource_nationalism', 'mega_project_diplomacy', 'debt_trap_narratives',
      'climate_policy', 'international_law', 'business_state'
    ],
    feedUrl: 'https://www.ft.com/world?format=rss',
    feedType: 'rss',
    updateFrequency: 15,
    reliability: 'high',
    paywall: true
  },
  {
    id: 'ft-tech',
    name: 'Financial Times Technology',
    category: 'business_financial',
    domains: [
      'ai_competition', 'semiconductor_controls', 'big_tech_regulation',
      'telecom_standards', 'data_sovereignty'
    ],
    feedUrl: 'https://www.ft.com/technology?format=rss',
    feedType: 'rss',
    updateFrequency: 20,
    reliability: 'high',
    paywall: true
  },
  
  // ============ AP NEWS - GLOBAL EVENTS ============
  {
    id: 'ap-world',
    name: 'AP World News',
    category: 'wire_service',
    domains: [
      'middle_east_wars', 'inflation_shocks', 'extreme_weather',
      'pandemics', 'terrorism', 'coups_backsliding', 'legitimacy_crises',
      'biotech_biosecurity'
    ],
    feedUrl: 'https://rsshub.app/apnews/topics/world-news',
    feedType: 'rss',
    updateFrequency: 5,
    reliability: 'high',
    paywall: false
  },
  
  // ============ AL JAZEERA - MIDDLE EAST & GLOBAL SOUTH ============
  {
    id: 'aljazeera-world',
    name: 'Al Jazeera',
    category: 'broadcaster',
    domains: [
      'middle_east_wars', 'regional_power_competition', 'terror_safe_havens',
      'civil_wars', 'legitimacy_crises'
    ],
    feedUrl: 'https://www.aljazeera.com/xml/rss/all.xml',
    feedType: 'rss',
    updateFrequency: 10,
    reliability: 'high',
    paywall: false
  },
  
  // ============ NIKKEI ASIA - INDO-PACIFIC ============
  {
    id: 'nikkei-asia',
    name: 'Nikkei Asia',
    category: 'regional_specialist',
    domains: [
      'taiwan_strait', 'japan_defense', 'asia_pacific_alliances',
      'south_china_sea', 'china_ccp_policy'
    ],
    feedUrl: 'https://asia.nikkei.com/rss/feed/nar',
    feedType: 'rss',
    updateFrequency: 30,
    reliability: 'high',
    paywall: true
  },
  
  // ============ THE DIPLOMAT - ASIA-PACIFIC ANALYSIS ============
  {
    id: 'diplomat-asia',
    name: 'The Diplomat',
    category: 'policy_analysis',
    domains: [
      'asia_pacific_alliances', 'taiwan_strait', 'south_china_sea',
      'china_ccp_policy', 'japan_defense', 'korean_peninsula'
    ],
    feedUrl: 'https://thediplomat.com/feed/',
    feedType: 'rss',
    updateFrequency: 60,
    reliability: 'high',
    paywall: false
  },
  
  // ============ THE ECONOMIST - ANALYSIS & DOCTRINE ============
  {
    id: 'economist-world',
    name: 'The Economist',
    category: 'policy_analysis',
    domains: [
      'military_doctrine', 'authoritarian_succession', 'debt_trap_narratives',
      'macro_narrative', 'geopolitical_risk_markets'
    ],
    feedUrl: 'https://www.economist.com/international/rss.xml',
    feedType: 'rss',
    updateFrequency: 60,
    reliability: 'high',
    paywall: true
  },
  
  // ============ DEFENSE NEWS - MILITARY & PROCUREMENT ============
  {
    id: 'defense-news',
    name: 'Defense News',
    category: 'defense_security',
    domains: [
      'defense_procurement', 'military_modernization', 'arms_transfers',
      'military_doctrine', 'nato_posture'
    ],
    feedUrl: 'https://www.defensenews.com/arc/outboundfeeds/rss/?outputType=xml',
    feedType: 'rss',
    updateFrequency: 30,
    reliability: 'high',
    paywall: false
  },
  
  // ============ JANES - DEFENSE INTELLIGENCE ============
  {
    id: 'janes-defense',
    name: 'Janes Defense',
    category: 'defense_security',
    domains: [
      'nuclear_deterrence', 'military_modernization', 'arms_transfers',
      'space_security', 'strategic_missile_testing', 'defense_procurement'
    ],
    scrapeUrl: 'https://www.janes.com/defence-news',
    feedType: 'scrape',
    updateFrequency: 60,
    reliability: 'high',
    paywall: true
  },
  
  // ============ RFE/RL - RUSSIA & EURASIA ============
  {
    id: 'rferl-russia',
    name: 'Radio Free Europe/Radio Liberty',
    category: 'broadcaster',
    domains: [
      'russia_domestic_stability', 'russia_ukraine_war',
      'censorship_crackdowns', 'authoritarian_succession',
      'state_surveillance'
    ],
    feedUrl: 'https://www.rferl.org/api/z-pqpiev-qpp',
    feedType: 'rss',
    updateFrequency: 30,
    reliability: 'high',
    paywall: false
  },
  
  // ============ POLITICO - US & EU POLITICS ============
  {
    id: 'politico-us',
    name: 'Politico',
    category: 'policy_analysis',
    domains: [
      'us_constitutional_crisis', 'us_congress_budget',
      'data_sovereignty', 'us_eu_divergence'
    ],
    feedUrl: 'https://rss.politico.com/politics-news.xml',
    feedType: 'rss',
    updateFrequency: 15,
    reliability: 'high',
    paywall: false
  },
  
  // ============ BBC - INVESTIGATIONS ============
  {
    id: 'bbc-world',
    name: 'BBC World Service',
    category: 'broadcaster',
    domains: [
      'disinformation', 'election_interference', 'press_freedom'
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
  us_presidential_power: { label: 'US Presidential Power', category: 'US Politics', description: 'Executive actions, policy shifts', priority: 'critical' },
  us_congress_budget: { label: 'US Congress & Budget', category: 'US Politics', description: 'Legislative action, shutdown risk', priority: 'high' },
  us_foreign_policy: { label: 'US Foreign Policy', category: 'US Politics', description: 'Alliances, strategic posture', priority: 'critical' },
  us_constitutional_crisis: { label: 'Constitutional Crisis', category: 'US Politics', description: 'Court-executive clashes, impeachments', priority: 'critical' },
  
  // Great Power Diplomacy
  great_power_summitry: { label: 'Great Power Summitry', category: 'Diplomacy', description: 'US-China, US-Russia high-level talks', priority: 'critical' },
  backchannel_negotiations: { label: 'Backchannel Talks', category: 'Diplomacy', description: 'Secret negotiations, mediation', priority: 'high' },
  ceasefire_talks: { label: 'Ceasefire Negotiations', category: 'Diplomacy', description: 'High-stakes conflict mediation', priority: 'critical' },
  
  // China & Indo-Pacific
  china_ccp_policy: { label: 'China CCP Policy', category: 'China & Indo-Pacific', description: 'Leadership decisions, party direction', priority: 'critical' },
  taiwan_strait: { label: 'Taiwan Strait', category: 'China & Indo-Pacific', description: 'Cross-strait tensions, military activity', priority: 'critical' },
  south_china_sea: { label: 'South China Sea', category: 'China & Indo-Pacific', description: 'Maritime disputes, territorial claims', priority: 'high' },
  japan_defense: { label: 'Japan Defense', category: 'China & Indo-Pacific', description: 'Military modernization, alliance', priority: 'high' },
  korean_peninsula: { label: 'Korean Peninsula', category: 'China & Indo-Pacific', description: 'DPRK missiles, deterrence', priority: 'critical' },
  india_rise: { label: 'India Rise', category: 'China & Indo-Pacific', description: 'Economic growth, strategic posture', priority: 'high' },
  pakistan_stability: { label: 'Pakistan Stability', category: 'China & Indo-Pacific', description: 'Political stability, nuclear security', priority: 'critical' },
  asia_pacific_alliances: { label: 'Asia-Pacific Alliances', category: 'China & Indo-Pacific', description: 'Quad, AUKUS, basing politics', priority: 'high' },
  
  // Europe & Russia
  russia_ukraine_war: { label: 'Russia-Ukraine War', category: 'Europe & Russia', description: 'Military operations, escalation risk', priority: 'critical' },
  russia_domestic_stability: { label: 'Russia Domestic', category: 'Europe & Russia', description: 'Elite politics, internal stability', priority: 'high' },
  nato_posture: { label: 'NATO Posture', category: 'Europe & Russia', description: 'Alliance readiness, burden-sharing', priority: 'high' },
  eu_integration: { label: 'EU Integration', category: 'Europe & Russia', description: 'Regulatory changes, autonomy', priority: 'medium' },
  european_far_right: { label: 'European Far-Right', category: 'Europe & Russia', description: 'Coalition shifts affecting EU policy', priority: 'high' },
  us_eu_divergence: { label: 'US-EU Divergence', category: 'Europe & Russia', description: 'Regulatory splits, alliance friction', priority: 'high' },
  
  // Middle East
  middle_east_wars: { label: 'Middle East Conflicts', category: 'Middle East', description: 'Active conflicts, ceasefires', priority: 'critical' },
  iran_nuclear: { label: 'Iran Nuclear', category: 'Middle East', description: 'Nuclear program, Gulf security', priority: 'critical' },
  regional_power_competition: { label: 'Regional Power Competition', category: 'Middle East', description: 'Turkey/Saudi/Iran/Israel rivalry', priority: 'high' },
  
  // Defense & Military
  nuclear_deterrence: { label: 'Nuclear Deterrence', category: 'Defense & Security', description: 'Arms control, posture shifts', priority: 'critical' },
  military_modernization: { label: 'Military Modernization', category: 'Defense & Security', description: 'Great power capabilities', priority: 'high' },
  arms_transfers: { label: 'Arms Transfers', category: 'Defense & Security', description: 'Defense trade, industrial capacity', priority: 'medium' },
  defense_procurement: { label: 'Defense Procurement', category: 'Defense & Security', description: 'Budgets, programs, delays', priority: 'medium' },
  military_doctrine: { label: 'Military Doctrine', category: 'Defense & Security', description: 'Force posture, readiness changes', priority: 'high' },
  strategic_missile_testing: { label: 'Missile Testing', category: 'Defense & Security', description: 'ICBMs, IRBMs, hypersonics', priority: 'critical' },
  nuclear_incidents: { label: 'Nuclear Incidents', category: 'Defense & Security', description: 'Accidents, radiological risks', priority: 'critical' },
  
  // Space & Cyber
  cyber_conflict: { label: 'Cyber Conflict', category: 'Cyber & Space', description: 'State-backed hacking', priority: 'high' },
  space_security: { label: 'Space Security', category: 'Cyber & Space', description: 'ASAT tests, satellite warfare', priority: 'high' },
  space_launch_geopolitics: { label: 'Space Launch Politics', category: 'Cyber & Space', description: 'Dual-use tech, orbit access', priority: 'medium' },
  undersea_cables: { label: 'Undersea Cables', category: 'Cyber & Space', description: 'Connectivity chokepoints', priority: 'high' },
  ransomware_retaliation: { label: 'Ransomware & Retaliation', category: 'Cyber & Space', description: 'Cross-border cyber attacks', priority: 'high' },
  
  // Terrorism & Violence
  terrorism: { label: 'Terrorism', category: 'Security Threats', description: 'Attack threats, counterterror ops', priority: 'high' },
  terror_safe_havens: { label: 'Terror Safe Havens', category: 'Security Threats', description: 'Cross-border insurgency', priority: 'high' },
  political_violence: { label: 'Political Violence', category: 'Security Threats', description: 'Assassinations, spillovers', priority: 'high' },
  
  // Economic Security
  sanctions_regimes: { label: 'Sanctions Regimes', category: 'Economic Security', description: 'New sanctions, enforcement', priority: 'high' },
  trade_wars: { label: 'Trade Wars', category: 'Economic Security', description: 'Tariffs, export controls', priority: 'high' },
  supply_chain: { label: 'Supply Chain', category: 'Economic Security', description: 'De-risking, reshoring', priority: 'high' },
  critical_minerals: { label: 'Critical Minerals', category: 'Economic Security', description: 'Rare earths, lithium supply', priority: 'high' },
  energy_security: { label: 'Energy Security', category: 'Economic Security', description: 'Oil/gas shocks', priority: 'critical' },
  opec_decisions: { label: 'OPEC+ Decisions', category: 'Economic Security', description: 'Production cuts, politics', priority: 'high' },
  central_bank_policy: { label: 'Central Bank Policy', category: 'Economic Security', description: 'Fed/ECB/BoJ decisions', priority: 'critical' },
  sovereign_debt: { label: 'Sovereign Debt', category: 'Economic Security', description: 'EM crises, restructuring', priority: 'high' },
  currency_wars: { label: 'Currency Wars', category: 'Economic Security', description: 'FX crises, capital controls', priority: 'high' },
  inflation_shocks: { label: 'Inflation Shocks', category: 'Economic Security', description: 'Food prices, unrest', priority: 'high' },
  banking_contagion: { label: 'Banking Contagion', category: 'Economic Security', description: 'Stress and contagion politics', priority: 'critical' },
  imf_conditionality: { label: 'IMF Conditionality', category: 'Economic Security', description: 'Shaping domestic politics', priority: 'medium' },
  shadow_banking: { label: 'Shadow Banking', category: 'Economic Security', description: 'Offshore finance, evasion', priority: 'medium' },
  crypto_sanctions: { label: 'Crypto & Sanctions', category: 'Economic Security', description: 'Illicit finance vectors', priority: 'medium' },
  sovereign_wealth_funds: { label: 'Sovereign Wealth Funds', category: 'Economic Security', description: 'Strategic investments', priority: 'medium' },
  
  // Industrial & Tech
  ai_competition: { label: 'AI Competition', category: 'Technology', description: 'AI race, compute controls', priority: 'high' },
  semiconductor_controls: { label: 'Semiconductor Controls', category: 'Technology', description: 'Chip export controls', priority: 'critical' },
  export_controls: { label: 'Export Controls', category: 'Technology', description: 'Chips, lithography, AI', priority: 'critical' },
  industrial_policy_race: { label: 'Industrial Policy Race', category: 'Technology', description: 'Subsidies, reshoring', priority: 'high' },
  standards_wars: { label: 'Standards Wars', category: 'Technology', description: 'ISO/ITU governance fights', priority: 'medium' },
  machine_tools: { label: 'Machine Tools', category: 'Technology', description: 'Dual-use manufacturing', priority: 'medium' },
  telecom_standards: { label: 'Telecom Standards', category: 'Technology', description: '5G/6G governance battles', priority: 'high' },
  big_tech_regulation: { label: 'Big Tech Regulation', category: 'Technology', description: 'Platform bans, fines', priority: 'high' },
  data_sovereignty: { label: 'Data Sovereignty', category: 'Technology', description: 'Digital sovereignty laws', priority: 'medium' },
  
  // Maritime & Trade
  maritime_chokepoints: { label: 'Maritime Chokepoints', category: 'Maritime', description: 'Suez, Hormuz disruptions', priority: 'critical' },
  piracy: { label: 'Piracy', category: 'Maritime', description: 'Maritime security threats', priority: 'medium' },
  shipping_insurance: { label: 'Shipping Insurance', category: 'Maritime', description: 'War-risk premia crises', priority: 'high' },
  port_disruptions: { label: 'Port Disruptions', category: 'Maritime', description: 'Strikes, blockades', priority: 'high' },
  commodity_cartels: { label: 'Commodity Cartels', category: 'Maritime', description: 'Gas, metals coordination', priority: 'medium' },
  
  // Food & Resources
  food_security_diplomacy: { label: 'Food Security', category: 'Resources', description: 'Grain corridors, bans', priority: 'high' },
  fertilizer_geopolitics: { label: 'Fertilizer Geopolitics', category: 'Resources', description: 'Sanctions, supply shocks', priority: 'high' },
  resource_nationalism: { label: 'Resource Nationalism', category: 'Resources', description: 'Expropriations', priority: 'medium' },
  energy_nationalization: { label: 'Energy Nationalization', category: 'Resources', description: 'Asset seizures, resets', priority: 'high' },
  water_stress: { label: 'Water Stress', category: 'Resources', description: 'Transboundary disputes', priority: 'medium' },
  water_infrastructure: { label: 'Water Infrastructure', category: 'Resources', description: 'Dam/canal sabotage', priority: 'high' },
  
  // Climate
  climate_policy: { label: 'Climate Policy', category: 'Climate', description: 'Carbon borders, net-zero', priority: 'medium' },
  extreme_weather: { label: 'Extreme Weather', category: 'Climate', description: 'Disasters, stability impacts', priority: 'high' },
  climate_instability: { label: 'Climate Instability', category: 'Climate', description: 'Heat, drought driving unrest', priority: 'high' },
  biotech_biosecurity: { label: 'Biotech & Biosecurity', category: 'Climate', description: 'Lab safety, bans', priority: 'high' },
  
  // Governance & Stability
  migration_borders: { label: 'Migration & Borders', category: 'Stability', description: 'Migration surges', priority: 'medium' },
  pandemics: { label: 'Pandemics', category: 'Stability', description: 'Health security', priority: 'high' },
  legitimacy_crises: { label: 'Legitimacy Crises', category: 'Stability', description: 'Protests, contested elections', priority: 'high' },
  coups_backsliding: { label: 'Coups & Backsliding', category: 'Stability', description: 'Democratic erosion', priority: 'high' },
  civil_wars: { label: 'Civil Wars', category: 'Stability', description: 'Insurgencies, conflicts', priority: 'high' },
  authoritarian_succession: { label: 'Authoritarian Succession', category: 'Stability', description: 'Elite splits, uncertainty', priority: 'high' },
  anti_corruption_weapons: { label: 'Anti-Corruption Weapons', category: 'Stability', description: 'Campaigns as political tools', priority: 'medium' },
  border_disputes: { label: 'Border Disputes', category: 'Stability', description: 'Small lines, big wars', priority: 'high' },
  
  // Information & Media
  disinformation: { label: 'Disinformation', category: 'Information', description: 'Info ops, interference', priority: 'high' },
  election_interference: { label: 'Election Interference', category: 'Information', description: 'Foreign influence ops', priority: 'critical' },
  state_surveillance: { label: 'State Surveillance', category: 'Information', description: 'Security expansions', priority: 'medium' },
  censorship_crackdowns: { label: 'Censorship Crackdowns', category: 'Information', description: 'Media controls', priority: 'medium' },
  press_freedom: { label: 'Press Freedom', category: 'Information', description: 'Flashpoints affecting diplomacy', priority: 'medium' },
  organized_crime: { label: 'Organized Crime', category: 'Information', description: 'Criminal networks', priority: 'medium' },
  
  // Infrastructure & Influence
  mega_project_diplomacy: { label: 'Mega-Project Diplomacy', category: 'Infrastructure', description: 'Ports, rail, corridors', priority: 'medium' },
  debt_trap_narratives: { label: 'Debt-Trap Narratives', category: 'Infrastructure', description: 'Infrastructure influence', priority: 'medium' },
  
  // Regional
  latin_america: { label: 'Latin America', category: 'Regional', description: 'Brazil, Mexico, Andes', priority: 'medium' },
  africa_stability: { label: 'Africa Stability', category: 'Regional', description: 'Sahel, Great Lakes, Horn', priority: 'high' },
  
  // International Order
  un_dynamics: { label: 'UN Dynamics', category: 'International', description: 'Security Council', priority: 'medium' },
  international_law: { label: 'International Law', category: 'International', description: 'ICJ/ICC rulings', priority: 'medium' },
  business_state: { label: 'Business-State Relations', category: 'International', description: 'Industrial policy', priority: 'medium' },
  geopolitical_risk_markets: { label: 'Geopolitical Risk Markets', category: 'International', description: 'Risk as market driver', priority: 'high' },
  macro_narrative: { label: 'Macro Narrative', category: 'International', description: 'How leaders frame world order', priority: 'medium' }
};

// Category groupings for the macro report
export const MACRO_CATEGORIES = {
  'Great Power Competition': ['us_foreign_policy', 'china_ccp_policy', 'russia_ukraine_war', 'great_power_summitry', 'taiwan_strait'],
  'Military & Nuclear': ['nuclear_deterrence', 'strategic_missile_testing', 'military_modernization', 'nato_posture'],
  'Economic Warfare': ['sanctions_regimes', 'trade_wars', 'semiconductor_controls', 'export_controls', 'central_bank_policy'],
  'Energy & Resources': ['energy_security', 'opec_decisions', 'critical_minerals', 'food_security_diplomacy'],
  'Regional Hotspots': ['middle_east_wars', 'korean_peninsula', 'south_china_sea', 'africa_stability'],
  'Cyber & Tech': ['cyber_conflict', 'ai_competition', 'undersea_cables', 'ransomware_retaliation'],
  'Governance & Stability': ['coups_backsliding', 'legitimacy_crises', 'election_interference', 'authoritarian_succession']
};
