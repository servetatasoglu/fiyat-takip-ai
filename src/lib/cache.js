/**
 * Redis cache utility with in-memory fallback.
 * If REDIS_URL is not configured, uses a simple Map-based cache.
 */

let client = null;
const memCache = new Map(); // Fallback when Redis not configured

async function getClient() {
  if (client) return client;

  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) return null; // Use memory fallback

  try {
    const { default: Redis } = await import('ioredis');
    client = new Redis(redisUrl, {
      maxRetriesPerRequest: 2,
      connectTimeout: 3000,
      lazyConnect: true,
    });
    client.on('error', (err) => {
      console.warn('[Redis] Connection error, falling back to memory cache:', err.message);
      client = null;
    });
    await client.connect();
    console.log('[Redis] Connected ✓');
    return client;
  } catch (err) {
    console.warn('[Redis] Failed to connect, using memory cache:', err.message);
    client = null;
    return null;
  }
}

/**
 * Get value from cache.
 */
export async function cacheGet(key) {
  try {
    const redis = await getClient();
    if (redis) {
      const val = await redis.get(key);
      return val ? JSON.parse(val) : null;
    }
    // Memory fallback
    const entry = memCache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expires) { memCache.delete(key); return null; }
    return entry.value;
  } catch {
    return null;
  }
}

/**
 * Set value in cache with TTL (seconds).
 */
export async function cacheSet(key, value, ttlSeconds = 300) {
  try {
    const redis = await getClient();
    if (redis) {
      await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
      return;
    }
    // Memory fallback
    memCache.set(key, { value, expires: Date.now() + ttlSeconds * 1000 });
  } catch { /* non-critical */ }
}

/**
 * Invalidate cache key(s).
 */
export async function cacheInvalidate(...keys) {
  try {
    const redis = await getClient();
    if (redis) {
      await redis.del(...keys);
      return;
    }
    keys.forEach(k => memCache.delete(k));
  } catch { /* non-critical */ }
}
