/**
 * Perplexity Query Builder
 *
 * Analyzes user requests to determine if search is needed and optimizes queries for Perplexity
 * Feature 6.0: Web Search Integration
 */

/**
 * Result of analyzing whether search is needed
 */
export interface QueryAnalysis {
  /** Whether web search should be activated */
  needsSearch: boolean;

  /** Optimized search query (if search needed) */
  searchQuery: string;

  /** Reasoning for decision */
  reasoning: string;

  /** Detected trigger keywords */
  triggers: string[];

  /** Confidence level (0-1) */
  confidence: number;
}

/**
 * Configuration for search trigger detection
 */
export interface TriggerConfig {
  /** Explicit prefix keywords */
  explicitPrefixes: string[];

  /** Temporal keywords */
  temporalKeywords: string[];

  /** Data request keywords */
  dataKeywords: string[];

  /** Minimum confidence threshold (default: 0.7) */
  minConfidence?: number;
}

/**
 * Default trigger configuration
 */
const DEFAULT_TRIGGER_CONFIG: TriggerConfig = {
  explicitPrefixes: [
    'search:',
    'look up:',
    'find:',
    'research:',
    'get data on:',
  ],

  temporalKeywords: [
    'current',
    'latest',
    'recent',
    'today',
    'this year',
    'this month',
    'this week',
    '2025',
    '2024',
    'now',
    'up-to-date',
    'real-time',
  ],

  dataKeywords: [
    'market cap',
    'market capitalization',
    'stock price',
    'statistics',
    'data on',
    'numbers for',
    'top 5',
    'top 10',
    'best',
    'fastest',
    'largest',
    'ranking',
    'comparison',
  ],

  minConfidence: 0.7,
};

/**
 * Analyze user request to determine if search is needed
 *
 * @param userRequest - User's diagram request
 * @param config - Optional trigger configuration
 * @returns Analysis with search decision
 *
 * @example
 * ```typescript
 * const analysis = analyzeSearchNeed(
 *   'Create chart with current market cap data'
 * );
 *
 * if (analysis.needsSearch) {
 *   console.log(`Search needed: ${analysis.reasoning}`);
 *   console.log(`Query: ${analysis.searchQuery}`);
 * }
 * ```
 */
export function analyzeSearchNeed(
  userRequest: string,
  config?: Partial<TriggerConfig>
): QueryAnalysis {
  const cfg = { ...DEFAULT_TRIGGER_CONFIG, ...config };
  const lowerRequest = userRequest.toLowerCase();

  const triggers: string[] = [];
  let confidence = 0;

  // 1. Check for explicit prefixes (100% confidence)
  for (const prefix of cfg.explicitPrefixes) {
    if (lowerRequest.startsWith(prefix)) {
      triggers.push(`explicit:${prefix}`);
      confidence = 1.0;
      break;
    }
  }

  // 2. Check for temporal keywords (adds 0.4 confidence)
  const temporalMatches = cfg.temporalKeywords.filter(keyword =>
    lowerRequest.includes(keyword)
  );
  if (temporalMatches.length > 0) {
    triggers.push(...temporalMatches.map(k => `temporal:${k}`));
    confidence += 0.4;
  }

  // 3. Check for data keywords (adds 0.3 confidence)
  const dataMatches = cfg.dataKeywords.filter(keyword =>
    lowerRequest.includes(keyword)
  );
  if (dataMatches.length > 0) {
    triggers.push(...dataMatches.map(k => `data:${k}`));
    confidence += 0.3;
  }

  // 4. Check for question words + data context (adds 0.2 confidence)
  const hasQuestionWord = /\b(what|which|who|how many)\b/i.test(userRequest);
  const hasDataContext = /\b(company|companies|country|countries|people|person)\b/i.test(userRequest);
  if (hasQuestionWord && hasDataContext) {
    triggers.push('question+context');
    confidence += 0.2;
  }

  // Cap confidence at 1.0
  confidence = Math.min(confidence, 1.0);

  const needsSearch = confidence >= (cfg.minConfidence ?? 0.7);

  return {
    needsSearch,
    searchQuery: needsSearch ? buildSearchQuery(userRequest) : '',
    reasoning: needsSearch
      ? `Detected ${triggers.length} trigger(s) with ${(confidence * 100).toFixed(0)}% confidence`
      : `No strong search triggers detected (${(confidence * 100).toFixed(0)}% confidence)`,
    triggers,
    confidence,
  };
}

/**
 * Build optimized search query from user request
 *
 * Removes diagram-specific instructions and extracts key entities
 *
 * @param userRequest - User's diagram request
 * @returns Optimized query for Perplexity
 *
 * @example
 * ```typescript
 * const query = buildSearchQuery(
 *   'Create a bar chart showing top 5 tech companies by market cap in 2025'
 * );
 * // Returns: "top 5 tech companies market capitalization 2025"
 * ```
 */
export function buildSearchQuery(userRequest: string): string {
  let query = userRequest;

  // 1. Remove explicit prefix if present
  const prefixRegex = /^(search|look up|find|research|get data on):\s*/i;
  query = query.replace(prefixRegex, '');

  // 2. Remove diagram-specific instructions
  const diagramInstructions = [
    /create\s+(a\s+)?(bar\s+chart|pie\s+chart|line\s+chart|graph|diagram|flowchart|table)/gi,
    /generate\s+(a\s+)?/gi,
    /make\s+(a\s+)?/gi,
    /design\s+(a\s+)?/gi,
    /show(ing)?\s+(me\s+)?/gi,
    /display(ing)?\s+/gi,
    /visualize\s+/gi,
    /illustrate\s+/gi,
  ];

  for (const pattern of diagramInstructions) {
    query = query.replace(pattern, '');
  }

  // 3. Extract key phrases (nouns, entities, numbers)
  // Keep: companies, market cap, top 5, 2025
  // Remove: the, a, an, of, for, with, using
  const stopWords = /\b(the|a|an|of|for|with|using|by|in|on|at)\b/gi;
  query = query.replace(stopWords, ' ');

  // 4. Normalize whitespace
  query = query.replace(/\s+/g, ' ').trim();

  // 5. Add temporal context if missing but implied
  const temporal = extractTemporalContext(userRequest);
  if (temporal && !query.includes(temporal)) {
    query = `${query} ${temporal}`;
  }

  // 6. Enforce length limit (< 200 characters)
  if (query.length > 200) {
    query = query.substring(0, 197) + '...';
  }

  return query;
}

/**
 * Extract temporal context from request
 *
 * @param request - User request
 * @returns Temporal context (e.g., "2025", "January 2025", "today")
 */
export function extractTemporalContext(request: string): string | null {
  // Extract year
  const yearMatch = request.match(/\b(202[0-9]|203[0-9])\b/);
  if (yearMatch) {
    return yearMatch[1];
  }

  // Check for "current", "latest", "today"
  if (/\b(current|latest|now|today)\b/i.test(request)) {
    return new Date().getFullYear().toString();
  }

  // Check for "this year/month"
  if (/\bthis\s+(year|month)\b/i.test(request)) {
    return new Date().getFullYear().toString();
  }

  return null;
}
