import { createClient } from '@sanity/client'
import { getSupabaseUser, createSupabaseDbClient } from '@/lib/supabaseServer'

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

    const url = new URL(request.url)
    const includeRejected = url.searchParams.get('includeRejected') === 'true'

    const db = createSupabaseDbClient()

    let query = db
      .from('membership_requests')
      .select('id, name, email, phone, message, submitted_at, status')
      .order('submitted_at', { ascending: false })

    if (!includeRejected) {
      query = query.neq('status', 'rejected')
    }

    const { data, error } = await query
    if (error) throw error

    return Response.json({ requests: data || [] })
  } catch (error) {
    console.error('admin/join-requests GET error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
