import { getSupabaseUser, createSupabaseDbClient } from '@/lib/supabaseServer'

// Lightweight endpoint for sidebar dot polling.
// Returns { count } — total active (pending/confirmed) bookings as parent or sitter.
export async function GET(request) {
  try {
    const user = await getSupabaseUser(request)
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = user.sitterId
    const db = createSupabaseDbClient()

    const [{ count: asParent }, { count: asSitter }] = await Promise.all([
      db.from('bookings')
        .select('id', { count: 'exact', head: true })
        .eq('parent_id', userId)
        .in('status', ['pending', 'confirmed', 'accepted']),
      db.from('bookings')
        .select('id', { count: 'exact', head: true })
        .eq('sitter_id', userId)
        .in('status', ['pending', 'confirmed', 'accepted']),
    ])

    return Response.json({ count: (asParent || 0) + (asSitter || 0) })
  } catch (error) {
    console.error('bookings/active-count GET error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
