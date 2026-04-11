import { createSupabaseDbClient } from '@/lib/supabaseServer'

// Runs hourly. Finds pending bookings where notified_at is 48+ hrs ago
// and the sitter has not responded — sets them to 'expired'.
export async function GET(request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
    const db = createSupabaseDbClient()

    const { data: expired } = await db
      .from('bookings')
      .select('id, booking_ref')
      .eq('status', 'pending')
      .not('notified_at', 'is', null)
      .lt('notified_at', cutoff)
      .is('deleted_at', null)

    if (!expired || expired.length === 0) {
      return Response.json({ expired: 0 })
    }

    await db
      .from('bookings')
      .update({ status: 'expired' })
      .in('id', expired.map(b => b.id))

    console.log(`[expire-bookings] Expired ${expired.length} booking(s):`, expired.map(b => b.booking_ref))
    return Response.json({ expired: expired.length, refs: expired.map(b => b.booking_ref) })
  } catch (error) {
    console.error('[expire-bookings] error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
