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

export async function POST(request) {
  try {
    const payload = await getAuth(request)
    if (!payload) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { reason } = await request.json()
    if (!reason || reason.trim().length < 20) {
      return Response.json({ error: 'Please provide a reason of at least 20 characters.' }, { status: 400 })
    }

    await sanity.patch(payload.sitterId).set({
      deletionRequested: true,
      deletionReason: reason.trim(),
      deletionRequestedAt: new Date().toISOString(),
    }).commit()

    return Response.json({ success: true })
  } catch (err) {
    console.error('request-deletion error:', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
