import { createClient } from '@sanity/client'
import { getSupabaseUser, createSupabaseDbClient } from '@/lib/supabaseServer'

const serverClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
})

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

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
    const { id: bookingId } = await params
    const db = createSupabaseDbClient()

    const { data: booking, error: fetchError } = await db
      .from('bookings')
      .select('id, booking_ref, start_date, end_date, status, cats, message, cancellation_reason, cancelled_by, cancelled_at, sitter_id, parent_id, sit_type')
      .eq('id', bookingId)
      .is('deleted_at', null)
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
        `*[_type == "catSitter" && _id == $id][0]{ name, email, phone, location, locationName }`,
        { id: otherId }
      ),
      serverClient.fetch(
        `*[_type == "catSitter" && _id == $id][0]{ location, locationName }`,
        { id: myId }
      ),
      serverClient.fetch(`*[_type == "catSitter" && _id == $id][0]{ name }`, { id: booking.sitter_id }),
      serverClient.fetch(`*[_type == "catSitter" && _id == $id][0]{ name }`, { id: booking.parent_id }),
    ])

    const sitType = booking.sit_type

    // Location is shared only in the direction travel goes:
    // - home visit: sitter travels to parent → sitter sees parent's location, parent does not see sitter's
    // - drop-off:   parent travels to sitter → parent sees sitter's location, sitter does not see parent's
    const showOtherLocation = sitType === 'home_visit' ? role === 'sitter' : role === 'parent'

    const lat = showOtherLocation ? (other?.location?.lat || null) : null
    const lng = showOtherLocation ? (other?.location?.lng || null) : null

    // Resolve other party's neighbourhood name: prefer cached locationName, then reverse geocode and cache
    let otherNeighbourhood = null
    if (showOtherLocation) {
      if (other?.locationName) {
        otherNeighbourhood = other.locationName
      } else {
        const resolved = await reverseGeocode(other?.location?.lat, other?.location?.lng)
        otherNeighbourhood = resolved
        if (resolved && otherId) {
          serverClient.patch(otherId).set({ locationName: resolved }).commit().catch(() => {})
        }
      }
    }

    // Resolve my neighbourhood: prefer cached locationName, then reverse geocode and cache
    let myNeighbourhood = null
    if (myProfile?.locationName) {
      myNeighbourhood = myProfile.locationName
    } else {
      const resolved = await reverseGeocode(myProfile?.location?.lat, myProfile?.location?.lng)
      myNeighbourhood = resolved
      if (resolved && myId) {
        serverClient.patch(myId).set({ locationName: resolved }).commit().catch(() => {})
      }
    }

    const statusNote = booking.status === 'unavailable'
      ? 'The cat parent found a sitter for these dates — no action needed from you.'
      : null

    // Contact details are released only when the booking is confirmed AND
    // the sit starts within 2 days (or has already started).
    const twoDaysBeforeStart = new Date(booking.start_date)
    twoDaysBeforeStart.setDate(twoDaysBeforeStart.getDate() - 2)
    const contactReleased =
      booking.status === 'confirmed' && new Date() >= twoDaysBeforeStart

    // Straight-line distance between the two members (road multiplier ~1.66 for India)
    const myLat = myProfile?.location?.lat
    const myLng = myProfile?.location?.lng
    const otherLat = other?.location?.lat
    const otherLng = other?.location?.lng
    const distanceKm = (myLat && myLng && otherLat && otherLng)
      ? Math.round(haversineKm(myLat, myLng, otherLat, otherLng) * 1.66 * 10) / 10
      : null

    return Response.json({
      _id:                booking.id,
      bookingRef:         booking.booking_ref,
      startDate:          booking.start_date,
      endDate:            booking.end_date,
      status:             booking.status,
      statusNote,
      sitType:            sitType || null,
      cats:               booking.cats || [],
      message:            booking.message || null,
      cancellationReason: booking.cancellation_reason || null,
      cancelledBy:        booking.cancelled_by || null,
      cancelledAt:        booking.cancelled_at || null,
      role,
      sitterName:      sitterProfile?.name || 'Member',
      parentName:      parentProfile?.name || 'Member',
      myNeighbourhood: myNeighbourhood || null,
      distanceKm,
      contactReleased,
      other: {
        name:          other?.name || 'Member',
        email:         contactReleased ? (other?.email || null) : null,
        phone:         contactReleased ? (other?.phone || null) : null,
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
