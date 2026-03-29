import { createClient } from '@sanity/client'
import { adjustScore } from '@/lib/memberScore'

const serverClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
})

export async function GET(request) {
  const secret = request.headers.get('x-cron-secret') || request.headers.get('authorization')
  const expected = process.env.CRON_SECRET

  if (!expected || secret !== expected) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const now = new Date()
    const msIn15Days = 15 * 24 * 60 * 60 * 1000
    const msIn1Day = 24 * 60 * 60 * 1000
    const cutoff15Days = new Date(now.getTime() - msIn15Days).toISOString()
    const cutoff1Day = new Date(now.getTime() - msIn1Day).toISOString()

    // === Rule 1: Unread messages older than 15 days (-5 per recipient) ===
    const oldUnread = await serverClient.fetch(
      `*[_type == "message" && read != true && createdAt < $cutoff]{
        to { _ref }
      }`,
      { cutoff: cutoff15Days }
    )

    // Group by recipient
    const staleByRecipient = new Map()
    for (const msg of oldUnread) {
      const id = msg.to._ref
      staleByRecipient.set(id, (staleByRecipient.get(id) || 0) + 1)
    }

    for (const [memberId] of staleByRecipient) {
      await adjustScore(memberId, -5, 'Has unread messages older than 15 days')
    }

    // === Rule 2: Sent more than 10 messages today (-2 per sender) ===
    const todayMessages = await serverClient.fetch(
      `*[_type == "message" && createdAt >= $since]{
        from { _ref }
      }`,
      { since: cutoff1Day }
    )

    const sendCountMap = new Map()
    for (const msg of todayMessages) {
      const id = msg.from._ref
      sendCountMap.set(id, (sendCountMap.get(id) || 0) + 1)
    }

    for (const [memberId, count] of sendCountMap) {
      if (count > 10) {
        await adjustScore(memberId, -2, `Sent ${count} messages in one day (over limit)`)
      }
    }

    // === Rule 3: Sent >5 messages to same person with 0 replies (-3 per sender) ===
    // Get all messages in last 30 days
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const recentMessages = await serverClient.fetch(
      `*[_type == "message" && createdAt >= $since]{
        from { _ref }, to { _ref }
      }`,
      { since: thirtyDaysAgo }
    )

    // Map: "senderId:recipientId" -> count sent
    const pairSentMap = new Map()
    for (const msg of recentMessages) {
      const key = `${msg.from._ref}:${msg.to._ref}`
      pairSentMap.set(key, (pairSentMap.get(key) || 0) + 1)
    }

    for (const [key, sentCount] of pairSentMap) {
      if (sentCount <= 5) continue
      const [senderId, recipientId] = key.split(':')
      // Check if recipient replied to sender at all
      const reverseKey = `${recipientId}:${senderId}`
      const repliesCount = pairSentMap.get(reverseKey) || 0
      if (repliesCount === 0) {
        await adjustScore(senderId, -3, `Sent ${sentCount} messages to same person with no replies`)
      }
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error('cron/calculate-scores error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
