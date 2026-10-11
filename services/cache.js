/**
 * cache.js
 * --------
 * A tiny in-memory cache with an expiry time.
 *
 * Why do we need it? The free OpenUV plan only allows a limited number of
 * requests per day, and every search uses 3 of them (current UV, forecast and
 * protection window). If someone refreshes the page or searches the same city
 * again, we reuse the stored result instead of spending more of the quota.
 *
 * Note: the cache lives in the server's memory, so it is cleared whenever the
 * server restarts. That's fine for this project - no database needed.
 */

const DEFAULT_TTL_MS = 15 * 60 * 1000; // 15 minutes - UV changes slowly
const MAX_ENTRIES = 100; // stop the cache growing forever

const store = new Map();

/**
 * Get a value if it exists and hasn't expired yet.
 * @param {string} key
 * @returns {any|undefined}
 */
export function getCached(key) {
  const entry = store.get(key);
  if (!entry) return undefined;

  // Expired? Remove it and behave as if it was never there.
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return undefined;
  }
  return entry.value;
}

/**
 * Save a value for a limited time.
 * @param {string} key
 * @param {any} value
 * @param {number} [ttlMs]
 */
export function setCached(key, value, ttlMs = DEFAULT_TTL_MS) {
  // If the cache is full, drop the oldest entry (Maps keep insertion order).
  if (store.size >= MAX_ENTRIES) {
    const oldestKey = store.keys().next().value;
    store.delete(oldestKey);
  }
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
}
