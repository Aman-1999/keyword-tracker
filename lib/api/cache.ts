/**
 * In-memory cache for hot data
 * Use for frequently accessed, slow-changing data
 */

interface CacheItem<T> {
  data: T;
  expires: number;
}

const cache = new Map<string, CacheItem<unknown>>();

// Cache TTLs (in milliseconds)
export const CACHE_TTL = {
  USER_TOKENS: 60 * 1000, // 1 minute
  LOCATION_SEARCH: 60 * 60 * 1000, // 1 hour
  ADMIN_STATS: 5 * 60 * 1000, // 5 minutes
  USER_DASHBOARD: 2 * 60 * 1000, // 2 minutes
  ANALYTICS_SUMMARY: 10 * 60 * 1000, // 10 minutes
  SERP_FEATURES: 30 * 60 * 1000, // 30 minutes
  SYSTEM_HEALTH: 30 * 1000, // 30 seconds
};

// Cache key generators
export const CACHE_KEYS = {
  userTokens: (userId: string) => `user:${userId}:tokens`,
  locationSearch: (query: string) => `loc:${query.toLowerCase()}`,
  adminStats: () => "admin:stats",
  userDashboard: (userId: string) => `user:${userId}:dashboard`,
  analyticsSummary: (userId: string) => `analytics:${userId}:summary`,
  serpFeatures: (userId: string) => `serp:${userId}:features`,
  systemHealth: () => "system:health",
  rankDistribution: (userId: string) => `rank:${userId}:distribution`,
};

/**
 * Get cached value
 */
export function getCached<T>(key: string): T | null {
  const item = cache.get(key);

  if (!item) {
    return null;
  }

  if (Date.now() > item.expires) {
    cache.delete(key);
    return null;
  }

  return item.data as T;
}

/**
 * Set cache value
 */
export function setCache<T>(key: string, data: T, ttlMs: number): void {
  cache.set(key, {
    data,
    expires: Date.now() + ttlMs,
  });

  // Clean up if cache gets too large
  if (cache.size > 5000) {
    cleanupCache();
  }
}

/**
 * Delete cached value
 */
export function deleteCache(key: string): void {
  cache.delete(key);
}

/**
 * Delete cached values by prefix
 */
export function deleteCacheByPrefix(prefix: string): void {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key);
    }
  }
}

/**
 * Invalidate user-related caches
 */
export function invalidateUserCache(userId: string): void {
  deleteCacheByPrefix(`user:${userId}`);
  deleteCacheByPrefix(`analytics:${userId}`);
  deleteCacheByPrefix(`serp:${userId}`);
  deleteCacheByPrefix(`rank:${userId}`);
}

/**
 * Clean up expired entries
 */
function cleanupCache(): void {
  const now = Date.now();

  for (const [key, item] of cache.entries()) {
    if (now > item.expires) {
      cache.delete(key);
    }
  }

  // If still too large, remove oldest entries
  if (cache.size > 4000) {
    const entries = Array.from(cache.entries()).sort(
      (a, b) => a[1].expires - b[1].expires
    );

    const toDelete = entries.slice(0, 1000);
    for (const [key] of toDelete) {
      cache.delete(key);
    }
  }
}

/**
 * Get or set cache (convenience function)
 */
export async function getOrSetCache<T>(
  key: string,
  ttlMs: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const cached = getCached<T>(key);

  if (cached !== null) {
    return cached;
  }

  const data = await fetcher();
  setCache(key, data, ttlMs);
  return data;
}

/**
 * Cache statistics (for debugging/monitoring)
 */
export function getCacheStats() {
  const now = Date.now();
  let active = 0;
  let expired = 0;

  for (const item of cache.values()) {
    if (now > item.expires) {
      expired++;
    } else {
      active++;
    }
  }

  return {
    total: cache.size,
    active,
    expired,
  };
}
