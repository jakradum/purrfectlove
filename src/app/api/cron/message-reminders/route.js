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

const hunterGreen = '#2C5F4F'
const tabbyBrown = '#C85C3F'
const whiskerCream = '#F6F4F0'

export async function GET(request) {
  const secret = request.headers.get('x-cron-secret') || request.headers.get('authorization')
  const expected = process.env.CRON_SECRET

  if (!expected || secret !== expected) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const now = new Date()
    const msIn48h = 48 * 60 * 60 * 1000
    const msIn49h = 49 * 60 * 60 * 1000

    const windowStart = new Date(now.getTime() - msIn49h).toISOString()
    const windowEnd = new Date(now.getTime() - msIn48h).toISOString()

    // Find unread messages that are 48-49 hours old
    const unreadMessages = await serverClient.fetch(
      `*[_type == "message" && read != true && createdAt >= $start && createdAt <= $end]{
        _id, body, createdAt,
        from -> { _id, name },
        to -> { _id, name, email }
      }`,
      { start: windowStart, end: windowEnd }
    )

    if (unreadMessages.length === 0) {
      return Response.json({ success: true, reminded: 0 })
    }

    // Group by recipient
    const byRecipient = new Map()
    for (const msg of unreadMessages) {
      if (!msg.to?.email) continue
      const recipientId = msg.to._id
      if (!byRecipient.has(recipientId)) {
        byRecipient.set(recipientId, {
          name: msg.to.name || 'there',
          email: msg.to.email,
          messages: [],
        })
      }
      byRecipient.get(recipientId).messages.push(msg)
    }

    let reminded = 0
    for (const [, recipient] of byRecipient) {
      const count = recipient.messages.length
      const subject = `Reminder: ${count} unread message${count !== 1 ? 's' : ''} on Catsitters`
      const previewMessages = recipient.messages.slice(0, 5)

      const html = buildReminderEmail(recipient.name, count, previewMessages)

      await resend.emails.send({
        from: 'Purrfect Love <noreply@purrfectlove.org>',
        to: recipient.email,
        subject,
        html,
      })

      reminded++
    }

    return Response.json({ success: true, reminded })
  } catch (error) {
    console.error('cron/message-reminders error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function buildReminderEmail(recipientName, count, messages) {
  const previewList = messages.map(msg => {
    const senderName = msg.from?.name || 'A member'
    const preview = (msg.body || '').slice(0, 80).replace(/</g, '&lt;').replace(/>/g, '&gt;')
    return `<div style="border-left:3px solid ${hunterGreen};padding:8px 12px;margin-bottom:8px;background:#f8f8f6;border-radius:0 6px 6px 0;">
      <strong style="color:${hunterGreen};font-size:13px;">${senderName}</strong>
      <p style="margin:4px 0 0;font-size:13px;color:#555;">${preview}${msg.body?.length > 80 ? '…' : ''}</p>
    </div>`
  }).join('')

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f0;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f0;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
        <tr>
          <td style="background:${hunterGreen};border-radius:12px 12px 0 0;padding:28px 32px;text-align:center;">
            <p style="margin:0;font-family:Georgia,serif;font-size:22px;font-weight:700;color:${whiskerCream};">Purrfect Love</p>
            <p style="margin:6px 0 0;font-size:13px;color:rgba(246,244,240,0.75);">Catsitters Network</p>
          </td>
        </tr>
        <tr>
          <td style="background:#fff;padding:32px;border-left:1px solid #e8e4dc;border-right:1px solid #e8e4dc;">
            <p style="margin:0 0 8px;font-size:17px;color:#1a1a1a;">Hi ${recipientName},</p>
            <p style="margin:0 0 20px;font-size:15px;color:#444;line-height:1.7;">
              You have <strong>${count} unread message${count !== 1 ? 's' : ''}</strong> waiting on Catsitters.
            </p>
            ${previewList}
            <table cellpadding="0" cellspacing="0" style="margin:24px auto 0;">
              <tr>
                <td style="background:${hunterGreen};border-radius:8px;padding:14px 28px;text-align:center;">
                  <a href="https://care.purrfectlove.org/inbox" style="color:${whiskerCream};text-decoration:none;font-size:15px;font-weight:700;font-family:Arial,sans-serif;">View Inbox</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="background:${whiskerCream};border-radius:0 0 12px 12px;padding:18px 32px;text-align:center;border:1px solid #e8e4dc;border-top:none;">
            <p style="margin:0;font-size:12px;color:#888;">
              Purrfect Love · <a href="https://purrfectlove.org" style="color:${tabbyBrown};text-decoration:none;">purrfectlove.org</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}
