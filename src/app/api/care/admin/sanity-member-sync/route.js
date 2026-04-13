import { createHmac, timingSafeEqual } from 'crypto'
import { createClient } from '@sanity/client'
import { createSupabaseAdminClient } from '@/lib/supabaseServer'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
})

// Verifies the sanity-webhook-signature header.
// Sanity format: "t=<timestamp>,v1=<hex_hmac>"
// HMAC = SHA256(secret, "<timestamp>.<rawBody>")
async function verifySignature(request, rawBody) {
  const secret = process.env.SANITY_WEBHOOK_SECRET
  if (!secret) return true // skip verification if secret not configured (dev only)

  const sigHeader = request.headers.get('sanity-webhook-signature') || ''
  const parts = Object.fromEntries(sigHeader.split(',').map(p => p.split('=')))
  const timestamp = parts.t
  const provided = parts.v1

  if (!timestamp || !provided) return false

  const expected = createHmac('sha256', secret)
    .update(`${timestamp}.${rawBody}`)
    .digest('hex')

  try {
    return timingSafeEqual(Buffer.from(provided, 'hex'), Buffer.from(expected, 'hex'))
  } catch {
    return false
  }
}

export async function POST(request) {
  const rawBody = await request.text()

  if (!(await verifySignature(request, rawBody))) {
    return Response.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let doc
  try {
    doc = JSON.parse(rawBody)
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Only act on catSitter documents that have an email set
  if (doc._type !== 'catSitter' || !doc.email || !doc._id) {
    return Response.json({ skipped: true })
  }

  const sitterId = doc._id
  const email = doc.email.trim().toLowerCase()

  const supabaseAdmin = createSupabaseAdminClient()

  // Check if a Supabase auth user already exists for this email
  const { data: existing } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
  const existingUser = existing?.users?.find(u => u.email === email)

  if (existingUser) {
    // User exists — update sitterId if it's pointing somewhere else
    if (existingUser.user_metadata?.sitterId === sitterId) {
      // Still ensure memberVerified is true in Sanity (idempotent)
      await sanity.patch(sitterId).set({ memberVerified: true }).commit().catch(() => {})
      return Response.json({ status: 'already_synced' })
    }
    await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
      user_metadata: { ...existingUser.user_metadata, sitterId },
    })
    await sanity.patch(sitterId).set({ memberVerified: true }).commit().catch(() => {})
    return Response.json({ status: 'updated', userId: existingUser.id })
  }

  // No user yet — create one. email_confirm: true so they can log in via OTP immediately.
  const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { sitterId },
  })

  if (error) {
    console.error('sanity-member-sync createUser error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }

  // Mark as verified in Sanity so the OTP gate in send-otp passes
  await sanity.patch(sitterId).set({ memberVerified: true }).commit().catch(() => {})

  return Response.json({ status: 'created', userId: created.user.id })
}
