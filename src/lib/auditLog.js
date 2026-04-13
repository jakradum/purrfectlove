import { createClient } from '@sanity/client'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
})

/**
 * Append a row to the admin audit log in Sanity. Non-fatal — errors are swallowed.
 *
 * @param {object} opts
 * @param {string}  opts.action      — e.g. 'member_approved', 'score_adjusted'
 * @param {string} [opts.actorId]    — sitterId of the admin who triggered the action
 * @param {string} [opts.actorEmail] — email of the admin (for email-link actions)
 * @param {string} [opts.targetId]   — Sanity _id of the affected document
 * @param {string} [opts.targetName] — human-readable label (name, email, broadcastId…)
 * @param {object} [opts.details]    — extra key/value pairs (serialised to JSON)
 */
export async function writeAuditLog({ action, actorId, actorEmail, targetId, targetName, details } = {}) {
  try {
    await sanity.create({
      _type: 'adminAuditLog',
      action: action || 'unknown',
      actorId: actorId || null,
      actorEmail: actorEmail || null,
      targetId: targetId || null,
      targetName: targetName || null,
      details: details ? JSON.stringify(details) : null,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    console.error('auditLog write error:', err)
  }
}
