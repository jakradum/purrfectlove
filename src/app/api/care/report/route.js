import { createClient } from '@sanity/client'
import { verifyToken } from '@/lib/careAuth'
import { rateLimit } from '@/lib/rateLimit'

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

export async function POST(request) {
  try {
    const payload = await getAuth(request)
    if (!payload) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!rateLimit(`report:${payload.sitterId}`, 5, 60_000 * 60)) {
      return Response.json({ error: 'Too many reports. Please wait before submitting another.' }, { status: 429 })
    }

    const body = await request.json()
    const { reportedId, reason, note } = body

    const VALID_REASONS = ['inappropriate', 'spam', 'impersonation', 'other']

    if (!reportedId || !reason || !VALID_REASONS.includes(reason)) {
      return Response.json({ error: 'reportedId and a valid reason are required' }, { status: 400 })
    }

    if (reportedId === payload.sitterId) {
      return Response.json({ error: 'You cannot report yourself.' }, { status: 400 })
    }

    // Check reported user exists
    const reported = await sanity.fetch(
      `*[_type == "catSitter" && _id == $id][0]{ _id }`,
      { id: reportedId }
    )
    if (!reported) {
      return Response.json({ error: 'Member not found.' }, { status: 404 })
    }

    await sanity.create({
      _type: 'memberReport',
      reporter: { _type: 'reference', _ref: payload.sitterId },
      reported: { _type: 'reference', _ref: reportedId },
      reason,
      note: (note || '').trim().slice(0, 500),
      resolved: false,
      createdAt: new Date().toISOString(),
    })

    return Response.json({ success: true })
  } catch (error) {
    console.error('report POST error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
