import { createClient } from '@sanity/client'
import { verifyToken } from '@/lib/careAuth'
import { adjustScore } from '@/lib/memberScore'

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

export async function PATCH(request) {
  try {
    const payload = await getAuth(request)
    if (!payload) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify admin
    const admin = await serverClient.fetch(
      `*[_type == "catSitter" && _id == $id][0]{ isAdmin }`,
      { id: payload.sitterId }
    )

    if (!admin?.isAdmin) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { memberId, change, reason } = await request.json()

    if (!memberId || change == null || !reason) {
      return Response.json({ error: 'memberId, change, and reason are required' }, { status: 400 })
    }

    await adjustScore(memberId, change, `Admin adjustment: ${reason}`)

    return Response.json({ success: true })
  } catch (error) {
    console.error('admin/score error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
