import { createSupabaseDbClient } from '@/lib/supabaseServer'
import { captureServerEvent } from '@/lib/posthogServer'

// Safety-net fallback. Finds pending bookings where notified_at is 120+ hrs ago
// and the sitter has not responded — sets them to 'expired'.
// Under normal operation, pending-booking-nudges withdraws at 96 hrs (with emails).
// This job catches any edge cases that slipped through.
export async function GET(request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const cutoff = new Date(Date.now() - 120 * 60 * 60 * 1000).toISOString()
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

    // Fire one event per expired booking (non-blocking)
    await Promise.allSettled(
      expired.map(b => captureServerEvent('system', 'booking_expired', { booking_ref: b.booking_ref }))
    )

    return Response.json({ expired: expired.length, refs: expired.map(b => b.booking_ref) })
  } catch (error) {
    console.error('[expire-bookings] error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
