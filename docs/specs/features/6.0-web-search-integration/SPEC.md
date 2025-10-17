# Feature 6.0: Web Search Integration (Perplexity API)

## Overview

### Feature ID

6.0

### Feature Name

Web Search Integration (Perplexity API)

### Description

Integrate Perplexity AI's web search capabilities into the AI Diagram Generator to enable real-time, web-wide research for diagram generation. This feature allows users to request diagrams based on current data, trends, statistics, and recent information that's not available in the base LLM's training data. The integration uses Perplexity's Sonar models to retrieve and synthesize information from multiple web sources, enriching diagram generation with up-to-date, factual content.

### Priority

**MEDIUM** - Enhances diagram quality and enables new use cases, but not critical for core functionality

### Estimated Time

8-12 hours

### Dependencies

- Phase 5: Export Functionality (COMPLETED)
- OpenAI GPT-4o diagram generation (COMPLETED)
- Perplexity API account with credits
- Feature flags system (`lib/config/features.ts`)

### Related Documents

- `/Users/anand/saas-bp/lib/ai/diagram-generator.ts` - Core generation module
- `/Users/anand/saas-bp/lib/ai/diagram-prompt-template.ts` - Prompt engineering
- `/Users/anand/saas-bp/app/api/diagram/generate/route.ts` - API endpoint
- `/Users/anand/saas-bp/docs/03-IMPLEMENTATION/STATUS.md` - Implementation progress
- `/Users/anand/saas-bp/lib/config/features.ts` - Feature flag configuration

---

## User Stories

### US-6.1: Current Data Visualization

**As a** business analyst
**I want to** generate diagrams with current market data, trends, or statistics
**So that** my visualizations reflect the most recent information available

**Acceptance Criteria:**

```gherkin
GIVEN I am using the AI Diagram Generator
WHEN I request "Create a bar chart showing the top 5 tech companies by market cap in 2025"
THEN the system triggers a Perplexity search for current market capitalization data
AND the system retrieves up-to-date numbers from reliable web sources
AND the system generates a diagram with accurate, current values
AND the diagram includes source citations in a footer
AND the entire process completes within 15 seconds
```

### US-6.2: Research-Based Diagrams

**As a** researcher or student
**I want to** create diagrams based on recent research findings or publications
**So that** I can visualize the latest scientific or academic information

**Acceptance Criteria:**

```gherkin
GIVEN I am researching a specific topic
WHEN I request "Create a flowchart showing the latest COVID-19 treatment protocols"
THEN the system searches for recent medical guidelines and protocols
AND the system synthesizes information from authoritative medical sources
AND the system generates a flowchart reflecting current best practices
AND the diagram includes citations to source materials
AND the system handles conflicting information gracefully
```

### US-6.3: Conditional Search Activation

**As a** power user
**I want to** explicitly control when web search is used
**So that** I can balance between speed and information freshness

**Acceptance Criteria:**

```gherkin
GIVEN I am generating a diagram
WHEN I prefix my request with "Search:" or include "current" or "latest" keywords
THEN the system automatically activates Perplexity search
AND when I omit these triggers, the system uses only GPT-4o knowledge
AND I see an indicator showing whether search was activated
AND the metadata includes search_used: true/false flag
```

### US-6.4: Error Handling for API Failures

**As a** user
**I want to** receive a usable diagram even if web search fails
**So that** my workflow isn't blocked by third-party service issues

**Acceptance Criteria:**

```gherkin
GIVEN I request a diagram that triggers Perplexity search
WHEN the Perplexity API returns an error (rate limit, timeout, invalid key)
THEN the system logs the error with details
AND the system falls back to generating the diagram using GPT-4o alone
AND the user receives a warning: "Web search unavailable, using general knowledge"
AND the diagram is still generated successfully
AND the metadata includes search_error field with reason
```

### US-6.5: Cost and Rate Limit Management

**As a** system administrator
**I want to** monitor and control Perplexity API usage
**So that** I can manage costs and avoid service disruptions

**Acceptance Criteria:**

```gherkin
GIVEN the system is configured with Perplexity API
WHEN usage approaches configured limits (requests per minute or daily budget)
THEN the system logs warnings to the console
AND subsequent requests skip Perplexity search automatically
AND users receive diagrams without search enhancement
AND the system provides usage metrics in metadata
AND rate limit status is visible in environment health checks
```

---

## Functional Requirements

### FR-6.1: Perplexity API Client Module

**Location:** `lib/ai/perplexity-client.ts`

**Purpose:** Encapsulate all Perplexity API interactions with error handling, retries, and rate limiting

**Implementation:**

```typescript
// lib/ai/perplexity-client.ts
export interface PerplexitySearchRequest {
  query: string;
  model?: 'sonar' | 'sonar-pro' | 'sonar-reasoning';
  maxTokens?: number;
  temperature?: number;
}

export interface PerplexitySearchResult {
  answer: string;
  citations: Array<{
    url: string;
    title: string;
    snippet: string;
  }>;
  model_used: string;
  tokens_used: number;
  search_time_ms: number;
}

export interface PerplexityError {
  code: 'rate_limit' | 'timeout' | 'invalid_key' | 'api_error';
  message: string;
  retryable: boolean;
}

/**
 * Search the web using Perplexity AI
 * @param request - Search query and parameters
 * @returns Search result with answer and citations
 * @throws PerplexityError on API failure
 */
export async function searchWithPerplexity(
  request: PerplexitySearchRequest
): Promise<PerplexitySearchResult>;

/**
 * Check if search should be used based on triggers
 * @param userRequest - User's diagram request
 * @returns true if search should be activated
 */
export function shouldTriggerSearch(userRequest: string): boolean;

/**
 * Check rate limit status
 * @returns remaining requests this minute
 */
export function checkRateLimitStatus(): Promise<number>;
```

**Requirements:**

1. Use official Perplexity SDK or REST API with fetch
2. Authenticate using `PERPLEXITY_API_KEY` from environment
3. Default to 'sonar' model (cost-effective: $1 input / $1 output per 1M tokens)
4. Implement 3-second timeout for API calls
5. Retry once on transient failures (network errors, 5xx)
6. Return structured error for client handling
7. Log all API calls with timing and token usage
8. Track requests per minute for rate limiting

### FR-6.2: Search Query Construction

**Location:** `lib/ai/perplexity-query-builder.ts`

**Purpose:** Transform diagram requests into effective Perplexity search queries

**Implementation:**

```typescript
// lib/ai/perplexity-query-builder.ts
export interface QueryAnalysis {
  needsSearch: boolean;
  searchQuery: string;
  reasoning: string;
  triggers: string[];
}

/**
 * Analyze user request to determine if search is needed
 * @param userRequest - User's diagram request
 * @returns Query analysis with search decision
 */
export function analyzeSearchNeed(userRequest: string): QueryAnalysis;

/**
 * Build optimized search query from diagram request
 * @param userRequest - User's diagram request
 * @returns Optimized query for Perplexity
 */
export function buildSearchQuery(userRequest: string): string;
```

**Search Triggers (shouldTriggerSearch logic):**

- Explicit: Request starts with "Search:", "Look up:", "Find:"
- Keywords: Contains "current", "latest", "recent", "today", "2025", "2024"
- Data requests: "market cap", "price", "statistics", "data on"
- Temporal: "this year", "this month", "now"
- Comparatives: "top 5", "best", "fastest" (when context suggests current data)

**Query Optimization:**

- Extract key entities and metrics (e.g., "top 5 tech companies market cap")
- Remove diagram-specific instructions ("create a bar chart" → focus on data)
- Add temporal context if implied ("tech companies market cap 2025")
- Keep queries concise (< 200 characters)

### FR-6.3: Enhanced Diagram Prompt Integration

**Location:** `lib/ai/diagram-prompt-template.ts` (modify existing)

**Purpose:** Incorporate Perplexity search results into diagram generation prompts

**Changes Required:**

1. Add optional `searchContext` parameter to `buildDiagramPrompt()`
2. Insert search results before user request in prompt
3. Format citations for inclusion in diagram footer

**Modified Function Signature:**

```typescript
export function buildDiagramPrompt(
  userRequest: string,
  context?: {
    fileContents?: string[];
    previousDiagrams?: string[];
    conversationHistory?: Array<{ role: string; content: string }>;
    searchContext?: {
      answer: string;
      citations: Array<{ url: string; title: string }>;
    };
  }
): Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
```

**Search Context Formatting:**

```typescript
// If searchContext provided, add before user message:
const searchSection = `
**Web Research Context:**

${context.searchContext.answer}

**Sources:**
${context.searchContext.citations.map((c, i) => `[${i + 1}] ${c.title} - ${c.url}`).join('\n')}

**Instructions:** Use the above research to inform your diagram. Include a small citation footer referencing the sources by number [1], [2], etc.
`;
```

### FR-6.4: API Endpoint Enhancement

**Location:** `app/api/diagram/generate/route.ts` (modify existing)

**Purpose:** Integrate search workflow into existing generation endpoint

**Changes Required:**

1. Add optional `enableSearch` parameter (default: true)
2. Analyze user request for search triggers
3. Perform Perplexity search if triggered
4. Pass search context to generation
5. Handle search errors gracefully
6. Include search metadata in response

**Request Schema Update:**

```typescript
const DiagramGenerationSchema = z.object({
  userRequest: z.string().min(10),
  files: z.array(z.any()).optional(),
  conversationHistory: z.array(z.object({ /* ... */ })).optional(),
  previousDiagrams: z.array(z.string()).optional(),
  enableValidation: z.boolean().optional().default(true),
  maxIterations: z.number().min(1).max(10).optional().default(5),
  enableSearch: z.boolean().optional().default(true), // NEW
});
```

**Response Metadata Update:**

```typescript
// Add to existing metadata:
{
  model: string;
  tokensUsed: number;
  generationTime: number;
  validationPassed: boolean;
  // NEW FIELDS:
  searchUsed: boolean;
  searchQuery?: string;
  searchTokens?: number;
  searchTime?: number;
  searchError?: string;
  citationCount?: number;
}
```

**Implementation Flow:**

```typescript
// Inside POST handler:
try {
  let searchContext;

  if (enableSearch) {
    const analysis = analyzeSearchNeed(userRequest);

    if (analysis.needsSearch) {
      try {
        const searchResult = await searchWithPerplexity({
          query: analysis.searchQuery,
          model: 'sonar',
        });

        searchContext = {
          answer: searchResult.answer,
          citations: searchResult.citations,
        };

        metadata.searchUsed = true;
        metadata.searchQuery = analysis.searchQuery;
        metadata.searchTokens = searchResult.tokens_used;
        metadata.searchTime = searchResult.search_time_ms;
        metadata.citationCount = searchResult.citations.length;
      } catch (error) {
        // Log error but continue without search
        console.error('Perplexity search failed:', error);
        metadata.searchUsed = false;
        metadata.searchError = error.message;
      }
    }
  }

  // Pass searchContext to generation
  const result = await generateDiagram({
    userRequest,
    files: validFiles,
    searchContext, // NEW
    /* ... other params ... */
  });

  // Merge search metadata into result
  return NextResponse.json({
    ...result,
    metadata: {
      ...result.metadata,
      ...metadata,
    },
  });
} catch (error) {
  // ... existing error handling
}
```

### FR-6.5: Environment Configuration

**Location:** `.env.example` and `lib/config/features.ts`

**Purpose:** Configure Perplexity API credentials and feature flag

**Environment Variables:**

```bash
# =============================================================================
# Perplexity AI Configuration (Feature 6.0)
# =============================================================================
# Get from: https://www.perplexity.ai/settings/api
PERPLEXITY_API_KEY=

# Optional: Rate limiting configuration
PERPLEXITY_MAX_REQUESTS_PER_MINUTE=60
PERPLEXITY_DAILY_BUDGET_USD=10
```

**Feature Flag:**

```typescript
// lib/config/features.ts
export const FEATURES = {
  // ... existing flags
  WEB_SEARCH: process.env.PERPLEXITY_API_KEY ? true : false,
} as const;
```

### FR-6.6: Usage Tracking and Monitoring

**Location:** `lib/ai/perplexity-usage-tracker.ts`

**Purpose:** Track API usage for cost management and debugging

**Implementation:**

```typescript
// lib/ai/perplexity-usage-tracker.ts
interface UsageRecord {
  timestamp: Date;
  query: string;
  model: string;
  tokens_input: number;
  tokens_output: number;
  cost_usd: number;
  success: boolean;
  error?: string;
}

/**
 * Singleton usage tracker for Perplexity API
 */
class PerplexityUsageTracker {
  private records: UsageRecord[] = [];
  private dailySpend: number = 0;
  private minuteRequests: number = 0;

  /**
   * Record an API call
   */
  public record(record: UsageRecord): void;

  /**
   * Get usage statistics
   */
  public getStats(): {
    totalRequests: number;
    successRate: number;
    totalCost: number;
    avgTokens: number;
  };

  /**
   * Check if budget/rate limits exceeded
   */
  public canMakeRequest(): boolean;

  /**
   * Reset daily counters (called at midnight UTC)
   */
  public resetDaily(): void;
}

export const usageTracker = new PerplexityUsageTracker();
```

---

## Technical Approach

### Architecture Pattern

**Integration Strategy:**

1. **Non-Blocking Enhancement:** Perplexity search is an optional enhancement, not a requirement
2. **Fail-Safe Design:** Diagram generation always succeeds, even if search fails
3. **Minimal Latency Impact:** Search adds < 3 seconds to generation time
4. **Cost-Conscious:** Use cheapest model (Sonar) and intelligent triggers

**Data Flow:**

```
User Request
    ↓
Trigger Analysis (shouldTriggerSearch)
    ↓ (if triggered)
Perplexity Search API
    ↓
Search Result + Citations
    ↓
Merge into Diagram Prompt
    ↓
GPT-4o Generation (existing)
    ↓
Generated Diagram + Search Metadata
```

### Model Selection

**Recommended Model:** `sonar` (Lightweight, cost-effective)

**Rationale:**
- Cost: $1 input / $1 output per 1M tokens (cheapest option)
- Speed: Faster than sonar-pro
- Sufficient quality: Adequate for factual data retrieval
- Request cost: $5-6 per 1K requests (low context)

**Alternative Models:**
- `sonar-pro`: Use for complex research queries requiring deeper analysis ($3 input / $15 output)
- `sonar-reasoning`: Use for multi-step logical queries ($1 input / $5 output)

**Selection Logic:**
```typescript
function selectModel(query: string): 'sonar' | 'sonar-pro' {
  // Use sonar-pro for:
  // - Queries with "analyze", "compare", "explain why"
  // - Queries > 100 words
  // - Queries requiring synthesis of multiple sources

  const complexTriggers = ['analyze', 'compare', 'explain why', 'evaluate'];
  const isComplex = complexTriggers.some(t => query.toLowerCase().includes(t));

  return isComplex || query.length > 300 ? 'sonar-pro' : 'sonar';
}
```

### Error Handling Strategy

**Error Categories:**

1. **Rate Limit (429):**
   - Don't retry immediately
   - Return graceful fallback (no search)
   - Log warning with reset time
   - Track to prevent future requests this minute

2. **Authentication Error (401):**
   - Don't retry
   - Return fallback immediately
   - Log critical error (requires key update)
   - Disable search feature for session

3. **Timeout (ETIMEDOUT):**
   - Retry once after 1 second
   - If retry fails, return fallback
   - Log warning with duration

4. **Server Error (500, 502, 503):**
   - Retry once after 2 seconds
   - If retry fails, return fallback
   - Log error with status code

5. **Network Error (ECONNREFUSED, ENOTFOUND):**
   - Don't retry
   - Return fallback immediately
   - Log error (possible DNS/network issue)

**Fallback Behavior:**

All errors result in the same user experience:
```typescript
{
  searchUsed: false,
  searchError: "Web search unavailable: <reason>",
  // Diagram generation continues without search context
}
```

### Rate Limiting Implementation

**Client-Side Rate Limiting:**

```typescript
// lib/ai/perplexity-rate-limiter.ts
class RateLimiter {
  private requests: number[] = []; // Timestamps of requests

  public canMakeRequest(): boolean {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    // Remove requests older than 1 minute
    this.requests = this.requests.filter(t => t > oneMinuteAgo);

    // Check limit (default: 60 per minute)
    const limit = parseInt(process.env.PERPLEXITY_MAX_REQUESTS_PER_MINUTE || '60');
    return this.requests.length < limit;
  }

  public recordRequest(): void {
    this.requests.push(Date.now());
  }
}
```

**Budget Tracking:**

```typescript
// Track daily spend
class BudgetTracker {
  private dailySpend: number = 0;
  private lastReset: Date = new Date();

  public canSpend(estimatedCost: number): boolean {
    this.checkReset();

    const budget = parseFloat(process.env.PERPLEXITY_DAILY_BUDGET_USD || '10');
    return (this.dailySpend + estimatedCost) <= budget;
  }

  private checkReset(): void {
    const now = new Date();
    if (now.getUTCDate() !== this.lastReset.getUTCDate()) {
      this.dailySpend = 0;
      this.lastReset = now;
    }
  }

  public recordCost(cost: number): void {
    this.dailySpend += cost;
  }
}
```

### Cost Estimation

**Per Request Cost Calculation:**

```typescript
function estimateSearchCost(query: string, model: 'sonar' | 'sonar-pro'): number {
  // Estimate tokens (rough: 1 token ≈ 4 characters)
  const inputTokens = Math.ceil(query.length / 4);
  const outputTokens = 500; // Estimate 500 tokens output

  // Token costs (per 1M tokens)
  const costs = {
    sonar: { input: 1, output: 1 },
    'sonar-pro': { input: 3, output: 15 },
  };

  const tokenCost = (
    (inputTokens * costs[model].input / 1_000_000) +
    (outputTokens * costs[model].output / 1_000_000)
  );

  // Request cost (per 1K requests, assume low context)
  const requestCost = model === 'sonar' ? 0.005 : 0.006;

  return tokenCost + requestCost;
}
```

**Expected Costs (per diagram with search):**

- Input: ~100 tokens ($0.0001)
- Output: ~500 tokens ($0.0005)
- Request: 1 request ($0.005)
- **Total per search: ~$0.0056** (< 1 cent)

**Monthly Cost Estimate:**
- 100 diagrams/day with search
- 30 days
- 3,000 searches × $0.0056 = **$16.80/month**

**Comparison to OpenAI:**
- OpenAI GPT-4o: $2.50 input / $10 output per 1M tokens
- Average diagram: 1,000 input + 2,000 output tokens = $0.0225
- 3,000 diagrams/month: $67.50
- **Perplexity adds ~25% to AI costs**

---

## Acceptance Criteria

### AC-6.1: API Client Implementation

**GIVEN** the Perplexity API key is configured in `.env.local`
**WHEN** the system calls `searchWithPerplexity({ query: 'test' })`
**THEN** the API client makes a successful HTTPS request to Perplexity API
**AND** returns a structured result with `answer`, `citations`, `model_used`, `tokens_used`
**AND** the request completes within 3 seconds
**AND** authentication is handled via bearer token

### AC-6.2: Search Trigger Detection

**GIVEN** various user requests
**WHEN** `shouldTriggerSearch()` is called
**THEN** it returns `true` for:

- "Search: top tech companies 2025"
- "Create chart with current market cap data"
- "Show latest COVID statistics"
- "Top 5 fastest cars today"
  **AND** it returns `false` for:
- "Create a flowchart for user login"
- "Generate an org chart"
- "Design a timeline from 1900 to 2000"

### AC-6.3: Query Optimization

**GIVEN** a diagram request with search trigger
**WHEN** `buildSearchQuery()` processes the request
**THEN** it extracts key information:

- Input: "Create bar chart showing top 5 tech companies by market cap in 2025"
- Output: "top 5 tech companies market capitalization 2025"
  **AND** it removes diagram-specific instructions
  **AND** it keeps the query under 200 characters
  **AND** it preserves temporal context

### AC-6.4: End-to-End Integration

**GIVEN** a user requests a data-driven diagram
**WHEN** the request "Create a bar chart of the top 5 programming languages in 2025" is submitted
**THEN** the system:

1. Detects search trigger ("top 5", "2025")
2. Constructs query: "top 5 programming languages 2025"
3. Calls Perplexity API
4. Receives current data with sources
5. Passes search context to GPT-4o
6. Generates diagram with current data
7. Includes citation footer
8. Returns metadata with `searchUsed: true`
   **AND** the entire process completes within 15 seconds
   **AND** the diagram contains accurate, up-to-date information

### AC-6.5: Error Handling - Rate Limit

**GIVEN** the rate limit is reached (60 requests/minute)
**WHEN** a user requests a diagram with search trigger
**THEN** the system:

- Detects rate limit exceeded
- Logs warning: "Rate limit reached, skipping search"
- Generates diagram without search
- Returns `searchUsed: false`, `searchError: "Rate limit exceeded"`
  **AND** the user still receives a valid diagram

### AC-6.6: Error Handling - API Failure

**GIVEN** the Perplexity API returns a 500 error
**WHEN** a user requests a diagram with search trigger
**THEN** the system:

- Attempts retry after 2 seconds
- If retry fails, falls back to no search
- Logs error with details
- Generates diagram without search
- Returns `searchUsed: false`, `searchError: "API error: 500"`
  **AND** the user still receives a valid diagram

### AC-6.7: Error Handling - Invalid API Key

**GIVEN** the Perplexity API key is invalid or missing
**WHEN** the system attempts to make a search request
**THEN** the system:

- Receives 401 authentication error
- Logs critical error
- Disables search for session (doesn't retry)
- Falls back to no search immediately
- Returns `searchUsed: false`, `searchError: "Authentication failed"`
  **AND** subsequent requests skip search automatically

### AC-6.8: Cost Tracking

**GIVEN** search is performed successfully
**WHEN** `usageTracker.record()` is called
**THEN** the tracker:

- Records timestamp, query, model, tokens, cost
- Updates daily spend counter
- Calculates cost accurately (tokens + request fee)
- Provides statistics via `getStats()`
  **AND** statistics include: `totalRequests`, `successRate`, `totalCost`, `avgTokens`

### AC-6.9: Budget Enforcement

**GIVEN** the daily budget is set to $10
**WHEN** estimated costs reach $9.95
**THEN** `budgetTracker.canSpend()` returns `false`
**AND** subsequent search requests are skipped
**AND** users receive diagrams without search
**AND** logs show: "Daily budget limit reached"
**AND** counter resets at midnight UTC

### AC-6.10: Search Context Formatting

**GIVEN** a successful Perplexity search result
**WHEN** the result is merged into the diagram prompt
**THEN** the prompt includes:

- "**Web Research Context:**" section
- Full search answer
- "**Sources:**" list with numbered citations
- Instructions to include citation footer
  **AND** GPT-4o receives this context before generating diagram
  **AND** the generated diagram includes citation references [1], [2], etc.

### AC-6.11: Feature Flag Behavior

**GIVEN** `PERPLEXITY_API_KEY` is not set in environment
**WHEN** the application starts
**THEN** `FEATURES.WEB_SEARCH` is set to `false`
**AND** all diagram requests skip search (even if triggered)
**AND** no Perplexity API calls are made
**AND** logs show: "Web search disabled (no API key)"

### AC-6.12: Metadata Completeness

**GIVEN** a diagram is generated with search
**WHEN** the API response is returned
**THEN** the metadata includes:

```typescript
{
  model: "gpt-4o",
  tokensUsed: 3500,
  generationTime: 8500,
  validationPassed: true,
  searchUsed: true,
  searchQuery: "top 5 tech companies market cap 2025",
  searchTokens: 650,
  searchTime: 1200,
  citationCount: 5
}
```

**AND** when search is not used:

```typescript
{
  model: "gpt-4o",
  tokensUsed: 3200,
  generationTime: 6200,
  validationPassed: true,
  searchUsed: false
}
```

---

## Constraints

### Performance Constraints

1. **Search Timeout:** 3 seconds maximum for Perplexity API calls
2. **Total Generation Time:** < 15 seconds including search (< 12 seconds without)
3. **Memory Usage:** No increase beyond 50MB for search caching
4. **Concurrent Requests:** Rate limiter must be thread-safe (Next.js edge functions)

### Cost Constraints

1. **Daily Budget:** Configurable limit (default: $10/day)
2. **Cost per Search:** Must not exceed $0.01 per request
3. **Model Selection:** Default to cheapest model (Sonar)
4. **Budget Overrun:** Must hard-stop at limit, no grace period

### Technical Constraints

1. **Stateless Architecture:** No database for usage tracking (in-memory only)
2. **No Breaking Changes:** Must not modify existing diagram generation interfaces
3. **Feature Flag:** Must respect `FEATURES.WEB_SEARCH` flag
4. **API Key Security:** Never expose `PERPLEXITY_API_KEY` to client

### Quality Constraints

1. **Reliability:** 99% diagram generation success rate (with or without search)
2. **Search Accuracy:** Citations must be verifiable URLs
3. **Error Recovery:** Zero user-facing errors from search failures
4. **Fallback Performance:** < 100ms overhead when search is skipped

---

## Success Metrics

### Quantitative Metrics

1. **Search Activation Rate:** 20-30% of diagram requests trigger search
2. **Search Success Rate:** > 95% of search attempts succeed
3. **Error Fallback Rate:** < 5% of requests fall back due to errors
4. **Average Search Time:** < 2 seconds per search
5. **Cost per Diagram (with search):** < $0.03 total ($0.0225 GPT + $0.006 Perplexity)
6. **Monthly Cost Increase:** < $20 for 100 diagrams/day

### Qualitative Metrics

1. **Diagram Accuracy:** Users report diagrams reflect current, factual data
2. **Citation Quality:** Citations are to reputable, relevant sources
3. **User Satisfaction:** Users appreciate up-to-date information in diagrams
4. **Error Handling:** Users are not blocked by search failures

### Completion Checklist

- [ ] Perplexity API client module implemented (`lib/ai/perplexity-client.ts`)
- [ ] Search query builder implemented (`lib/ai/perplexity-query-builder.ts`)
- [ ] Usage tracker implemented (`lib/ai/perplexity-usage-tracker.ts`)
- [ ] Rate limiter implemented (`lib/ai/perplexity-rate-limiter.ts`)
- [ ] Budget tracker implemented (`lib/ai/perplexity-budget-tracker.ts`)
- [ ] Diagram prompt template updated with search context support
- [ ] API endpoint enhanced with search workflow
- [ ] Environment variables added to `.env.example`
- [ ] Feature flag added to `lib/config/features.ts`
- [ ] Error handling tested for all failure modes
- [ ] Rate limiting tested (60 requests/minute)
- [ ] Budget enforcement tested ($10/day limit)
- [ ] End-to-end integration tested with real Perplexity API
- [ ] Metadata includes all search-related fields
- [ ] Cost tracking validated against Perplexity pricing
- [ ] Documentation updated (README, API docs)
- [ ] Feature 6.0 marked complete in `STATUS.md`
- [ ] Git commit: `feat(search): Implement Feature 6.0 - Web Search Integration`

---

## Implementation Notes

### Order of Operations

1. ✅ Create Perplexity API client module with authentication
2. ✅ Implement search trigger detection logic
3. ✅ Implement query builder and optimization
4. ✅ Add usage tracking and rate limiting
5. ✅ Update diagram prompt template for search context
6. ✅ Enhance API endpoint with search workflow
7. ✅ Add environment configuration and feature flag
8. ✅ Test error handling for all failure modes
9. ✅ Test end-to-end with real API
10. ✅ Validate cost tracking and budget enforcement
11. ✅ Update documentation

### Perplexity API Setup (Developer Action Required)

**Prerequisite Steps:**

1. Visit https://www.perplexity.ai/ and create an account
2. Navigate to Settings → API
3. Add a payment method (credit card)
4. Purchase API credits (minimum: $5)
5. Generate API key from API dashboard
6. Copy API key to `.env.local`:
   ```bash
   PERPLEXITY_API_KEY=pplx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

**Estimated Setup Time:** 15 minutes

**Cost:** $5 initial credit (lasts ~833 searches with Sonar model)

### Model Selection Logic

```typescript
// Start with 'sonar' as default
// Upgrade to 'sonar-pro' only for:
// - Queries requiring deep analysis
// - Queries with "compare", "analyze", "explain why"
// - Research papers or academic content
// - Multi-step reasoning tasks

// Example:
// "top 5 companies" → sonar ($0.0056)
// "compare pros and cons of..." → sonar-pro ($0.015)
```

### Rate Limit Recommendations

**Conservative (recommended for MVP):**

```bash
PERPLEXITY_MAX_REQUESTS_PER_MINUTE=30
PERPLEXITY_DAILY_BUDGET_USD=5
```

**Production (after testing):**

```bash
PERPLEXITY_MAX_REQUESTS_PER_MINUTE=60
PERPLEXITY_DAILY_BUDGET_USD=20
```

**High-Traffic:**

```bash
PERPLEXITY_MAX_REQUESTS_PER_MINUTE=120
PERPLEXITY_DAILY_BUDGET_USD=50
```

### Known Issues and Considerations

1. **In-Memory Tracking Limitation:** Usage tracking resets on server restart. Consider Redis or database for production if persistence is needed.

2. **Rate Limiter Accuracy:** Client-side rate limiting may be imperfect in serverless environment with multiple instances. Consider using Redis atomic counters for distributed rate limiting.

3. **Cost Estimation:** Actual costs may vary ±20% from estimates due to variable output length and context size.

4. **Citation Formatting:** GPT-4o may not always format citations consistently. Consider post-processing step to enforce citation style.

5. **Search Relevance:** Perplexity may return general information instead of specific data requested. Query optimization is critical.

6. **Model Availability:** Perplexity models may change. Implement fallback: sonar-pro → sonar → skip search.

### Testing Strategy

**Unit Tests:**

- Test search trigger detection with 20+ sample requests
- Test query builder optimization rules
- Test rate limiter with time-based scenarios
- Test budget tracker with various spending patterns
- Test error handling for each error type

**Integration Tests:**

- Test end-to-end with mocked Perplexity responses
- Test API endpoint with search enabled/disabled
- Test metadata population in all scenarios
- Test fallback behavior on errors

**Manual Testing:**

- Test with real Perplexity API (use small credits)
- Verify citations are clickable and relevant
- Verify diagrams reflect current data
- Verify rate limiting works (make 61 requests)
- Verify budget enforcement (set low limit, exceed it)

---

## Dependencies

### Prerequisite Features

- ✅ Phase 1-5: Complete (Foundation, Core, Frontend, State, Export)
- ✅ OpenAI GPT-4o integration
- ✅ Feature flag system (`lib/config/features.ts`)
- ✅ Environment configuration pattern

### External Dependencies

- **Perplexity API Account:** Developer must create account and add payment method
- **API Credits:** Minimum $5 initial purchase
- **npm Packages:** Official Perplexity SDK or native fetch (no new dependencies required)

### Integration Points

- `lib/ai/diagram-generator.ts` - Pass search context to generation
- `lib/ai/diagram-prompt-template.ts` - Format search context in prompt
- `app/api/diagram/generate/route.ts` - Orchestrate search workflow
- `lib/config/features.ts` - Feature flag for enabling/disabling

---

## Risk Assessment

### High Risks

1. **API Cost Overrun**
   - Risk: Perplexity usage exceeds budget, unexpected charges
   - Mitigation: Hard budget limits, rate limiting, usage monitoring, start with low limits

2. **Search Failures Impact User Experience**
   - Risk: Users expect current data, receive outdated information on failures
   - Mitigation: Clear messaging when search is unavailable, fallback always works

### Medium Risks

1. **Rate Limit Contention**
   - Risk: Multiple concurrent users hit rate limit simultaneously
   - Mitigation: Conservative limits (30/min initially), queue requests if needed

2. **Citation Relevance**
   - Risk: Perplexity returns tangentially related sources
   - Mitigation: Query optimization, consider post-filtering citations

3. **Model Availability**
   - Risk: Perplexity deprecates 'sonar' model
   - Mitigation: Model selection abstraction, easy to update

### Low Risks

1. **Search Latency**
   - Risk: Perplexity takes > 3 seconds, impacts generation time
   - Mitigation: 3-second timeout, fallback to no search

2. **Authentication Errors**
   - Risk: API key expires or is revoked
   - Mitigation: Clear error logging, feature flag auto-disables

---

## Open Questions for User Approval

### Question 1: Search Activation Strategy

**Options:**

A. **Always On (Auto-Trigger):** Analyze every request, search when keywords detected
B. **Explicit Prefix:** Only search when user prefixes with "Search:" or "Look up:"
C. **Hybrid (Recommended):** Auto-trigger on keywords + support explicit prefix

**Recommendation:** Option C (Hybrid)

**Rationale:** Balances convenience (auto-trigger) with user control (explicit prefix). Keeps costs manageable while enabling power users.

**User Decision Needed:** Which approach do you prefer?

### Question 2: Default Daily Budget

**Options:**

A. **Conservative ($5/day):** ~833 searches/day, low risk
B. **Moderate ($10/day):** ~1,666 searches/day, balanced
C. **Generous ($20/day):** ~3,333 searches/day, high throughput

**Recommendation:** Option B ($10/day)

**Rationale:** Sufficient for 100-200 diagram requests/day with search, low enough to prevent bill shock.

**User Decision Needed:** What daily budget limit should we set?

### Question 3: Citation Display in Diagrams

**Options:**

A. **Inline Citations:** [1], [2] references within diagram content
B. **Footer Only:** Small citation list at bottom of diagram
C. **Both:** Inline references + footer list
D. **None:** Use search data but don't show citations

**Recommendation:** Option C (Both)

**Rationale:** Most transparent, allows users to verify sources, academic standard.

**User Decision Needed:** How should citations be displayed?

### Question 4: Error Messaging to Users

**Options:**

A. **Silent Fallback:** Generate diagram without telling user search failed
B. **Warning Badge:** Show small warning icon with hover text
C. **Inline Message:** Display warning in diagram header or footer
D. **Explicit Error:** Show error message above diagram

**Recommendation:** Option B (Warning Badge)

**Rationale:** Non-intrusive, doesn't distract from diagram, available if user wants details.

**User Decision Needed:** How should we inform users about search failures?

### Question 5: Model Selection

**Options:**

A. **Always Sonar:** Use cheapest model for all searches
B. **Always Sonar Pro:** Use highest quality model for all searches
C. **Intelligent Selection (Recommended):** Analyze query complexity, choose model
D. **User Selectable:** Let user choose model in UI

**Recommendation:** Option C (Intelligent Selection)

**Rationale:** Optimizes cost/quality tradeoff, simple queries use cheap model, complex queries get better model.

**User Decision Needed:** How should we select which Perplexity model to use?

---

## References

### Source Files

- `/Users/anand/saas-bp/lib/ai/diagram-generator.ts` - Current generation module
- `/Users/anand/saas-bp/lib/ai/diagram-prompt-template.ts` - Prompt engineering
- `/Users/anand/saas-bp/app/api/diagram/generate/route.ts` - API endpoint
- `/Users/anand/saas-bp/lib/config/features.ts` - Feature flags
- `/Users/anand/saas-bp/docs/03-IMPLEMENTATION/STATUS.md` - Project status

### Documentation

- Feature 1.2: Environment Configuration (credential setup pattern)
- Feature 2.2-2.5: AI Generation modules (existing patterns)
- Phase 5: Export Functionality (completed work)
- CLAUDE.md: Development guidelines and Git workflow

### External Resources

- [Perplexity API Documentation](https://docs.perplexity.ai/)
- [Perplexity API Pricing](https://docs.perplexity.ai/getting-started/pricing)
- [Perplexity API Settings](https://www.perplexity.ai/settings/api)
- [Perplexity SDK Quickstart](https://docs.perplexity.ai/guides/perplexity-sdk)

---

**Last Updated:** 2025-01-XX (Current Date)
**Status:** Ready for User Review
**Approved By:** Pending User Approval
**Next Phase:** User Review → Design → Implementation

---

## Next Steps

1. **User Review:** Please review this specification and answer the 5 open questions above
2. **Design Phase:** Once approved, create technical implementation plan (DESIGN.md)
3. **Implementation:** Develop modules in order listed in Implementation Notes
4. **Testing:** Execute test strategy (unit → integration → manual)
5. **Deployment:** Update environment, deploy to production
6. **Documentation:** Update STATUS.md, commit with conventional format

**Estimated Timeline:**
- User Review: 30 minutes
- Design: 2 hours
- Implementation: 8-12 hours
- Testing: 2 hours
- Documentation: 1 hour
- **Total: 13-17 hours**
