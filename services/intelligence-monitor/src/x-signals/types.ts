/**
 * X Signal Intelligence Types
 * 
 * Structured types for the X/Twitter signal detection system
 */

import { z } from 'zod';

// ============ ACCOUNT REGISTRY ============

export type AccountCategory = 'Economy' | 'Politics' | 'Sports' | 'Tech' | 'M&A' | 'Crypto';
export type AccountTier = 1 | 2 | 3; // 1 = primary source, 2 = interpreter, 3 = aggregator

export const AccountSchema = z.object({
  account_id: z.string(),
  handle: z.string(),
  display_name: z.string().optional(),
  category: z.enum(['Economy', 'Politics', 'Sports', 'Tech', 'M&A', 'Crypto']),
  subdomain: z.string(),
  tier: z.number().min(1).max(3),
  credibility_score: z.number().min(0).max(1),
  region: z.string().optional(),
  active: z.boolean(),
  notes: z.string().optional(),
  historical_accuracy: z.number().min(0).max(1).optional(),
  last_scraped: z.string().datetime().optional(),
});

export type Account = z.infer<typeof AccountSchema>;

// ============ RAW TWEET ============

export const RawTweetSchema = z.object({
  tweet_id: z.string(),
  account_id: z.string(),
  handle: z.string(),
  text: z.string(),
  timestamp: z.string().datetime(),
  reply_count: z.number(),
  retweet_count: z.number(),
  like_count: z.number(),
  quote_count: z.number().optional(),
  quoted_tweet_id: z.string().optional(),
  in_reply_to_id: z.string().optional(),
  media_urls: z.array(z.string()).optional(),
  urls: z.array(z.string()).optional(),
  hashtags: z.array(z.string()).optional(),
  mentions: z.array(z.string()).optional(),
});

export type RawTweet = z.infer<typeof RawTweetSchema>;

// ============ PROCESSED SIGNAL ============

export const SignalSchema = z.object({
  signal_id: z.string(),
  tweet_id: z.string(),
  account_id: z.string(),
  handle: z.string(),
  text: z.string(),
  timestamp: z.string().datetime(),
  
  // Signal Analysis
  matched_keywords: z.array(z.string()),
  keyword_bundle: z.string(), // Economy, Politics, etc.
  keyword_confidence: z.number().min(0).max(1),
  
  // Velocity Metrics
  velocity_score: z.number().min(0).max(1),
  is_spike: z.boolean(),
  related_tweet_count: z.number(),
  
  // Credibility
  source_tier: z.number().min(1).max(3),
  source_credibility: z.number().min(0).max(1),
  confirmation_count: z.number(),
  confirmed_by: z.array(z.string()), // handles
  
  // Composite
  overall_confidence: z.number().min(0).max(1),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  
  // Processing metadata
  processed_at: z.string().datetime(),
});

export type Signal = z.infer<typeof SignalSchema>;

// ============ NORMALIZED EVENT ============

export const NormalizedEventSchema = z.object({
  event_id: z.string(),
  event_type: z.string(),
  category: z.enum(['Economy', 'Politics', 'Sports', 'Tech', 'M&A', 'Crypto']),
  subcategory: z.string().optional(),
  region: z.string().optional(),
  
  // Event Details
  headline: z.string(),
  summary: z.string(),
  entities: z.array(z.string()), // Companies, people, countries
  
  // Confidence & Status
  confidence: z.number().min(0).max(1),
  status: z.enum(['rumor', 'developing', 'confirmed', 'denied', 'resolved']),
  
  // Sources
  source_signals: z.array(z.string()), // signal_ids
  primary_sources: z.array(z.string()), // handles
  first_seen: z.string().datetime(),
  last_updated: z.string().datetime(),
  
  // Market Mapping
  mapped_markets: z.array(z.object({
    market_id: z.string(),
    market_title: z.string(),
    platform: z.string(),
    relevance: z.number().min(0).max(1),
  })).optional(),
  
  // Impact Assessment
  market_impact: z.object({
    assets: z.array(z.string()),
    direction: z.enum(['bullish', 'bearish', 'neutral', 'volatile']),
    magnitude: z.enum(['minor', 'moderate', 'significant', 'major']),
    sectors: z.array(z.string()),
  }).optional(),
});

export type NormalizedEvent = z.infer<typeof NormalizedEventSchema>;

// ============ ALERT ============

export const AlertSchema = z.object({
  alert_id: z.string(),
  event_id: z.string(),
  severity: z.enum(['info', 'warning', 'critical']),
  trigger: z.enum(['confidence_threshold', 'multi_source', 'velocity_spike', 'tier1_override']),
  title: z.string(),
  message: z.string(),
  created_at: z.string().datetime(),
  acknowledged: z.boolean(),
  acknowledged_at: z.string().datetime().optional(),
});

export type Alert = z.infer<typeof AlertSchema>;

// ============ KEYWORD BUNDLES ============

export interface KeywordBundle {
  category: AccountCategory;
  keywords: string[];
  phrases: string[];
  version: string;
  updated_at: string;
}

