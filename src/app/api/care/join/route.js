import { Resend } from 'resend'
import { createSupabaseDbClient } from '@/lib/supabaseServer'
import { rateLimit, shouldRateLimit } from '@/lib/rateLimit'

const resend = new Resend(process.env.RESEND_API_KEY)

async function generateToken(id, expiresAtMs) {
  const secret = process.env.APPROVAL_SECRET
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  )
  const data = encoder.encode(`${id}.${expiresAtMs}`)
  const sig = await crypto.subtle.sign('HMAC', key, data)
  return Buffer.from(sig).toString('hex')
}

export async function POST(request) {
  try {
    // IP-based rate limit: 3 join requests per hour per IP (only when ≥25 real members)
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    if (await shouldRateLimit() && !rateLimit(`join:${ip}`, 3, 60 * 60 * 1000)) {
      return Response.json({ error: 'Too many requests. Please wait before trying again.' }, { status: 429 })
    }

    const { name, phone, email, message, turnstileToken } = await request.json()

    if (!name?.trim()) {
      return Response.json({ error: 'Name is required' }, { status: 400 })
    }
    if (!phone?.trim() && !email?.trim()) {
      return Response.json({ error: 'Please provide at least a phone number or email' }, { status: 400 })
    }

    // Verify Turnstile token
    const turnstileRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret: process.env.TURNSTILE_SECRET_KEY,
        response: turnstileToken,
      }),
    })
    const turnstileData = await turnstileRes.json()
    if (!turnstileData.success) {
      return Response.json({ error: 'Please complete the human verification.' }, { status: 400 })
    }

    const db = createSupabaseDbClient()

    // Insert and return id
    const { data: row, error } = await db
      .from('membership_requests')
      .insert({
        name:         name.trim(),
        phone:        phone?.trim() || null,
        email:        email?.trim().toLowerCase() || null,
        message:      message?.trim() || null,
        submitted_at: new Date().toISOString(),
        status:       'pending',
      })
      .select('id')
      .single()

    if (error) throw error

    // Generate HMAC token (48h expiry)
    const expiresAtMs = Date.now() + 48 * 60 * 60 * 1000
    const token = await generateToken(row.id, expiresAtMs)
    const expiresAt = new Date(expiresAtMs).toISOString()

    await db
      .from('membership_requests')
      .update({ approval_token: token, token_expires_at: expiresAt })
      .eq('id', row.id)

    // Notify support inbox
    const base = 'https://care.purrfectlove.org/api/care/admin'
    const approveUrl = `${base}/approve-member?id=${row.id}&token=${token}`
    const rejectUrl  = `${base}/reject-member?id=${row.id}&token=${token}`
    const submittedAt = new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })

    await resend.emails.send({
      from: 'Purrfect Love <no-reply@purrfectlove.org>',
      to: ['support@purrfectlove.org'],
      bcc: ['pranavkarnad@gmail.com'],
      subject: `Community portal: Member approval needed — ${name.trim()}`,
      html: buildAdminNotificationHtml({ name: name.trim(), email: email?.trim() || null, message: message?.trim() || null, submittedAt, approveUrl, rejectUrl }),
      text: buildAdminNotificationText({ name: name.trim(), email: email?.trim() || null, message: message?.trim() || null, submittedAt, approveUrl, rejectUrl }),
    })

    return Response.json({ success: true })
  } catch (error) {
    console.error('join error:', error)
    return Response.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}

function buildAdminNotificationHtml({ name, email, message, submittedAt, approveUrl, rejectUrl }) {
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
            <p style="font-size:16px;line-height:1.7;color:#4A4A4A;margin:0 0 20px;">New join request received:</p>
            <table cellpadding="0" cellspacing="0" style="width:100%;margin:0 0 24px;border:0.5px solid #eee;border-radius:10px;overflow:hidden;">
              <tr style="background:#f9f9f7;">
                <td style="padding:10px 16px;font-size:11px;font-weight:600;color:#aaa;text-transform:uppercase;letter-spacing:0.06em;width:110px;">Name</td>
                <td style="padding:10px 16px;font-size:14px;color:#2C2C2A;">${name}</td>
              </tr>
              <tr>
                <td style="padding:10px 16px;font-size:11px;font-weight:600;color:#aaa;text-transform:uppercase;letter-spacing:0.06em;border-top:0.5px solid #eee;">Email</td>
                <td style="padding:10px 16px;font-size:14px;color:#2C2C2A;border-top:0.5px solid #eee;">${email || '—'}</td>
              </tr>
              <tr style="background:#f9f9f7;">
                <td style="padding:10px 16px;font-size:11px;font-weight:600;color:#aaa;text-transform:uppercase;letter-spacing:0.06em;border-top:0.5px solid #eee;">Message</td>
                <td style="padding:10px 16px;font-size:14px;color:#2C2C2A;border-top:0.5px solid #eee;">${message || '—'}</td>
              </tr>
              <tr>
                <td style="padding:10px 16px;font-size:11px;font-weight:600;color:#aaa;text-transform:uppercase;letter-spacing:0.06em;border-top:0.5px solid #eee;">Submitted</td>
                <td style="padding:10px 16px;font-size:14px;color:#2C2C2A;border-top:0.5px solid #eee;">${submittedAt}</td>
              </tr>
            </table>
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:#2C5F4F;border-radius:8px;padding:12px 24px;margin-right:12px;">
                  <a href="${approveUrl}" style="color:#F6F4F0;text-decoration:none;font-size:15px;font-weight:700;font-family:'Trebuchet MS',sans-serif;">✓ Approve</a>
                </td>
                <td style="width:12px;"></td>
                <td style="background:#FAECE7;border-radius:8px;padding:12px 24px;border:0.5px solid #C85C3F;">
                  <a href="${rejectUrl}" style="color:#C85C3F;text-decoration:none;font-size:15px;font-weight:700;font-family:'Trebuchet MS',sans-serif;">✗ Reject</a>
                </td>
              </tr>
            </table>
            <p style="font-size:12px;color:#aaa;margin:20px 0 0;">These links expire in 48 hours.</p>
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

function buildAdminNotificationText({ name, email, message, submittedAt, approveUrl, rejectUrl }) {
  return `New join request received:

Name:      ${name}
Email:     ${email || '—'}
Message:   ${message || '—'}
Submitted: ${submittedAt}

Approve: ${approveUrl}
Reject:  ${rejectUrl}

These links expire in 48 hours.`
}
