import OpenAI from 'openai';
import { IntelligenceItem, IntelligenceAssessment, ImpactType, TimeHorizon, MarketImplication } from './types';
import { MonitoringDomain, DOMAIN_METADATA } from './sources';

const ASSESSMENT_SYSTEM_PROMPT = `You are a senior geopolitical intelligence analyst specializing in assessing news for market and policy implications.

Your task is to analyze news articles and provide structured assessments of their severity, relevance, and potential impact.

SCORING GUIDELINES (1-10 scale):

SEVERITY - How serious is this development?
1-2: Routine news, minimal significance
3-4: Notable but contained development  
5-6: Significant event with clear implications
7-8: Major development requiring close monitoring
9-10: Crisis-level event with systemic implications

RELEVANCE - How relevant to markets/geopolitics?
1-2: Tangential connection at best
3-4: Some relevance to specific sectors
5-6: Clear relevance to multiple stakeholders
7-8: Highly relevant to major markets/powers
9-10: Core geopolitical/market event

IMPACT - Potential market/policy impact
1-2: Negligible expected impact
3-4: Minor, localized impact
5-6: Moderate impact on affected areas
7-8: Significant broad impact expected
9-10: Major systemic impact likely

URGENCY - Time sensitivity
1-2: Background development, no rush
3-4: Worth noting but not time-critical
5-6: Should be addressed within days
7-8: Requires attention within 24 hours
9-10: Immediate attention required

Always provide:
- Clear reasoning for your scores
- Specific market implications with assets affected
- Key risks and uncertainties
- Escalation potential assessment

Be calibrated - most news is 3-5 severity. Reserve 8+ for genuine crises.`;

const ASSESSMENT_USER_PROMPT = (item: Partial<IntelligenceItem>) => `
Analyze this news article:

TITLE: ${item.title}

SOURCE: ${item.sourceName}

SUMMARY: ${item.summary}

${item.content ? `FULL TEXT: ${item.content}` : ''}

Provide your assessment in the following JSON format:
{
  "severity": <1-10>,
  "relevance": <1-10>,
  "impact": <1-10>,
  "urgency": <1-10>,
  "confidence": <1-10>,
  "impactType": "<market_shock|policy_shift|conflict_escalation|diplomatic_breakthrough|regulatory_change|supply_disruption|leadership_change|economic_crisis|security_threat|technology_shift|humanitarian_crisis|environmental_event>",
  "timeHorizon": "<immediate|short_term|medium_term|long_term>",
  "affectedRegions": ["<region1>", "<region2>"],
  "affectedSectors": ["<sector1>", "<sector2>"],
  "marketImplications": [
    {
      "asset": "<asset name>",
      "direction": "<bullish|bearish|volatile|neutral>",
      "magnitude": "<minor|moderate|significant|major>",
      "rationale": "<brief explanation>"
    }
  ],
  "keyPoints": ["<point1>", "<point2>", "<point3>"],
  "risks": ["<risk1>", "<risk2>"],
  "opportunities": ["<opportunity1>"],
  "escalationPotential": "<low|medium|high|critical>",
  "reasoning": "<2-3 sentence explanation of your overall assessment>",
  "uncertainties": ["<uncertainty1>", "<uncertainty2>"],
  "suggestedDomains": ["<domain1>", "<domain2>"]
}`;

export class AssessmentEngine {
  private openai: OpenAI;
  
  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
  }
  
  async assessItem(item: Partial<IntelligenceItem>): Promise<IntelligenceAssessment> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: ASSESSMENT_SYSTEM_PROMPT },
          { role: 'user', content: ASSESSMENT_USER_PROMPT(item) }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3, // Lower temperature for more consistent scoring
        max_tokens: 1500
      });
      
      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }
      
      const parsed = JSON.parse(content);
      
      // Calculate composite score
      const compositeScore = this.calculateCompositeScore(parsed);
      
      return {
        severity: parsed.severity,
        relevance: parsed.relevance,
        impact: parsed.impact,
        urgency: parsed.urgency,
        confidence: parsed.confidence,
        compositeScore,
        impactType: parsed.impactType as ImpactType,
        timeHorizon: parsed.timeHorizon as TimeHorizon,
        affectedRegions: parsed.affectedRegions || [],
        affectedSectors: parsed.affectedSectors || [],
        marketImplications: parsed.marketImplications || [],
        keyPoints: parsed.keyPoints || [],
        risks: parsed.risks || [],
        opportunities: parsed.opportunities || [],
        relatedEvents: [],
        escalationPotential: parsed.escalationPotential || 'low',
        reasoning: parsed.reasoning || '',
        uncertainties: parsed.uncertainties || []
      };
    } catch (error) {
      console.error('Assessment failed:', error);
      return this.getDefaultAssessment();
    }
  }
  
  private calculateCompositeScore(assessment: any): number {
    // Weighted composite score
    const weights = {
      severity: 0.35,
      relevance: 0.25,
      impact: 0.25,
      urgency: 0.15
    };
    
    const score = (
      assessment.severity * weights.severity +
      assessment.relevance * weights.relevance +
      assessment.impact * weights.impact +
      assessment.urgency * weights.urgency
    );
    
    return Math.round(score * 10) / 10;
  }
  
  private getDefaultAssessment(): IntelligenceAssessment {
    return {
      severity: 3,
      relevance: 3,
      impact: 3,
      urgency: 3,
      confidence: 1,
      compositeScore: 3,
      impactType: 'policy_shift',
      timeHorizon: 'medium_term',
      affectedRegions: [],
      affectedSectors: [],
      marketImplications: [],
      keyPoints: ['Assessment pending'],
      risks: [],
      opportunities: [],
      relatedEvents: [],
      escalationPotential: 'low',
      reasoning: 'Automated assessment unavailable',
      uncertainties: ['Assessment not completed']
    };
  }
  
  // Batch assessment for efficiency
  async assessBatch(items: Partial<IntelligenceItem>[]): Promise<IntelligenceAssessment[]> {
    const results: IntelligenceAssessment[] = [];
    
    // Process in parallel with rate limiting
    const batchSize = 5;
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(item => this.assessItem(item))
      );
      results.push(...batchResults);
      
      // Rate limit delay
      if (i + batchSize < items.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return results;
  }
  
  // Domain classification
  async classifyDomains(item: Partial<IntelligenceItem>): Promise<MonitoringDomain[]> {
    const domainList = Object.keys(DOMAIN_METADATA).join(', ');
    
    const response = await this.openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `You classify news articles into geopolitical monitoring domains. Available domains: ${domainList}. Return a JSON array of 1-3 most relevant domain IDs.`
        },
        {
          role: 'user',
          content: `Title: ${item.title}\nSummary: ${item.summary}\n\nReturn JSON array of domain IDs:`
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
      max_tokens: 100
    });
    
    try {
      const content = response.choices[0]?.message?.content;
      const parsed = JSON.parse(content || '{"domains":[]}');
      return parsed.domains || [];
    } catch {
      return [];
    }
  }
}

// Severity color mapping for UI
export function getSeverityColor(severity: number): string {
  if (severity >= 9) return 'red';
  if (severity >= 7) return 'orange';
  if (severity >= 5) return 'yellow';
  if (severity >= 3) return 'blue';
  return 'zinc';
}

export function getSeverityLabel(severity: number): string {
  const labels = [
    '', 'Minimal', 'Minor', 'Low', 'Moderate', 'Elevated',
    'High', 'Serious', 'Severe', 'Critical', 'Extreme'
  ];
  return labels[Math.min(Math.max(severity, 1), 10)];
}

