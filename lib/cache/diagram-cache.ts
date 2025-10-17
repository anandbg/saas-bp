/**
 * Diagram Cache - In-Memory TTL-based Cache with LRU Eviction
 *
 * Caches OpenAI diagram generation responses to reduce API calls and improve performance.
 * Features:
 * - TTL-based expiration (1 hour default)
 * - LRU (Least Recently Used) eviction when cache is full
 * - Request hashing for cache key generation
 * - Thread-safe implementation
 *
 * @example
 * ```ts
 * const cache = DiagramCache.getInstance();
 *
 * // Try to get from cache
 * const cached = cache.get(requestHash);
 * if (cached) return cached;
 *
 * // Generate and cache
 * const result = await generateDiagram(request);
 * cache.set(requestHash, result);
 * ```
 */

import type { GenerateResponse } from '@/types/diagram';

// Cache configuration
const DEFAULT_TTL = 60 * 60 * 1000; // 1 hour in milliseconds
const MAX_CACHE_SIZE = 100; // Maximum number of cached items
const CLEANUP_INTERVAL = 5 * 60 * 1000; // Clean up expired items every 5 minutes

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  lastAccessed: number;
}

/**
 * Generate a hash from request parameters
 * Used to create cache keys
 */
export function hashRequest(request: {
  userRequest: string;
  conversationHistory?: unknown[];
  files?: { name: string; size: number }[];
}): string {
  const normalized = {
    request: request.userRequest.trim().toLowerCase(),
    historyLength: request.conversationHistory?.length ?? 0,
    fileCount: request.files?.length ?? 0,
    fileNames: request.files?.map((f) => f.name).sort().join(',') ?? '',
  };

  return JSON.stringify(normalized);
}

/**
 * In-memory cache with TTL and LRU eviction
 */
export class DiagramCache {
  private static instance: DiagramCache | null = null;
  private cache: Map<string, CacheEntry<GenerateResponse>>;
  private cleanupTimer: NodeJS.Timeout | null = null;

  private constructor() {
    this.cache = new Map();
    this.startCleanupTimer();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): DiagramCache {
    if (!DiagramCache.instance) {
      DiagramCache.instance = new DiagramCache();
    }
    return DiagramCache.instance;
  }

  /**
   * Get value from cache
   * Returns null if not found or expired
   */
  public get(key: string): GenerateResponse | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      console.log(`[DiagramCache] Cache miss (expired): ${key.substring(0, 50)}...`);
      return null;
    }

    // Update last accessed time (for LRU)
    entry.lastAccessed = Date.now();
    console.log(`[DiagramCache] Cache hit: ${key.substring(0, 50)}...`);
    return entry.value;
  }

  /**
   * Set value in cache
   * Automatically evicts LRU items if cache is full
   */
  public set(key: string, value: GenerateResponse, ttl: number = DEFAULT_TTL): void {
    // Check if we need to evict
    if (this.cache.size >= MAX_CACHE_SIZE && !this.cache.has(key)) {
      this.evictLRU();
    }

    const entry: CacheEntry<GenerateResponse> = {
      value,
      expiresAt: Date.now() + ttl,
      lastAccessed: Date.now(),
    };

    this.cache.set(key, entry);
    console.log(
      `[DiagramCache] Cached response (size: ${this.cache.size}/${MAX_CACHE_SIZE}): ${key.substring(0, 50)}...`
    );
  }

  /**
   * Remove a specific key from cache
   */
  public invalidate(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      console.log(`[DiagramCache] Invalidated: ${key.substring(0, 50)}...`);
    }
    return deleted;
  }

  /**
   * Clear all cached items
   */
  public clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    console.log(`[DiagramCache] Cleared ${size} items`);
  }

  /**
   * Get cache statistics
   */
  public getStats(): {
    size: number;
    maxSize: number;
    oldestEntry: number | null;
    newestEntry: number | null;
  } {
    let oldestEntry: number | null = null;
    let newestEntry: number | null = null;

    for (const entry of this.cache.values()) {
      if (oldestEntry === null || entry.lastAccessed < oldestEntry) {
        oldestEntry = entry.lastAccessed;
      }
      if (newestEntry === null || entry.lastAccessed > newestEntry) {
        newestEntry = entry.lastAccessed;
      }
    }

    return {
      size: this.cache.size,
      maxSize: MAX_CACHE_SIZE,
      oldestEntry,
      newestEntry,
    };
  }

  /**
   * Evict least recently used item
   */
  private evictLRU(): void {
    let lruKey: string | null = null;
    let lruTime = Infinity;

    // Find least recently used entry
    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < lruTime) {
        lruTime = entry.lastAccessed;
        lruKey = key;
      }
    }

    if (lruKey) {
      this.cache.delete(lruKey);
      console.log(`[DiagramCache] Evicted LRU item: ${lruKey.substring(0, 50)}...`);
    }
  }

  /**
   * Remove all expired entries
   */
  private removeExpired(): void {
    const now = Date.now();
    let removedCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      console.log(`[DiagramCache] Removed ${removedCount} expired items`);
    }
  }

  /**
   * Start periodic cleanup of expired items
   */
  private startCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    this.cleanupTimer = setInterval(() => {
      this.removeExpired();
    }, CLEANUP_INTERVAL);

    // Don't prevent Node from exiting
    if (this.cleanupTimer.unref) {
      this.cleanupTimer.unref();
    }
  }

  /**
   * Stop cleanup timer (for testing)
   */
  public stopCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  /**
   * Destroy the cache instance (for testing)
   */
  public static destroy(): void {
    if (DiagramCache.instance) {
      DiagramCache.instance.stopCleanupTimer();
      DiagramCache.instance.clear();
      DiagramCache.instance = null;
    }
  }
}

/**
 * Export singleton instance for convenience
 */
export const diagramCache = DiagramCache.getInstance();
