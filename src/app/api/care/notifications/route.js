import { createClient } from '@sanity/client'
import { verifyToken } from '@/lib/careAuth'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
})

async function getAuth(request) {
  const cookieHeader = request.headers.get('cookie') || ''
  const match = cookieHeader.match(/auth_token=([^;]+)/)
  const token = match ? match[1] : null
  if (!token) return null
  return verifyToken(token)
}

export async function GET(request) {
  try {
    const payload = await getAuth(request)
    if (!payload) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const notifications = await sanity.fetch(
      `*[_type == "notification" && recipient._ref == $id] | order(createdAt desc) [0...50] {
        _id, type, linkPath, read, createdAt,
        "senderName": sender->username
      }`,
      { id: payload.sitterId }
    )

    const unreadCount = notifications.filter(n => !n.read).length

    return Response.json({ notifications: notifications || [], unreadCount })
  } catch (error) {
    console.error('notifications GET error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request) {
  try {
    const payload = await getAuth(request)
    if (!payload) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { notificationId } = body

    // Verify this notification belongs to the current user
    const notif = await sanity.fetch(
      `*[_type == "notification" && _id == $id && recipient._ref == $userId][0]{ _id }`,
      { id: notificationId, userId: payload.sitterId }
    )

    if (!notif) {
      return Response.json({ error: 'Not found' }, { status: 404 })
    }

    await sanity.patch(notificationId).set({ read: true }).commit()

    return Response.json({ success: true })
  } catch (error) {
    console.error('notifications PATCH error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
