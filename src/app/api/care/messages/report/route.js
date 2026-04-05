import { createClient } from '@sanity/client'
import { getSupabaseUser } from '@/lib/supabaseServer'
import { adjustScore } from '@/lib/memberScore'

const serverClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
})

export async function POST(request) {
  try {
    const user = await getSupabaseUser(request)
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { messageId } = await request.json()

    if (!messageId) {
      return Response.json({ error: 'messageId is required' }, { status: 400 })
    }

    // Fetch the message to confirm it was sent TO the current user
    const message = await serverClient.fetch(
      `*[_type == "message" && _id == $id][0]{ _id, to { _ref }, from { _ref }, markedAsSpam }`,
      { id: messageId }
    )

    if (!message) {
      return Response.json({ error: 'Message not found' }, { status: 404 })
    }

    if (message.to._ref !== user.sitterId) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (message.markedAsSpam) {
      return Response.json({ success: true, alreadyReported: true })
    }

    // Mark as spam
    await serverClient.patch(messageId).set({ markedAsSpam: true }).commit()

    // Deduct -5 from sender's score
    await adjustScore(message.from._ref, -5, 'Message reported as spam')

    return Response.json({ success: true })
  } catch (error) {
    console.error('messages/report error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
