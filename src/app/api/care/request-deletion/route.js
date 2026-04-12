import { createClient } from '@sanity/client'
import { getSupabaseUser } from '@/lib/supabaseServer'
import { rateLimit } from '@/lib/rateLimit'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
})

export async function POST(request) {
  try {
    const user = await getSupabaseUser(request)
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    // 3 deletion requests per day per user
    if (!rateLimit(`request-deletion:${user.sitterId}`, 3, 24 * 60 * 60 * 1000)) {
      return Response.json({ error: 'Too many requests.' }, { status: 429 })
    }

    const { reason } = await request.json()
    if (!reason || reason.trim().length < 20) {
      return Response.json({ error: 'Please provide a reason of at least 20 characters.' }, { status: 400 })
    }

    await sanity.patch(user.sitterId).set({
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
