/**
 * Perplexity Rate Limiter
 *
 * Implements sliding window rate limiting for Perplexity API
 * Feature 6.0: Web Search Integration
 */

/**
 * Singleton rate limiter for Perplexity API
 * Uses sliding window algorithm to track requests per minute
 */
export class RateLimiter {
  private requests: number[] = []; // Timestamps of requests
  private readonly maxRequestsPerMinute: number;

  constructor(maxRequestsPerMinute?: number) {
    // Default: 60 requests per minute (can be overridden by env var)
    const envLimit = process.env.PERPLEXITY_MAX_REQUESTS_PER_MINUTE;
    this.maxRequestsPerMinute = maxRequestsPerMinute || (envLimit ? parseInt(envLimit, 10) : 60);
  }

  /**
   * Check if a request can be made without exceeding rate limit
   * @returns true if request is allowed, false if rate limit exceeded
   */
  public canMakeRequest(): boolean {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    // Remove requests older than 1 minute
    this.requests = this.requests.filter(timestamp => timestamp > oneMinuteAgo);

    // Check if we're under the limit
    return this.requests.length < this.maxRequestsPerMinute;
  }

  /**
   * Record a successful request
   * Should be called after API call succeeds
   */
  public recordRequest(): void {
    this.requests.push(Date.now());
  }

  /**
   * Get number of remaining requests in current window
   * @returns Number of requests available
   */
  public getRemainingRequests(): number {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    // Clean up old requests
    this.requests = this.requests.filter(timestamp => timestamp > oneMinuteAgo);

    return Math.max(0, this.maxRequestsPerMinute - this.requests.length);
  }

  /**
   * Get time until rate limit resets (in milliseconds)
   * @returns Milliseconds until oldest request expires from window
   */
  public getTimeUntilReset(): number {
    if (this.requests.length === 0) {
      return 0;
    }

    const oldestRequest = Math.min(...this.requests);
    const resetTime = oldestRequest + 60000; // 1 minute after oldest request
    const now = Date.now();

    return Math.max(0, resetTime - now);
  }

  /**
   * Reset the rate limiter (clear all tracked requests)
   * Useful for testing or manual reset
   */
  public reset(): void {
    this.requests = [];
  }

  /**
   * Get current statistics
   * @returns Rate limiter statistics
   */
  public getStats(): {
    requestsInWindow: number;
    remainingRequests: number;
    maxRequests: number;
    timeUntilReset: number;
  } {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    // Clean up old requests
    this.requests = this.requests.filter(timestamp => timestamp > oneMinuteAgo);

    return {
      requestsInWindow: this.requests.length,
      remainingRequests: this.getRemainingRequests(),
      maxRequests: this.maxRequestsPerMinute,
      timeUntilReset: this.getTimeUntilReset(),
    };
  }
}

/**
 * Singleton instance of rate limiter
 * Import and use this instance throughout the application
 *
 * @example
 * ```typescript
 * import { rateLimiter } from '@/lib/ai/perplexity-rate-limiter';
 *
 * if (rateLimiter.canMakeRequest()) {
 *   await searchWithPerplexity({ query: '...' });
 *   rateLimiter.recordRequest();
 * } else {
 *   console.warn('Rate limit exceeded');
 * }
 * ```
 */
export const rateLimiter = new RateLimiter();
