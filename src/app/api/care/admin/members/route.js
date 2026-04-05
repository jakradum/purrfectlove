import { createClient } from '@sanity/client'
import { getSupabaseUser, createSupabaseAdminClient } from '@/lib/supabaseServer'

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
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = await serverClient.fetch(
      `*[_type == "catSitter" && _id == $id][0]{ siteAdmin }`,
      { id: user.sitterId }
    )
    if (!admin?.siteAdmin) return Response.json({ error: 'Forbidden' }, { status: 403 })

    // Fetch all verified members from Sanity
    const members = await serverClient.fetch(
      `*[_type == "catSitter" && memberVerified == true]{ _id, name, email, siteAdmin } | order(name asc)`,
      {}
    )

    // Fetch all Supabase users to get last_sign_in_at — match by sitterId in metadata
    const supabaseAdmin = createSupabaseAdminClient()
    let supabaseUsers = []
    let page = 1
    while (true) {
      const { data } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 })
      if (!data?.users?.length) break
      supabaseUsers.push(...data.users)
      if (data.users.length < 1000) break
      page++
    }

    // Build sitterId → last_sign_in_at map
    const lastSignInMap = {}
    for (const u of supabaseUsers) {
      const sid = u.user_metadata?.sitterId
      if (sid) lastSignInMap[sid] = u.last_sign_in_at || null
    }

    const result = members.map(m => ({
      _id:           m._id,
      name:          m.name || '—',
      email:         m.email || null,
      siteAdmin:     m.siteAdmin || false,
      lastSignIn:    lastSignInMap[m._id] || null,
    }))

    return Response.json({ members: result })
  } catch (error) {
    console.error('admin/members GET error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
