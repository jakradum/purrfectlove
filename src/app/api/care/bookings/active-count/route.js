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

// Lightweight endpoint for sidebar dot polling.
// Returns { count } — total active (pending/accepted) bookings as parent or sitter.
export async function GET(request) {
  try {
    const payload = await getAuth(request)
    if (!payload) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = payload.sitterId

    const [asParent, asSitter] = await Promise.all([
      serverClient.fetch(
        `count(*[_type == "bookingRequest" && parent._ref == $userId && status in ["pending", "confirmed", "accepted"]])`,
        { userId }
      ),
      serverClient.fetch(
        `count(*[_type == "bookingRequest" && sitter._ref == $userId && status in ["pending", "confirmed", "accepted"]])`,
        { userId }
      ),
    ])

    return Response.json({ count: (asParent || 0) + (asSitter || 0) })
  } catch (error) {
    console.error('bookings/active-count GET error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
