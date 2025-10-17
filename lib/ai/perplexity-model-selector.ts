/**
 * Perplexity Model Selector
 *
 * Intelligently selects the appropriate Perplexity model based on query complexity
 * Feature 6.0: Web Search Integration
 */

import { calculateSearchCost, estimateTokens } from './perplexity-client';

/**
 * Model selection result
 */
export interface ModelSelection {
  /** Selected model */
  model: 'sonar' | 'sonar-pro' | 'sonar-reasoning';

  /** Reasoning for selection */
  reasoning: string;

  /** Estimated cost for this model */
  estimatedCostUsd: number;

  /** Complexity score (0-1) */
  complexityScore: number;
}

/**
 * Complexity analysis of a query
 */
export interface ComplexityAnalysis {
  /** Overall complexity score (0-1) */
  score: number;

  /** Individual factor scores */
  factors: {
    length: number;          // Query length factor
    analyticalWords: number; // Presence of "analyze", "compare", etc.
    multiStep: number;       // Requires multi-step reasoning
    specificity: number;     // How specific vs. general
  };

  /** Detected complexity indicators */
  indicators: string[];
}

/**
 * Analytical words that indicate complex queries
 */
const ANALYTICAL_WORDS = [
  'analyze',
  'compare',
  'contrast',
  'evaluate',
  'assess',
  'explain why',
  'reasoning',
  'pros and cons',
  'advantages',
  'disadvantages',
  'trade-offs',
  'implications',
  'consequences',
];

/**
 * Multi-step reasoning indicators
 */
const MULTI_STEP_INDICATORS = [
  'step by step',
  'process',
  'how to',
  'explain',
  'breakdown',
  'detailed',
  'comprehensive',
  'in-depth',
];

/**
 * Select optimal Perplexity model for a query
 *
 * @param query - Search query
 * @returns Model selection with reasoning
 *
 * @example
 * ```typescript
 * const selection = selectModel(
 *   'top 5 companies market cap'
 * );
 *
 * console.log(selection.model); // 'sonar'
 * console.log(selection.estimatedCostUsd); // 0.006
 * ```
 */
export function selectModel(
  query: string
): ModelSelection {
  const analysis = analyzeComplexity(query);

  // Use sonar-pro for high complexity (score > 0.6)
  if (analysis.score > 0.6) {
    return {
      model: 'sonar-pro',
      reasoning: `High complexity query (${(analysis.score * 100).toFixed(0)}%): ${analysis.indicators.join(', ')}`,
      estimatedCostUsd: estimateModelCost('sonar-pro', query.length),
      complexityScore: analysis.score,
    };
  }

  // Use sonar-reasoning for medium complexity with reasoning needs (score 0.4-0.6)
  if (analysis.score > 0.4 && hasReasoningIndicators(query)) {
    return {
      model: 'sonar-reasoning',
      reasoning: `Medium complexity with reasoning needs (${(analysis.score * 100).toFixed(0)}%): ${analysis.indicators.join(', ')}`,
      estimatedCostUsd: estimateModelCost('sonar-reasoning', query.length),
      complexityScore: analysis.score,
    };
  }

  // Default to sonar (cheapest, fastest)
  return {
    model: 'sonar',
    reasoning: `Simple query (${(analysis.score * 100).toFixed(0)}%): Standard search sufficient`,
    estimatedCostUsd: estimateModelCost('sonar', query.length),
    complexityScore: analysis.score,
  };
}

/**
 * Analyze complexity of a search query
 *
 * @param query - Search query to analyze
 * @returns Complexity analysis
 */
export function analyzeComplexity(query: string): ComplexityAnalysis {
  const lowerQuery = query.toLowerCase();
  const indicators: string[] = [];

  // Factor 1: Query length (0-0.3 score)
  const lengthScore = Math.min(query.length / 300, 0.3);
  if (query.length > 100) {
    indicators.push(`long query (${query.length} chars)`);
  }

  // Factor 2: Analytical words (0-0.4 score)
  const analyticalMatches = ANALYTICAL_WORDS.filter(word =>
    lowerQuery.includes(word)
  );
  const analyticalScore = Math.min(analyticalMatches.length * 0.2, 0.4);
  if (analyticalMatches.length > 0) {
    indicators.push(`analytical: ${analyticalMatches.join(', ')}`);
  }

  // Factor 3: Multi-step reasoning (0-0.2 score)
  const multiStepMatches = MULTI_STEP_INDICATORS.filter(indicator =>
    lowerQuery.includes(indicator)
  );
  const multiStepScore = Math.min(multiStepMatches.length * 0.1, 0.2);
  if (multiStepMatches.length > 0) {
    indicators.push(`multi-step: ${multiStepMatches.join(', ')}`);
  }

  // Factor 4: Specificity (0-0.1 score)
  // More specific queries (with numbers, quotes, brands) get lower score
  const hasNumbers = /\d+/.test(query);
  const hasQuotes = /"[^"]+"/.test(query);
  const hasBrands = /\b(google|apple|microsoft|amazon|facebook|tesla)\b/i.test(query);
  const specificityScore = (hasNumbers || hasQuotes || hasBrands) ? 0 : 0.1;
  if (!hasNumbers && !hasQuotes && !hasBrands) {
    indicators.push('general query');
  }

  // Calculate total score
  const score = Math.min(
    lengthScore + analyticalScore + multiStepScore + specificityScore,
    1.0
  );

  return {
    score,
    factors: {
      length: lengthScore,
      analyticalWords: analyticalScore,
      multiStep: multiStepScore,
      specificity: specificityScore,
    },
    indicators: indicators.length > 0 ? indicators : ['simple query'],
  };
}

/**
 * Check if query has reasoning indicators
 */
function hasReasoningIndicators(query: string): boolean {
  const reasoningWords = ['why', 'how', 'explain', 'reason', 'cause'];
  const lowerQuery = query.toLowerCase();
  return reasoningWords.some(word => lowerQuery.includes(word));
}

/**
 * Estimate cost for a model with typical usage
 *
 * @param model - Model to estimate
 * @param queryLength - Approximate query length in characters
 * @returns Estimated cost in USD
 */
export function estimateModelCost(
  model: 'sonar' | 'sonar-pro' | 'sonar-reasoning',
  queryLength: number
): number {
  // Estimate tokens
  const inputTokens = estimateTokens(queryLength.toString());
  const outputTokens = 500; // Typical output

  // Calculate cost using actual pricing
  return calculateSearchCost(model, inputTokens, outputTokens);
}
