import { createClient } from '@sanity/client'
import { Resend } from 'resend'
import { verifyToken } from '@/lib/careAuth'

const serverClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
})

const resend = new Resend(process.env.RESEND_API_KEY)

async function getAdminPayload(request) {
  // Accept shared secret from Studio (NEXT_PUBLIC_ADMIN_API_SECRET)
  const secret = request.headers.get('X-Admin-Secret')
  if (secret && process.env.ADMIN_API_SECRET && secret === process.env.ADMIN_API_SECRET) {
    // Find the siteAdmin catSitter to use as sender
    const admin = await serverClient.fetch(`*[_type == "catSitter" && siteAdmin == true][0]{ _id }`)
    if (admin?._id) return { sitterId: admin._id }
  }

  // Fall back to care portal auth cookie
  const cookieHeader = request.headers.get('cookie') || ''
  const match = cookieHeader.match(/auth_token=([^;]+)/)
  const token = match ? decodeURIComponent(match[1]) : null
  if (!token) return null
  const payload = await verifyToken(token)
  if (!payload) return null
  const sitter = await serverClient.fetch(
    `*[_type == "catSitter" && _id == $id][0]{ siteAdmin }`,
    { id: payload.sitterId }
  )
  return sitter?.siteAdmin ? payload : null
}

export async function POST(request) {
  try {
    const adminPayload = await getAdminPayload(request)
    if (!adminPayload) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { broadcastId } = await request.json()
    if (!broadcastId) {
      return Response.json({ error: 'broadcastId is required' }, { status: 400 })
    }

    // Fetch the broadcast document
    const broadcast = await serverClient.fetch(
      `*[_type == "broadcastMessage" && _id == $id][0]{ _id, subject, body, sentAt }`,
      { id: broadcastId }
    )

    if (!broadcast) {
      return Response.json({ error: 'Broadcast not found' }, { status: 404 })
    }

    // Fetch all eligible recipients: verified members who haven't opted out
    const members = await serverClient.fetch(
      `*[_type == "catSitter" && memberVerified == true && (newsletterOptOut != true)]{
        _id, email, name, username
      }`,
      {}
    )

    if (!members.length) {
      return Response.json({ sentCount: 0 })
    }

    const subject = broadcast.subject
    const bodyText = broadcast.body

    // Send in batches of 50 to avoid rate limits
    const BATCH = 50
    let sentCount = 0

    for (let i = 0; i < members.length; i += BATCH) {
      const batch = members.slice(i, i + BATCH)
      const results = await Promise.allSettled(
        batch.map(async (member) => {
          if (!member.email) return
          const displayName = member.username || member.name || 'there'
          await resend.emails.send({
            from: 'Purrfect Love Community <no-reply@purrfectlove.org>',
            replyTo: 'support@purrfectlove.org',
            to: [member.email],
            subject,
            html: buildHtml(displayName, subject, bodyText),
            text: `Hi ${displayName},\n\n${bodyText}\n\n– The Purrfect Love Team\n\nTo unsubscribe from community emails, log in and go to Profile > Email notifications.`,
          })
          sentCount++
        })
      )
      results.forEach((r, idx) => {
        if (r.status === 'rejected') {
          console.error(`broadcast: email batch[${i + idx}] failed:`, r.reason)
        }
      })
    }

    // Record sentCount on the document
    await serverClient.patch(broadcastId).set({ sentCount }).commit()

    return Response.json({ sentCount, memberCount: members.length })
  } catch (error) {
    console.error('admin/broadcast error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function buildHtml(displayName, subject, body) {
  const paragraphs = body
    .split(/\n{2,}/)
    .map((p) => `<p style="font-size:15px;line-height:1.7;color:#4A4A4A;margin:0 0 16px;">${p.replace(/\n/g, '<br>')}</p>`)
    .join('')

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
            ${paragraphs}
            <p style="font-size:15px;line-height:1.7;color:#4A4A4A;margin:16px 0 0;">– The Purrfect Love Team</p>
          </td>
        </tr>
        <tr>
          <td style="background:#F5F0E8;padding:20px 32px;text-align:center;border-top:1px solid #E8E4DC;">
            <p style="margin:0;font-size:13px;color:#6B6B6B;font-weight:600;">Purrfect Love · Cat Adoption &amp; Rescue</p>
            <p style="margin:4px 0 0;font-size:12px;color:#999;">
              <a href="https://purrfectlove.org" style="color:#C85C3F;text-decoration:none;">purrfectlove.org</a>
              &nbsp;·&nbsp;
              <a href="https://purrfectlove.org/profile" style="color:#999;text-decoration:none;">Unsubscribe</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}
