import { getSupabaseUser, createSupabaseDbClient } from '@/lib/supabaseServer'

function expandRange(startYMD, endYMD) {
  const dates = []
  const cur = new Date(startYMD + 'T00:00:00Z')
  const end = new Date(endYMD + 'T00:00:00Z')
  while (cur <= end) {
    const y = cur.getUTCFullYear()
    const m = String(cur.getUTCMonth() + 1).padStart(2, '0')
    const d = String(cur.getUTCDate()).padStart(2, '0')
    dates.push(`${y}-${m}-${d}`)
    cur.setUTCDate(cur.getUTCDate() + 1)
  }
  return dates
}

export async function GET(request) {
  try {
    const user = await getSupabaseUser(request)
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const db = createSupabaseDbClient()

    // Find confirmed bookings where this member is the sitter.
    // Fixed: was querying status == "accepted" but the correct value is "confirmed".
    const { data: bookings } = await db
      .from('bookings')
      .select('start_date, end_date')
      .eq('sitter_id', user.sitterId)
      .in('status', ['confirmed', 'accepted']) // include 'accepted' for migrated legacy rows

    const blocked = new Set()
    for (const b of (bookings || [])) {
      if (b.start_date && b.end_date) {
        for (const d of expandRange(b.start_date, b.end_date)) {
          blocked.add(d)
        }
      }
    }

    return Response.json({ blockedDates: [...blocked].sort() })
  } catch (error) {
    console.error('blocked-dates GET error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
