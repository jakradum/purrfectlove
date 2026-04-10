import { createClient } from '@sanity/client'
import { createSupabaseDbClient } from '@/lib/supabaseServer'

const serverClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
})

async function verifyToken(id, expiresAtMs, token) {
  const secret = process.env.APPROVAL_SECRET
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  )
  const data = encoder.encode(`${id}.${expiresAtMs}`)
  const sig = await crypto.subtle.sign('HMAC', key, data)
  return Buffer.from(sig).toString('hex') === token
}

const html = (body) => new Response(
  `<!DOCTYPE html><html><head><meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <style>body{font-family:Georgia,serif;background:#FFF8F0;color:#2D2D2D;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;}
  .card{background:#fff;border-radius:16px;padding:40px 48px;box-shadow:0 4px 12px rgba(0,0,0,0.08);max-width:480px;text-align:center;}
  a{color:#2C5F4F;font-weight:600;}
  .btn{display:inline-block;background:#C85C3F;color:#fff;border:none;border-radius:8px;padding:12px 28px;font-size:15px;font-weight:700;font-family:'Trebuchet MS',sans-serif;cursor:pointer;margin-top:20px;}
  .tag{display:inline-block;background:#f2f2f0;color:#888;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;border-radius:999px;padding:3px 10px;margin-bottom:16px;}
  </style></head>
  <body><div class="card">${body}</div></body></html>`,
  { headers: { 'Content-Type': 'text/html' } }
)

// GET — show confirmation page only. No side effects (prevents email-client prefetch from firing)
export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const id    = searchParams.get('id')
  const token = searchParams.get('token')

  if (!id || !token) return html('<p>Invalid link.</p>')

  try {
    const db = createSupabaseDbClient()
    const { data: req, error } = await db
      .from('membership_requests')
      .select('id, name, email, status, token_expires_at')
      .eq('id', id)
      .single()

    if (error || !req) return html('<p>Request not found.</p>')

    const expiresAtMs = new Date(req.token_expires_at).getTime()
    const valid = await verifyToken(id, expiresAtMs, token)
    if (!valid) return html('<p>Invalid or tampered link.</p>')

    if (Date.now() > expiresAtMs) return html('<p>This link has expired.</p>')

    if (req.status !== 'pending') return html(`
      <span class="tag">Ticket closed</span>
      <p style="font-size:18px;margin:0 0 8px;"><strong>${req.name || 'Applicant'}</strong></p>
      <p style="color:#888;margin:0;">This application has already been <strong>${req.status === 'entry_denied' ? 'denied' : req.status}</strong>.</p>
      <p style="margin-top:24px;"><a href="https://care.purrfectlove.org">Back to portal →</a></p>
    `)

    const displayName = req.name || 'Applicant'
    return html(`
      <p style="font-size:18px;margin:0 0 8px;">Deny entry for <strong>${displayName}</strong>?</p>
      <p style="font-size:14px;color:#888;margin:0 0 4px;">${req.email || 'No email on file'}</p>
      <p style="font-size:13px;color:#aaa;margin:0 0 24px;">No email will be sent. The applicant will be silently declined and permanently blocked from inbox approval.</p>
      <form method="POST" action="/api/care/admin/reject-member">
        <input type="hidden" name="id" value="${id}" />
        <input type="hidden" name="token" value="${token}" />
        <button type="submit" class="btn">Confirm — deny entry</button>
      </form>
      <p style="margin-top:16px;"><a href="https://care.purrfectlove.org">Cancel →</a></p>
    `)
  } catch (err) {
    console.error('reject-member GET error:', err)
    return html('<p>Something went wrong. Please try again.</p>')
  }
}

// POST — actually performs the rejection
export async function POST(request) {
  try {
    const formData = await request.formData()
    const id    = formData.get('id')
    const token = formData.get('token')

    if (!id || !token) return html('<p>Invalid submission.</p>')

    const db = createSupabaseDbClient()
    const { data: req, error } = await db
      .from('membership_requests')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !req) return html('<p>Request not found.</p>')

    const expiresAtMs = new Date(req.token_expires_at).getTime()
    const valid = await verifyToken(id, expiresAtMs, token)
    if (!valid) return html('<p>Invalid or tampered link.</p>')

    if (Date.now() > expiresAtMs) return html('<p>This link has expired.</p>')

    // Atomic update — only succeeds if still pending (prevents double-fire)
    const { data: updated } = await db
      .from('membership_requests')
      .update({ status: 'entry_denied' })
      .eq('id', id)
      .eq('status', 'pending')
      .select('id')
      .single()

    if (!updated) {
      return html(`
        <span class="tag">Ticket closed</span>
        <p>This application was already actioned by another admin.</p>
        <p><a href="https://care.purrfectlove.org">Back to portal →</a></p>
      `)
    }

    // Create a minimal Sanity record with admitted: false to block inbox approval permanently
    if (req.email) {
      await serverClient.create({
        _type: 'catSitter',
        name: req.name || null,
        email: req.email,
        admitted: false,
        memberVerified: false,
        welcomeSent: false,
      })
    }

    const displayName = req.name || 'Applicant'
    return html(`
      <span class="tag">Ticket closed</span>
      <p style="font-size:18px;margin:0 0 12px;"><strong>${displayName}</strong></p>
      <p style="color:#888;margin:0;">Entry denied. No email sent. Inbox approval permanently blocked for this applicant.</p>
      <p style="margin-top:24px;"><a href="https://care.purrfectlove.org">Back to portal →</a></p>
    `)
  } catch (err) {
    console.error('reject-member POST error:', err)
    return html('<p>Something went wrong. Please try again.</p>')
  }
}
