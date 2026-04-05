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

    const { data: bookings, error } = await db
      .from('bookings')
      .select('id, booking_ref, sitter_id, parent_id, start_date, end_date, status')
      .order('created_at', { ascending: false })
      .limit(200)

    if (error) throw error

    // Batch name lookup from Sanity
    const allIds = [...new Set(bookings.flatMap(b => [b.sitter_id, b.parent_id]))]
    let nameMap = {}
    if (allIds.length > 0) {
      const profiles = await serverClient.fetch(
        `*[_type == "catSitter" && _id in $ids]{ _id, name }`,
        { ids: allIds }
      )
      for (const p of profiles) nameMap[p._id] = p.name || 'Member'
    }

    const result = bookings.map(b => ({
      id:         b.id,
      bookingRef: b.booking_ref,
      sitterName: nameMap[b.sitter_id] || 'Member',
      parentName: nameMap[b.parent_id] || 'Member',
      startDate:  b.start_date,
      endDate:    b.end_date,
      status:     b.status,
    }))

    return Response.json({ bookings: result })
  } catch (error) {
    console.error('admin/bookings-list GET error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
