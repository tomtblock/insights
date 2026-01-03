import Parser from 'rss-parser';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { v4 as uuidv4 } from 'uuid';
import { IntelligenceSource, INTELLIGENCE_SOURCES, MonitoringDomain } from './sources';
import { IntelligenceItem } from './types';

const rssParser = new Parser({
  timeout: 10000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (compatible; IntelligenceMonitor/1.0)',
    'Accept': 'application/rss+xml, application/xml, text/xml'
  }
});

export class IntelligenceScraper {
  private sources: IntelligenceSource[];
  private seenUrls: Set<string> = new Set();
  
  constructor(sources?: IntelligenceSource[]) {
    this.sources = sources || INTELLIGENCE_SOURCES;
  }
  
  async scrapeAll(): Promise<IntelligenceItem[]> {
    const allItems: IntelligenceItem[] = [];
    
    for (const source of this.sources) {
      try {
        const items = await this.scrapeSource(source);
        allItems.push(...items);
        console.log(`[${source.name}] Fetched ${items.length} items`);
      } catch (error) {
        console.error(`[${source.name}] Scrape failed:`, error);
      }
    }
    
    return this.deduplicateItems(allItems);
  }
  
  async scrapeSource(source: IntelligenceSource): Promise<IntelligenceItem[]> {
    switch (source.feedType) {
      case 'rss':
        return this.scrapeRSS(source);
      case 'api':
        return this.scrapeAPI(source);
      case 'scrape':
        return this.scrapeHTML(source);
      default:
        return [];
    }
  }
  
  private async scrapeRSS(source: IntelligenceSource): Promise<IntelligenceItem[]> {
    if (!source.feedUrl) return [];
    
    try {
      const feed = await rssParser.parseURL(source.feedUrl);
      
      return feed.items.map(item => ({
        id: uuidv4(),
        sourceId: source.id,
        sourceName: source.name,
        title: item.title || 'Untitled',
        summary: this.cleanText(item.contentSnippet || item.content || ''),
        content: this.cleanText(item.content || ''),
        url: item.link || '',
        imageUrl: this.extractImage(item),
        publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
        scrapedAt: new Date(),
        domains: source.domains,
        primaryDomain: source.domains[0],
        status: 'pending' as const,
        flagged: false
      }));
    } catch (error) {
      console.error(`RSS scrape failed for ${source.name}:`, error);
      return [];
    }
  }
  
  private async scrapeAPI(source: IntelligenceSource): Promise<IntelligenceItem[]> {
    // Placeholder for API-based sources
    // Would implement specific API integrations here
    return [];
  }
  
  private async scrapeHTML(source: IntelligenceSource): Promise<IntelligenceItem[]> {
    if (!source.scrapeUrl) return [];
    
    try {
      const response = await axios.get(source.scrapeUrl, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml'
        }
      });
      
      const $ = cheerio.load(response.data);
      const items: IntelligenceItem[] = [];
      
      // Generic article extraction - would customize per source
      $('article, .article, .news-item, .story').each((_, el) => {
        const $el = $(el);
        const title = $el.find('h1, h2, h3, .title, .headline').first().text().trim();
        const summary = $el.find('p, .summary, .excerpt').first().text().trim();
        const link = $el.find('a').first().attr('href');
        const image = $el.find('img').first().attr('src');
        
        if (title && link) {
          items.push({
            id: uuidv4(),
            sourceId: source.id,
            sourceName: source.name,
            title,
            summary: summary || '',
            url: this.resolveUrl(link, source.scrapeUrl),
            imageUrl: image ? this.resolveUrl(image, source.scrapeUrl) : undefined,
            publishedAt: new Date(),
            scrapedAt: new Date(),
            domains: source.domains,
            primaryDomain: source.domains[0],
            status: 'pending' as const,
            flagged: false
          });
        }
      });
      
      return items;
    } catch (error) {
      console.error(`HTML scrape failed for ${source.name}:`, error);
      return [];
    }
  }
  
  private cleanText(text: string): string {
    return text
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 1000);
  }
  
  private extractImage(item: any): string | undefined {
    // Try various RSS image fields
    if (item.enclosure?.url) return item.enclosure.url;
    if (item['media:content']?.$.url) return item['media:content'].$.url;
    if (item['media:thumbnail']?.$.url) return item['media:thumbnail'].$.url;
    
    // Try to extract from content
    const imgMatch = item.content?.match(/<img[^>]+src="([^"]+)"/);
    return imgMatch?.[1];
  }
  
  private resolveUrl(url: string, baseUrl: string): string {
    if (url.startsWith('http')) return url;
    try {
      return new URL(url, baseUrl).href;
    } catch {
      return url;
    }
  }
  
  private deduplicateItems(items: IntelligenceItem[]): IntelligenceItem[] {
    const unique: IntelligenceItem[] = [];
    const seenTitles = new Set<string>();
    
    for (const item of items) {
      const normalizedTitle = item.title.toLowerCase().trim();
      
      if (!seenTitles.has(normalizedTitle) && !this.seenUrls.has(item.url)) {
        seenTitles.add(normalizedTitle);
        this.seenUrls.add(item.url);
        unique.push(item);
      }
    }
    
    return unique;
  }
  
  // Filter items by domain
  filterByDomain(items: IntelligenceItem[], domain: MonitoringDomain): IntelligenceItem[] {
    return items.filter(item => item.domains.includes(domain));
  }
  
  // Sort by recency
  sortByDate(items: IntelligenceItem[], desc = true): IntelligenceItem[] {
    return [...items].sort((a, b) => {
      const diff = b.publishedAt.getTime() - a.publishedAt.getTime();
      return desc ? diff : -diff;
    });
  }
}

// Mock data generator for development
export function generateMockIntelligence(): IntelligenceItem[] {
  const mockItems: Partial<IntelligenceItem>[] = [
    {
      title: 'China Conducts Military Exercises Near Taiwan Strait',
      summary: 'PLA Eastern Theater Command announces live-fire drills in waters near Taiwan, raising regional tensions.',
      sourceName: 'Reuters',
      domains: ['taiwan_strait', 'china_ccp_policy'] as MonitoringDomain[],
      primaryDomain: 'taiwan_strait' as MonitoringDomain,
      assessment: {
        severity: 7,
        relevance: 9,
        impact: 7,
        urgency: 8,
        confidence: 8,
        compositeScore: 7.6,
        impactType: 'conflict_escalation',
        timeHorizon: 'immediate',
        affectedRegions: ['Taiwan', 'China', 'United States', 'Japan'],
        affectedSectors: ['Defense', 'Semiconductors', 'Shipping'],
        marketImplications: [
          { asset: 'Taiwan Dollar', direction: 'bearish', magnitude: 'moderate', rationale: 'Geopolitical risk premium' },
          { asset: 'Defense Stocks', direction: 'bullish', magnitude: 'moderate', rationale: 'Regional tension escalation' }
        ],
        keyPoints: ['Live-fire exercises announced', 'Multiple naval vessels deployed', 'US monitoring closely'],
        risks: ['Accidental escalation', 'Supply chain disruption', 'Semiconductor production risk'],
        opportunities: [],
        relatedEvents: [],
        escalationPotential: 'high',
        reasoning: 'Significant military activity near Taiwan represents elevated escalation risk and potential supply chain implications for global semiconductor industry.',
        uncertainties: ['Duration of exercises', 'US response', 'Japanese involvement']
      }
    },
    {
      title: 'Federal Reserve Signals Potential Rate Cut Timeline',
      summary: 'Fed Chair indicates conditions may support rate reductions in coming months, citing cooling inflation.',
      sourceName: 'Bloomberg',
      domains: ['central_bank_policy', 'geopolitical_risk_markets'] as MonitoringDomain[],
      primaryDomain: 'central_bank_policy' as MonitoringDomain,
      assessment: {
        severity: 6,
        relevance: 10,
        impact: 8,
        urgency: 5,
        confidence: 9,
        compositeScore: 7.2,
        impactType: 'policy_shift',
        timeHorizon: 'short_term',
        affectedRegions: ['United States', 'Global'],
        affectedSectors: ['Banking', 'Real Estate', 'Technology', 'Bonds'],
        marketImplications: [
          { asset: 'S&P 500', direction: 'bullish', magnitude: 'moderate', rationale: 'Lower rates support valuations' },
          { asset: 'US Treasury Bonds', direction: 'bullish', magnitude: 'significant', rationale: 'Rate cut expectations' },
          { asset: 'USD', direction: 'bearish', magnitude: 'moderate', rationale: 'Interest rate differential narrowing' }
        ],
        keyPoints: ['Rate cut timeline discussed', 'Inflation trending toward target', 'Labor market remains resilient'],
        risks: ['Inflation resurgence', 'Market overreaction'],
        opportunities: ['Fixed income positioning', 'Growth stock rotation'],
        relatedEvents: [],
        escalationPotential: 'low',
        reasoning: 'Major monetary policy signal with significant implications for global asset prices and capital flows.',
        uncertainties: ['Exact timing', 'Magnitude of cuts', 'Economic data evolution']
      }
    },
    {
      title: 'Houthi Attacks Disrupt Red Sea Shipping Routes',
      summary: 'Multiple container ships rerouted around Cape of Good Hope following missile and drone attacks on commercial vessels.',
      sourceName: 'Reuters',
      domains: ['maritime_chokepoints', 'middle_east_wars', 'supply_chain'] as MonitoringDomain[],
      primaryDomain: 'maritime_chokepoints' as MonitoringDomain,
      assessment: {
        severity: 8,
        relevance: 9,
        impact: 8,
        urgency: 9,
        confidence: 9,
        compositeScore: 8.3,
        impactType: 'supply_disruption',
        timeHorizon: 'immediate',
        affectedRegions: ['Middle East', 'Europe', 'Asia'],
        affectedSectors: ['Shipping', 'Retail', 'Manufacturing', 'Energy'],
        marketImplications: [
          { asset: 'Container Shipping Stocks', direction: 'bullish', magnitude: 'significant', rationale: 'Higher freight rates' },
          { asset: 'Oil', direction: 'bullish', magnitude: 'moderate', rationale: 'Supply route disruption' },
          { asset: 'European Retailers', direction: 'bearish', magnitude: 'moderate', rationale: 'Supply chain delays' }
        ],
        keyPoints: ['Major shipping lines avoiding Red Sea', 'Freight rates surging', 'US naval presence increased'],
        risks: ['Conflict escalation', 'Insurance costs spike', 'Extended disruption'],
        opportunities: ['Alternative route providers', 'Air freight'],
        relatedEvents: [],
        escalationPotential: 'high',
        reasoning: 'Critical chokepoint disruption affecting 12% of global trade with immediate supply chain and inflation implications.',
        uncertainties: ['Conflict duration', 'Military response effectiveness', 'Insurance market reaction']
      }
    },
    {
      title: 'EU Announces New Semiconductor Subsidy Package',
      summary: 'European Commission unveils €10 billion chip manufacturing initiative to reduce Asian supply dependency.',
      sourceName: 'Financial Times',
      domains: ['semiconductor_controls', 'eu_integration', 'supply_chain'] as MonitoringDomain[],
      primaryDomain: 'semiconductor_controls' as MonitoringDomain,
      assessment: {
        severity: 5,
        relevance: 8,
        impact: 6,
        urgency: 3,
        confidence: 9,
        compositeScore: 5.6,
        impactType: 'policy_shift',
        timeHorizon: 'long_term',
        affectedRegions: ['European Union', 'Taiwan', 'South Korea', 'United States'],
        affectedSectors: ['Semiconductors', 'Automotive', 'Technology'],
        marketImplications: [
          { asset: 'European Chip Stocks', direction: 'bullish', magnitude: 'moderate', rationale: 'Subsidy support' },
          { asset: 'ASML', direction: 'bullish', magnitude: 'minor', rationale: 'Equipment demand' }
        ],
        keyPoints: ['€10B subsidy package', 'Focus on advanced nodes', 'Multi-year implementation'],
        risks: ['Execution challenges', 'Competitive response'],
        opportunities: ['European fab investment', 'Equipment suppliers'],
        relatedEvents: [],
        escalationPotential: 'low',
        reasoning: 'Significant industrial policy development but long implementation timeline limits immediate impact.',
        uncertainties: ['Implementation timeline', 'Company participation', 'Technology partnerships']
      }
    },
    {
      title: 'Russia Announces New Hypersonic Missile Deployment',
      summary: 'Defense Ministry confirms operational deployment of Zircon hypersonic missiles to Northern Fleet vessels.',
      sourceName: 'Reuters',
      domains: ['military_modernization', 'russia_ukraine_war', 'nuclear_deterrence'] as MonitoringDomain[],
      primaryDomain: 'military_modernization' as MonitoringDomain,
      assessment: {
        severity: 7,
        relevance: 8,
        impact: 6,
        urgency: 4,
        confidence: 7,
        compositeScore: 6.5,
        impactType: 'security_threat',
        timeHorizon: 'medium_term',
        affectedRegions: ['Russia', 'NATO', 'Arctic'],
        affectedSectors: ['Defense', 'Aerospace'],
        marketImplications: [
          { asset: 'Defense Stocks', direction: 'bullish', magnitude: 'minor', rationale: 'Arms race dynamics' },
          { asset: 'European Equities', direction: 'bearish', magnitude: 'minor', rationale: 'Security concerns' }
        ],
        keyPoints: ['Hypersonic capability confirmed', 'Naval deployment', 'NATO monitoring'],
        risks: ['Arms race escalation', 'Deterrence stability'],
        opportunities: ['Western defense investment'],
        relatedEvents: [],
        escalationPotential: 'medium',
        reasoning: 'Notable military development affecting strategic balance but no immediate crisis trigger.',
        uncertainties: ['Actual capability', 'Deployment numbers', 'Targeting doctrine']
      }
    }
  ];
  
  return mockItems.map((item, index) => ({
    id: `mock-${index + 1}`,
    sourceId: 'mock',
    sourceName: item.sourceName || 'Mock Source',
    title: item.title || '',
    summary: item.summary || '',
    url: `https://example.com/article-${index + 1}`,
    publishedAt: new Date(Date.now() - Math.random() * 86400000 * 2),
    scrapedAt: new Date(),
    domains: item.domains || [],
    primaryDomain: item.primaryDomain || 'us_foreign_policy',
    assessment: item.assessment,
    status: 'assessed' as const,
    flagged: (item.assessment?.severity || 0) >= 8
  }));
}

