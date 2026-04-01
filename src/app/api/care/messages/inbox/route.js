import { createClient } from '@sanity/client'
import { verifyToken } from '@/lib/careAuth'

const serverClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
})

async function getAuth(request) {
  const cookieHeader = request.headers.get('cookie') || ''
  const match = cookieHeader.match(/auth_token=([^;]+)/)
  const token = match ? decodeURIComponent(match[1]) : null
  if (!token) return null
  return verifyToken(token)
}

export async function GET(request) {
  try {
    const payload = await getAuth(request)
    if (!payload) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sitterId = payload.sitterId

    // Fetch all blocks involving this user (as blocker or blocked)
    const blocks = await serverClient.fetch(
      `*[_type == "blockedUser" && (blocker._ref == $id || blocked._ref == $id)]{
        blocker { _ref }, blocked { _ref }
      }`,
      { id: sitterId }
    )

    const blockedSet = new Set()
    for (const b of blocks) {
      const otherParty = b.blocker._ref === sitterId ? b.blocked._ref : b.blocker._ref
      blockedSet.add(otherParty)
    }

    // Fetch all messages where user is sender or recipient
    const messages = await serverClient.fetch(
      `*[_type == "message" && (from._ref == $id || to._ref == $id)] | order(createdAt desc) {
        _id, body, read, readAt, markedAsSpam, broadcast, createdAt,
        from -> { _id, name, username, siteAdmin },
        to -> { _id, name, username, siteAdmin }
      }`,
      { id: sitterId }
    )

    // Exclude messages with missing references or involving blocked users
    const filtered = messages.filter(msg => {
      if (!msg.from || !msg.to) return false
      const otherId = msg.from._id === sitterId ? msg.to._id : msg.from._id
      return !blockedSet.has(otherId)
    })

    // Group into threads by conversation partner
    const threadsMap = new Map()
    for (const msg of filtered) {
      const partnerId = msg.from._id === sitterId ? msg.to._id : msg.from._id
      const partner = msg.from._id === sitterId ? msg.to : msg.from
      const partnerName = partner.username || partner.name

      if (!threadsMap.has(partnerId)) {
        threadsMap.set(partnerId, {
          partnerId,
          partnerName: partnerName || 'Unknown',
          isAdminThread: !!partner.siteAdmin,
          isBroadcastThread: !!msg.broadcast,
          messages: [],
          unreadCount: 0,
          latestAt: null,
        })
      } else if (msg.broadcast) {
        threadsMap.get(partnerId).isBroadcastThread = true
      }

      const thread = threadsMap.get(partnerId)
      thread.messages.push(msg)

      // Count unread messages sent TO current user
      if (msg.to._id === sitterId && !msg.read) {
        thread.unreadCount++
      }

      // Track latest message time
      if (!thread.latestAt || msg.createdAt > thread.latestAt) {
        thread.latestAt = msg.createdAt
      }
    }

    // Sort messages within each thread chronologically (oldest first)
    for (const thread of threadsMap.values()) {
      thread.messages.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    }

    // Convert to array and sort threads by latest message (newest first)
    const threads = Array.from(threadsMap.values()).sort((a, b) =>
      (b.latestAt || '').localeCompare(a.latestAt || '')
    )

    return Response.json({ threads })
  } catch (error) {
    console.error('messages/inbox error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
