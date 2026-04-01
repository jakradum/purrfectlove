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
  const token = match ? match[1] : null
  if (!token) return null
  return verifyToken(token)
}

export async function GET(request) {
  try {
    const payload = await getAuth(request)
    if (!payload) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'canSit' or 'needsSitting'

    let query
    if (type === 'needsSitting') {
      query = `*[_type == "catSitter" && needsSitting == true && memberVerified == true && deletionRequested != true && defined(name) && defined(location.lat)]{
        _id, _createdAt, name, username, location, bio, contactPreference, siteAdmin, avatarColour,
        identityVerified, trustedSitter,
        "email": select(hideEmail == true => null, email),
        "phone": select(hideWhatsApp == true => null, phone),
        "photoUrl": photo.asset->url,
        hideEmail, hideWhatsApp,
        cats, availableDates, alwaysAvailable, unavailableDates, unavailableRanges, unavailableDatesV2, maxHomesPerDay,
        feedingTypes, behavioralTraits
      }`
    } else {
      query = `*[_type == "catSitter" && canSit == true && memberVerified == true && deletionRequested != true && defined(name) && defined(location.lat)]{
        _id, _createdAt, name, username, location, bio, contactPreference, siteAdmin, avatarColour,
        identityVerified, trustedSitter,
        "email": select(hideEmail == true => null, email),
        "phone": select(hideWhatsApp == true => null, phone),
        "photoUrl": photo.asset->url,
        hideEmail, hideWhatsApp,
        maxHomesPerDay, feedingTypes, behavioralTraits, availableDates, alwaysAvailable, unavailableDates, unavailableRanges, unavailableDatesV2
      }`
    }

    const sitters = await serverClient.fetch(query)
    return Response.json(sitters)
  } catch (error) {
    console.error('sitters GET error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
