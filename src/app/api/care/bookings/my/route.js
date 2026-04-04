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

const BOOKING_FIELDS = `
  _id, bookingRef, startDate, endDate, status, cats,
  "sitterId": sitter._ref,
  "sitterName": sitter->name,
  "parentName": parent->name
`

// Returns bookings as both parent (requester) and sitter.
// Marketplace polling reads asParent for per-card booking state.
export async function GET(request) {
  try {
    const payload = await getAuth(request)
    if (!payload) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = payload.sitterId

    const [asParent, asSitter] = await Promise.all([
      serverClient.fetch(
        `*[_type == "bookingRequest" && parent._ref == $userId] | order(startDate asc) { ${BOOKING_FIELDS} }`,
        { userId }
      ),
      serverClient.fetch(
        `*[_type == "bookingRequest" && sitter._ref == $userId] | order(startDate asc) { ${BOOKING_FIELDS} }`,
        { userId }
      ),
    ])

    return Response.json({
      // 'bookings' kept for backwards-compat with marketplace polling (pending + active only)
      bookings: (asParent || []).filter(b => ['pending', 'accepted', 'confirmed'].includes(b.status)),
      asParent: asParent || [],
      asSitter: asSitter || [],
    })
  } catch (error) {
    console.error('bookings/my GET error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
