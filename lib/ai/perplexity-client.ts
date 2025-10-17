/**
 * Perplexity API Client
 *
 * Encapsulates all Perplexity API interactions with authentication, error handling, and retries
 * Feature 6.0: Web Search Integration
 */

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

/**
 * Internal API response structure
 */
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

/**
 * Internal function to perform the actual search
 */
async function performSearch(
  request: PerplexitySearchRequest,
  config?: Partial<PerplexityClientConfig>
): Promise<PerplexitySearchResult> {
  const searchStartTime = Date.now();

  // Get configuration
  const apiKey = config?.apiKey || process.env.PERPLEXITY_API_KEY;
  if (!apiKey) {
    throw {
      code: 'auth_error',
      message: 'PERPLEXITY_API_KEY not configured',
      retryable: false,
    } as PerplexityError;
  }

  const timeoutMs = config?.timeoutMs || 3000;
  const baseUrl = config?.baseUrl || 'https://api.perplexity.ai';
  const debug = config?.debug || false;

  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    // Build request body
    const body = {
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
    };

    if (debug) {
      console.log('[Perplexity] Request:', JSON.stringify(body, null, 2));
    }

    // Make API call
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Handle non-OK responses
    if (!response.ok) {
      const errorBody = await response.text();
      if (debug) {
        console.error('[Perplexity] Error response:', errorBody);
      }

      throw {
        status: response.status,
        statusText: response.statusText,
        body: errorBody,
      };
    }

    // Parse response
    const apiResponse: PerplexityApiResponse = await response.json();

    if (debug) {
      console.log('[Perplexity] Response:', JSON.stringify(apiResponse, null, 2));
    }

    // Parse and return result
    return parsePerplexityResponse(apiResponse, searchStartTime);
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Parse Perplexity API response into structured result
 */
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

/**
 * Parse citations from API response
 */
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

/**
 * Extract title from URL (best effort)
 */
function extractTitleFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const path = urlObj.pathname;

    // Remove leading/trailing slashes and file extensions
    const cleanPath = path.replace(/^\/|\/$/g, '').replace(/\.[^/.]+$/, '');

    // Split by slash or dash and capitalize
    const parts = cleanPath.split(/[/-]/).filter(p => p.length > 0);
    if (parts.length > 0) {
      return parts
        .map(p => p.charAt(0).toUpperCase() + p.slice(1))
        .join(' ');
    }

    // Fallback to domain
    return urlObj.hostname.replace('www.', '');
  } catch {
    return url;
  }
}

/**
 * Handle and categorize errors
 */
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

/**
 * Type guard for HTTP errors
 */
function isHttpError(error: unknown): error is { status: number; statusText: string; body: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    typeof (error as any).status === 'number'
  );
}

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
): number {
  // Token costs (per 1M tokens)
  const costs = {
    sonar: { input: 1, output: 1 },
    'sonar-pro': { input: 3, output: 15 },
    'sonar-reasoning': { input: 1, output: 5 },
  };

  const tokenCost = (
    (tokensInput * costs[model].input / 1_000_000) +
    (tokensOutput * costs[model].output / 1_000_000)
  );

  // Request cost (per 1K requests, assume low context)
  const requestCost = model === 'sonar' ? 0.005 : 0.006;

  return tokenCost + requestCost;
}

/**
 * Estimate tokens from text
 * Rough approximation: 1 token ≈ 4 characters
 *
 * @param text - Text to estimate
 * @returns Estimated token count
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}
