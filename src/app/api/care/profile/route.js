import { createClient } from '@sanity/client'
import { getSupabaseUser } from '@/lib/supabaseServer'
import { rateLimit } from '@/lib/rateLimit'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const { OpenLocationCode } = require('open-location-code')

const olc = new OpenLocationCode()

async function geocodeCity(query) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
    { headers: { 'User-Agent': 'PurrfectLove/1.0 (support@purrfectlove.org)' } }
  )
  const data = await res.json()
  if (data[0]) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
  return null
}

async function resolveLocation(name) {
  const trimmed = name.trim()
  const parts = trimmed.split(/\s+/)
  const codeToken = parts[0]

  if (codeToken.includes('+') && olc.isValid(codeToken)) {
    if (olc.isFull(codeToken)) {
      const decoded = olc.decode(codeToken)
      // Normalise the stored name to just the full code (drop any trailing text)
      return {
        fullCode: codeToken.toUpperCase(),
        lat: parseFloat(decoded.latitudeCenter.toFixed(6)),
        lng: parseFloat(decoded.longitudeCenter.toFixed(6)),
      }
    }
    // Short code — geocode the locality part as a reference point
    const cityPart = parts.slice(1).join(' ')
    if (cityPart) {
      const ref = await geocodeCity(cityPart)
      if (ref) {
        const fullCode = olc.recoverNearest(codeToken, ref.lat, ref.lng)
        const decoded = olc.decode(fullCode)
        return {
          fullCode: fullCode.toUpperCase(),
          lat: parseFloat(decoded.latitudeCenter.toFixed(6)),
          lng: parseFloat(decoded.longitudeCenter.toFixed(6)),
        }
      }
    }
  }
  // Plain text — try geocoding the whole string (no fullCode to surface)
  return geocodeCity(trimmed)
}

const serverClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
})

export async function GET(request) {
  try {
    const user = await getSupabaseUser(request)
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sitter = await serverClient.fetch(
      `*[_type == "catSitter" && _id == $id][0]`,
      { id: user.sitterId }
    )

    if (!sitter) {
      return Response.json({ error: 'Profile not found' }, { status: 404 })
    }

    return Response.json(sitter)
  } catch (error) {
    console.error('profile GET error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request) {
  try {
    const user = await getSupabaseUser(request)
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!rateLimit(`profile:${user.sitterId}`, 30, 60_000)) {
      return Response.json({ error: 'Too many requests. Please wait a moment.' }, { status: 429 })
    }

    const body = await request.json()

    // Only allow member-editable fields
    const allowedFields = [
      'name', 'location', 'contactPreference', 'bio', 'bedrooms', 'householdSize',
      'cats', 'alwaysAvailable', 'unavailableDates', 'unavailableRanges', 'availableDates',
      'availabilityDefault', 'unavailableDatesV2', 'maxHomesPerDay', 'maxCatsPerDay', 'feedingTypes', 'behavioralTraits', 'canSit',
      'hideEmail', 'hideWhatsApp', 'newsletterOptOut', 'guidelinesAccepted', 'blockedByBooking',
      'notifEmailMessage', 'notifEmailSitRequest',
    ]

    const patch = {}
    for (const field of allowedFields) {
      if (field in body) {
        patch[field] = body[field]
      }
    }

    // Resolve location coords if name is set but coords are missing.
    // Also normalise location.name to the full global Plus Code when resolved.
    if (patch.location?.name && (patch.location.lat == null || patch.location.lng == null)) {
      try {
        const resolved = await resolveLocation(patch.location.name)
        if (resolved) {
          patch.location = {
            ...patch.location,
            lat: resolved.lat,
            lng: resolved.lng,
            // Overwrite name with the canonical full code when available
            ...(resolved.fullCode ? { name: resolved.fullCode } : {}),
          }
        }
      } catch {
        // proceed without coords
      }
    }

    const updated = await serverClient
      .patch(user.sitterId)
      .set(patch)
      .commit()

    return Response.json(updated)
  } catch (error) {
    console.error('profile PATCH error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
