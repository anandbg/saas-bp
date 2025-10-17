/**
 * Model Usage Tracker
 * Feature 7.0: GPT-5 Reasoning Model Integration
 *
 * Tracks usage statistics for cost analysis and debugging:
 * - Model usage frequency
 * - Token consumption
 * - Cost tracking
 * - Fallback patterns
 * - Success rates
 */

/**
 * Single usage record for a diagram generation
 */
export interface ModelUsageRecord {
  /** Timestamp of request */
  timestamp: Date;

  /** Model used (gpt-5, o3-mini, gpt-4o, etc.) */
  model: string;

  /** Reasoning effort if applicable */
  reasoningEffort?: string;

  /** Total tokens consumed */
  tokensUsed: number;

  /** Generation time in milliseconds */
  generationTime: number;

  /** Whether fallback occurred */
  fallbackOccurred: boolean;

  /** Whether generation succeeded */
  success: boolean;

  /** Estimated cost in USD */
  estimatedCost: number;
}

/**
 * Aggregated usage statistics
 */
export interface UsageStats {
  /** Total number of requests tracked */
  totalRequests: number;

  /** Success rate percentage (0-100) */
  successRate: number;

  /** Fallback rate percentage (0-100) */
  fallbackRate: number;

  /** Total cost in USD */
  totalCost: number;

  /** Average cost per request in USD */
  avgCostPerRequest: number;

  /** Average tokens per request */
  avgTokens: number;

  /** Average generation time in milliseconds */
  avgGenerationTime: number;

  /** Model usage distribution (model name → count) */
  modelDistribution: Record<string, number>;

  /** Reasoning effort distribution (effort → count) */
  reasoningDistribution: Record<string, number>;
}

/**
 * Singleton class to track model usage across the application
 *
 * Uses in-memory storage with FIFO eviction to prevent memory leaks.
 * Keeps last 1000 records for analysis.
 */
export class ModelUsageTracker {
  private records: ModelUsageRecord[] = [];
  private maxRecords = 1000; // Keep last 1000 records in memory

  /**
   * Log a usage record
   *
   * @param record - Usage record to log
   *
   * @example
   * ```typescript
   * modelUsageTracker.log({
   *   timestamp: new Date(),
   *   model: 'gpt-5',
   *   reasoningEffort: 'medium',
   *   tokensUsed: 3200,
   *   generationTime: 8500,
   *   fallbackOccurred: false,
   *   success: true,
   *   estimatedCost: 0.0132,
   * });
   * ```
   */
  public log(record: ModelUsageRecord): void {
    this.records.push(record);

    // Trim to max size (FIFO: First In, First Out)
    if (this.records.length > this.maxRecords) {
      this.records.shift(); // Remove oldest record
    }

    // Console log for real-time monitoring
    const successIcon = record.success ? '✓' : '✗';
    const fallbackInfo = record.fallbackOccurred ? '(fallback)' : '';
    const reasoningInfo = record.reasoningEffort ? `(${record.reasoningEffort})` : '';

    console.log(
      `[Model Usage] ${record.model} ${reasoningInfo} - ` +
      `${record.tokensUsed} tokens, ${record.generationTime}ms, ` +
      `$${record.estimatedCost.toFixed(4)} ` +
      `${fallbackInfo} ${successIcon}`
    );
  }

  /**
   * Get aggregated usage statistics
   *
   * @returns Usage statistics or null if no records
   *
   * @example
   * ```typescript
   * const stats = modelUsageTracker.getStats();
   * if (stats) {
   *   console.log(`Total requests: ${stats.totalRequests}`);
   *   console.log(`Success rate: ${stats.successRate.toFixed(2)}%`);
   *   console.log(`Total cost: $${stats.totalCost.toFixed(2)}`);
   *   console.log(`Model distribution:`, stats.modelDistribution);
   * }
   * ```
   */
  public getStats(): UsageStats | null {
    const total = this.records.length;

    if (total === 0) {
      return null;
    }

    // Calculate success and fallback rates
    const successful = this.records.filter(r => r.success).length;
    const withFallback = this.records.filter(r => r.fallbackOccurred).length;

    // Calculate totals and averages
    const totalCost = this.records.reduce((sum, r) => sum + r.estimatedCost, 0);
    const avgTokens = this.records.reduce((sum, r) => sum + r.tokensUsed, 0) / total;
    const avgTime = this.records.reduce((sum, r) => sum + r.generationTime, 0) / total;

    // Model distribution
    const modelCounts: Record<string, number> = {};
    this.records.forEach(r => {
      modelCounts[r.model] = (modelCounts[r.model] || 0) + 1;
    });

    // Reasoning effort distribution
    const reasoningCounts: Record<string, number> = {};
    this.records.forEach(r => {
      if (r.reasoningEffort) {
        reasoningCounts[r.reasoningEffort] = (reasoningCounts[r.reasoningEffort] || 0) + 1;
      }
    });

    return {
      totalRequests: total,
      successRate: (successful / total) * 100,
      fallbackRate: (withFallback / total) * 100,
      totalCost,
      avgCostPerRequest: totalCost / total,
      avgTokens,
      avgGenerationTime: avgTime,
      modelDistribution: modelCounts,
      reasoningDistribution: reasoningCounts,
    };
  }

  /**
   * Get recent records (for debugging)
   *
   * @param count - Number of records to return (default: 10)
   * @returns Array of most recent records
   */
  public getRecentRecords(count: number = 10): ModelUsageRecord[] {
    return this.records.slice(-count);
  }

  /**
   * Clear all records (for testing)
   */
  public clear(): void {
    this.records = [];
  }

  /**
   * Get total number of tracked records
   */
  public getRecordCount(): number {
    return this.records.length;
  }
}

/**
 * Singleton instance
 * Exported for use throughout the application
 */
export const modelUsageTracker = new ModelUsageTracker();

/**
 * Print usage statistics to console
 * Useful for debugging and monitoring
 *
 * @example
 * ```typescript
 * // In API route or debugging session
 * printUsageStats();
 * ```
 */
export function printUsageStats(): void {
  const stats = modelUsageTracker.getStats();

  if (!stats) {
    console.log('[Model Usage] No usage data available');
    return;
  }

  console.log('\n========================================');
  console.log('MODEL USAGE STATISTICS');
  console.log('========================================');
  console.log(`Total Requests: ${stats.totalRequests}`);
  console.log(`Success Rate: ${stats.successRate.toFixed(2)}%`);
  console.log(`Fallback Rate: ${stats.fallbackRate.toFixed(2)}%`);
  console.log(`Total Cost: $${stats.totalCost.toFixed(4)}`);
  console.log(`Avg Cost/Request: $${stats.avgCostPerRequest.toFixed(4)}`);
  console.log(`Avg Tokens: ${Math.round(stats.avgTokens)}`);
  console.log(`Avg Time: ${Math.round(stats.avgGenerationTime)}ms`);
  console.log('\nModel Distribution:');
  Object.entries(stats.modelDistribution).forEach(([model, count]) => {
    const percentage = ((count / stats.totalRequests) * 100).toFixed(1);
    console.log(`  ${model}: ${count} (${percentage}%)`);
  });

  if (Object.keys(stats.reasoningDistribution).length > 0) {
    console.log('\nReasoning Effort Distribution:');
    Object.entries(stats.reasoningDistribution).forEach(([effort, count]) => {
      const percentage = ((count / stats.totalRequests) * 100).toFixed(1);
      console.log(`  ${effort}: ${count} (${percentage}%)`);
    });
  }
  console.log('========================================\n');
}

/**
 * Get cost comparison between GPT-5 and GPT-4o
 * Useful for ROI analysis
 *
 * @returns Cost comparison or null if no data
 */
export function getCostComparison(): {
  gpt5AvgCost: number;
  gpt4oAvgCost: number;
  savings: number;
  savingsPercentage: number;
} | null {
  const stats = modelUsageTracker.getStats();

  if (!stats) {
    return null;
  }

  const gpt5Records = modelUsageTracker['records'].filter(r => r.model === 'gpt-5');
  const gpt4oRecords = modelUsageTracker['records'].filter(r => r.model === 'gpt-4o');

  if (gpt5Records.length === 0 || gpt4oRecords.length === 0) {
    return null;
  }

  const gpt5AvgCost = gpt5Records.reduce((sum, r) => sum + r.estimatedCost, 0) / gpt5Records.length;
  const gpt4oAvgCost = gpt4oRecords.reduce((sum, r) => sum + r.estimatedCost, 0) / gpt4oRecords.length;
  const savings = gpt4oAvgCost - gpt5AvgCost;
  const savingsPercentage = (savings / gpt4oAvgCost) * 100;

  return {
    gpt5AvgCost,
    gpt4oAvgCost,
    savings,
    savingsPercentage,
  };
}
