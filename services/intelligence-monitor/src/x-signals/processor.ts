/**
 * X Signal Processing Engine
 * 
 * Processes raw tweets into structured signals with:
 * - Keyword & pattern matching
 * - Velocity detection
 * - Credibility scoring
 * - Event normalization
 */

import { v4 as uuidv4 } from 'uuid';
import { 
  RawTweet, Signal, NormalizedEvent, Account, 
  AccountCategory, KeywordBundle 
} from './types';
import { 
  SEED_ACCOUNTS, KEYWORD_BUNDLES, EVENT_TYPES,
  getKeywordBundle 
} from './accounts';

// ============ SIGNAL PROCESSOR ============

export class SignalProcessor {
  private accounts: Map<string, Account>;
  private keywordBundles: Map<AccountCategory, KeywordBundle>;
  private recentSignals: Map<string, Signal[]>; // For velocity detection
  private eventBuffer: Map<string, NormalizedEvent>;
  
  constructor() {
    this.accounts = new Map(SEED_ACCOUNTS.map(a => [a.account_id, a]));
    this.keywordBundles = new Map(KEYWORD_BUNDLES.map(b => [b.category, b]));
    this.recentSignals = new Map();
    this.eventBuffer = new Map();
  }

  /**
   * Process a raw tweet into a signal
   */
  processTweet(tweet: RawTweet): Signal | null {
    const account = this.accounts.get(tweet.account_id);
    if (!account) {
      console.warn(`Unknown account: ${tweet.account_id}`);
      return null;
    }

    // Run keyword matching
    const keywordMatch = this.matchKeywords(tweet.text, account.category);
    if (keywordMatch.matched.length === 0) {
      return null; // No relevant keywords found
    }

    // Calculate velocity
    const velocity = this.calculateVelocity(tweet, keywordMatch.matched);

    // Get credibility score
    const credibility = this.calculateCredibility(account, tweet);

    // Calculate overall confidence
    const confidence = this.calculateConfidence(
      keywordMatch.confidence,
      velocity.score,
      credibility.score
    );

    // Determine severity
    const severity = this.determineSeverity(confidence, account.tier, velocity.isSpike);

    const signal: Signal = {
      signal_id: uuidv4(),
      tweet_id: tweet.tweet_id,
      account_id: tweet.account_id,
      handle: tweet.handle,
      text: tweet.text,
      timestamp: tweet.timestamp,
      
      matched_keywords: keywordMatch.matched,
      keyword_bundle: account.category,
      keyword_confidence: keywordMatch.confidence,
      
      velocity_score: velocity.score,
      is_spike: velocity.isSpike,
      related_tweet_count: velocity.relatedCount,
      
      source_tier: account.tier,
      source_credibility: credibility.score,
      confirmation_count: credibility.confirmations,
      confirmed_by: credibility.confirmedBy,
      
      overall_confidence: confidence,
      severity: severity,
      
      processed_at: new Date().toISOString()
    };

    // Store for velocity detection
    this.storeSignal(signal);

    return signal;
  }

  /**
   * Match keywords from the text
   */
  private matchKeywords(text: string, category: AccountCategory): {
    matched: string[];
    confidence: number;
  } {
    const bundle = this.keywordBundles.get(category);
    if (!bundle) {
      return { matched: [], confidence: 0 };
    }

    const textLower = text.toLowerCase();
    const matched: string[] = [];

    // Check keywords
    for (const keyword of bundle.keywords) {
      if (textLower.includes(keyword.toLowerCase())) {
        matched.push(keyword);
      }
    }

    // Check phrases (higher weight)
    for (const phrase of bundle.phrases) {
      if (textLower.includes(phrase.toLowerCase())) {
        matched.push(phrase);
      }
    }

    // Also check cross-category keywords for multi-domain signals
    for (const [cat, b] of this.keywordBundles) {
      if (cat === category) continue;
      for (const kw of b.keywords.slice(0, 10)) { // Top 10 from each
        if (textLower.includes(kw.toLowerCase())) {
          matched.push(`[${cat}] ${kw}`);
        }
      }
    }

    // Calculate confidence based on matches
    const confidence = Math.min(1, matched.length * 0.15 + (matched.length > 0 ? 0.3 : 0));

    return { matched: [...new Set(matched)], confidence };
  }

  /**
   * Calculate velocity metrics
   */
  private calculateVelocity(tweet: RawTweet, keywords: string[]): {
    score: number;
    isSpike: boolean;
    relatedCount: number;
  } {
    const now = new Date(tweet.timestamp).getTime();
    const windowMs = 15 * 60 * 1000; // 15 minute window

    // Get recent signals with same keywords
    let relatedCount = 0;
    for (const [, signals] of this.recentSignals) {
      for (const sig of signals) {
        const sigTime = new Date(sig.timestamp).getTime();
        if (now - sigTime < windowMs) {
          const overlap = sig.matched_keywords.filter(k => keywords.includes(k));
          if (overlap.length > 0) {
            relatedCount++;
          }
        }
      }
    }

    // Engagement velocity
    const engagementScore = Math.min(1, (
      (tweet.retweet_count * 2 + tweet.reply_count * 1.5 + tweet.like_count * 0.5) / 1000
    ));

    // Combined score
    const score = Math.min(1, (relatedCount * 0.1) + engagementScore);
    const isSpike = relatedCount >= 3 || engagementScore > 0.5;

    return { score, isSpike, relatedCount };
  }

  /**
   * Calculate credibility metrics
   */
  private calculateCredibility(account: Account, tweet: RawTweet): {
    score: number;
    confirmations: number;
    confirmedBy: string[];
  } {
    // Base credibility from account
    let score = account.credibility_score;

    // Tier adjustment
    if (account.tier === 1) score = Math.min(1, score + 0.1);
    if (account.tier === 3) score = Math.max(0, score - 0.1);

    // Check for confirmations from other accounts
    const confirmedBy: string[] = [];
    const tweetTime = new Date(tweet.timestamp).getTime();
    const windowMs = 30 * 60 * 1000; // 30 minute window

    for (const [accountId, signals] of this.recentSignals) {
      if (accountId === tweet.account_id) continue;
      
      const otherAccount = this.accounts.get(accountId);
      if (!otherAccount) continue;

      for (const sig of signals) {
        const sigTime = new Date(sig.timestamp).getTime();
        if (Math.abs(sigTime - tweetTime) < windowMs) {
          // Check for keyword overlap
          const textLower = tweet.text.toLowerCase();
          const sigTextLower = sig.text.toLowerCase();
          const commonWords = textLower.split(' ').filter(w => 
            w.length > 4 && sigTextLower.includes(w)
          );
          
          if (commonWords.length >= 3) {
            confirmedBy.push(sig.handle);
            // Tier 1/2 confirmations boost score
            if (otherAccount.tier <= 2) {
              score = Math.min(1, score + 0.05);
            }
          }
        }
      }
    }

    return {
      score,
      confirmations: confirmedBy.length,
      confirmedBy: [...new Set(confirmedBy)].slice(0, 5)
    };
  }

  /**
   * Calculate overall confidence
   */
  private calculateConfidence(
    keywordConf: number,
    velocityScore: number,
    credibilityScore: number
  ): number {
    // Weighted average
    return Math.min(1, (
      keywordConf * 0.3 +
      velocityScore * 0.2 +
      credibilityScore * 0.5
    ));
  }

  /**
   * Determine signal severity
   */
  private determineSeverity(
    confidence: number,
    tier: number,
    isSpike: boolean
  ): 'low' | 'medium' | 'high' | 'critical' {
    if (confidence >= 0.85 || (tier === 1 && confidence >= 0.7)) {
      return 'critical';
    }
    if (confidence >= 0.7 || isSpike) {
      return 'high';
    }
    if (confidence >= 0.5) {
      return 'medium';
    }
    return 'low';
  }

  /**
   * Store signal for velocity tracking
   */
  private storeSignal(signal: Signal) {
    const signals = this.recentSignals.get(signal.account_id) || [];
    signals.push(signal);
    
    // Keep only last 100 signals per account
    if (signals.length > 100) {
      signals.shift();
    }
    
    this.recentSignals.set(signal.account_id, signals);
  }

  /**
   * Normalize signal into event
   */
  normalizeToEvent(signal: Signal): NormalizedEvent {
    const account = this.accounts.get(signal.account_id);
    const category = account?.category || 'Politics';

    // Detect event type
    const eventType = this.detectEventType(signal.text, signal.matched_keywords);

    // Extract entities (simplified)
    const entities = this.extractEntities(signal.text);

    // Generate headline
    const headline = this.generateHeadline(signal, eventType);

    // Determine status
    const status = this.determineEventStatus(signal);

    const event: NormalizedEvent = {
      event_id: uuidv4(),
      event_type: eventType,
      category: category,
      subcategory: account?.subdomain,
      region: account?.region,
      
      headline: headline,
      summary: signal.text.slice(0, 280),
      entities: entities,
      
      confidence: signal.overall_confidence,
      status: status,
      
      source_signals: [signal.signal_id],
      primary_sources: [signal.handle],
      first_seen: signal.timestamp,
      last_updated: new Date().toISOString(),
      
      market_impact: this.assessMarketImpact(signal, eventType, category)
    };

    return event;
  }

  /**
   * Detect event type from text and keywords
   */
  private detectEventType(text: string, keywords: string[]): string {
    const textLower = text.toLowerCase();
    
    for (const [eventType, config] of Object.entries(EVENT_TYPES)) {
      for (const kw of config.keywords) {
        if (textLower.includes(kw) || keywords.some(k => k.toLowerCase().includes(kw))) {
          return eventType;
        }
      }
    }
    
    return 'general_signal';
  }

  /**
   * Extract entities from text (simplified)
   */
  private extractEntities(text: string): string[] {
    const entities: string[] = [];
    
    // Find @mentions
    const mentions = text.match(/@\w+/g) || [];
    entities.push(...mentions);
    
    // Find $tickers
    const tickers = text.match(/\$[A-Z]+/g) || [];
    entities.push(...tickers);
    
    // Find capitalized proper nouns (simplified)
    const properNouns = text.match(/[A-Z][a-z]+(?:\s[A-Z][a-z]+)*/g) || [];
    entities.push(...properNouns.filter(n => n.length > 3).slice(0, 5));
    
    return [...new Set(entities)];
  }

  /**
   * Generate headline from signal
   */
  private generateHeadline(signal: Signal, eventType: string): string {
    const keywords = signal.matched_keywords.slice(0, 3).join(', ');
    return `[${signal.keyword_bundle}] ${eventType.replace(/_/g, ' ')}: ${keywords}`;
  }

  /**
   * Determine event status
   */
  private determineEventStatus(signal: Signal): 'rumor' | 'developing' | 'confirmed' | 'denied' | 'resolved' {
    const textLower = signal.text.toLowerCase();
    
    if (textLower.includes('confirmed') || textLower.includes('official')) {
      return 'confirmed';
    }
    if (textLower.includes('denied') || textLower.includes('false')) {
      return 'denied';
    }
    if (signal.confirmation_count >= 2 || signal.source_tier === 1) {
      return 'developing';
    }
    return 'rumor';
  }

  /**
   * Assess market impact
   */
  private assessMarketImpact(signal: Signal, eventType: string, category: AccountCategory) {
    const impactMap: Record<string, { direction: any; magnitude: any; sectors: string[] }> = {
      'military_strike': { direction: 'volatile', magnitude: 'major', sectors: ['Defense', 'Energy', 'Commodities'] },
      'escalation': { direction: 'bearish', magnitude: 'significant', sectors: ['Equities', 'EM'] },
      'ceasefire': { direction: 'bullish', magnitude: 'moderate', sectors: ['Equities', 'Energy'] },
      'rate_decision': { direction: 'volatile', magnitude: 'significant', sectors: ['Rates', 'FX', 'Equities'] },
      'supply_disruption': { direction: 'bullish', magnitude: 'moderate', sectors: ['Commodities'] },
      'hack': { direction: 'bearish', magnitude: 'significant', sectors: ['Crypto'] },
      'acquisition': { direction: 'bullish', magnitude: 'moderate', sectors: ['Target Stock'] },
      'injury': { direction: 'neutral', magnitude: 'minor', sectors: ['Sports Betting'] },
    };

    const impact = impactMap[eventType] || { direction: 'neutral', magnitude: 'minor', sectors: [category] };

    return {
      assets: signal.matched_keywords.filter(k => k.startsWith('$')),
      direction: impact.direction as 'bullish' | 'bearish' | 'neutral' | 'volatile',
      magnitude: impact.magnitude as 'minor' | 'moderate' | 'significant' | 'major',
      sectors: impact.sectors
    };
  }

  /**
   * Get all accounts
   */
  getAccounts(): Account[] {
    return Array.from(this.accounts.values());
  }

  /**
   * Get recent signals
   */
  getRecentSignals(limit: number = 50): Signal[] {
    const all: Signal[] = [];
    for (const signals of this.recentSignals.values()) {
      all.push(...signals);
    }
    return all
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }
}

// Export singleton
export const signalProcessor = new SignalProcessor();

