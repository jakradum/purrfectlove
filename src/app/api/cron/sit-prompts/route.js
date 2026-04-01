import { createClient } from '@sanity/client'
import { Resend } from 'resend'

const serverClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
})

const resend = new Resend(process.env.RESEND_API_KEY)

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://care.purrfectlove.org'

export async function GET(request) {
  const secret = request.headers.get('x-cron-secret') || request.headers.get('authorization')
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD

    // Find sit records that ended, haven't had a prompt sent, and both sitter+parent have email
    const records = await serverClient.fetch(
      `*[_type == "sitRecord" && endDate < $today && !defined(promptSentAt)]{
        _id, startDate, endDate,
        sitter -> { _id, email, username, name, notifEmailSitRequest },
        parent -> { _id, email, username, name, notifEmailSitRequest }
      }`,
      { today }
    )

    if (records.length === 0) {
      return Response.json({ success: true, prompted: 0 })
    }

    let prompted = 0

    for (const record of records) {
      const { sitter, parent } = record
      if (!sitter || !parent) continue

      const confirmUrl = `${BASE_URL}/confirm-sit/${record._id}`

      const sends = []

      if (sitter.email && sitter.notifEmailSitRequest !== false) {
        sends.push(
          resend.emails.send({
            from: 'Purrfect Love <no-reply@purrfectlove.org>',
            replyTo: 'support@purrfectlove.org',
            to: [sitter.email],
            subject: `How did the sit go? Quick confirmation needed`,
            html: buildPromptEmail(sitter.username || sitter.name || 'there', parent.username || parent.name || 'your cat parent', record.startDate, record.endDate, confirmUrl, 'sitter'),
            text: `Hi ${sitter.username || 'there'},\n\nYour sit with ${parent.username || 'a cat parent'} (${record.startDate} – ${record.endDate}) has ended. Did the sit happen?\n\nPlease confirm: ${confirmUrl}\n\n– The Purrfect Love Team`,
          })
        )
      }

      if (parent.email && parent.notifEmailSitRequest !== false) {
        sends.push(
          resend.emails.send({
            from: 'Purrfect Love <no-reply@purrfectlove.org>',
            replyTo: 'support@purrfectlove.org',
            to: [parent.email],
            subject: `How did the sit go? Quick confirmation needed`,
            html: buildPromptEmail(parent.username || parent.name || 'there', sitter.username || sitter.name || 'your sitter', record.startDate, record.endDate, confirmUrl, 'parent'),
            text: `Hi ${parent.username || 'there'},\n\nThe sit with ${sitter.username || 'your sitter'} (${record.startDate} – ${record.endDate}) has ended. Did the sit happen?\n\nPlease confirm: ${confirmUrl}\n\n– The Purrfect Love Team`,
          })
        )
      }

      // Also create in-app notifications
      const notifBase = { _type: 'notification', read: false, type: 'sit_confirm', linkPath: `/confirm-sit/${record._id}`, createdAt: new Date().toISOString() }
      sends.push(
        serverClient.create({ ...notifBase, recipient: { _type: 'reference', _ref: sitter._id } }),
        serverClient.create({ ...notifBase, recipient: { _type: 'reference', _ref: parent._id } })
      )

      await Promise.allSettled(sends)
      await serverClient.patch(record._id).set({ promptSentAt: new Date().toISOString() }).commit()
      prompted++
    }

    return Response.json({ success: true, prompted })
  } catch (error) {
    console.error('cron/sit-prompts error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function buildPromptEmail(recipientName, otherName, startDate, endDate, confirmUrl, role) {
  const roleNote = role === 'sitter'
    ? `You were listed as the sitter for <strong>${otherName}</strong>'s cats.`
    : `<strong>${otherName}</strong> was listed as the sitter for your cats.`

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:Georgia,'Times New Roman',serif;background-color:#FFF8F0;color:#2D2D2D;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FFF8F0;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:#2C5F4F;padding:28px 32px;text-align:center;">
            <h1 style="margin:0;font-family:'Trebuchet MS',sans-serif;font-size:24px;color:#F6F4F0;font-weight:700;">Purrfect Love</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:40px 32px;">
            <p style="font-size:16px;line-height:1.7;color:#4A4A4A;margin:0 0 16px;">Hi ${recipientName},</p>
            <p style="font-size:15px;line-height:1.7;color:#4A4A4A;margin:0 0 16px;">
              Your scheduled sit (${startDate} – ${endDate}) has ended. ${roleNote}
            </p>
            <p style="font-size:15px;line-height:1.7;color:#4A4A4A;margin:0 0 24px;">
              Could you take a moment to confirm whether the sit happened? It helps us keep the community healthy and gives both of you a chance to leave feedback.
            </p>
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:#2C5F4F;border-radius:8px;padding:14px 28px;">
                  <a href="${confirmUrl}" style="color:#F6F4F0;text-decoration:none;font-size:15px;font-weight:700;font-family:Arial,sans-serif;">Confirm sit</a>
                </td>
              </tr>
            </table>
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
