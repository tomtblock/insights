import cron from 'node-cron';
import { IntelligenceScraper, generateMockIntelligence } from './scraper';
import { AssessmentEngine } from './assessment';
import { INTELLIGENCE_SOURCES } from './sources';
import { IntelligenceItem } from './types';

// In-memory store (replace with database in production)
let intelligenceStore: IntelligenceItem[] = [];

const scraper = new IntelligenceScraper(INTELLIGENCE_SOURCES);

// Initialize with mock data in development
if (process.env.NODE_ENV !== 'production') {
  intelligenceStore = generateMockIntelligence();
  console.log(`[Intelligence Monitor] Initialized with ${intelligenceStore.length} mock items`);
}

// Assessment engine (requires OpenAI API key)
let assessmentEngine: AssessmentEngine | null = null;
if (process.env.OPENAI_API_KEY) {
  assessmentEngine = new AssessmentEngine(process.env.OPENAI_API_KEY);
  console.log('[Intelligence Monitor] Assessment engine initialized');
}

// Scrape all sources
async function runScrape() {
  console.log('[Intelligence Monitor] Starting scrape cycle...');
  
  try {
    const newItems = await scraper.scrapeAll();
    console.log(`[Intelligence Monitor] Scraped ${newItems.length} new items`);
    
    // Assess new items if engine is available
    if (assessmentEngine && newItems.length > 0) {
      console.log('[Intelligence Monitor] Running AI assessment...');
      
      for (const item of newItems) {
        try {
          const assessment = await assessmentEngine.assessItem(item);
          item.assessment = assessment;
          item.status = 'assessed';
          item.assessedAt = new Date();
          
          // Flag high-severity items
          if (assessment.severity >= 8) {
            item.flagged = true;
            item.flagReason = `High severity: ${assessment.severity}/10`;
            console.log(`[ALERT] High severity item: ${item.title}`);
          }
        } catch (error) {
          console.error(`Failed to assess item: ${item.title}`, error);
        }
      }
    }
    
    // Add to store (prepend new items)
    intelligenceStore = [...newItems, ...intelligenceStore].slice(0, 1000); // Keep last 1000
    
    console.log(`[Intelligence Monitor] Store now contains ${intelligenceStore.length} items`);
  } catch (error) {
    console.error('[Intelligence Monitor] Scrape cycle failed:', error);
  }
}

// API endpoints (for integration with main API)
export function getIntelligenceItems(options?: {
  limit?: number;
  offset?: number;
  domain?: string;
  minSeverity?: number;
  flaggedOnly?: boolean;
}): IntelligenceItem[] {
  let items = [...intelligenceStore];
  
  if (options?.domain) {
    items = items.filter(i => i.domains.includes(options.domain as any));
  }
  
  if (options?.minSeverity) {
    items = items.filter(i => (i.assessment?.severity || 0) >= options.minSeverity);
  }
  
  if (options?.flaggedOnly) {
    items = items.filter(i => i.flagged);
  }
  
  const offset = options?.offset || 0;
  const limit = options?.limit || 50;
  
  return items.slice(offset, offset + limit);
}

export function getIntelligenceStats() {
  const assessed = intelligenceStore.filter(i => i.assessment);
  
  return {
    total: intelligenceStore.length,
    assessed: assessed.length,
    pending: intelligenceStore.length - assessed.length,
    flagged: intelligenceStore.filter(i => i.flagged).length,
    critical: assessed.filter(i => (i.assessment?.severity || 0) >= 9).length,
    severe: assessed.filter(i => (i.assessment?.severity || 0) >= 7).length,
    avgSeverity: assessed.length > 0
      ? assessed.reduce((acc, i) => acc + (i.assessment?.severity || 0), 0) / assessed.length
      : 0,
    lastUpdate: intelligenceStore[0]?.scrapedAt || new Date(),
  };
}

export function getIntelligenceItem(id: string): IntelligenceItem | undefined {
  return intelligenceStore.find(i => i.id === id);
}

// Start service
export function startIntelligenceMonitor() {
  console.log('[Intelligence Monitor] Service starting...');
  
  // Run initial scrape
  runScrape();
  
  // Schedule scrapes every 5 minutes
  cron.schedule('*/5 * * * *', () => {
    runScrape();
  });
  
  console.log('[Intelligence Monitor] Service started, scraping every 5 minutes');
}

// Start if run directly
if (require.main === module) {
  startIntelligenceMonitor();
}

export { IntelligenceScraper, AssessmentEngine, INTELLIGENCE_SOURCES };
export * from './types';
export * from './sources';

