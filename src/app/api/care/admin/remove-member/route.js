import { createClient } from '@sanity/client'
import { getSupabaseUser, createSupabaseAdminClient } from '@/lib/supabaseServer'

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
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = await serverClient.fetch(
      `*[_type == "catSitter" && _id == $id][0]{ siteAdmin }`,
      { id: user.sitterId }
    )
    if (!admin?.siteAdmin) return Response.json({ error: 'Forbidden' }, { status: 403 })

    const { memberId } = await request.json()
    if (!memberId) return Response.json({ error: 'memberId is required' }, { status: 400 })
    if (memberId === user.sitterId) return Response.json({ error: 'Cannot remove yourself' }, { status: 400 })

    // 1. Set memberVerified = false in Sanity
    await serverClient.patch(memberId).set({ memberVerified: false }).commit()

    // 2. Find and ban the Supabase user by sitterId metadata
    const supabaseAdmin = createSupabaseAdminClient()
    let page = 1
    let targetUid = null
    while (true) {
      const { data } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 })
      if (!data?.users?.length) break
      const found = data.users.find(u => u.user_metadata?.sitterId === memberId)
      if (found) { targetUid = found.id; break }
      if (data.users.length < 1000) break
      page++
    }

    if (targetUid) {
      await supabaseAdmin.auth.admin.updateUserById(targetUid, { ban_duration: '87600h' })
    }

    return Response.json({ success: true, supabaseUserFound: !!targetUid })
  } catch (error) {
    console.error('remove-member error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
