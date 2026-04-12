import { PostHog } from 'posthog-node'

/**
 * Fire a single server-side PostHog event and flush immediately.
 * Safe to call from any API route — fails silently if key is missing.
 *
 * @param {string} distinctId  The actor's sitterId (use 'system' for cron jobs)
 * @param {string} event       Event name
 * @param {object} [properties]
 */
export async function captureServerEvent(distinctId, event, properties = {}) {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
  if (!key || !distinctId) return
  try {
    const client = new PostHog(key, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com',
      flushAt: 1,
      flushInterval: 0,
    })
    client.capture({ distinctId, event, properties })
    await client.shutdown()
  } catch {
    // fail silently — analytics must never break the request
  }
}
