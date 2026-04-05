import { createClient } from '@sanity/client'
import { getSupabaseUser } from '@/lib/supabaseServer'

const serverClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
})

export async function PATCH(request, { params }) {
  try {
    const user = await getSupabaseUser(request)
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Verify this message is addressed to the current user
    const message = await serverClient.fetch(
      `*[_type == "message" && _id == $id][0]{ _id, to { _ref } }`,
      { id }
    )

    if (!message) {
      return Response.json({ error: 'Message not found' }, { status: 404 })
    }

    if (message.to._ref !== user.sitterId) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    await serverClient
      .patch(id)
      .set({ read: true, readAt: new Date().toISOString() })
      .commit()

    return Response.json({ success: true })
  } catch (error) {
    console.error('messages/read error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
