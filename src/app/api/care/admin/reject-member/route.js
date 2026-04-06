import { createClient } from '@sanity/client'
import { Resend } from 'resend'
import { getSupabaseUser, createSupabaseDbClient } from '@/lib/supabaseServer'

const serverClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
})

const resend = new Resend(process.env.RESEND_API_KEY)

async function verifyToken(id, expiresAtMs, token) {
  const secret = process.env.APPROVAL_SECRET
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  )
  const data = encoder.encode(`${id}.${expiresAtMs}`)
  const sig = await crypto.subtle.sign('HMAC', key, data)
  const expected = Buffer.from(sig).toString('hex')
  return expected === token
}

// ── GET: email link click ──────────────────────────────────────────────────
export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const id    = searchParams.get('id')
  const token = searchParams.get('token')

  const html = (body) => new Response(
    `<!DOCTYPE html><html><head><meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1.0">
    <style>body{font-family:Georgia,serif;background:#FFF8F0;color:#2D2D2D;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;}
    .card{background:#fff;border-radius:16px;padding:40px 48px;box-shadow:0 4px 12px rgba(0,0,0,0.08);max-width:480px;text-align:center;}
    a{color:#2C5F4F;font-weight:600;}</style></head>
    <body><div class="card">${body}</div></body></html>`,
    { headers: { 'Content-Type': 'text/html' } }
  )

  if (!id || !token) return html('<p>Invalid link.</p>')

  try {
    const db = createSupabaseDbClient()
    const { data: req, error } = await db
      .from('membership_requests')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !req) return html('<p>Request not found.</p>')

    // Validate HMAC
    const expiresAtMs = new Date(req.token_expires_at).getTime()
    const valid = await verifyToken(id, expiresAtMs, token)
    if (!valid) return html('<p>Invalid or tampered link.</p>')

    // Check expiry
    if (Date.now() > expiresAtMs) return html('<p>This link has expired. Log in to the admin dashboard to action this request.</p>')

    // Check already actioned
    if (req.status !== 'pending') return html(`<p>Already actioned — this request has been <strong>${req.status}</strong>.</p><p><a href="https://care.purrfectlove.org">Back to portal →</a></p>`)

    // Mark rejected
    await db.from('membership_requests').update({ status: 'rejected' }).eq('id', id)

    // Send rejection email
    if (req.email) {
      const displayName = (req.name || 'there').split(' ')[0]
      await resend.emails.send({
        from: 'Purrfect Love <no-reply@purrfectlove.org>',
        replyTo: 'support@purrfectlove.org',
        to: [req.email],
        subject: 'Regarding your Purrfect Love Community application',
        html: buildRejectionHtml(displayName),
        text: `Hi ${displayName},\n\nThank you for your interest in the Purrfect Love Community. After reviewing your application, we're unable to approve it at this time.\n\nIf you'd like to reapply or have any questions, feel free to reach out at support@purrfectlove.org.\n\n– The Purrfect Love Team`,
      })
    }

    const displayName = req.name || 'Applicant'
    return html(`<p style="font-size:20px;margin:0 0 12px;">Done</p><p>Request from <strong>${displayName}</strong> has been rejected and the applicant notified.</p><p style="margin-top:24px;"><a href="https://care.purrfectlove.org">Back to portal →</a></p>`)
  } catch (err) {
    console.error('reject-member GET error:', err)
    return html('<p>Something went wrong. Please try again or use the admin dashboard.</p>')
  }
}

// ── POST: admin dashboard ──────────────────────────────────────────────────
export async function POST(request) {
  try {
    const user = await getSupabaseUser(request)
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = await serverClient.fetch(
      `*[_type == "catSitter" && _id == $id][0]{ siteAdmin }`,
      { id: user.sitterId }
    )
    if (!admin?.siteAdmin) return Response.json({ error: 'Forbidden' }, { status: 403 })

    const { requestId } = await request.json()
    if (!requestId) return Response.json({ error: 'requestId is required' }, { status: 400 })

    const db = createSupabaseDbClient()

    const { data: req, error: fetchError } = await db
      .from('membership_requests')
      .select('*')
      .eq('id', requestId)
      .single()

    if (fetchError || !req) return Response.json({ error: 'Request not found' }, { status: 404 })
    if (req.status === 'rejected') return Response.json({ error: 'Already rejected' }, { status: 409 })

    await db.from('membership_requests').update({ status: 'rejected' }).eq('id', requestId)

    if (req.email) {
      const displayName = (req.name || 'there').split(' ')[0]
      await resend.emails.send({
        from: 'Purrfect Love <no-reply@purrfectlove.org>',
        replyTo: 'support@purrfectlove.org',
        to: [req.email],
        subject: 'Regarding your Purrfect Love Community application',
        html: buildRejectionHtml(displayName),
        text: `Hi ${displayName},\n\nThank you for your interest in the Purrfect Love Community. After reviewing your application, we're unable to approve it at this time.\n\nIf you'd like to reapply or have any questions, feel free to reach out at support@purrfectlove.org.\n\n– The Purrfect Love Team`,
      })
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error('reject-member error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function buildRejectionHtml(displayName) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:Georgia,'Times New Roman',serif;background-color:#FFF8F0;color:#2D2D2D;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#FFF8F0;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:#2C5F4F;padding:28px 32px;text-align:center;">
            <h1 style="margin:0;font-family:'Trebuchet MS',sans-serif;font-size:24px;color:#F6F4F0;font-weight:700;">Purrfect Love</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:40px 32px;">
            <p style="font-size:16px;line-height:1.7;color:#4A4A4A;margin:0 0 16px;">Hi ${displayName},</p>
            <p style="font-size:15px;line-height:1.7;color:#4A4A4A;margin:0 0 16px;">
              Thank you for your interest in joining the Purrfect Love Community. We've reviewed your application and unfortunately we're not able to approve it at this time.
            </p>
            <p style="font-size:15px;line-height:1.7;color:#4A4A4A;margin:0 0 16px;">
              We'd encourage you to reapply in the future — circumstances change, and we'd love to have you in the community when the time is right.
            </p>
            <p style="font-size:15px;line-height:1.7;color:#4A4A4A;margin:0;">
              If you have any questions, feel free to reach out at <a href="mailto:support@purrfectlove.org" style="color:#C85C3F;">support@purrfectlove.org</a>.
            </p>
            <p style="font-size:15px;line-height:1.7;color:#4A4A4A;margin:24px 0 0;">– The Purrfect Love Team</p>
          </td>
        </tr>
        <tr>
          <td style="background:#F5F0E8;padding:20px 32px;text-align:center;border-top:1px solid #E8E4DC;">
            <p style="margin:0;font-size:13px;color:#6B6B6B;font-weight:600;">Purrfect Love · Cat Adoption &amp; Rescue</p>
            <p style="margin:4px 0 0;font-size:12px;color:#999;">
              <a href="https://purrfectlove.org" style="color:#C85C3F;text-decoration:none;">purrfectlove.org</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}
