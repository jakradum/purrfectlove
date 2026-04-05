import { createClient } from '@sanity/client'
import { getSupabaseUser } from '@/lib/supabaseServer'

const serverClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
})

export async function GET(request) {
  try {
    const user = await getSupabaseUser(request)
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sitter = await serverClient.fetch(
      `*[_type == "catSitter" && _id == $id][0]{ siteAdmin }`,
      { id: user.sitterId }
    )

    if (!sitter?.siteAdmin) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayIso = todayStart.toISOString()

    const [todayMessages, todayBlocks, spamReports, activeMembers, lowScoreMembers, allMembers] =
      await Promise.all([
        serverClient.fetch(
          `count(*[_type == "message" && createdAt >= $since])`,
          { since: todayIso }
        ),
        serverClient.fetch(
          `count(*[_type == "blockedUser" && createdAt >= $since])`,
          { since: todayIso }
        ),
        serverClient.fetch(
          `count(*[_type == "message" && markedAsSpam == true])`,
          {}
        ),
        serverClient.fetch(
          `count(*[_type == "catSitter" && memberVerified == true && (canSit == true || needsSitting == true)])`,
          {}
        ),
        serverClient.fetch(
          `*[_type == "catSitter" && memberVerified == true && memberScore < 50]{
            _id, name, email, memberScore
          } | order(memberScore asc)`,
          {}
        ),
        serverClient.fetch(
          `*[_type == "catSitter" && memberVerified == true]{
            _id, name, email, phone, memberScore, siteAdmin, canSit, needsSitting
          } | order(name asc)`,
          {}
        ),
      ])

    return Response.json({
      today: {
        messages: todayMessages,
        blocks: todayBlocks,
      },
      spamReports,
      activeMembers,
      lowScoreMembers,
      allMembers,
    })
  } catch (error) {
    console.error('admin/stats error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
