import { createClient } from '@sanity/client'
import { Resend } from 'resend'
import { createSupabaseAdminClient, createSupabaseDbClient } from '@/lib/supabaseServer'
import { computeCohort } from '@/lib/cohort'

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
  return Buffer.from(sig).toString('hex') === token
}

const html = (body) => new Response(
  `<!DOCTYPE html><html><head><meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <style>body{font-family:Georgia,serif;background:#FFF8F0;color:#2D2D2D;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;}
  .card{background:#fff;border-radius:16px;padding:40px 48px;box-shadow:0 4px 12px rgba(0,0,0,0.08);max-width:480px;text-align:center;}
  a{color:#2C5F4F;font-weight:600;}</style></head>
  <body><div class="card">${body}</div></body></html>`,
  { headers: { 'Content-Type': 'text/html' } }
)

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const id    = searchParams.get('id')
  const token = searchParams.get('token')

  if (!id || !token) return html('<p>Invalid link.</p>')

  try {
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

    if (Date.now() > expiresAtMs) return html('<p>This link has expired. Please action this request manually.</p>')

    if (req.status !== 'pending') return html(`
      <p style="font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#aaa;margin:0 0 12px;">Ticket closed</p>
      <p>This application has already been <strong>${req.status === 'entry_denied' ? 'denied' : req.status}</strong>.</p>
      <p><a href="https://care.purrfectlove.org">Back to portal →</a></p>
    `)

    // Block if applicant was previously denied (admitted: false in Sanity)
    if (req.email) {
      const denied = await serverClient.fetch(
        `*[_type == "catSitter" && email == $email && admitted == false][0]._id`,
        { email: req.email }
      )
      if (denied) return html(`
        <p style="font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#C85C3F;margin:0 0 12px;">Entry denied — blocked</p>
        <p>This applicant was previously denied. Inbox approval is permanently blocked.</p>
        <p style="font-size:13px;color:#aaa;">To override, update the <code>admitted</code> field in Sanity and approve manually via the codebase.</p>
        <p><a href="https://care.purrfectlove.org">Back to portal →</a></p>
      `)
    }

    // Atomic update — only succeeds if still pending (prevents double-fire from email prefetch)
    const { data: locked } = await db
      .from('membership_requests')
      .update({ status: 'approved' })
      .eq('id', id)
      .eq('status', 'pending')
      .select('id')
      .single()

    if (!locked) return html(`
      <p style="font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#aaa;margin:0 0 12px;">Ticket closed</p>
      <p>This application was already actioned by another admin.</p>
      <p><a href="https://care.purrfectlove.org">Back to portal →</a></p>
    `)

    // Create catSitter in Sanity
    const sitter = await serverClient.create({
      _type: 'catSitter',
      name: req.name || null,
      phone: req.phone || null,
      email: req.email || null,
      admitted: true,
      memberVerified: true,
      welcomeSent: false,
    })

    // Create Supabase auth user
    if (req.email) {
      const supabaseAdmin = createSupabaseAdminClient()
      const { data: userData } = await supabaseAdmin.auth.admin.createUser({
        email: req.email,
        email_confirm: true,
        user_metadata: { sitterId: sitter._id, isTeamMember: false },
      })
      if (userData?.user?.id) {
        const cohort = computeCohort(userData.user.id, false)
        await supabaseAdmin.auth.admin.updateUserById(userData.user.id, {
          user_metadata: { sitterId: sitter._id, isTeamMember: false, cohort },
        })
      }
    }

    // Send welcome email
    let emailSent = false
    if (req.email) {
      const displayName = (req.name || 'there').split(' ')[0]
      await resend.emails.send({
        from: 'Purrfect Love <no-reply@purrfectlove.org>',
        to: [req.email],
        subject: 'Welcome to the Purrfect Love Community',
        html: buildWelcomeHtml(displayName),
        text: `Hi ${displayName},\n\nWelcome to the Purrfect Love Community! Your application has been approved.\n\nLog in at https://care.purrfectlove.org/login\n\n– The Purrfect Love Team`,
      })
      emailSent = true
    }

    await serverClient.patch(sitter._id).set({ welcomeSent: emailSent }).commit()

    const displayName = req.name || 'Applicant'
    return html(`
      <p style="font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#2C5F4F;margin:0 0 12px;">Ticket closed · Approved</p>
      <p style="font-size:20px;margin:0 0 12px;">✓ Done</p>
      <p><strong>${displayName}</strong> has been approved and sent a welcome email.</p>
      <p style="margin-top:24px;"><a href="https://care.purrfectlove.org">Back to portal →</a></p>
    `)
  } catch (err) {
    console.error('approve-member GET error:', err)
    return html('<p>Something went wrong. Please try again.</p>')
  }
}

function buildWelcomeHtml(displayName) {
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
              Welcome to the <strong>Purrfect Love Community</strong>! Your application has been approved and your account is ready.
            </p>
            <p style="font-size:15px;line-height:1.7;color:#4A4A4A;margin:0 0 24px;">
              You can log in using your email at the link below.
            </p>
            <table cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
              <tr>
                <td style="background:#2C5F4F;border-radius:8px;padding:12px 24px;">
                  <a href="https://care.purrfectlove.org/login" style="color:#F6F4F0;text-decoration:none;font-size:15px;font-weight:700;font-family:'Trebuchet MS',sans-serif;">Log in to the Community →</a>
                </td>
              </tr>
            </table>
            <p style="font-size:15px;line-height:1.7;color:#4A4A4A;margin:0;">– The Purrfect Love Team</p>
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
