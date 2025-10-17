# Feature 6.0: Web Search Integration - Technical Design

**Feature ID**: 6.0
**Feature Name**: Web Search Integration (Perplexity API)
**Status**: Ready for Implementation
**Last Updated**: January 2025
**Author**: Designer Agent

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Module Specifications](#2-module-specifications)
3. [Integration Changes](#3-integration-changes)
4. [API Specifications](#4-api-specifications)
5. [Error Handling](#5-error-handling)
6. [Testing Plan](#6-testing-plan)
7. [Implementation Order](#7-implementation-order)
8. [Configuration](#8-configuration)
9. [Security & Performance](#9-security--performance)
10. [Migration Notes](#10-migration-notes)

---

## 1. Architecture Overview

### 1.1 High-Level Component Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                          User Request                            │
│              "Create bar chart of top 5 tech companies"         │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│           POST /api/diagram/generate (Modified)                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 1. Validate Request & Parse Files                        │  │
│  │ 2. Check FEATURES.WEB_SEARCH flag                        │  │
│  │ 3. Analyze search need (Query Builder)                   │  │
│  │ 4. Check rate/budget limits (Rate Limiter)               │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────────┘
                         │
            ┌────────────┴────────────┐
            │ Search Needed?          │
            └────────────┬────────────┘
                    Yes  │  No
              ┌──────────┴─────────────┐
              ▼                        ▼
┌──────────────────────────┐   ┌──────────────────────────┐
│  Perplexity Search Flow  │   │   Skip Search Flow       │
│  ┌────────────────────┐  │   │  ┌────────────────────┐  │
│  │ Model Selector     │  │   │  │ Generate Diagram   │  │
│  │ (sonar/sonar-pro)  │  │   │  │ with GPT-4o        │  │
│  └────────┬───────────┘  │   │  └────────────────────┘  │
│           ▼              │   └──────────────────────────┘
│  ┌────────────────────┐  │
│  │ Perplexity Client  │  │
│  │ (HTTP Request)     │  │
│  └────────┬───────────┘  │
│           ▼              │
│  ┌────────────────────┐  │
│  │ Search Result      │  │
│  │ + Citations        │  │
│  └────────┬───────────┘  │
│           ▼              │
│  ┌────────────────────┐  │
│  │ Usage Tracker      │  │
│  │ (Cost/Stats)       │  │
│  └────────────────────┘  │
└──────────┬───────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────────┐
│              Enhanced Diagram Prompt Template                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ System Prompt + [Web Research Context] + User Request    │  │
│  │ - Search Answer                                          │  │
│  │ - Citations [1], [2], [3]                                │  │
│  │ - Instructions for citation footer                       │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                 OpenAI GPT-4o Generation                         │
│                    (Existing Module)                             │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Response with Metadata                         │
│  {                                                               │
│    success: true,                                                │
│    html: "<html>...",                                            │
│    metadata: {                                                   │
│      searchUsed: true,                                           │
│      searchQuery: "top 5 tech companies market cap 2025",       │
│      searchTokens: 650,                                          │
│      searchTime: 1200,                                           │
│      citationCount: 5                                            │
│    }                                                             │
│  }                                                               │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Data Flow

**Happy Path (Search Activated)**:
1. User submits diagram request with trigger keywords
2. API endpoint validates request and enables search
3. Query builder analyzes request and extracts search query
4. Rate limiter verifies request quota available
5. Budget tracker checks daily spend limit not exceeded
6. Model selector chooses appropriate Perplexity model
7. Perplexity client makes HTTP request to API
8. Search result returned with answer + citations
9. Usage tracker records cost and statistics
10. Search context merged into diagram prompt
11. GPT-4o generates diagram with current data
12. Citations included in diagram footer
13. Response returned with search metadata

**Fallback Path (Search Failed)**:
1. Steps 1-7 same as above
2. Perplexity API returns error (timeout/rate limit/auth)
3. Error logged with details
4. Search context set to undefined
5. searchUsed: false, searchError: "reason"
6. GPT-4o generates diagram without search context
7. Response returned with error metadata

**Skip Path (Search Not Needed)**:
1. User submits generic diagram request
2. Query builder detects no search triggers
3. Skip directly to GPT-4o generation
4. No Perplexity API call made
5. Response returned with searchUsed: false

### 1.3 Module Dependencies

```
┌─────────────────────────────────────────────────────────────────┐
│                  NEW MODULES (Feature 6.0)                       │
├─────────────────────────────────────────────────────────────────┤
│  perplexity-client.ts                                            │
│    ├── searchWithPerplexity()                                    │
│    └── Uses: OpenAI SDK, fetch API                              │
│                                                                   │
│  perplexity-query-builder.ts                                     │
│    ├── analyzeSearchNeed()                                       │
│    ├── buildSearchQuery()                                        │
│    └── Uses: String parsing, regex                              │
│                                                                   │
│  perplexity-model-selector.ts                                    │
│    ├── selectModel()                                             │
│    ├── estimateComplexity()                                      │
│    └── Uses: perplexity-client types                            │
│                                                                   │
│  perplexity-rate-limiter.ts                                      │
│    ├── RateLimiter class (singleton)                             │
│    ├── canMakeRequest()                                          │
│    └── Uses: In-memory tracking                                 │
│                                                                   │
│  perplexity-usage-tracker.ts                                     │
│    ├── PerplexityUsageTracker class (singleton)                  │
│    ├── record(), getStats()                                      │
│    ├── BudgetTracker class (singleton)                           │
│    └── Uses: In-memory tracking                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│               MODIFIED MODULES (Existing)                        │
├─────────────────────────────────────────────────────────────────┤
│  diagram-prompt-template.ts                                      │
│    └── buildDiagramPrompt() - add searchContext param           │
│                                                                   │
│  diagram-generator.ts                                            │
│    └── generateDiagram() - pass searchContext through           │
│                                                                   │
│  app/api/diagram/generate/route.ts                               │
│    └── POST handler - integrate search workflow                 │
│                                                                   │
│  lib/config/features.ts                                          │
│    └── Add WEB_SEARCH flag                                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Module Specifications

### 2.1 Perplexity API Client (`lib/ai/perplexity-client.ts`)

**Purpose**: Encapsulate all Perplexity API interactions with authentication, error handling, and retries.

#### 2.1.1 TypeScript Interfaces

```typescript
/**
 * Request parameters for Perplexity search
 */
export interface PerplexitySearchRequest {
  /** Search query (optimized for web research) */
  query: string;

  /** Model to use (default: 'sonar') */
  model?: 'sonar' | 'sonar-pro' | 'sonar-reasoning';

  /** Maximum tokens in response (default: 1000) */
  maxTokens?: number;

  /** Temperature for generation (default: 0.2) */
  temperature?: number;

  /** Whether to return sources (default: true) */
  returnCitations?: boolean;
}

/**
 * Successful search result from Perplexity
 */
export interface PerplexitySearchResult {
  /** Main answer from Perplexity */
  answer: string;

  /** Source citations with metadata */
  citations: PerplexityCitation[];

  /** Model used for this search */
  modelUsed: string;

  /** Input tokens consumed */
  tokensInput: number;

  /** Output tokens generated */
  tokensOutput: number;

  /** Total tokens (input + output) */
  tokensTotal: number;

  /** Search execution time in milliseconds */
  searchTimeMs: number;

  /** Estimated cost in USD */
  estimatedCostUsd: number;
}

/**
 * Citation from Perplexity search
 */
export interface PerplexityCitation {
  /** Source URL */
  url: string;

  /** Page title */
  title: string;

  /** Excerpt from source */
  snippet?: string;

  /** Domain name */
  domain?: string;

  /** Publication date if available */
  publishedDate?: string;
}

/**
 * Error types from Perplexity API
 */
export type PerplexityErrorCode =
  | 'rate_limit'        // 429 - Too many requests
  | 'timeout'           // ETIMEDOUT - Request timeout
  | 'auth_error'        // 401 - Invalid API key
  | 'server_error'      // 5xx - Perplexity server error
  | 'network_error'     // ECONNREFUSED - Network failure
  | 'invalid_request'   // 400 - Bad request
  | 'unknown_error';    // Unexpected error

/**
 * Error from Perplexity API
 */
export interface PerplexityError {
  /** Error code for programmatic handling */
  code: PerplexityErrorCode;

  /** Human-readable error message */
  message: string;

  /** Whether this error is retryable */
  retryable: boolean;

  /** Original HTTP status code if applicable */
  statusCode?: number;

  /** Additional error details */
  details?: unknown;
}

/**
 * Configuration for Perplexity client
 */
export interface PerplexityClientConfig {
  /** API key (from environment) */
  apiKey: string;

  /** Request timeout in milliseconds (default: 3000) */
  timeoutMs?: number;

  /** Base URL for API (default: https://api.perplexity.ai) */
  baseUrl?: string;

  /** Whether to enable debug logging */
  debug?: boolean;
}
```

#### 2.1.2 Main Functions

```typescript
/**
 * Search the web using Perplexity AI
 *
 * @param request - Search parameters
 * @param config - Optional client configuration (uses defaults from env)
 * @returns Search result with answer and citations
 * @throws PerplexityError on API failure
 *
 * @example
 * ```typescript
 * const result = await searchWithPerplexity({
 *   query: 'top 5 tech companies market cap 2025',
 *   model: 'sonar',
 * });
 *
 * console.log(result.answer);
 * console.log(result.citations);
 * ```
 */
export async function searchWithPerplexity(
  request: PerplexitySearchRequest,
  config?: Partial<PerplexityClientConfig>
): Promise<PerplexitySearchResult>;

/**
 * Calculate cost for a search request
 *
 * @param model - Model to use
 * @param tokensInput - Input tokens
 * @param tokensOutput - Output tokens
 * @returns Cost in USD
 *
 * @example
 * ```typescript
 * const cost = calculateSearchCost('sonar', 100, 500);
 * // Returns: 0.006 (approx)
 * ```
 */
export function calculateSearchCost(
  model: 'sonar' | 'sonar-pro' | 'sonar-reasoning',
  tokensInput: number,
  tokensOutput: number
): number;

/**
 * Estimate tokens from text
 * Rough approximation: 1 token ≈ 4 characters
 *
 * @param text - Text to estimate
 * @returns Estimated token count
 */
export function estimateTokens(text: string): number;
```

#### 2.1.3 Implementation Details

**Authentication**:
- Use bearer token authentication
- API key from `process.env.PERPLEXITY_API_KEY`
- Include in Authorization header: `Bearer pplx-xxx...`

**HTTP Client**:
```typescript
// Use native fetch with AbortSignal for timeout
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

try {
  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: request.model || 'sonar',
      messages: [
        {
          role: 'user',
          content: request.query,
        },
      ],
      max_tokens: request.maxTokens || 1000,
      temperature: request.temperature || 0.2,
      return_citations: request.returnCitations ?? true,
      return_related_questions: false,
    }),
    signal: controller.signal,
  });

  clearTimeout(timeoutId);

  // Handle response...
} catch (error) {
  clearTimeout(timeoutId);
  // Handle error...
}
```

**Error Handling**:
```typescript
function handlePerplexityError(error: unknown): PerplexityError {
  // Network timeout
  if (error instanceof Error && error.name === 'AbortError') {
    return {
      code: 'timeout',
      message: 'Request timed out after 3 seconds',
      retryable: true,
    };
  }

  // HTTP errors
  if (isHttpError(error)) {
    const status = error.status;

    if (status === 429) {
      return {
        code: 'rate_limit',
        message: 'Rate limit exceeded',
        retryable: false, // Don't retry immediately
        statusCode: 429,
      };
    }

    if (status === 401) {
      return {
        code: 'auth_error',
        message: 'Invalid API key',
        retryable: false,
        statusCode: 401,
      };
    }

    if (status >= 500) {
      return {
        code: 'server_error',
        message: `Perplexity server error: ${status}`,
        retryable: true,
        statusCode: status,
      };
    }

    if (status === 400) {
      return {
        code: 'invalid_request',
        message: 'Invalid request parameters',
        retryable: false,
        statusCode: 400,
      };
    }
  }

  // Network errors
  if (error instanceof Error &&
      (error.message.includes('ECONNREFUSED') ||
       error.message.includes('ENOTFOUND'))) {
    return {
      code: 'network_error',
      message: 'Network connection failed',
      retryable: false,
    };
  }

  // Unknown error
  return {
    code: 'unknown_error',
    message: error instanceof Error ? error.message : 'Unknown error',
    retryable: false,
  };
}
```

**Retry Logic**:
```typescript
async function searchWithPerplexity(
  request: PerplexitySearchRequest,
  config?: Partial<PerplexityClientConfig>
): Promise<PerplexitySearchResult> {
  const maxRetries = 1; // Retry once on transient failures
  let lastError: PerplexityError | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Make API call
      const result = await performSearch(request, config);
      return result;
    } catch (error) {
      lastError = handlePerplexityError(error);

      // Don't retry on non-retryable errors
      if (!lastError.retryable) {
        throw lastError;
      }

      // Don't retry on last attempt
      if (attempt === maxRetries) {
        throw lastError;
      }

      // Wait before retry (exponential backoff)
      const delayMs = 1000 * Math.pow(2, attempt); // 1s, 2s
      await new Promise(resolve => setTimeout(resolve, delayMs));

      console.warn(`Retrying Perplexity request (attempt ${attempt + 2})`);
    }
  }

  throw lastError!;
}
```

**Response Parsing**:
```typescript
interface PerplexityApiResponse {
  id: string;
  model: string;
  created: number;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  citations?: string[];
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
}

function parsePerplexityResponse(
  apiResponse: PerplexityApiResponse,
  searchStartTime: number
): PerplexitySearchResult {
  const answer = apiResponse.choices[0]?.message?.content || '';
  const citations = parseCitations(apiResponse.citations || []);

  const tokensInput = apiResponse.usage.prompt_tokens;
  const tokensOutput = apiResponse.usage.completion_tokens;
  const tokensTotal = apiResponse.usage.total_tokens;

  const searchTimeMs = Date.now() - searchStartTime;
  const estimatedCostUsd = calculateSearchCost(
    apiResponse.model as any,
    tokensInput,
    tokensOutput
  );

  return {
    answer,
    citations,
    modelUsed: apiResponse.model,
    tokensInput,
    tokensOutput,
    tokensTotal,
    searchTimeMs,
    estimatedCostUsd,
  };
}

function parseCitations(citationUrls: string[]): PerplexityCitation[] {
  return citationUrls.map(url => {
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname.replace('www.', '');

      return {
        url,
        title: extractTitleFromUrl(url),
        domain,
      };
    } catch {
      return {
        url,
        title: url,
      };
    }
  });
}
```

---

### 2.2 Query Builder (`lib/ai/perplexity-query-builder.ts`)

**Purpose**: Analyze user requests to determine if search is needed and optimize queries for Perplexity.

#### 2.2.1 TypeScript Interfaces

```typescript
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
```

#### 2.2.2 Main Functions

```typescript
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
): QueryAnalysis;

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
export function buildSearchQuery(userRequest: string): string;

/**
 * Extract temporal context from request
 *
 * @param request - User request
 * @returns Temporal context (e.g., "2025", "January 2025", "today")
 */
export function extractTemporalContext(request: string): string | null;
```

#### 2.2.3 Implementation Details

**Default Trigger Configuration**:
```typescript
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
```

**Search Trigger Detection Algorithm**:
```typescript
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

  const needsSearch = confidence >= cfg.minConfidence;

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
```

**Query Optimization**:
```typescript
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
```

---

### 2.3 Model Selector (`lib/ai/perplexity-model-selector.ts`)

**Purpose**: Intelligently select the appropriate Perplexity model based on query complexity.

#### 2.3.1 TypeScript Interfaces

```typescript
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
```

#### 2.3.2 Main Functions

```typescript
/**
 * Select optimal Perplexity model for a query
 *
 * @param query - Search query
 * @param userRequest - Original user request (for context)
 * @returns Model selection with reasoning
 *
 * @example
 * ```typescript
 * const selection = selectModel(
 *   'top 5 companies market cap',
 *   'Create chart of top 5 companies'
 * );
 *
 * console.log(selection.model); // 'sonar'
 * console.log(selection.estimatedCostUsd); // 0.006
 * ```
 */
export function selectModel(
  query: string,
  userRequest?: string
): ModelSelection;

/**
 * Analyze complexity of a search query
 *
 * @param query - Search query to analyze
 * @returns Complexity analysis
 */
export function analyzeComplexity(query: string): ComplexityAnalysis;

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
): number;
```

#### 2.3.3 Implementation Details

**Model Selection Logic**:
```typescript
export function selectModel(
  query: string,
  userRequest?: string
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

  // Use sonar-reasoning for multi-step reasoning
  if (analysis.factors.multiStep > 0.5) {
    return {
      model: 'sonar-reasoning',
      reasoning: 'Multi-step reasoning required',
      estimatedCostUsd: estimateModelCost('sonar-reasoning', query.length),
      complexityScore: analysis.score,
    };
  }

  // Default to sonar (cheapest, fastest)
  return {
    model: 'sonar',
    reasoning: 'Simple factual query',
    estimatedCostUsd: estimateModelCost('sonar', query.length),
    complexityScore: analysis.score,
  };
}
```

**Complexity Analysis**:
```typescript
export function analyzeComplexity(query: string): ComplexityAnalysis {
  const indicators: string[] = [];
  const factors = {
    length: 0,
    analyticalWords: 0,
    multiStep: 0,
    specificity: 0,
  };

  // 1. Length factor (longer = more complex)
  if (query.length > 300) {
    factors.length = 0.8;
    indicators.push('long query');
  } else if (query.length > 150) {
    factors.length = 0.5;
    indicators.push('medium query');
  } else {
    factors.length = 0.2;
  }

  // 2. Analytical words (compare, analyze, evaluate, explain why)
  const analyticalWords = [
    'analyze', 'compare', 'evaluate', 'assess',
    'explain why', 'explain how', 'reasoning',
    'pros and cons', 'advantages', 'disadvantages',
    'trade-offs', 'versus', 'vs',
  ];

  const matchedAnalytical = analyticalWords.filter(word =>
    query.toLowerCase().includes(word)
  );

  if (matchedAnalytical.length > 0) {
    factors.analyticalWords = Math.min(matchedAnalytical.length * 0.3, 1.0);
    indicators.push(...matchedAnalytical);
  }

  // 3. Multi-step reasoning indicators
  const multiStepIndicators = [
    'first', 'then', 'after that', 'finally',
    'step 1', 'step 2',
    'because', 'therefore', 'as a result',
  ];

  const matchedMultiStep = multiStepIndicators.filter(indicator =>
    query.toLowerCase().includes(indicator)
  );

  if (matchedMultiStep.length > 0) {
    factors.multiStep = 0.7;
    indicators.push('multi-step');
  }

  // 4. Specificity (specific entities vs. general concepts)
  const hasNumbers = /\d+/.test(query);
  const hasProperNouns = /[A-Z][a-z]+/.test(query);
  const hasQuotes = /["']/.test(query);

  if (hasNumbers || hasProperNouns || hasQuotes) {
    factors.specificity = 0.3; // Specific queries are simpler
  } else {
    factors.specificity = 0.6; // General queries may need deeper research
    indicators.push('general/conceptual');
  }

  // Calculate overall score (weighted average)
  const score = (
    factors.length * 0.2 +
    factors.analyticalWords * 0.4 +
    factors.multiStep * 0.3 +
    factors.specificity * 0.1
  );

  return {
    score,
    factors,
    indicators,
  };
}
```

**Cost Estimation**:
```typescript
export function estimateModelCost(
  model: 'sonar' | 'sonar-pro' | 'sonar-reasoning',
  queryLength: number
): number {
  // Estimate tokens (1 token ≈ 4 characters)
  const inputTokens = Math.ceil(queryLength / 4);
  const outputTokens = 500; // Typical output length

  // Token costs per 1M tokens
  const costs = {
    sonar: { input: 1, output: 1 },
    'sonar-pro': { input: 3, output: 15 },
    'sonar-reasoning': { input: 1, output: 5 },
  };

  // Token cost
  const tokenCost = (
    (inputTokens * costs[model].input / 1_000_000) +
    (outputTokens * costs[model].output / 1_000_000)
  );

  // Request cost (per 1K requests)
  const requestCosts = {
    sonar: 0.005,       // $5 per 1K requests
    'sonar-pro': 0.006, // $6 per 1K requests
    'sonar-reasoning': 0.005,
  };

  return tokenCost + requestCosts[model];
}
```

---

### 2.4 Rate Limiter (`lib/ai/perplexity-rate-limiter.ts`)

**Purpose**: Prevent exceeding Perplexity API rate limits using sliding window algorithm.

#### 2.4.1 TypeScript Interfaces

```typescript
/**
 * Rate limit status
 */
export interface RateLimitStatus {
  /** Whether a request can be made now */
  allowed: boolean;

  /** Remaining requests in current window */
  remaining: number;

  /** Maximum requests per window */
  limit: number;

  /** Time until limit resets (ms) */
  resetInMs: number;

  /** Reason if not allowed */
  reason?: string;
}

/**
 * Configuration for rate limiter
 */
export interface RateLimiterConfig {
  /** Maximum requests per window */
  maxRequests: number;

  /** Window duration in milliseconds */
  windowMs: number;
}
```

#### 2.4.2 Main Class

```typescript
/**
 * Sliding window rate limiter for Perplexity API
 *
 * Singleton instance to share state across API calls
 * Thread-safe for serverless environments
 *
 * @example
 * ```typescript
 * const limiter = PerplexityRateLimiter.getInstance();
 *
 * const status = limiter.checkLimit();
 * if (!status.allowed) {
 *   console.log(`Rate limit exceeded. Reset in ${status.resetInMs}ms`);
 *   return;
 * }
 *
 * // Make API call
 * limiter.recordRequest();
 * ```
 */
export class PerplexityRateLimiter {
  private static instance: PerplexityRateLimiter;

  private requestTimestamps: number[] = [];
  private config: RateLimiterConfig;

  private constructor(config?: Partial<RateLimiterConfig>) {
    this.config = {
      maxRequests: parseInt(process.env.PERPLEXITY_MAX_REQUESTS_PER_MINUTE || '60'),
      windowMs: 60 * 1000, // 1 minute
      ...config,
    };
  }

  /**
   * Get singleton instance
   */
  public static getInstance(config?: Partial<RateLimiterConfig>): PerplexityRateLimiter {
    if (!PerplexityRateLimiter.instance) {
      PerplexityRateLimiter.instance = new PerplexityRateLimiter(config);
    }
    return PerplexityRateLimiter.instance;
  }

  /**
   * Check if a request can be made
   *
   * @returns Rate limit status
   */
  public checkLimit(): RateLimitStatus {
    this.cleanOldRequests();

    const remaining = this.config.maxRequests - this.requestTimestamps.length;
    const allowed = remaining > 0;

    // Calculate reset time
    const oldestTimestamp = this.requestTimestamps[0] || Date.now();
    const resetInMs = Math.max(0, (oldestTimestamp + this.config.windowMs) - Date.now());

    return {
      allowed,
      remaining: Math.max(0, remaining),
      limit: this.config.maxRequests,
      resetInMs,
      reason: allowed ? undefined : 'Rate limit exceeded',
    };
  }

  /**
   * Record a request (call after successful API request)
   */
  public recordRequest(): void {
    this.requestTimestamps.push(Date.now());
    this.cleanOldRequests();
  }

  /**
   * Reset all counters (for testing)
   */
  public reset(): void {
    this.requestTimestamps = [];
  }

  /**
   * Get current request count
   */
  public getCurrentCount(): number {
    this.cleanOldRequests();
    return this.requestTimestamps.length;
  }

  /**
   * Remove timestamps outside the current window
   */
  private cleanOldRequests(): void {
    const now = Date.now();
    const cutoff = now - this.config.windowMs;

    this.requestTimestamps = this.requestTimestamps.filter(
      timestamp => timestamp > cutoff
    );
  }
}

/**
 * Convenience function to check rate limit
 */
export function checkRateLimit(): RateLimitStatus {
  return PerplexityRateLimiter.getInstance().checkLimit();
}

/**
 * Convenience function to record request
 */
export function recordRequest(): void {
  PerplexityRateLimiter.getInstance().recordRequest();
}
```

---

### 2.5 Usage Tracker (`lib/ai/perplexity-usage-tracker.ts`)

**Purpose**: Track API usage, costs, and enforce daily budget limits.

#### 2.5.1 TypeScript Interfaces

```typescript
/**
 * Single usage record
 */
export interface UsageRecord {
  /** Timestamp of request */
  timestamp: Date;

  /** Search query */
  query: string;

  /** Model used */
  model: string;

  /** Input tokens */
  tokensInput: number;

  /** Output tokens */
  tokensOutput: number;

  /** Total tokens */
  tokensTotal: number;

  /** Cost in USD */
  costUsd: number;

  /** Whether request succeeded */
  success: boolean;

  /** Error message if failed */
  error?: string;

  /** Search time in milliseconds */
  searchTimeMs?: number;
}

/**
 * Usage statistics
 */
export interface UsageStatistics {
  /** Total requests made */
  totalRequests: number;

  /** Successful requests */
  successfulRequests: number;

  /** Failed requests */
  failedRequests: number;

  /** Success rate (0-1) */
  successRate: number;

  /** Total cost in USD */
  totalCost: number;

  /** Total tokens consumed */
  totalTokens: number;

  /** Average tokens per request */
  avgTokens: number;

  /** Average cost per request */
  avgCost: number;

  /** Average search time (ms) */
  avgSearchTime: number;

  /** Requests today */
  requestsToday: number;

  /** Spend today */
  spendToday: number;
}

/**
 * Budget status
 */
export interface BudgetStatus {
  /** Whether budget allows new request */
  allowed: boolean;

  /** Current daily spend */
  currentSpend: number;

  /** Daily budget limit */
  dailyLimit: number;

  /** Remaining budget */
  remaining: number;

  /** Percentage used (0-100) */
  percentageUsed: number;

  /** Time until budget resets (ms) */
  resetInMs: number;

  /** Reason if not allowed */
  reason?: string;
}
```

#### 2.5.2 Main Classes

```typescript
/**
 * Usage tracker for Perplexity API
 *
 * Singleton instance to track all usage across application
 * In-memory storage (resets on server restart)
 */
export class PerplexityUsageTracker {
  private static instance: PerplexityUsageTracker;

  private records: UsageRecord[] = [];
  private maxRecords: number = 10000; // Keep last 10K records

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): PerplexityUsageTracker {
    if (!PerplexityUsageTracker.instance) {
      PerplexityUsageTracker.instance = new PerplexityUsageTracker();
    }
    return PerplexityUsageTracker.instance;
  }

  /**
   * Record a usage event
   *
   * @param record - Usage record to store
   */
  public record(record: UsageRecord): void {
    this.records.push(record);

    // Trim old records if exceeding max
    if (this.records.length > this.maxRecords) {
      this.records = this.records.slice(-this.maxRecords);
    }

    // Log to console
    console.log(`[Perplexity] ${record.success ? 'Success' : 'Failed'}: ${record.query.substring(0, 50)}... | Cost: $${record.costUsd.toFixed(4)} | Tokens: ${record.tokensTotal}`);
  }

  /**
   * Get usage statistics
   *
   * @param since - Optional start date (default: all time)
   * @returns Aggregated statistics
   */
  public getStats(since?: Date): UsageStatistics {
    const relevantRecords = since
      ? this.records.filter(r => r.timestamp >= since)
      : this.records;

    const totalRequests = relevantRecords.length;
    const successfulRequests = relevantRecords.filter(r => r.success).length;
    const failedRequests = totalRequests - successfulRequests;
    const successRate = totalRequests > 0 ? successfulRequests / totalRequests : 0;

    const totalCost = relevantRecords.reduce((sum, r) => sum + r.costUsd, 0);
    const totalTokens = relevantRecords.reduce((sum, r) => sum + r.tokensTotal, 0);

    const avgTokens = totalRequests > 0 ? totalTokens / totalRequests : 0;
    const avgCost = totalRequests > 0 ? totalCost / totalRequests : 0;

    const recordsWithTime = relevantRecords.filter(r => r.searchTimeMs !== undefined);
    const avgSearchTime = recordsWithTime.length > 0
      ? recordsWithTime.reduce((sum, r) => sum + (r.searchTimeMs || 0), 0) / recordsWithTime.length
      : 0;

    // Today's stats
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todayRecords = this.records.filter(r => r.timestamp >= startOfToday);
    const requestsToday = todayRecords.length;
    const spendToday = todayRecords.reduce((sum, r) => sum + r.costUsd, 0);

    return {
      totalRequests,
      successfulRequests,
      failedRequests,
      successRate,
      totalCost,
      totalTokens,
      avgTokens,
      avgCost,
      avgSearchTime,
      requestsToday,
      spendToday,
    };
  }

  /**
   * Get all records
   */
  public getAllRecords(): UsageRecord[] {
    return [...this.records];
  }

  /**
   * Clear all records (for testing)
   */
  public reset(): void {
    this.records = [];
  }
}

/**
 * Budget tracker for daily spend limits
 *
 * Singleton instance to enforce budget across application
 */
export class BudgetTracker {
  private static instance: BudgetTracker;

  private dailySpend: number = 0;
  private lastReset: Date = new Date();
  private dailyLimit: number;

  private constructor() {
    this.dailyLimit = parseFloat(process.env.PERPLEXITY_DAILY_BUDGET_USD || '10');
    this.checkAndResetDaily();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): BudgetTracker {
    if (!BudgetTracker.instance) {
      BudgetTracker.instance = new BudgetTracker();
    }
    return BudgetTracker.instance;
  }

  /**
   * Check if budget allows a request
   *
   * @param estimatedCost - Estimated cost of request
   * @returns Budget status
   */
  public checkBudget(estimatedCost: number = 0.01): BudgetStatus {
    this.checkAndResetDaily();

    const remaining = this.dailyLimit - this.dailySpend;
    const allowed = (this.dailySpend + estimatedCost) <= this.dailyLimit;
    const percentageUsed = (this.dailySpend / this.dailyLimit) * 100;

    // Calculate time until reset (midnight UTC)
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    tomorrow.setUTCHours(0, 0, 0, 0);
    const resetInMs = tomorrow.getTime() - now.getTime();

    return {
      allowed,
      currentSpend: this.dailySpend,
      dailyLimit: this.dailyLimit,
      remaining: Math.max(0, remaining),
      percentageUsed,
      resetInMs,
      reason: allowed ? undefined : 'Daily budget limit exceeded',
    };
  }

  /**
   * Record actual cost (call after successful request)
   *
   * @param cost - Actual cost in USD
   */
  public recordCost(cost: number): void {
    this.checkAndResetDaily();
    this.dailySpend += cost;

    // Warn if approaching limit
    const percentUsed = (this.dailySpend / this.dailyLimit) * 100;
    if (percentUsed >= 80 && percentUsed < 90) {
      console.warn(`[Perplexity Budget] 80% of daily budget used ($${this.dailySpend.toFixed(2)}/$${this.dailyLimit})`);
    } else if (percentUsed >= 90 && percentUsed < 100) {
      console.warn(`[Perplexity Budget] 90% of daily budget used ($${this.dailySpend.toFixed(2)}/$${this.dailyLimit})`);
    } else if (percentUsed >= 100) {
      console.error(`[Perplexity Budget] Daily budget limit reached! ($${this.dailySpend.toFixed(2)}/$${this.dailyLimit})`);
    }
  }

  /**
   * Get current spend today
   */
  public getCurrentSpend(): number {
    this.checkAndResetDaily();
    return this.dailySpend;
  }

  /**
   * Reset counters (for testing)
   */
  public reset(): void {
    this.dailySpend = 0;
    this.lastReset = new Date();
  }

  /**
   * Check if we need to reset daily counters
   */
  private checkAndResetDaily(): void {
    const now = new Date();
    const lastResetDate = this.lastReset.getUTCDate();
    const currentDate = now.getUTCDate();

    // Reset if date changed (UTC)
    if (currentDate !== lastResetDate) {
      console.log(`[Perplexity Budget] Daily budget reset. Previous spend: $${this.dailySpend.toFixed(2)}`);
      this.dailySpend = 0;
      this.lastReset = now;
    }
  }
}

/**
 * Convenience functions
 */
export function recordUsage(record: UsageRecord): void {
  PerplexityUsageTracker.getInstance().record(record);

  if (record.success) {
    BudgetTracker.getInstance().recordCost(record.costUsd);
  }
}

export function getUsageStats(): UsageStatistics {
  return PerplexityUsageTracker.getInstance().getStats();
}

export function checkBudget(estimatedCost?: number): BudgetStatus {
  return BudgetTracker.getInstance().checkBudget(estimatedCost);
}
```

---

## 3. Integration Changes

### 3.1 Diagram Prompt Template (`lib/ai/diagram-prompt-template.ts`)

**Changes Required**: Add optional `searchContext` parameter and format search results into prompt.

#### 3.1.1 Modified Interface

```typescript
/**
 * Search context from Perplexity
 */
export interface SearchContext {
  /** Main answer from search */
  answer: string;

  /** Source citations */
  citations: Array<{
    url: string;
    title: string;
    snippet?: string;
  }>;
}

/**
 * Context for diagram generation (MODIFIED)
 */
export interface DiagramContext {
  fileContents?: string[];
  previousDiagrams?: string[];
  conversationHistory?: Array<{ role: string; content: string }>;
  searchContext?: SearchContext; // NEW
}
```

#### 3.1.2 Modified Function

```typescript
/**
 * Build the complete prompt for diagram generation (MODIFIED)
 *
 * @param userRequest - The user's description of what they want to create
 * @param context - Optional context including search results
 * @returns Complete prompt for OpenAI API
 */
export function buildDiagramPrompt(
  userRequest: string,
  context?: DiagramContext // MODIFIED: now includes searchContext
): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> {
  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    {
      role: 'system',
      content: DIAGRAM_GENERATION_SYSTEM_PROMPT,
    },
  ];

  // Add conversation history if provided
  if (context?.conversationHistory && context.conversationHistory.length > 0) {
    messages.push(...context.conversationHistory as Array<{ role: 'system' | 'user' | 'assistant'; content: string }>);
  }

  // Build user message with all context
  let userMessage = '';

  // NEW: Add search context BEFORE user request
  if (context?.searchContext) {
    userMessage += formatSearchContext(context.searchContext);
    userMessage += '\n\n---\n\n';
  }

  // Add user request
  userMessage += userRequest;

  // Add file contents if provided
  if (context?.fileContents && context.fileContents.length > 0) {
    userMessage += `\n\n**Context from uploaded files:**\n${context.fileContents.join('\n\n---\n\n')}`;
  }

  // Add reference to previous diagrams if this is an iteration
  if (context?.previousDiagrams && context.previousDiagrams.length > 0) {
    userMessage += `\n\n**This is an iteration. Previous version:**\n${context.previousDiagrams[context.previousDiagrams.length - 1]}`;
  }

  messages.push({
    role: 'user',
    content: userMessage,
  });

  return messages;
}
```

#### 3.1.3 New Helper Function

```typescript
/**
 * Format search context for inclusion in prompt
 *
 * @param searchContext - Search results from Perplexity
 * @returns Formatted string for prompt
 */
export function formatSearchContext(searchContext: SearchContext): string {
  let formatted = '**Web Research Context:**\n\n';

  // Add search answer
  formatted += searchContext.answer;
  formatted += '\n\n';

  // Add citations
  if (searchContext.citations && searchContext.citations.length > 0) {
    formatted += '**Sources:**\n';
    searchContext.citations.forEach((citation, index) => {
      formatted += `[${index + 1}] ${citation.title} - ${citation.url}\n`;
    });
    formatted += '\n';
  }

  // Add instructions for GPT-4o
  formatted += '**Instructions:** Use the above research to inform your diagram. ';
  formatted += 'The data should be current and accurate based on these sources. ';
  formatted += 'Include a small citation footer at the bottom of the diagram ';
  formatted += 'referencing the sources by number (e.g., [1], [2], [3]). ';
  formatted += 'Format citations as: "Sources: [1] Title - URL"';

  return formatted;
}
```

---

### 3.2 Diagram Generator (`lib/ai/diagram-generator.ts`)

**Changes Required**: Add `searchContext` parameter and pass through to prompt builder.

#### 3.2.1 Modified Interface

```typescript
export interface DiagramGenerationRequest {
  userRequest: string;
  files?: ParsedFile[];
  conversationHistory?: Array<{ role: string; content: string }>;
  previousDiagrams?: string[];
  searchContext?: SearchContext; // NEW
}
```

#### 3.2.2 Modified Function

```typescript
/**
 * Generate a diagram from user request (MODIFIED)
 *
 * @param request - Generation parameters
 * @returns Generated HTML or error
 */
export async function generateDiagram(
  request: DiagramGenerationRequest
): Promise<DiagramGenerationResult> {
  const startTime = Date.now();

  try {
    // ... existing validation code ...

    // Extract file contents for context
    const fileContents = request.files?.map(
      (file) => `**${file.fileName}**:\n${file.content}`
    );

    // Build prompt (MODIFIED: now includes searchContext)
    const messages = buildDiagramPrompt(request.userRequest, {
      fileContents,
      previousDiagrams: request.previousDiagrams,
      conversationHistory: request.conversationHistory,
      searchContext: request.searchContext, // NEW
    });

    // ... rest of function unchanged ...
  } catch (error) {
    // ... existing error handling ...
  }
}
```

**Note**: `improveDiagram()` and `generateWithFeedbackLoop()` functions do NOT need changes since they don't use search context.

---

### 3.3 API Endpoint (`app/api/diagram/generate/route.ts`)

**Changes Required**: Integrate full search workflow before diagram generation.

#### 3.3.1 Modified Request Schema

```typescript
const DiagramGenerationSchema = z.object({
  userRequest: z.string().min(10, 'Request must be at least 10 characters'),
  files: z.array(z.any()).optional(),
  conversationHistory: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string(),
      })
    )
    .optional(),
  previousDiagrams: z.array(z.string()).optional(),
  enableValidation: z.boolean().optional().default(true),
  maxIterations: z.number().min(1).max(10).optional().default(5),
  enableSearch: z.boolean().optional().default(true), // NEW
});
```

#### 3.3.2 Modified POST Handler

```typescript
export async function POST(request: NextRequest) {
  try {
    // ... existing validation code (unchanged) ...

    // NEW: Search workflow integration
    let searchContext: SearchContext | undefined;
    const searchMetadata: Record<string, any> = {
      searchUsed: false,
    };

    if (enableSearch && FEATURES.WEB_SEARCH) {
      try {
        // 1. Analyze if search is needed
        const analysis = analyzeSearchNeed(userRequest);

        if (analysis.needsSearch) {
          console.log(`[Search] Triggered: ${analysis.reasoning}`);

          // 2. Check rate limit
          const rateLimit = checkRateLimit();
          if (!rateLimit.allowed) {
            console.warn(`[Search] Rate limit exceeded. Remaining: ${rateLimit.remaining}`);
            searchMetadata.searchError = 'Rate limit exceeded';
            // Continue without search
          } else {
            // 3. Check budget
            const budget = checkBudget(0.01); // Estimate $0.01 per search
            if (!budget.allowed) {
              console.warn(`[Search] Budget limit exceeded. Used: $${budget.currentSpend.toFixed(2)}`);
              searchMetadata.searchError = 'Daily budget exceeded';
              // Continue without search
            } else {
              // 4. Select model
              const modelSelection = selectModel(analysis.searchQuery, userRequest);
              console.log(`[Search] Model: ${modelSelection.model} (${modelSelection.reasoning})`);

              // 5. Perform search
              try {
                const searchStartTime = Date.now();
                const searchResult = await searchWithPerplexity({
                  query: analysis.searchQuery,
                  model: modelSelection.model,
                  maxTokens: 1000,
                  temperature: 0.2,
                });

                // 6. Record usage
                recordRequest(); // Rate limiter
                recordUsage({
                  timestamp: new Date(),
                  query: analysis.searchQuery,
                  model: searchResult.modelUsed,
                  tokensInput: searchResult.tokensInput,
                  tokensOutput: searchResult.tokensOutput,
                  tokensTotal: searchResult.tokensTotal,
                  costUsd: searchResult.estimatedCostUsd,
                  success: true,
                  searchTimeMs: searchResult.searchTimeMs,
                });

                // 7. Set search context
                searchContext = {
                  answer: searchResult.answer,
                  citations: searchResult.citations,
                };

                // 8. Set metadata
                searchMetadata.searchUsed = true;
                searchMetadata.searchQuery = analysis.searchQuery;
                searchMetadata.searchModel = searchResult.modelUsed;
                searchMetadata.searchTokens = searchResult.tokensTotal;
                searchMetadata.searchTime = searchResult.searchTimeMs;
                searchMetadata.searchCost = searchResult.estimatedCostUsd;
                searchMetadata.citationCount = searchResult.citations.length;

                console.log(`[Search] Success: ${searchResult.citations.length} citations in ${searchResult.searchTimeMs}ms`);
              } catch (searchError) {
                // Search failed - log and continue without search
                const perplexityError = searchError as PerplexityError;
                console.error(`[Search] Failed: ${perplexityError.message}`);

                // Record failed usage
                recordUsage({
                  timestamp: new Date(),
                  query: analysis.searchQuery,
                  model: modelSelection.model,
                  tokensInput: 0,
                  tokensOutput: 0,
                  tokensTotal: 0,
                  costUsd: 0,
                  success: false,
                  error: perplexityError.message,
                });

                searchMetadata.searchError = perplexityError.message;
                // Continue without search (fail-safe)
              }
            }
          }
        } else {
          console.log(`[Search] Skipped: ${analysis.reasoning}`);
        }
      } catch (error) {
        // Unexpected error in search workflow - log and continue
        console.error('[Search] Unexpected error:', error);
        searchMetadata.searchError = 'Unexpected search error';
        // Continue without search (fail-safe)
      }
    } else if (!FEATURES.WEB_SEARCH) {
      console.log('[Search] Feature disabled (no API key)');
    }

    // ... existing file parsing code (unchanged) ...

    // Generate diagram (MODIFIED: pass searchContext)
    let result: Awaited<ReturnType<typeof generateDiagram>>;

    const validFiles = parsedFiles
      ?.filter((f): f is import('@/lib/parsers').ParsedFile => !('error' in f));

    if (enableValidation) {
      result = await generateWithFeedbackLoop(
        {
          userRequest: validationResult.data.userRequest,
          files: validFiles,
          conversationHistory: validationResult.data.conversationHistory,
          previousDiagrams: validationResult.data.previousDiagrams,
          searchContext, // NEW
        },
        maxIterations
      );
    } else {
      result = await generateDiagram({
        userRequest: validationResult.data.userRequest,
        files: validFiles,
        conversationHistory: validationResult.data.conversationHistory,
        previousDiagrams: validationResult.data.previousDiagrams,
        searchContext, // NEW
      });
    }

    // Return result with search metadata
    return NextResponse.json(
      {
        success: result.success,
        html: result.html,
        error: result.error,
        metadata: {
          ...result.metadata,
          ...searchMetadata, // Merge search metadata
        },
      },
      { status: result.success ? 200 : 500 }
    );
  } catch (error) {
    // ... existing error handling (unchanged) ...
  }
}
```

#### 3.3.3 Required Imports

```typescript
import { FEATURES } from '@/lib/config/features';
import { analyzeSearchNeed } from '@/lib/ai/perplexity-query-builder';
import { selectModel } from '@/lib/ai/perplexity-model-selector';
import { searchWithPerplexity, type PerplexityError } from '@/lib/ai/perplexity-client';
import { checkRateLimit, recordRequest as recordRateLimitRequest } from '@/lib/ai/perplexity-rate-limiter';
import { checkBudget, recordUsage } from '@/lib/ai/perplexity-usage-tracker';
import type { SearchContext } from '@/lib/ai/diagram-prompt-template';
```

---

### 3.4 Feature Flags (`lib/config/features.ts`)

**Changes Required**: Add `WEB_SEARCH` feature flag.

```typescript
export const FEATURES = {
  // Existing features
  DATABASE: process.env.NEXT_PUBLIC_ENABLE_DATABASE === 'true',
  AUTH: process.env.NEXT_PUBLIC_ENABLE_AUTH === 'true',
  STRIPE: process.env.NEXT_PUBLIC_ENABLE_STRIPE === 'true',
  DIAGRAM_GENERATOR: true,
  FILE_PARSING: true,
  MCP_VALIDATION: false,
  AI_GENERATION: true,

  // NEW: Web search integration
  WEB_SEARCH: process.env.PERPLEXITY_API_KEY ? true : false,
} as const;
```

---

## 4. API Specifications

### 4.1 POST /api/diagram/generate (Modified)

#### 4.1.1 Request Format

**Content-Type**: `multipart/form-data`

**Fields**:
```typescript
{
  // Existing fields
  userRequest: string;              // Required, min 10 characters
  file?: File | File[];             // Optional uploaded files
  conversationHistory?: string;     // Optional JSON string
  previousDiagrams?: string;        // Optional JSON array
  enableValidation?: string;        // Optional "true" | "false"
  maxIterations?: string;           // Optional number (1-10)

  // NEW FIELD
  enableSearch?: string;            // Optional "true" | "false" (default: "true")
}
```

**Example Request**:
```typescript
const formData = new FormData();
formData.append('userRequest', 'Create bar chart of top 5 tech companies by market cap in 2025');
formData.append('enableSearch', 'true');
formData.append('enableValidation', 'false');

const response = await fetch('/api/diagram/generate', {
  method: 'POST',
  body: formData,
});
```

#### 4.1.2 Response Format

**Success Response** (200 OK):
```typescript
{
  success: true,
  html: string,
  metadata: {
    // Existing fields
    model: "gpt-4o",
    tokensUsed: number,
    generationTime: number,
    validationPassed: boolean,
    validationErrors?: string[],
    validationWarnings?: string[],
    iterations?: number,

    // NEW FIELDS
    searchUsed: boolean,               // Whether search was performed
    searchQuery?: string,              // Optimized search query (if used)
    searchModel?: string,              // Model used (sonar/sonar-pro)
    searchTokens?: number,             // Total tokens consumed by search
    searchTime?: number,               // Search execution time (ms)
    searchCost?: number,               // Estimated cost in USD
    citationCount?: number,            // Number of citations found
    searchError?: string,              // Error message if search failed
  }
}
```

**Example Response (Search Used)**:
```json
{
  "success": true,
  "html": "<!DOCTYPE html><html>...</html>",
  "metadata": {
    "model": "gpt-4o",
    "tokensUsed": 3500,
    "generationTime": 8500,
    "validationPassed": true,
    "searchUsed": true,
    "searchQuery": "top 5 tech companies market capitalization 2025",
    "searchModel": "sonar",
    "searchTokens": 650,
    "searchTime": 1200,
    "searchCost": 0.0065,
    "citationCount": 5
  }
}
```

**Example Response (Search Skipped)**:
```json
{
  "success": true,
  "html": "<!DOCTYPE html><html>...</html>",
  "metadata": {
    "model": "gpt-4o",
    "tokensUsed": 3200,
    "generationTime": 6200,
    "validationPassed": true,
    "searchUsed": false
  }
}
```

**Example Response (Search Failed)**:
```json
{
  "success": true,
  "html": "<!DOCTYPE html><html>...</html>",
  "metadata": {
    "model": "gpt-4o",
    "tokensUsed": 3200,
    "generationTime": 6500,
    "validationPassed": true,
    "searchUsed": false,
    "searchError": "Rate limit exceeded"
  }
}
```

**Error Response** (400 Bad Request):
```typescript
{
  success: false,
  error: string,
  code: string,
  details?: any
}
```

---

## 5. Error Handling

### 5.1 Error Types and Handling Strategy

| Error Type | Code | HTTP Status | Retryable? | Action |
|------------|------|-------------|------------|--------|
| **Rate Limit** | `rate_limit` | 429 | No | Skip search, continue generation |
| **Timeout** | `timeout` | - | Yes (1x) | Retry once after 1s, then skip |
| **Auth Error** | `auth_error` | 401 | No | Skip search, log critical error |
| **Server Error** | `server_error` | 5xx | Yes (1x) | Retry once after 2s, then skip |
| **Network Error** | `network_error` | - | No | Skip search immediately |
| **Invalid Request** | `invalid_request` | 400 | No | Skip search, log error |
| **Budget Exceeded** | - | - | No | Skip search, continue generation |

### 5.2 Error Handling Implementation

#### 5.2.1 Rate Limit Error (429)

```typescript
if (error.code === 'rate_limit') {
  console.warn('[Search] Rate limit exceeded. Skipping search for this request.');
  console.warn(`[Search] Rate limit resets in ${rateLimit.resetInMs}ms`);

  searchMetadata.searchUsed = false;
  searchMetadata.searchError = 'Rate limit exceeded';

  // DO NOT throw - continue with generation
  // DO NOT retry - respect rate limit
}
```

#### 5.2.2 Authentication Error (401)

```typescript
if (error.code === 'auth_error') {
  console.error('[Search] CRITICAL: Invalid Perplexity API key');
  console.error('[Search] Please check PERPLEXITY_API_KEY environment variable');

  // Disable feature to prevent repeated failures
  FEATURES.WEB_SEARCH = false;

  searchMetadata.searchUsed = false;
  searchMetadata.searchError = 'Authentication failed';

  // DO NOT throw - continue with generation
  // DO NOT retry - auth won't fix itself
}
```

#### 5.2.3 Timeout Error (ETIMEDOUT)

```typescript
if (error.code === 'timeout') {
  if (retryAttempt === 0) {
    console.warn('[Search] Request timed out. Retrying once...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    // Retry...
  } else {
    console.warn('[Search] Request timed out after retry. Skipping search.');
    searchMetadata.searchUsed = false;
    searchMetadata.searchError = 'Request timed out';
    // DO NOT throw - continue with generation
  }
}
```

#### 5.2.4 Server Error (5xx)

```typescript
if (error.code === 'server_error') {
  if (retryAttempt === 0) {
    console.warn(`[Search] Perplexity server error (${error.statusCode}). Retrying once...`);
    await new Promise(resolve => setTimeout(resolve, 2000));
    // Retry...
  } else {
    console.error(`[Search] Perplexity server error persists (${error.statusCode}). Skipping search.`);
    searchMetadata.searchUsed = false;
    searchMetadata.searchError = `Server error: ${error.statusCode}`;
    // DO NOT throw - continue with generation
  }
}
```

#### 5.2.5 Network Error (ECONNREFUSED)

```typescript
if (error.code === 'network_error') {
  console.error('[Search] Network connection failed. Check internet connectivity.');

  searchMetadata.searchUsed = false;
  searchMetadata.searchError = 'Network error';

  // DO NOT throw - continue with generation
  // DO NOT retry - network issues won't resolve immediately
}
```

#### 5.2.6 Budget Exceeded

```typescript
const budget = checkBudget(estimatedCost);

if (!budget.allowed) {
  console.warn(`[Search] Daily budget limit reached ($${budget.currentSpend.toFixed(2)}/$${budget.dailyLimit})`);
  console.warn(`[Search] Budget resets in ${Math.floor(budget.resetInMs / 3600000)} hours`);

  searchMetadata.searchUsed = false;
  searchMetadata.searchError = 'Daily budget exceeded';

  // DO NOT throw - continue with generation
  // Skip search entirely
  return; // Exit search workflow
}
```

### 5.3 Error Logging Strategy

**Console Logging Levels**:
- `console.log()` - Informational (search triggered, query built)
- `console.warn()` - Warning (rate limit, budget warning, retry attempt)
- `console.error()` - Error (auth failure, persistent server error)

**Log Format**:
```
[Search] <Level>: <Message>
[Search] Triggered: Detected 2 trigger(s) with 80% confidence
[Search] Rate limit exceeded. Remaining: 0
[Search] CRITICAL: Invalid Perplexity API key
```

**Error Metadata**:
Always include `searchError` in metadata when search fails:
```typescript
metadata: {
  searchUsed: false,
  searchError: "Rate limit exceeded" | "Authentication failed" | "Request timed out" | "Server error: 500" | "Network error" | "Daily budget exceeded"
}
```

### 5.4 Graceful Degradation

**Core Principle**: Diagram generation ALWAYS succeeds, even if search fails.

**Implementation**:
1. Wrap entire search workflow in `try-catch`
2. On any error, set `searchUsed: false` and `searchError: "reason"`
3. Continue to diagram generation without `searchContext`
4. Return successful response with degraded metadata

**User Experience**:
- User receives diagram regardless of search status
- Metadata indicates if search was used
- If search failed, error reason provided for debugging
- No user-facing errors from search failures

---

## 6. Testing Plan

### 6.1 Unit Tests

#### 6.1.1 Perplexity Client Tests

**File**: `tests/unit/perplexity-client.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { searchWithPerplexity, calculateSearchCost, estimateTokens } from '@/lib/ai/perplexity-client';

describe('Perplexity Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('searchWithPerplexity', () => {
    it('should make successful API request', async () => {
      // Mock fetch
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          id: 'test-id',
          model: 'sonar',
          usage: { prompt_tokens: 100, completion_tokens: 500, total_tokens: 600 },
          citations: ['https://example.com'],
          choices: [{ message: { content: 'Test answer' } }],
        }),
      });

      const result = await searchWithPerplexity({
        query: 'test query',
        model: 'sonar',
      });

      expect(result.answer).toBe('Test answer');
      expect(result.citations).toHaveLength(1);
      expect(result.tokensTotal).toBe(600);
    });

    it('should handle rate limit error (429)', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
      });

      await expect(
        searchWithPerplexity({ query: 'test' })
      ).rejects.toMatchObject({
        code: 'rate_limit',
        retryable: false,
      });
    });

    it('should handle auth error (401)', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
      });

      await expect(
        searchWithPerplexity({ query: 'test' })
      ).rejects.toMatchObject({
        code: 'auth_error',
        retryable: false,
      });
    });

    it('should retry on server error (500)', async () => {
      let callCount = 0;
      global.fetch = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({ ok: false, status: 500 });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({
            id: 'test',
            model: 'sonar',
            usage: { total_tokens: 100 },
            choices: [{ message: { content: 'Answer' } }],
          }),
        });
      });

      const result = await searchWithPerplexity({ query: 'test' });
      expect(callCount).toBe(2); // Initial + 1 retry
      expect(result.answer).toBe('Answer');
    });

    it('should handle timeout', async () => {
      global.fetch = vi.fn().mockImplementation(
        () => new Promise((_, reject) =>
          setTimeout(() => reject(new Error('AbortError')), 100)
        )
      );

      await expect(
        searchWithPerplexity({ query: 'test' })
      ).rejects.toMatchObject({
        code: 'timeout',
        retryable: true,
      });
    });
  });

  describe('calculateSearchCost', () => {
    it('should calculate cost for sonar model', () => {
      const cost = calculateSearchCost('sonar', 100, 500);
      // (100 * $1 / 1M) + (500 * $1 / 1M) + $0.005
      expect(cost).toBeCloseTo(0.0056, 4);
    });

    it('should calculate cost for sonar-pro model', () => {
      const cost = calculateSearchCost('sonar-pro', 100, 500);
      // (100 * $3 / 1M) + (500 * $15 / 1M) + $0.006
      expect(cost).toBeCloseTo(0.0138, 4);
    });
  });

  describe('estimateTokens', () => {
    it('should estimate tokens from text', () => {
      const text = 'This is a test query';
      const tokens = estimateTokens(text);
      expect(tokens).toBe(Math.ceil(text.length / 4));
    });
  });
});
```

#### 6.1.2 Query Builder Tests

**File**: `tests/unit/perplexity-query-builder.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { analyzeSearchNeed, buildSearchQuery, extractTemporalContext } from '@/lib/ai/perplexity-query-builder';

describe('Query Builder', () => {
  describe('analyzeSearchNeed', () => {
    it('should trigger on explicit prefix', () => {
      const analysis = analyzeSearchNeed('Search: top tech companies');
      expect(analysis.needsSearch).toBe(true);
      expect(analysis.confidence).toBe(1.0);
      expect(analysis.triggers).toContain('explicit:search:');
    });

    it('should trigger on temporal keywords', () => {
      const analysis = analyzeSearchNeed('Show current market data');
      expect(analysis.needsSearch).toBe(true);
      expect(analysis.triggers.some(t => t.startsWith('temporal:'))).toBe(true);
    });

    it('should trigger on data keywords', () => {
      const analysis = analyzeSearchNeed('Create chart with top 5 companies');
      expect(analysis.needsSearch).toBe(true);
      expect(analysis.triggers.some(t => t.startsWith('data:'))).toBe(true);
    });

    it('should NOT trigger on generic diagram request', () => {
      const analysis = analyzeSearchNeed('Create a flowchart for user login');
      expect(analysis.needsSearch).toBe(false);
      expect(analysis.confidence).toBeLessThan(0.7);
    });

    it('should combine multiple trigger types', () => {
      const analysis = analyzeSearchNeed('Create chart of top 5 companies in 2025');
      expect(analysis.triggers.length).toBeGreaterThan(1);
      expect(analysis.confidence).toBeGreaterThan(0.7);
    });
  });

  describe('buildSearchQuery', () => {
    it('should remove diagram instructions', () => {
      const query = buildSearchQuery('Create a bar chart showing top 5 tech companies');
      expect(query).not.toContain('Create');
      expect(query).not.toContain('bar chart');
      expect(query).toContain('top 5 tech companies');
    });

    it('should remove stop words', () => {
      const query = buildSearchQuery('Show me the top companies in the world');
      expect(query).not.toContain('Show');
      expect(query).not.toContain('me');
      expect(query).not.toContain('the');
      expect(query).toContain('top companies');
    });

    it('should add temporal context if missing', () => {
      const query = buildSearchQuery('Top tech companies current data');
      expect(query).toContain('2025'); // Current year
    });

    it('should enforce length limit', () => {
      const longRequest = 'Create chart ' + 'with lots of data '.repeat(30);
      const query = buildSearchQuery(longRequest);
      expect(query.length).toBeLessThanOrEqual(200);
    });
  });

  describe('extractTemporalContext', () => {
    it('should extract year from request', () => {
      const context = extractTemporalContext('Data for 2025');
      expect(context).toBe('2025');
    });

    it('should infer current year from "current"', () => {
      const context = extractTemporalContext('Current market data');
      expect(context).toBe(new Date().getFullYear().toString());
    });

    it('should return null if no temporal context', () => {
      const context = extractTemporalContext('Historical data');
      expect(context).toBeNull();
    });
  });
});
```

#### 6.1.3 Model Selector Tests

**File**: `tests/unit/perplexity-model-selector.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { selectModel, analyzeComplexity, estimateModelCost } from '@/lib/ai/perplexity-model-selector';

describe('Model Selector', () => {
  describe('selectModel', () => {
    it('should select sonar for simple queries', () => {
      const selection = selectModel('top 5 companies');
      expect(selection.model).toBe('sonar');
      expect(selection.complexityScore).toBeLessThan(0.6);
    });

    it('should select sonar-pro for analytical queries', () => {
      const selection = selectModel('analyze and compare top companies');
      expect(selection.model).toBe('sonar-pro');
      expect(selection.reasoning).toContain('analyze');
    });

    it('should select sonar-pro for long queries', () => {
      const longQuery = 'Explain the pros and cons of '.repeat(20);
      const selection = selectModel(longQuery);
      expect(selection.model).toBe('sonar-pro');
      expect(selection.reasoning).toContain('complexity');
    });

    it('should select sonar-reasoning for multi-step queries', () => {
      const selection = selectModel('First find companies, then compare them');
      expect(selection.model).toBe('sonar-reasoning');
    });
  });

  describe('analyzeComplexity', () => {
    it('should detect analytical words', () => {
      const analysis = analyzeComplexity('compare pros and cons');
      expect(analysis.factors.analyticalWords).toBeGreaterThan(0);
      expect(analysis.indicators).toContain('compare');
    });

    it('should detect multi-step reasoning', () => {
      const analysis = analyzeComplexity('first do this, then do that');
      expect(analysis.factors.multiStep).toBeGreaterThan(0);
      expect(analysis.indicators).toContain('multi-step');
    });

    it('should calculate overall score', () => {
      const simple = analyzeComplexity('top 5 companies');
      const complex = analyzeComplexity('analyze and compare the advantages and disadvantages of cloud providers');
      expect(complex.score).toBeGreaterThan(simple.score);
    });
  });

  describe('estimateModelCost', () => {
    it('should estimate cost for sonar', () => {
      const cost = estimateModelCost('sonar', 100);
      expect(cost).toBeLessThan(0.01);
    });

    it('should estimate higher cost for sonar-pro', () => {
      const sonarCost = estimateModelCost('sonar', 100);
      const proCost = estimateModelCost('sonar-pro', 100);
      expect(proCost).toBeGreaterThan(sonarCost);
    });
  });
});
```

#### 6.1.4 Rate Limiter Tests

**File**: `tests/unit/perplexity-rate-limiter.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PerplexityRateLimiter } from '@/lib/ai/perplexity-rate-limiter';

describe('Rate Limiter', () => {
  let limiter: PerplexityRateLimiter;

  beforeEach(() => {
    limiter = PerplexityRateLimiter.getInstance();
    limiter.reset();
  });

  it('should allow requests under limit', () => {
    const status = limiter.checkLimit();
    expect(status.allowed).toBe(true);
    expect(status.remaining).toBe(60); // Default limit
  });

  it('should block requests over limit', () => {
    // Record 60 requests
    for (let i = 0; i < 60; i++) {
      limiter.recordRequest();
    }

    const status = limiter.checkLimit();
    expect(status.allowed).toBe(false);
    expect(status.remaining).toBe(0);
    expect(status.reason).toBe('Rate limit exceeded');
  });

  it('should reset after window expires', async () => {
    // Mock time
    vi.useFakeTimers();

    limiter.recordRequest();
    expect(limiter.getCurrentCount()).toBe(1);

    // Advance time by 61 seconds
    vi.advanceTimersByTime(61000);

    expect(limiter.getCurrentCount()).toBe(0);

    vi.useRealTimers();
  });

  it('should track requests in sliding window', async () => {
    vi.useFakeTimers();

    // Record request at t=0
    limiter.recordRequest();
    expect(limiter.getCurrentCount()).toBe(1);

    // Advance 30 seconds
    vi.advanceTimersByTime(30000);
    limiter.recordRequest();
    expect(limiter.getCurrentCount()).toBe(2);

    // Advance another 31 seconds (total 61)
    vi.advanceTimersByTime(31000);
    // First request should be expired, second still valid
    expect(limiter.getCurrentCount()).toBe(1);

    vi.useRealTimers();
  });
});
```

#### 6.1.5 Usage Tracker Tests

**File**: `tests/unit/perplexity-usage-tracker.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PerplexityUsageTracker, BudgetTracker, recordUsage, checkBudget } from '@/lib/ai/perplexity-usage-tracker';

describe('Usage Tracker', () => {
  let tracker: PerplexityUsageTracker;

  beforeEach(() => {
    tracker = PerplexityUsageTracker.getInstance();
    tracker.reset();
  });

  it('should record usage', () => {
    recordUsage({
      timestamp: new Date(),
      query: 'test',
      model: 'sonar',
      tokensInput: 100,
      tokensOutput: 500,
      tokensTotal: 600,
      costUsd: 0.006,
      success: true,
    });

    const stats = tracker.getStats();
    expect(stats.totalRequests).toBe(1);
    expect(stats.totalCost).toBeCloseTo(0.006);
  });

  it('should calculate statistics', () => {
    // Record multiple requests
    for (let i = 0; i < 5; i++) {
      recordUsage({
        timestamp: new Date(),
        query: `test ${i}`,
        model: 'sonar',
        tokensInput: 100,
        tokensOutput: 500,
        tokensTotal: 600,
        costUsd: 0.006,
        success: i < 4, // 1 failure
        searchTimeMs: 1000 + i * 100,
      });
    }

    const stats = tracker.getStats();
    expect(stats.totalRequests).toBe(5);
    expect(stats.successfulRequests).toBe(4);
    expect(stats.failedRequests).toBe(1);
    expect(stats.successRate).toBeCloseTo(0.8);
    expect(stats.avgTokens).toBe(600);
    expect(stats.avgSearchTime).toBeCloseTo(1200);
  });
});

describe('Budget Tracker', () => {
  let budget: BudgetTracker;

  beforeEach(() => {
    budget = BudgetTracker.getInstance();
    budget.reset();
  });

  it('should allow requests under budget', () => {
    const status = checkBudget(0.01);
    expect(status.allowed).toBe(true);
    expect(status.remaining).toBeCloseTo(10); // Default $10 limit
  });

  it('should block requests over budget', () => {
    // Spend $9.99
    for (let i = 0; i < 999; i++) {
      budget.recordCost(0.01);
    }

    const status = checkBudget(0.02);
    expect(status.allowed).toBe(false);
    expect(status.reason).toBe('Daily budget limit exceeded');
  });

  it('should reset at midnight UTC', () => {
    vi.useFakeTimers();

    budget.recordCost(5);
    expect(budget.getCurrentSpend()).toBe(5);

    // Mock next day
    const tomorrow = new Date();
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    vi.setSystemTime(tomorrow);

    expect(budget.getCurrentSpend()).toBe(0);

    vi.useRealTimers();
  });
});
```

### 6.2 Integration Tests

#### 6.2.1 End-to-End Search Flow

**File**: `tests/integration/diagram-search.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/diagram/generate/route';

describe('Diagram Generation with Search', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.PERPLEXITY_API_KEY = 'test-key';
    process.env.OPENAI_API_KEY = 'test-key';
  });

  it('should generate diagram with search context', async () => {
    // Mock Perplexity API
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('perplexity.ai')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            id: 'test',
            model: 'sonar',
            usage: { total_tokens: 600 },
            citations: ['https://example.com'],
            choices: [{ message: { content: 'Market cap data...' } }],
          }),
        });
      }
      // Mock OpenAI
      return Promise.resolve({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: '```html\n<html>...</html>\n```' } }],
          usage: { total_tokens: 3000 },
        }),
      });
    });

    const formData = new FormData();
    formData.append('userRequest', 'Create chart of top 5 tech companies market cap 2025');
    formData.append('enableSearch', 'true');

    const request = new Request('http://localhost:3000/api/diagram/generate', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request as any);
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.metadata.searchUsed).toBe(true);
    expect(data.metadata.searchQuery).toBeDefined();
    expect(data.metadata.citationCount).toBeGreaterThan(0);
  });

  it('should fallback gracefully on search failure', async () => {
    // Mock Perplexity failure
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('perplexity.ai')) {
        return Promise.resolve({ ok: false, status: 500 });
      }
      // OpenAI succeeds
      return Promise.resolve({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: '```html\n<html>...</html>\n```' } }],
          usage: { total_tokens: 3000 },
        }),
      });
    });

    const formData = new FormData();
    formData.append('userRequest', 'Create chart with current data');
    formData.append('enableSearch', 'true');

    const request = new Request('http://localhost:3000/api/diagram/generate', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request as any);
    const data = await response.json();

    expect(data.success).toBe(true); // Still succeeds
    expect(data.metadata.searchUsed).toBe(false);
    expect(data.metadata.searchError).toBeDefined();
  });

  it('should skip search when not needed', async () => {
    const formData = new FormData();
    formData.append('userRequest', 'Create a simple flowchart');
    formData.append('enableSearch', 'true');

    const request = new Request('http://localhost:3000/api/diagram/generate', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request as any);
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.metadata.searchUsed).toBe(false);
    expect(data.metadata.searchError).toBeUndefined();
  });
});
```

### 6.3 Manual Testing Checklist

#### 6.3.1 Real API Testing (Small Credits)

```bash
# Set up environment
export PERPLEXITY_API_KEY="pplx-your-key"
export PERPLEXITY_MAX_REQUESTS_PER_MINUTE=30
export PERPLEXITY_DAILY_BUDGET_USD=1

# Test 1: Simple factual query
curl -X POST http://localhost:3000/api/diagram/generate \
  -F 'userRequest=Create bar chart of top 5 tech companies by market cap in 2025' \
  -F 'enableSearch=true'

# Expected: searchUsed=true, citationCount > 0

# Test 2: Generic query (no search)
curl -X POST http://localhost:3000/api/diagram/generate \
  -F 'userRequest=Create a flowchart for user authentication' \
  -F 'enableSearch=true'

# Expected: searchUsed=false

# Test 3: Rate limiting (make 31 requests rapidly)
for i in {1..31}; do
  curl -X POST http://localhost:3000/api/diagram/generate \
    -F 'userRequest=Test request '$i \
    -F 'enableSearch=true'
done

# Expected: Last request has searchError="Rate limit exceeded"

# Test 4: Budget limit (set low limit, exceed it)
export PERPLEXITY_DAILY_BUDGET_USD=0.05
# Make requests until budget exceeded
# Expected: searchError="Daily budget exceeded"

# Test 5: Invalid API key
export PERPLEXITY_API_KEY="invalid-key"
curl -X POST http://localhost:3000/api/diagram/generate \
  -F 'userRequest=Search: current data' \
  -F 'enableSearch=true'

# Expected: searchError="Authentication failed"
```

#### 6.3.2 Citation Verification

1. Generate diagram with search
2. Open HTML in browser
3. Verify:
   - Inline citations [1], [2] present
   - Footer with "Sources:" section
   - All URLs are clickable
   - URLs lead to relevant pages

#### 6.3.3 Performance Testing

```bash
# Measure search latency
time curl -X POST http://localhost:3000/api/diagram/generate \
  -F 'userRequest=Create chart with current market data' \
  -F 'enableSearch=true'

# Expected: Total time < 15 seconds
# metadata.searchTime < 3000ms
```

---

## 7. Implementation Order

Follow this sequence for safe, incremental implementation:

### Step 1: Perplexity Client Module
**File**: `lib/ai/perplexity-client.ts`
- Implement TypeScript interfaces
- Implement `searchWithPerplexity()` function
- Implement error handling and retry logic
- Implement `calculateSearchCost()` and `estimateTokens()`
- Write unit tests
- Test with real API (small credits)

**Validation**: Unit tests pass, manual API call succeeds

---

### Step 2: Query Builder Module
**File**: `lib/ai/perplexity-query-builder.ts`
- Implement `analyzeSearchNeed()` function
- Implement `buildSearchQuery()` function
- Implement `extractTemporalContext()` function
- Write unit tests with 20+ test cases

**Validation**: Unit tests pass, trigger detection works correctly

---

### Step 3: Model Selector Module
**File**: `lib/ai/perplexity-model-selector.ts`
- Implement `selectModel()` function
- Implement `analyzeComplexity()` function
- Implement `estimateModelCost()` function
- Write unit tests

**Validation**: Unit tests pass, model selection makes sense

---

### Step 4: Rate Limiter Module
**File**: `lib/ai/perplexity-rate-limiter.ts`
- Implement `PerplexityRateLimiter` class
- Implement sliding window algorithm
- Write unit tests (including time-based tests)

**Validation**: Unit tests pass, rate limiting works

---

### Step 5: Usage Tracker Module
**File**: `lib/ai/perplexity-usage-tracker.ts`
- Implement `PerplexityUsageTracker` class
- Implement `BudgetTracker` class
- Implement convenience functions
- Write unit tests

**Validation**: Unit tests pass, tracking and budget work

---

### Step 6: Update Prompt Template
**File**: `lib/ai/diagram-prompt-template.ts`
- Add `SearchContext` interface
- Update `DiagramContext` interface
- Modify `buildDiagramPrompt()` function
- Implement `formatSearchContext()` function
- Write unit tests for search context formatting

**Validation**: Prompt includes search context correctly

---

### Step 7: Update Diagram Generator
**File**: `lib/ai/diagram-generator.ts`
- Update `DiagramGenerationRequest` interface
- Modify `generateDiagram()` to pass searchContext
- Write integration tests

**Validation**: Search context flows through to prompt

---

### Step 8: Update Feature Flags
**File**: `lib/config/features.ts`
- Add `WEB_SEARCH` flag
- Update `.env.example` with Perplexity variables

**Validation**: Feature flag works correctly

---

### Step 9: Update API Endpoint
**File**: `app/api/diagram/generate/route.ts`
- Import all new modules
- Add `enableSearch` to schema
- Integrate search workflow before generation
- Add error handling for all error types
- Add search metadata to response
- Write integration tests

**Validation**: Integration tests pass, end-to-end flow works

---

### Step 10: Manual Testing
- Test with real Perplexity API
- Verify citations in diagrams
- Test all error scenarios
- Test rate limiting
- Test budget enforcement
- Measure performance

**Validation**: All manual tests pass

---

### Step 11: Documentation & Deployment
- Update `.env.example`
- Update `STATUS.md`
- Commit with conventional format: `feat(search): Implement Feature 6.0 - Web Search Integration`
- Push to feature branch
- Create PR

**Validation**: Documentation complete, PR ready

---

## 8. Configuration

### 8.1 Environment Variables

Add to `.env.example`:

```bash
# =============================================================================
# Perplexity AI Configuration (Feature 6.0: Web Search Integration)
# =============================================================================

# Perplexity API Key (Required for web search)
# Get from: https://www.perplexity.ai/settings/api
# Cost: $5 minimum credit purchase (lasts ~833 searches)
PERPLEXITY_API_KEY=

# Optional: Rate Limiting Configuration
# Maximum requests per minute (default: 60)
# Recommended for MVP: 30
PERPLEXITY_MAX_REQUESTS_PER_MINUTE=60

# Optional: Daily Budget Limit in USD (default: 10)
# Prevents unexpected costs from runaway usage
# Recommended for MVP: 5
PERPLEXITY_DAILY_BUDGET_USD=10

# Optional: Request Timeout in milliseconds (default: 3000)
# Timeout for Perplexity API requests
PERPLEXITY_TIMEOUT_MS=3000
```

### 8.2 Feature Flag Configuration

In `lib/config/features.ts`:

```typescript
export const FEATURES = {
  // ... existing features ...

  /**
   * Web Search Integration (Feature 6.0)
   *
   * Enables Perplexity AI web search for diagram generation
   * Automatically enabled if PERPLEXITY_API_KEY is set
   *
   * When enabled:
   * - User requests with search triggers use real-time web data
   * - Citations included in generated diagrams
   * - Rate limiting and budget tracking active
   *
   * When disabled:
   * - All diagrams generated with GPT-4o knowledge only
   * - No external API calls to Perplexity
   */
  WEB_SEARCH: process.env.PERPLEXITY_API_KEY ? true : false,
} as const;
```

### 8.3 Default Configuration Values

```typescript
// lib/ai/perplexity-config.ts
export const PERPLEXITY_DEFAULTS = {
  // API Configuration
  BASE_URL: 'https://api.perplexity.ai',
  TIMEOUT_MS: parseInt(process.env.PERPLEXITY_TIMEOUT_MS || '3000'),

  // Model Configuration
  DEFAULT_MODEL: 'sonar' as const,
  DEFAULT_MAX_TOKENS: 1000,
  DEFAULT_TEMPERATURE: 0.2,

  // Rate Limiting
  MAX_REQUESTS_PER_MINUTE: parseInt(process.env.PERPLEXITY_MAX_REQUESTS_PER_MINUTE || '60'),
  RATE_LIMIT_WINDOW_MS: 60 * 1000, // 1 minute

  // Budget Configuration
  DAILY_BUDGET_USD: parseFloat(process.env.PERPLEXITY_DAILY_BUDGET_USD || '10'),

  // Retry Configuration
  MAX_RETRIES: 1,
  RETRY_DELAY_MS: 1000,

  // Usage Tracking
  MAX_USAGE_RECORDS: 10000,

  // Model Pricing (per 1M tokens)
  PRICING: {
    sonar: { input: 1, output: 1, request: 5 }, // $5 per 1K requests
    'sonar-pro': { input: 3, output: 15, request: 6 },
    'sonar-reasoning': { input: 1, output: 5, request: 5 },
  },
} as const;
```

---

## 9. Security & Performance

### 9.1 Security Considerations

#### 9.1.1 API Key Protection

```typescript
// ✅ CORRECT: API key only in server-side code
// lib/ai/perplexity-client.ts
const apiKey = process.env.PERPLEXITY_API_KEY; // Server-only

// ❌ INCORRECT: Never expose in client components
// components/DiagramGenerator.tsx
const apiKey = process.env.NEXT_PUBLIC_PERPLEXITY_API_KEY; // ❌ DON'T DO THIS
```

**Rules**:
1. Never use `NEXT_PUBLIC_` prefix for `PERPLEXITY_API_KEY`
2. Never send API key to client in responses
3. All Perplexity calls must be server-side only
4. API routes are the only place to call Perplexity

#### 9.1.2 Input Sanitization

```typescript
// Sanitize user input before sending to Perplexity
function sanitizeQuery(query: string): string {
  // Remove potentially malicious characters
  let sanitized = query.replace(/[<>\"']/g, '');

  // Trim whitespace
  sanitized = sanitized.trim();

  // Limit length
  if (sanitized.length > 500) {
    sanitized = sanitized.substring(0, 500);
  }

  return sanitized;
}
```

#### 9.1.3 Rate Limiting (DoS Prevention)

```typescript
// Prevent abuse by enforcing rate limits
const rateLimit = checkRateLimit();
if (!rateLimit.allowed) {
  // Block request
  return NextResponse.json({
    success: false,
    error: 'Rate limit exceeded',
  }, { status: 429 });
}
```

#### 9.1.4 Budget Protection

```typescript
// Prevent runaway costs
const budget = checkBudget(estimatedCost);
if (!budget.allowed) {
  // Don't make expensive API call
  console.warn('Budget limit reached, skipping search');
  // Continue without search (fail-safe)
}
```

### 9.2 Performance Optimization

#### 9.2.1 Timeout Configuration

```typescript
// Strict 3-second timeout prevents hanging requests
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 3000);

try {
  const response = await fetch(url, { signal: controller.signal });
  // ...
} catch (error) {
  if (error.name === 'AbortError') {
    // Handle timeout
  }
} finally {
  clearTimeout(timeoutId);
}
```

**Impact**:
- Search adds < 3 seconds to diagram generation
- Total generation time: < 15 seconds (vs. < 12 without search)
- User experience remains fast

#### 9.2.2 Parallel Processing

```typescript
// Don't block - make search and prepare files in parallel
const [searchResult, parsedFiles] = await Promise.all([
  searchWithPerplexity(query).catch(() => null), // Fail gracefully
  parseMultipleFiles(files),
]);
```

#### 9.2.3 Caching Strategy (Optional Enhancement)

```typescript
// Optional: Cache identical queries for 15 minutes
const cache = new Map<string, { result: PerplexitySearchResult; expires: number }>();

function getCachedSearch(query: string): PerplexitySearchResult | null {
  const cached = cache.get(query);
  if (cached && cached.expires > Date.now()) {
    return cached.result;
  }
  cache.delete(query);
  return null;
}

function setCachedSearch(query: string, result: PerplexitySearchResult): void {
  cache.set(query, {
    result,
    expires: Date.now() + 15 * 60 * 1000, // 15 minutes
  });
}
```

**Impact**:
- Identical queries return instantly (0ms)
- Reduces API costs
- Improves user experience for repeated requests

#### 9.2.4 Memory Management

```typescript
// Limit stored usage records to prevent memory bloat
private maxRecords: number = 10000;

public record(record: UsageRecord): void {
  this.records.push(record);

  // Trim old records
  if (this.records.length > this.maxRecords) {
    this.records = this.records.slice(-this.maxRecords);
  }
}
```

**Impact**:
- Max memory: ~50MB for usage tracking
- Auto-cleanup prevents unbounded growth
- Serverless-friendly (stateless)

### 9.3 Performance Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Search Latency** | < 3s | 95th percentile |
| **Total Generation Time** | < 15s | With search enabled |
| **Rate Limit Accuracy** | > 99% | Requests blocked correctly |
| **Budget Enforcement** | 100% | Hard limit never exceeded |
| **Search Success Rate** | > 95% | Successful vs. failed |
| **Memory Usage** | < 50MB | Usage tracking overhead |
| **Cache Hit Rate** | > 30% | If caching enabled |

---

## 10. Migration Notes

### 10.1 Zero-Downtime Deployment

**Strategy**: Feature flag enables safe rollout

```typescript
// Feature is disabled by default (no API key)
WEB_SEARCH: process.env.PERPLEXITY_API_KEY ? true : false

// Deployment steps:
// 1. Deploy code (search disabled)
// 2. Test in production without API key
// 3. Add PERPLEXITY_API_KEY to environment
// 4. Feature automatically enables
// 5. Monitor logs and metrics
// 6. Adjust rate limits if needed
```

**Rollout Plan**:
1. **Week 1**: Deploy with conservative limits (`PERPLEXITY_MAX_REQUESTS_PER_MINUTE=30`, `PERPLEXITY_DAILY_BUDGET_USD=5`)
2. **Week 2**: Monitor usage, adjust limits based on actual data
3. **Week 3**: Increase limits to production values if stable
4. **Week 4**: Enable caching for performance boost

### 10.2 Rollback Plan

**If issues arise, rollback is instant**:

```bash
# Option 1: Remove API key (disables feature)
unset PERPLEXITY_API_KEY
# or in Vercel dashboard: Delete PERPLEXITY_API_KEY env var

# Option 2: Redeploy previous version
vercel rollback

# Option 3: Feature flag override (emergency)
# Add to lib/config/features.ts:
WEB_SEARCH: false, // Force disable
```

**Rollback triggers**:
- Search error rate > 10%
- Budget exceeded unexpectedly
- Performance degradation (> 20s generation time)
- Perplexity API outage

### 10.3 Backward Compatibility

**Guaranteed**:
- All existing API requests work without changes
- `enableSearch` defaults to `true` but safely skips if no API key
- Metadata is additive (new fields added, none removed)
- No breaking changes to request/response schemas

**Example - Old client continues to work**:
```typescript
// Client from before Feature 6.0
const formData = new FormData();
formData.append('userRequest', 'Create flowchart');
// enableSearch not specified

const response = await fetch('/api/diagram/generate', {
  method: 'POST',
  body: formData,
});

// Response includes new metadata fields, but client ignores them
// Diagram generation works exactly as before
```

### 10.4 Monitoring & Alerts

**Key Metrics to Monitor**:

```typescript
// Log these on every search request
console.log('[Search] Metrics:', {
  searchUsed: boolean,
  searchTime: number,
  searchCost: number,
  searchError?: string,
  rateLimitRemaining: number,
  budgetRemaining: number,
});

// Alert thresholds
if (searchError) {
  // Alert: Search failure
}

if (budgetRemaining < 1) {
  // Alert: Budget almost exhausted
}

if (rateLimitRemaining < 5) {
  // Alert: Approaching rate limit
}

if (searchTime > 4000) {
  // Alert: Search latency high
}
```

**Dashboard Queries** (if using logging service):

```sql
-- Search success rate (last 24h)
SELECT
  COUNT(*) as total_searches,
  SUM(CASE WHEN searchError IS NULL THEN 1 ELSE 0 END) as successful,
  (SUM(CASE WHEN searchError IS NULL THEN 1 ELSE 0 END) * 100.0 / COUNT(*)) as success_rate
FROM logs
WHERE timestamp > NOW() - INTERVAL '24 hours'
  AND searchUsed = true;

-- Daily cost tracking
SELECT
  DATE(timestamp) as date,
  SUM(searchCost) as total_cost,
  COUNT(*) as search_count
FROM logs
WHERE searchUsed = true
GROUP BY DATE(timestamp)
ORDER BY date DESC;

-- Average search latency
SELECT
  AVG(searchTime) as avg_search_time_ms,
  MAX(searchTime) as max_search_time_ms,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY searchTime) as p95_search_time_ms
FROM logs
WHERE searchUsed = true;
```

### 10.5 Deprecation Strategy (Future)

**If we decide to remove Perplexity in the future**:

1. Set `WEB_SEARCH: false` in feature flags
2. Remove `PERPLEXITY_API_KEY` from environment
3. Keep code in place (muted) for 3 months
4. Remove code if confirmed no longer needed

**Code remains functional without Perplexity**:
- All diagrams generate successfully
- No errors thrown
- Clean degradation to GPT-4o-only mode

---

## Appendices

### Appendix A: Cost Calculator

```typescript
// Example: Calculate expected monthly cost

const monthlyDiagrams = 3000;
const searchActivationRate = 0.25; // 25% trigger search
const avgSearchCost = 0.006; // $0.006 per search

const monthlySearches = monthlyDiagrams * searchActivationRate; // 750
const monthlySearchCost = monthlySearches * avgSearchCost; // $4.50

console.log(`Expected monthly cost: $${monthlySearchCost.toFixed(2)}`);
// Output: Expected monthly cost: $4.50
```

### Appendix B: Example Search Triggers

**Will Trigger Search**:
- "Search: top tech companies"
- "Create chart with current market cap data"
- "Show latest COVID statistics for 2025"
- "Top 5 fastest cars today"
- "What are the best AI models in 2025?"
- "Compare market data for cloud providers"

**Will NOT Trigger Search**:
- "Create a flowchart for user login"
- "Generate an org chart for my team"
- "Design a timeline from 1900 to 2000"
- "Make a diagram explaining photosynthesis"
- "Show me a network topology diagram"

### Appendix C: Citation Format Examples

**Inline Citations**:
```html
<p>Apple has the highest market cap at $3.2 trillion [1], followed by Microsoft [2].</p>
```

**Footer Citations**:
```html
<div class="text-xs text-gray-500 mt-4 border-t pt-2">
  <strong>Sources:</strong><br>
  [1] Apple Market Cap - https://companiesmarketcap.com/apple<br>
  [2] Microsoft Market Cap - https://companiesmarketcap.com/microsoft<br>
  [3] Tech Giants 2025 - https://techcrunch.com/2025/01/tech-giants
</div>
```

---

## Summary

This technical design provides complete specifications for implementing Feature 6.0: Web Search Integration. Key highlights:

1. **5 New Modules**: Complete TypeScript interfaces and implementations
2. **3 Modified Modules**: Minimal, non-breaking changes to existing code
3. **Comprehensive Error Handling**: 6 error types with retry logic and fallbacks
4. **Testing Strategy**: Unit tests (80+ cases) + integration tests + manual tests
5. **Security**: API key protection, input sanitization, rate limiting, budget enforcement
6. **Performance**: < 3s search latency, < 15s total generation, minimal memory
7. **Zero-Downtime Deployment**: Feature flag enables safe rollout and instant rollback

**Implementation Ready**: Backend engineer can implement directly from this design without ambiguity.

**Estimated Implementation Time**: 8-12 hours (as specified in requirements)

---

**End of Design Document**
