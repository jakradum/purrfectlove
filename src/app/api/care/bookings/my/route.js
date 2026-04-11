import { createClient } from '@sanity/client'
import { getSupabaseUser, createSupabaseDbClient } from '@/lib/supabaseServer'

const serverClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
})

// Returns bookings as both parent (requester) and sitter.
// Response shape is kept identical to the Sanity version for frontend compatibility.
export async function GET(request) {
  try {
    const user = await getSupabaseUser(request)
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = user.sitterId
    const db = createSupabaseDbClient()

    const [{ data: asParentRows }, { data: asSitterRows }] = await Promise.all([
      db.from('bookings')
        .select('id, booking_ref, start_date, end_date, status, cats, sitter_id, parent_id')
        .eq('parent_id', userId)
        .is('deleted_at', null)
        .order('start_date', { ascending: true }),
      db.from('bookings')
        .select('id, booking_ref, start_date, end_date, status, cats, sitter_id, parent_id')
        .eq('sitter_id', userId)
        .is('deleted_at', null)
        .order('start_date', { ascending: true }),
    ])

    // Collect all unique counterpart IDs for name lookup
    const sitterIds = [...new Set((asParentRows || []).map(b => b.sitter_id))]
    const parentIds = [...new Set((asSitterRows || []).map(b => b.parent_id))]
    const allIds = [...new Set([...sitterIds, ...parentIds])]

    let nameMap = {}
    if (allIds.length > 0) {
      const profiles = await serverClient.fetch(
        `*[_type == "catSitter" && _id in $ids]{ _id, name }`,
        { ids: allIds }
      )
      for (const p of profiles) nameMap[p._id] = p.name || 'Member'
    }

    const toBooking = (row, role) => ({
      _id:        row.id,
      bookingRef: row.booking_ref,
      startDate:  row.start_date,
      endDate:    row.end_date,
      status:     row.status,
      cats:       row.cats || [],
      sitterId:   row.sitter_id,
      sitterName: nameMap[row.sitter_id] || 'Member',
      parentName: nameMap[row.parent_id] || 'Member',
    })

    const asParent = (asParentRows || []).map(r => toBooking(r, 'parent'))
    const asSitter = (asSitterRows || []).map(r => toBooking(r, 'sitter'))

    return Response.json({
      // 'bookings' kept for backward-compat with marketplace polling (pending + active only)
      bookings: asParent.filter(b => ['pending', 'accepted', 'confirmed'].includes(b.status)),
      asParent,
      asSitter,
    })
  } catch (error) {
    console.error('bookings/my GET error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
