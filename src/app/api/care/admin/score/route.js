import { createClient } from '@sanity/client'
import { getSupabaseUser } from '@/lib/supabaseServer'
import { adjustScore } from '@/lib/memberScore'
import { writeAuditLog } from '@/lib/auditLog'

const serverClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
})

export async function PATCH(request) {
  try {
    const user = await getSupabaseUser(request)
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = await serverClient.fetch(
      `*[_type == "catSitter" && _id == $id][0]{ siteAdmin }`,
      { id: user.sitterId }
    )

    if (!admin?.siteAdmin) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { memberId, change, reason } = await request.json()

    if (!memberId || change == null || !reason) {
      return Response.json({ error: 'memberId, change, and reason are required' }, { status: 400 })
    }

    await adjustScore(memberId, change, `Admin adjustment: ${reason}`)

    writeAuditLog({
      action: 'score_adjusted',
      actorId: user.sitterId,
      targetId: memberId,
      details: { change, reason },
    }).catch(() => {})

    return Response.json({ success: true })
  } catch (error) {
    console.error('admin/score error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
