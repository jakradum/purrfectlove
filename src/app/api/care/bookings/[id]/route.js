import { createClient } from '@sanity/client'
import { verifyToken } from '@/lib/careAuth'

const serverClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
})

async function getAuth(request) {
  const cookieHeader = request.headers.get('cookie') || ''
  const match = cookieHeader.match(/auth_token=([^;]+)/)
  const token = match ? decodeURIComponent(match[1]) : null
  if (!token) return null
  return verifyToken(token)
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
    const payload = await getAuth(request)
    if (!payload) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = payload.sitterId
    const bookingId = params.id

    const booking = await serverClient.fetch(
      `*[_type == "bookingRequest" && _id == $bookingId][0]{
        _id, bookingRef, startDate, endDate, status, cats, message,
        cancellationReason, cancelledBy, cancelledAt,
        sitter -> { _id, name, email, phone, location },
        parent -> { _id, name, email, phone, location },
      }`,
      { bookingId }
    )

    if (!booking) return Response.json({ error: 'Not found' }, { status: 404 })

    const isParent = booking.parent?._id === userId
    const isSitter = booking.sitter?._id === userId
    if (!isParent && !isSitter) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const role = isParent ? 'parent' : 'sitter'
    const other = isParent ? booking.sitter : booking.parent

    const lat = other?.location?.lat
    const lng = other?.location?.lng
    const neighbourhood = await reverseGeocode(lat, lng)

    return Response.json({
      _id: booking._id,
      bookingRef: booking.bookingRef,
      startDate: booking.startDate,
      endDate: booking.endDate,
      status: booking.status,
      cats: booking.cats || [],
      message: booking.message || null,
      cancellationReason: booking.cancellationReason || null,
      cancelledBy: booking.cancelledBy || null,
      cancelledAt: booking.cancelledAt || null,
      role,
      sitterName: booking.sitter?.name || 'Member',
      parentName: booking.parent?.name || 'Member',
      other: {
        name: other?.name || 'Member',
        email: other?.email || null,
        phone: other?.phone || null,
        lat: lat || null,
        lng: lng || null,
        neighbourhood: neighbourhood || null,
      },
    })
  } catch (error) {
    console.error('bookings/[id] GET error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
