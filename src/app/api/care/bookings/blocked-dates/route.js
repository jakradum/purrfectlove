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

function expandRange(startYMD, endYMD) {
  const dates = []
  const cur = new Date(startYMD + 'T00:00:00Z')
  const end = new Date(endYMD + 'T00:00:00Z')
  while (cur <= end) {
    const y = cur.getUTCFullYear()
    const m = String(cur.getUTCMonth() + 1).padStart(2, '0')
    const d = String(cur.getUTCDate()).padStart(2, '0')
    dates.push(`${y}-${m}-${d}`)
    cur.setUTCDate(cur.getUTCDate() + 1)
  }
  return dates
}

export async function GET(request) {
  try {
    const payload = await getAuth(request)
    if (!payload) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find accepted bookings where this member is the sitter
    const bookings = await serverClient.fetch(
      `*[_type == "bookingRequest" && status == "accepted" && sitter._ref == $sitterId]{ startDate, endDate }`,
      { sitterId: payload.sitterId }
    )

    const blocked = new Set()
    for (const b of bookings) {
      if (b.startDate && b.endDate) {
        for (const d of expandRange(b.startDate, b.endDate)) {
          blocked.add(d)
        }
      }
    }

    return Response.json({ blockedDates: [...blocked].sort() })
  } catch (error) {
    console.error('blocked-dates GET error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
