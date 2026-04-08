import { createClient } from '@sanity/client'
import { getSupabaseUser, createSupabaseDbClient } from '@/lib/supabaseServer'

const serverClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
})

async function reverseGeocode(lat, lng) {
  if (!lat || !lng) return null
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      {
        headers: {
          'User-Agent': 'PurrfectLove/1.0 (https://purrfectlove.org)',
          'Accept-Language': 'en',
        },
      }
    )
    if (!res.ok) return null
    const data = await res.json()
    const addr = data.address || {}
    return (
      addr.neighbourhood ||
      addr.suburb ||
      addr.quarter ||
      addr.village ||
      addr.town ||
      addr.city_district ||
      addr.city ||
      null
    )
  } catch {
    return null
  }
}

export async function GET(request, { params }) {
  try {
    const user = await getSupabaseUser(request)
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = user.sitterId
    const bookingId = params.id
    const db = createSupabaseDbClient()

    const { data: booking, error: fetchError } = await db
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single()

    if (fetchError || !booking) return Response.json({ error: 'Not found' }, { status: 404 })

    const isParent = booking.parent_id === userId
    const isSitter = booking.sitter_id === userId
    if (!isParent && !isSitter) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const role = isParent ? 'parent' : 'sitter'
    const otherId = isParent ? booking.sitter_id : booking.parent_id
    const myId   = isParent ? booking.parent_id  : booking.sitter_id

    const [other, myProfile, sitterProfile, parentProfile] = await Promise.all([
      serverClient.fetch(
        `*[_type == "catSitter" && _id == $id][0]{ name, email, phone, location }`,
        { id: otherId }
      ),
      serverClient.fetch(
        `*[_type == "catSitter" && _id == $id][0]{ location }`,
        { id: myId }
      ),
      serverClient.fetch(`*[_type == "catSitter" && _id == $id][0]{ name }`, { id: booking.sitter_id }),
      serverClient.fetch(`*[_type == "catSitter" && _id == $id][0]{ name }`, { id: booking.parent_id }),
    ])

    const lat = other?.location?.lat
    const lng = other?.location?.lng

    // Prefer the stored location name; fall back to reverse geocoding only if absent
    const otherNeighbourhood = other?.location?.name || await reverseGeocode(lat, lng)
    const myNeighbourhood    = myProfile?.location?.name || null

    return Response.json({
      _id:                booking.id,
      bookingRef:         booking.booking_ref,
      startDate:          booking.start_date,
      endDate:            booking.end_date,
      status:             booking.status,
      cats:               booking.cats || [],
      message:            booking.message || null,
      cancellationReason: booking.cancellation_reason || null,
      cancelledBy:        booking.cancelled_by || null,
      cancelledAt:        booking.cancelled_at || null,
      role,
      sitterName:      sitterProfile?.name || 'Member',
      parentName:      parentProfile?.name || 'Member',
      myNeighbourhood: myNeighbourhood || null,
      other: {
        name:          other?.name || 'Member',
        email:         other?.email || null,
        phone:         other?.phone || null,
        lat:           lat || null,
        lng:           lng || null,
        neighbourhood: otherNeighbourhood || null,
      },
    })
  } catch (error) {
    console.error('bookings/[id] GET error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
