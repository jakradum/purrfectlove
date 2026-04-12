import { createClient } from '@sanity/client'
import { getSupabaseUser } from '@/lib/supabaseServer'
import { adjustScore } from '@/lib/memberScore'
import { rateLimit } from '@/lib/rateLimit'

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

    // 5 block actions per hour per user
    if (!rateLimit(`block:${sitterId}`, 5, 60 * 60 * 1000)) {
      return Response.json({ error: 'Too many requests. Please wait before blocking again.' }, { status: 429 })
    }

    if (memberId === sitterId) {
      return Response.json({ error: 'Cannot block yourself' }, { status: 400 })
    }

    // Prevent blocking team members / admins
    const target = await serverClient.fetch(
      `*[_type == "catSitter" && _id == $id][0]{ siteAdmin }`,
      { id: memberId }
    )
    if (target?.siteAdmin === true) {
      return Response.json({ error: 'You cannot block a team member.' }, { status: 403 })
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
