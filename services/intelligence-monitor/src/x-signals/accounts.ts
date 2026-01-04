/**
 * X Account Registry
 * 
 * Curated list of high-signal X accounts for market intelligence
 */

import { Account, AccountCategory, KeywordBundle } from './types';

// ============ SEED ACCOUNTS v1 ============

export const SEED_ACCOUNTS: Account[] = [
  // === ECONOMY ===
  {
    account_id: 'javierblas',
    handle: '@JavierBlas',
    display_name: 'Javier Blas',
    category: 'Economy',
    subdomain: 'Commodities',
    tier: 1,
    credibility_score: 0.95,
    region: 'Global',
    active: true,
    notes: 'Bloomberg commodities lead, primary source for oil/gas'
  },
  {
    account_id: 'energyintel',
    handle: '@EnergyIntel',
    display_name: 'Energy Intelligence',
    category: 'Economy',
    subdomain: 'Energy',
    tier: 1,
    credibility_score: 0.92,
    region: 'Global',
    active: true,
    notes: 'Infrastructure & outages, OPEC coverage'
  },
  {
    account_id: 'freightwaves',
    handle: '@FreightWaves',
    display_name: 'FreightWaves',
    category: 'Economy',
    subdomain: 'Logistics',
    tier: 2,
    credibility_score: 0.85,
    region: 'Global',
    active: true,
    notes: 'Shipping & trucking disruptions'
  },
  {
    account_id: 'macroalf',
    handle: '@MacroAlf',
    display_name: 'Alfonso Peccatiello',
    category: 'Economy',
    subdomain: 'Macro',
    tier: 2,
    credibility_score: 0.88,
    region: 'Global',
    active: true,
    notes: 'Rates & inflation analysis'
  },
  {
    account_id: 'charliebilello',
    handle: '@charliebilello',
    display_name: 'Charlie Bilello',
    category: 'Economy',
    subdomain: 'Markets',
    tier: 2,
    credibility_score: 0.87,
    region: 'US',
    active: true,
    notes: 'Macro visualizations'
  },
  {
    account_id: 'zabormarket',
    handle: '@zabormarket',
    display_name: 'Zoltan Pozsar',
    category: 'Economy',
    subdomain: 'Macro',
    tier: 1,
    credibility_score: 0.94,
    region: 'Global',
    active: true,
    notes: 'Former Credit Suisse, rates expert'
  },
  {
    account_id: 'faborhayes',
    handle: '@FedGuy12',
    display_name: 'Joseph Wang',
    category: 'Economy',
    subdomain: 'Fed Policy',
    tier: 1,
    credibility_score: 0.93,
    region: 'US',
    active: true,
    notes: 'Former Fed trader, policy insights'
  },

  // === POLITICS / CONFLICT ===
  {
    account_id: 'reuters',
    handle: '@Reuters',
    display_name: 'Reuters',
    category: 'Politics',
    subdomain: 'Global Politics',
    tier: 1,
    credibility_score: 0.98,
    region: 'Global',
    active: true,
    notes: 'Primary confirmation source'
  },
  {
    account_id: 'sentdefender',
    handle: '@sentdefender',
    display_name: 'OSINTdefender',
    category: 'Politics',
    subdomain: 'Conflict OSINT',
    tier: 1,
    credibility_score: 0.90,
    region: 'Global',
    active: true,
    notes: 'Early escalation detection, military movements'
  },
  {
    account_id: 'elintnews',
    handle: '@ELINTNews',
    display_name: 'ELINT News',
    category: 'Politics',
    subdomain: 'Military',
    tier: 2,
    credibility_score: 0.85,
    region: 'Global',
    active: true,
    notes: 'Signals intelligence'
  },
  {
    account_id: 'liveuamap',
    handle: '@Liveuamap',
    display_name: 'Liveuamap',
    category: 'Politics',
    subdomain: 'War Mapping',
    tier: 2,
    credibility_score: 0.88,
    region: 'Global',
    active: true,
    notes: 'Event aggregation, conflict tracking'
  },
  {
    account_id: 'natashabertrand',
    handle: '@NatashaBertrand',
    display_name: 'Natasha Bertrand',
    category: 'Politics',
    subdomain: 'Security',
    tier: 1,
    credibility_score: 0.92,
    region: 'US',
    active: true,
    notes: 'US defense & intelligence reporting'
  },
  {
    account_id: 'inikishore',
    handle: '@INikiforov',
    display_name: 'Igor Nikiforov',
    category: 'Politics',
    subdomain: 'Russia/Ukraine',
    tier: 2,
    credibility_score: 0.84,
    region: 'Eastern Europe',
    active: true,
    notes: 'Ukraine conflict specialist'
  },
  {
    account_id: 'wikiintel',
    handle: '@IntelCrab',
    display_name: 'Intel Crab',
    category: 'Politics',
    subdomain: 'OSINT',
    tier: 2,
    credibility_score: 0.82,
    region: 'Global',
    active: true,
    notes: 'Open source intelligence'
  },

  // === SPORTS ===
  {
    account_id: 'fabrizioromano',
    handle: '@FabrizioRomano',
    display_name: 'Fabrizio Romano',
    category: 'Sports',
    subdomain: 'Soccer Transfers',
    tier: 1,
    credibility_score: 0.96,
    region: 'Europe',
    active: true,
    notes: 'Here we go! Transfer king'
  },
  {
    account_id: 'adamschefter',
    handle: '@AdamSchefter',
    display_name: 'Adam Schefter',
    category: 'Sports',
    subdomain: 'NFL',
    tier: 1,
    credibility_score: 0.95,
    region: 'US',
    active: true,
    notes: 'NFL injuries & trades'
  },
  {
    account_id: 'wojespn',
    handle: '@wojespn',
    display_name: 'Adrian Wojnarowski',
    category: 'Sports',
    subdomain: 'NBA',
    tier: 1,
    credibility_score: 0.97,
    region: 'US',
    active: true,
    notes: 'NBA trades, Woj bombs'
  },
  {
    account_id: 'shamscharania',
    handle: '@ShamsCharania',
    display_name: 'Shams Charania',
    category: 'Sports',
    subdomain: 'NBA',
    tier: 1,
    credibility_score: 0.94,
    region: 'US',
    active: true,
    notes: 'NBA roster news'
  },
  {
    account_id: 'benrothenberg',
    handle: '@BenRothenberg',
    display_name: 'Ben Rothenberg',
    category: 'Sports',
    subdomain: 'Tennis',
    tier: 1,
    credibility_score: 0.90,
    region: 'Global',
    active: true,
    notes: 'Tennis injuries & bans'
  },
  {
    account_id: 'jeffpassan',
    handle: '@JeffPassan',
    display_name: 'Jeff Passan',
    category: 'Sports',
    subdomain: 'MLB',
    tier: 1,
    credibility_score: 0.94,
    region: 'US',
    active: true,
    notes: 'MLB trades & signings'
  },

  // === TECH / AI ===
  {
    account_id: 'sama',
    handle: '@sama',
    display_name: 'Sam Altman',
    category: 'Tech',
    subdomain: 'AI',
    tier: 1,
    credibility_score: 0.98,
    region: 'US',
    active: true,
    notes: 'OpenAI CEO, primary AI source'
  },
  {
    account_id: 'karpathy',
    handle: '@karpathy',
    display_name: 'Andrej Karpathy',
    category: 'Tech',
    subdomain: 'AI Research',
    tier: 1,
    credibility_score: 0.96,
    region: 'US',
    active: true,
    notes: 'Former Tesla AI, model insights'
  },
  {
    account_id: 'benedictevans',
    handle: '@benedictevans',
    display_name: 'Benedict Evans',
    category: 'Tech',
    subdomain: 'Tech Strategy',
    tier: 2,
    credibility_score: 0.88,
    region: 'Global',
    active: true,
    notes: 'Tech strategy interpretation'
  },
  {
    account_id: 'patrickc',
    handle: '@patrickc',
    display_name: 'Patrick Collison',
    category: 'Tech',
    subdomain: 'Startups',
    tier: 2,
    credibility_score: 0.90,
    region: 'US',
    active: true,
    notes: 'Stripe CEO, infra & SaaS'
  },
  {
    account_id: 'techmeme',
    handle: '@Techmeme',
    display_name: 'Techmeme',
    category: 'Tech',
    subdomain: 'Aggregation',
    tier: 3,
    credibility_score: 0.85,
    region: 'Global',
    active: true,
    notes: 'Tech news aggregation'
  },
  {
    account_id: 'elikiverstone',
    handle: '@elikiverstone',
    display_name: 'Eli Kiverstone',
    category: 'Tech',
    subdomain: 'Semiconductors',
    tier: 2,
    credibility_score: 0.86,
    region: 'Global',
    active: true,
    notes: 'Chip industry coverage'
  },

  // === M&A / VC ===
  {
    account_id: 'dealbook',
    handle: '@dealaborbook',
    display_name: 'DealBook',
    category: 'M&A',
    subdomain: 'M&A',
    tier: 1,
    credibility_score: 0.95,
    region: 'Global',
    active: true,
    notes: 'NYT deal coverage'
  },
  {
    account_id: 'axios',
    handle: '@axios',
    display_name: 'Axios',
    category: 'M&A',
    subdomain: 'Deals',
    tier: 1,
    credibility_score: 0.92,
    region: 'US',
    active: true,
    notes: 'Fast deal reporting'
  },
  {
    account_id: 'cbinsights',
    handle: '@CBinsights',
    display_name: 'CB Insights',
    category: 'M&A',
    subdomain: 'VC',
    tier: 2,
    credibility_score: 0.88,
    region: 'Global',
    active: true,
    notes: 'Funding rounds'
  },
  {
    account_id: 'pitchbook',
    handle: '@PitchBook',
    display_name: 'PitchBook',
    category: 'M&A',
    subdomain: 'Private Markets',
    tier: 2,
    credibility_score: 0.90,
    region: 'Global',
    active: true,
    notes: 'Private market confirmations'
  },

  // === CRYPTO ===
  {
    account_id: 'theblock',
    handle: '@TheBlock__',
    display_name: 'The Block',
    category: 'Crypto',
    subdomain: 'Crypto News',
    tier: 1,
    credibility_score: 0.90,
    region: 'Global',
    active: true,
    notes: 'Crypto M&A & digital assets'
  },
  {
    account_id: 'waborclark',
    handle: '@WuBlockchain',
    display_name: 'Wu Blockchain',
    category: 'Crypto',
    subdomain: 'Mining & China',
    tier: 2,
    credibility_score: 0.85,
    region: 'Asia',
    active: true,
    notes: 'China crypto news'
  },
  {
    account_id: 'coindesk',
    handle: '@CoinDesk',
    display_name: 'CoinDesk',
    category: 'Crypto',
    subdomain: 'Crypto News',
    tier: 2,
    credibility_score: 0.88,
    region: 'Global',
    active: true,
    notes: 'Crypto industry news'
  },
];

// ============ KEYWORD BUNDLES ============

export const KEYWORD_BUNDLES: KeywordBundle[] = [
  {
    category: 'Economy',
    keywords: [
      'supply disruption', 'force majeure', 'export ban', 'production cut',
      'inventory draw', 'shipping delays', 'port congestion', 'strike action',
      'energy shortage', 'price controls', 'rate hike', 'rate cut',
      'inflation surge', 'deflation', 'recession', 'GDP', 'unemployment',
      'trade deficit', 'sanctions', 'tariff', 'embargo', 'OPEC',
      'oil production', 'natural gas', 'LNG', 'pipeline', 'refinery',
      'grain exports', 'crop failure', 'drought', 'supply chain'
    ],
    phrases: [
      'emergency meeting', 'production quota', 'strategic reserve',
      'price cap', 'windfall tax', 'currency intervention',
      'central bank', 'interest rate decision', 'quantitative easing',
      'balance sheet', 'yield curve', 'credit default', 'bond market'
    ],
    version: '1.0',
    updated_at: '2026-01-03'
  },
  {
    category: 'Politics',
    keywords: [
      'state of emergency', 'snap election', 'martial law', 'sanctions imposed',
      'military escalation', 'ceasefire talks', 'constitutional court',
      'election annulled', 'mobilization order', 'air strike', 'ground invasion',
      'drone attack', 'missile launch', 'nuclear', 'chemical weapons',
      'humanitarian crisis', 'refugee', 'evacuation', 'coup', 'assassination',
      'impeachment', 'resignation', 'summit', 'treaty', 'alliance'
    ],
    phrases: [
      'breaking news', 'just in', 'confirmed reports', 'developing story',
      'military operation', 'special operation', 'national security',
      'defense minister', 'foreign minister', 'head of state',
      'UN Security Council', 'NATO Article 5', 'mutual defense'
    ],
    version: '1.0',
    updated_at: '2026-01-03'
  },
  {
    category: 'Sports',
    keywords: [
      'out indefinitely', 'season-ending injury', 'trade finalized',
      'transfer agreed', 'coach fired', 'medical evaluation', 'disciplinary action',
      'contract extension', 'free agent', 'waived', 'suspended', 'banned',
      'ACL tear', 'concussion protocol', 'injury reserve', 'IL stint',
      'trade deadline', 'draft pick', 'buyout', 'retirement'
    ],
    phrases: [
      'here we go', 'deal done', 'agreement reached', 'per sources',
      'official announcement', 'medical staff', 'out for season',
      'game-time decision', 'doubtful', 'questionable', 'ruled out'
    ],
    version: '1.0',
    updated_at: '2026-01-03'
  },
  {
    category: 'Tech',
    keywords: [
      'model released', 'weights published', 'training compute', 'data center expansion',
      'export controls', 'AI regulation', 'antitrust probe', 'acquisition',
      'IPO', 'layoffs', 'restructuring', 'product launch', 'API', 'open source',
      'benchmark', 'GPT', 'Claude', 'Gemini', 'LLM', 'AGI', 'chips', 'NVIDIA',
      'semiconductor', 'TSMC', 'foundry', 'wafer', 'supply shortage'
    ],
    phrases: [
      'just announced', 'now available', 'rolling out', 'beta access',
      'general availability', 'enterprise tier', 'rate limits',
      'compute cluster', 'training run', 'inference cost'
    ],
    version: '1.0',
    updated_at: '2026-01-03'
  },
  {
    category: 'M&A',
    keywords: [
      'acquired for', 'term sheet signed', 'strategic investment', 'exclusive talks',
      'Series B raised', 'regulatory approval', 'deal collapsed', 'merger',
      'acquisition', 'takeover', 'buyout', 'divestiture', 'spin-off',
      'IPO filed', 'S-1', 'valuation', 'due diligence', 'LOI', 'MOU'
    ],
    phrases: [
      'deal value', 'cash and stock', 'all-cash offer', 'hostile takeover',
      'friendly acquisition', 'strategic buyer', 'private equity',
      'antitrust review', 'FTC approval', 'DOJ clearance', 'CFIUS review'
    ],
    version: '1.0',
    updated_at: '2026-01-03'
  },
  {
    category: 'Crypto',
    keywords: [
      'hack', 'exploit', 'rug pull', 'bridge attack', 'wallet drained',
      'ETF approved', 'ETF rejected', 'SEC', 'CFTC', 'regulation',
      'stablecoin', 'depeg', 'liquidation', 'whale', 'exchange withdrawal',
      'mining ban', 'halving', 'fork', 'upgrade', 'mainnet', 'testnet'
    ],
    phrases: [
      'funds are safu', 'not your keys', 'on-chain analysis',
      'smart contract', 'liquidity pool', 'flash loan',
      'protocol exploit', 'governance vote', 'token unlock'
    ],
    version: '1.0',
    updated_at: '2026-01-03'
  }
];

// ============ EVENT TYPE MAPPINGS ============

export const EVENT_TYPES: Record<string, { category: AccountCategory; keywords: string[] }> = {
  // Economy
  'supply_disruption': { category: 'Economy', keywords: ['supply disruption', 'shortage', 'inventory draw'] },
  'production_cut': { category: 'Economy', keywords: ['production cut', 'output reduction', 'quota'] },
  'rate_decision': { category: 'Economy', keywords: ['rate hike', 'rate cut', 'interest rate', 'FOMC'] },
  'trade_action': { category: 'Economy', keywords: ['tariff', 'sanction', 'embargo', 'trade war'] },
  
  // Politics
  'military_strike': { category: 'Politics', keywords: ['air strike', 'missile', 'bombing', 'attack'] },
  'escalation': { category: 'Politics', keywords: ['escalation', 'mobilization', 'troops', 'invasion'] },
  'ceasefire': { category: 'Politics', keywords: ['ceasefire', 'peace talks', 'truce', 'negotiation'] },
  'election': { category: 'Politics', keywords: ['election', 'vote', 'ballot', 'poll'] },
  'leadership_change': { category: 'Politics', keywords: ['resignation', 'coup', 'impeachment', 'removed'] },
  
  // Sports
  'injury': { category: 'Sports', keywords: ['injury', 'ACL', 'out indefinitely', 'IL', 'surgery'] },
  'trade': { category: 'Sports', keywords: ['trade', 'traded', 'deal', 'exchange'] },
  'signing': { category: 'Sports', keywords: ['signed', 'contract', 'extension', 'agreement'] },
  'firing': { category: 'Sports', keywords: ['fired', 'dismissed', 'let go', 'parting ways'] },
  
  // Tech
  'product_launch': { category: 'Tech', keywords: ['launched', 'released', 'announced', 'available'] },
  'ai_model': { category: 'Tech', keywords: ['model', 'GPT', 'Claude', 'weights', 'training'] },
  'regulation': { category: 'Tech', keywords: ['regulation', 'antitrust', 'probe', 'investigation'] },
  'layoffs': { category: 'Tech', keywords: ['layoffs', 'job cuts', 'restructuring', 'workforce reduction'] },
  
  // M&A
  'acquisition': { category: 'M&A', keywords: ['acquired', 'acquisition', 'takeover', 'buyout'] },
  'funding': { category: 'M&A', keywords: ['raised', 'funding', 'Series', 'investment'] },
  'ipo': { category: 'M&A', keywords: ['IPO', 'going public', 'S-1', 'listing'] },
  'deal_collapse': { category: 'M&A', keywords: ['collapsed', 'terminated', 'called off', 'walked away'] },
  
  // Crypto
  'hack': { category: 'Crypto', keywords: ['hack', 'exploit', 'drained', 'stolen'] },
  'regulation_crypto': { category: 'Crypto', keywords: ['SEC', 'regulation', 'approved', 'rejected'] },
  'depeg': { category: 'Crypto', keywords: ['depeg', 'depegged', 'lost peg', 'stablecoin'] },
};

// ============ HELPERS ============

export function getAccountsByCategory(category: AccountCategory): Account[] {
  return SEED_ACCOUNTS.filter(a => a.category === category && a.active);
}

export function getAccountsByTier(tier: 1 | 2 | 3): Account[] {
  return SEED_ACCOUNTS.filter(a => a.tier === tier && a.active);
}

export function getKeywordBundle(category: AccountCategory): KeywordBundle | undefined {
  return KEYWORD_BUNDLES.find(b => b.category === category);
}

export function getAllKeywords(): string[] {
  return KEYWORD_BUNDLES.flatMap(b => [...b.keywords, ...b.phrases]);
}

