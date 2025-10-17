/**
 * Perplexity Usage Tracker
 *
 * Tracks API usage for cost management and debugging
 * Feature 6.0: Web Search Integration
 */

/**
 * Record of a single API call
 */
export interface UsageRecord {
  /** Timestamp of the request */
  timestamp: Date;

  /** Search query */
  query: string;

  /** Model used */
  model: string;

  /** Input tokens consumed */
  tokensInput: number;

  /** Output tokens generated */
  tokensOutput: number;

  /** Cost in USD */
  costUsd: number;

  /** Whether the request succeeded */
  success: boolean;

  /** Error message if failed */
  error?: string;
}

/**
 * Usage statistics
 */
export interface UsageStats {
  /** Total number of requests */
  totalRequests: number;

  /** Number of successful requests */
  successfulRequests: number;

  /** Success rate (0-1) */
  successRate: number;

  /** Total cost in USD */
  totalCost: number;

  /** Average tokens per request */
  avgTokens: number;

  /** Average cost per request */
  avgCost: number;

  /** Requests in last hour */
  requestsLastHour: number;

  /** Cost in last hour */
  costLastHour: number;
}

/**
 * Singleton usage tracker for Perplexity API
 * Tracks all API calls for cost management and debugging
 */
export class PerplexityUsageTracker {
  private records: UsageRecord[] = [];
  private readonly maxRecords = 10000; // Keep last 10k records

  /**
   * Record an API call
   * @param record - Usage record to store
   */
  public record(record: UsageRecord): void {
    this.records.push(record);

    // Trim old records if we exceed max
    if (this.records.length > this.maxRecords) {
      this.records = this.records.slice(-this.maxRecords);
    }
  }

  /**
   * Get usage statistics
   * @returns Aggregated statistics
   */
  public getStats(): UsageStats {
    if (this.records.length === 0) {
      return {
        totalRequests: 0,
        successfulRequests: 0,
        successRate: 0,
        totalCost: 0,
        avgTokens: 0,
        avgCost: 0,
        requestsLastHour: 0,
        costLastHour: 0,
      };
    }

    const now = Date.now();
    const oneHourAgo = now - 3600000;

    const totalRequests = this.records.length;
    const successfulRequests = this.records.filter(r => r.success).length;
    const successRate = successfulRequests / totalRequests;

    const totalCost = this.records.reduce((sum, r) => sum + r.costUsd, 0);
    const totalTokens = this.records.reduce((sum, r) => sum + r.tokensInput + r.tokensOutput, 0);
    const avgTokens = totalTokens / totalRequests;
    const avgCost = totalCost / totalRequests;

    const recentRecords = this.records.filter(r => r.timestamp.getTime() > oneHourAgo);
    const requestsLastHour = recentRecords.length;
    const costLastHour = recentRecords.reduce((sum, r) => sum + r.costUsd, 0);

    return {
      totalRequests,
      successfulRequests,
      successRate,
      totalCost,
      avgTokens,
      avgCost,
      requestsLastHour,
      costLastHour,
    };
  }

  /**
   * Get all records (for debugging)
   * @returns Array of usage records
   */
  public getRecords(): UsageRecord[] {
    return [...this.records];
  }

  /**
   * Get records for a specific time range
   * @param startTime - Start timestamp
   * @param endTime - End timestamp
   * @returns Filtered records
   */
  public getRecordsInRange(startTime: Date, endTime: Date): UsageRecord[] {
    const start = startTime.getTime();
    const end = endTime.getTime();

    return this.records.filter(r => {
      const timestamp = r.timestamp.getTime();
      return timestamp >= start && timestamp <= end;
    });
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
 * Enforces configurable daily budget to prevent cost overruns
 */
export class BudgetTracker {
  private dailySpend: number = 0;
  private lastReset: Date = new Date();
  private readonly dailyBudgetUsd: number;

  constructor(dailyBudgetUsd?: number) {
    // Default: $10/day (can be overridden by env var)
    const envBudget = process.env.PERPLEXITY_DAILY_BUDGET_USD;
    this.dailyBudgetUsd = dailyBudgetUsd || (envBudget ? parseFloat(envBudget) : 10);
  }

  /**
   * Check if we can spend the estimated cost without exceeding budget
   * @param estimatedCost - Estimated cost in USD
   * @returns true if within budget, false if would exceed
   */
  public canSpend(estimatedCost: number): boolean {
    this.checkReset();
    return (this.dailySpend + estimatedCost) <= this.dailyBudgetUsd;
  }

  /**
   * Record actual cost spent
   * @param cost - Cost in USD
   */
  public recordCost(cost: number): void {
    this.checkReset();
    this.dailySpend += cost;
  }

  /**
   * Get remaining budget for today
   * @returns Remaining budget in USD
   */
  public getRemainingBudget(): number {
    this.checkReset();
    return Math.max(0, this.dailyBudgetUsd - this.dailySpend);
  }

  /**
   * Get current daily spend
   * @returns Spend today in USD
   */
  public getDailySpend(): number {
    this.checkReset();
    return this.dailySpend;
  }

  /**
   * Get budget statistics
   * @returns Budget statistics
   */
  public getStats(): {
    dailyBudget: number;
    dailySpend: number;
    remainingBudget: number;
    percentUsed: number;
  } {
    this.checkReset();

    return {
      dailyBudget: this.dailyBudgetUsd,
      dailySpend: this.dailySpend,
      remainingBudget: this.getRemainingBudget(),
      percentUsed: (this.dailySpend / this.dailyBudgetUsd) * 100,
    };
  }

  /**
   * Check if we need to reset daily counters (at midnight UTC)
   */
  private checkReset(): void {
    const now = new Date();

    // Check if we've crossed into a new UTC day
    if (now.getUTCDate() !== this.lastReset.getUTCDate() ||
        now.getUTCMonth() !== this.lastReset.getUTCMonth() ||
        now.getUTCFullYear() !== this.lastReset.getUTCFullYear()) {
      this.dailySpend = 0;
      this.lastReset = now;
    }
  }

  /**
   * Reset budget tracker (for testing)
   */
  public reset(): void {
    this.dailySpend = 0;
    this.lastReset = new Date();
  }
}

/**
 * Singleton instance of usage tracker
 * Import and use this instance throughout the application
 *
 * @example
 * ```typescript
 * import { usageTracker } from '@/lib/ai/perplexity-usage-tracker';
 *
 * // Record a successful search
 * usageTracker.record({
 *   timestamp: new Date(),
 *   query: 'top 5 tech companies',
 *   model: 'sonar',
 *   tokensInput: 100,
 *   tokensOutput: 500,
 *   costUsd: 0.006,
 *   success: true,
 * });
 *
 * // Get statistics
 * const stats = usageTracker.getStats();
 * console.log(`Total cost: $${stats.totalCost.toFixed(2)}`);
 * ```
 */
export const usageTracker = new PerplexityUsageTracker();

/**
 * Singleton instance of budget tracker
 * Import and use this instance throughout the application
 *
 * @example
 * ```typescript
 * import { budgetTracker } from '@/lib/ai/perplexity-usage-tracker';
 *
 * // Check before making request
 * if (budgetTracker.canSpend(0.01)) {
 *   const result = await searchWithPerplexity({ query: '...' });
 *   budgetTracker.recordCost(result.estimatedCostUsd);
 * } else {
 *   console.warn('Daily budget limit reached');
 * }
 * ```
 */
export const budgetTracker = new BudgetTracker();
