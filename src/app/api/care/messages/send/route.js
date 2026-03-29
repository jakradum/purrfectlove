import { createClient } from '@sanity/client'
import { verifyToken } from '@/lib/careAuth'
import { Resend } from 'resend'

const serverClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
})

const resend = new Resend(process.env.RESEND_API_KEY)

// In-memory rate limiting: { sitterId: [timestamps] }
const dailyMsgMap = new Map()
// In-memory per-pair limits: { "senderId:recipientId": [timestamps] }
const pairMsgMap = new Map()

function getDayMs() {
  return 24 * 60 * 60 * 1000
}

function getRecentTimestamps(map, key) {
  const now = Date.now()
  const day = getDayMs()
  const times = (map.get(key) || []).filter(t => now - t < day)
  map.set(key, times)
  return times
}

function recordSend(sitterId, recipientId) {
  const now = Date.now()
  const dailyKey = sitterId
  const pairKey = `${sitterId}:${recipientId}`

  const daily = getRecentTimestamps(dailyMsgMap, dailyKey)
  dailyMsgMap.set(dailyKey, [...daily, now])

  const pair = getRecentTimestamps(pairMsgMap, pairKey)
  pairMsgMap.set(pairKey, [...pair, now])
}

async function getAuth(request) {
  const cookieHeader = request.headers.get('cookie') || ''
  const match = cookieHeader.match(/auth_token=([^;]+)/)
  const token = match ? decodeURIComponent(match[1]) : null
  if (!token) return null
  return verifyToken(token)
}

export async function POST(request) {
  try {
    const payload = await getAuth(request)
    if (!payload) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { recipientId, message } = body

    if (!recipientId || !message) {
      return Response.json({ error: 'recipientId and message are required' }, { status: 400 })
    }

    // Validate message length
    const words = message.trim().split(/\s+/).filter(Boolean)
    if (words.length > 200 || message.length > 3200) {
      return Response.json({ error: 'Message too long. Max 200 words or 3200 characters.' }, { status: 400 })
    }

    const sitterId = payload.sitterId

    // Check rate limits
    const dailyCount = getRecentTimestamps(dailyMsgMap, sitterId).length
    if (dailyCount >= 10) {
      return Response.json({ error: 'Daily message limit reached (10 messages/day).' }, { status: 429 })
    }

    const pairKey = `${sitterId}:${recipientId}`
    const pairCount = getRecentTimestamps(pairMsgMap, pairKey).length
    if (pairCount >= 3) {
      return Response.json({ error: 'You have reached the limit of 3 messages to this person today.' }, { status: 429 })
    }

    // Check if recipient has blocked sender
    const block = await serverClient.fetch(
      `*[_type == "blockedUser" && blocker._ref == $recipientId && blocked._ref == $sitterId][0]{ _id }`,
      { recipientId, sitterId }
    )
    if (block) {
      return Response.json({ error: 'Unable to send message.' }, { status: 403 })
    }

    // Also check if sender has blocked recipient (optional safety)
    const reverseBlock = await serverClient.fetch(
      `*[_type == "blockedUser" && blocker._ref == $sitterId && blocked._ref == $recipientId][0]{ _id }`,
      { sitterId, recipientId }
    )
    if (reverseBlock) {
      return Response.json({ error: 'You have blocked this user.' }, { status: 403 })
    }

    // Create message in Sanity
    const newMessage = await serverClient.create({
      _type: 'message',
      from: { _type: 'reference', _ref: sitterId },
      to: { _type: 'reference', _ref: recipientId },
      body: message,
      read: false,
      markedAsSpam: false,
      createdAt: new Date().toISOString(),
    })

    // Record rate limit
    recordSend(sitterId, recipientId)

    // If recipient has both contact methods hidden, send instant email notification
    const recipient = await serverClient.fetch(
      `*[_type == "catSitter" && _id == $id][0]{ email, hideEmail, hideWhatsApp, name }`,
      { id: recipientId }
    )

    const sender = await serverClient.fetch(
      `*[_type == "catSitter" && _id == $id][0]{ name }`,
      { id: sitterId }
    )

    if (recipient?.hideEmail && recipient?.hideWhatsApp && recipient?.email) {
      const senderName = sender?.name || payload.name || 'A member'
      await resend.emails.send({
        from: 'Purrfect Love <noreply@purrfectlove.org>',
        to: recipient.email,
        subject: `New message from ${senderName} on Catsitters`,
        html: buildNotificationEmail(senderName, recipient.name || 'there'),
      })
    }

    return Response.json({ success: true, messageId: newMessage._id })
  } catch (error) {
    console.error('messages/send error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function buildNotificationEmail(senderName, recipientName) {
  const hunterGreen = '#2C5F4F'
  const whiskerCream = '#F6F4F0'
  const tabbyBrown = '#C85C3F'

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f0;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f0;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
        <!-- Header -->
        <tr>
          <td style="background:${hunterGreen};border-radius:12px 12px 0 0;padding:28px 32px;text-align:center;">
            <p style="margin:0;font-family:Georgia,serif;font-size:22px;font-weight:700;color:${whiskerCream};letter-spacing:0.02em;">Purrfect Love</p>
            <p style="margin:6px 0 0;font-size:13px;color:rgba(246,244,240,0.75);">Catsitters Network</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="background:#fff;padding:32px;border-left:1px solid #e8e4dc;border-right:1px solid #e8e4dc;">
            <p style="margin:0 0 16px;font-size:17px;color:#1a1a1a;">Hi ${recipientName},</p>
            <p style="margin:0 0 24px;font-size:15px;color:#444;line-height:1.7;">
              <strong>${senderName}</strong> sent you a message on Catsitters.
            </p>
            <table cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
              <tr>
                <td style="background:${hunterGreen};border-radius:8px;padding:14px 28px;text-align:center;">
                  <a href="https://care.purrfectlove.org/inbox" style="color:${whiskerCream};text-decoration:none;font-size:15px;font-weight:700;font-family:Arial,sans-serif;">View Message</a>
                </td>
              </tr>
            </table>
            <p style="margin:0;font-size:13px;color:#888;line-height:1.6;">
              Messages on Catsitters are moderated. Please do not share sensitive personal information.
            </p>
          </td>
        </tr>
        <!-- Footer -->
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
