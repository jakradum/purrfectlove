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

    const db = createSupabaseDbClient()

    const [
      totalMembers,
      sitsCompleted,
      { count: pendingRequests },
      { count: activeBookings },
      { data: recentRequestRows },
      recentMembersRaw,
    ] = await Promise.all([
      serverClient.fetch(`count(*[_type == "catSitter" && memberVerified == true])`, {}),
      serverClient.fetch(`count(*[_type == "sitRecord"])`, {}),
      db.from('membership_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      db.from('bookings').select('id', { count: 'exact', head: true }).in('status', ['pending', 'confirmed']),
      db.from('membership_requests')
        .select('id, name, email, message, submitted_at, status')
        .eq('status', 'pending')
        .order('submitted_at', { ascending: false })
        .limit(5),
      serverClient.fetch(
        `*[_type == "catSitter" && memberVerified == true] | order(_createdAt desc) [0..4]{ _id, name, email, _createdAt }`,
        {}
      ),
    ])

    return Response.json({
      totalMembers:     totalMembers || 0,
      pendingRequests:  pendingRequests || 0,
      activeBookings:   activeBookings || 0,
      sitsCompleted:    sitsCompleted || 0,
      recentRequests:   recentRequestRows || [],
      recentMembers:    recentMembersRaw || [],
    })
  } catch (error) {
    console.error('admin/overview error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
