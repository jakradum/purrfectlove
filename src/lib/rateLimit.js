import { createSupabaseAdminClient } from './supabaseServer'

// Simple in-memory rate limiter. Resets on serverless cold start — good enough
// for mutation routes that are not high-frequency attack targets.
const store = new Map()

// Cache for shouldRateLimit — re-queried every 5 minutes
let _rlCache = { value: null, expiresAt: 0 }

/**
 * Returns true if rate limiting should be applied (≥25 real members).
 * Caches the result for 5 minutes so the threshold activates automatically.
 */
export async function shouldRateLimit() {
  const now = Date.now()
  if (_rlCache.value !== null && now < _rlCache.expiresAt) {
    return _rlCache.value
  }
  try {
    const supabaseAdmin = createSupabaseAdminClient()
    const { data } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
    const realMembers = (data?.users || []).filter(
      u => u.user_metadata?.isTeamMember !== true
    ).length
    const result = realMembers >= 25
    _rlCache = { value: result, expiresAt: now + 5 * 60 * 1000 }
    return result
  } catch {
    // On error, default to applying rate limits (safe fallback)
    return true
  }
}

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
