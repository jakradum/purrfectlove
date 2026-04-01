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
  const token = match ? decodeURIComponent(match[1]) : null
  if (!token) return null
  return verifyToken(token)
}

export async function POST(request) {
  try {
    const payload = await getAuth(request)
    if (!payload) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { sitRecordId, response, note } = await request.json()

    if (!sitRecordId || !response) {
      return Response.json({ error: 'sitRecordId and response are required' }, { status: 400 })
    }

    const validResponses = ['yes_great', 'yes_feedback', 'no']
    if (!validResponses.includes(response)) {
      return Response.json({ error: 'Invalid response value' }, { status: 400 })
    }

    // Fetch the sit record to verify the user is a participant
    const record = await sanity.fetch(
      `*[_type == "sitRecord" && _id == $id][0]{
        _id,
        "sitterId": sitter._ref,
        "parentId": parent._ref,
        sitterResponse, parentResponse
      }`,
      { id: sitRecordId }
    )

    if (!record) {
      return Response.json({ error: 'Sit record not found' }, { status: 404 })
    }

    const isSitter = record.sitterId === payload.sitterId
    const isParent = record.parentId === payload.sitterId

    if (!isSitter && !isParent) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const patch = {}
    if (isSitter) {
      patch.sitterResponse = response
      if (note) patch.sitterFeedbackNote = note.slice(0, 1000)
    } else {
      patch.parentResponse = response
      if (note) patch.parentFeedbackNote = note.slice(0, 1000)
    }

    await sanity.patch(sitRecordId).set(patch).commit()

    return Response.json({ success: true })
  } catch (error) {
    console.error('sit-confirm POST error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
