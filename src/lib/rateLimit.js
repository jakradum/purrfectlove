// Simple in-memory rate limiter. Resets on serverless cold start — good enough
// for mutation routes that are not high-frequency attack targets.
const store = new Map()

/**
 * @param {string} key       e.g. `profile:${sitterId}` or `join:${ip}`
 * @param {number} limit     max requests allowed in the window
 * @param {number} windowMs  window size in milliseconds
 * @returns {boolean}        true = allowed, false = rate limited
 */
export function rateLimit(key, limit = 30, windowMs = 60_000) {
  const now = Date.now()
  const times = (store.get(key) || []).filter(t => now - t < windowMs)
  if (times.length >= limit) return false
  store.set(key, [...times, now])
  // Prune store periodically to avoid unbounded growth
  if (store.size > 2000) {
    for (const [k, ts] of store.entries()) {
      if (ts.every(t => now - t > windowMs)) store.delete(k)
    }
  }
  return true
}
