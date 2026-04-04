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

// Returns all pending/accepted bookings where the logged-in user is the parent (requester).
// Used by the marketplace to derive per-card booking button state.
export async function GET(request) {
  try {
    const payload = await getAuth(request)
    if (!payload) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const bookings = await serverClient.fetch(
      `*[_type == "bookingRequest" && parent._ref == $parentId && status in ["pending", "accepted"]]{
        _id, bookingRef, startDate, endDate, status,
        "sitterId": sitter._ref
      }`,
      { parentId: payload.sitterId }
    )

    return Response.json({ bookings: bookings || [] })
  } catch (error) {
    console.error('bookings/my GET error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
