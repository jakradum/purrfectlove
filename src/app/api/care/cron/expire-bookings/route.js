import { createClient } from '@sanity/client'

const serverClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
})

// Runs hourly. Finds pending bookings where notifiedAt is 48+ hrs ago
// and the sitter has not responded — sets them to 'expired'.
export async function GET(request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()

    const expired = await serverClient.fetch(
      `*[_type == "bookingRequest" && status == "pending" && defined(notifiedAt) && notifiedAt < $cutoff]{ _id, bookingRef }`,
      { cutoff }
    )

    if (expired.length === 0) {
      return Response.json({ expired: 0 })
    }

    await Promise.all(
      expired.map(b =>
        serverClient.patch(b._id).set({ status: 'expired' }).commit()
      )
    )

    console.log(`[expire-bookings] Expired ${expired.length} booking(s):`, expired.map(b => b.bookingRef))
    return Response.json({ expired: expired.length, refs: expired.map(b => b.bookingRef) })
  } catch (error) {
    console.error('[expire-bookings] error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
