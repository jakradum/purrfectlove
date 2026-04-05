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

export async function POST(request, { params }) {
  try {
    const user = await getSupabaseUser(request)
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { memberId } = await params
    const sitterId = user.sitterId

    if (memberId === sitterId) {
      return Response.json({ error: 'Cannot block yourself' }, { status: 400 })
    }

    const body = await request.json().catch(() => ({}))
    const reason = body.reason || 'Other'

    // Check if already blocked
    const existing = await serverClient.fetch(
      `*[_type == "blockedUser" && blocker._ref == $blocker && blocked._ref == $blocked][0]{ _id }`,
      { blocker: sitterId, blocked: memberId }
    )

    if (existing) {
      return Response.json({ success: true, alreadyBlocked: true })
    }

    await serverClient.create({
      _type: 'blockedUser',
      blocker: { _type: 'reference', _ref: sitterId },
      blocked: { _type: 'reference', _ref: memberId },
      reason,
      createdAt: new Date().toISOString(),
    })

    // Deduct -10 from blocked user's score
    await adjustScore(memberId, -10, `Blocked by member (reason: ${reason})`)

    return Response.json({ success: true })
  } catch (error) {
    console.error('block/[memberId] error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
