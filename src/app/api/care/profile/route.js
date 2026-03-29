import { createClient } from '@sanity/client'
import { verifyToken } from '@/lib/careAuth'
import { cookies } from 'next/headers'
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
      return { lat: parseFloat(decoded.latitudeCenter.toFixed(6)), lng: parseFloat(decoded.longitudeCenter.toFixed(6)) }
    }
    // Short code — geocode city part as reference
    const cityPart = parts.slice(1).join(' ')
    if (cityPart) {
      const ref = await geocodeCity(cityPart)
      if (ref) {
        const fullCode = olc.recoverNearest(codeToken, ref.lat, ref.lng)
        const decoded = olc.decode(fullCode)
        return { lat: parseFloat(decoded.latitudeCenter.toFixed(6)), lng: parseFloat(decoded.longitudeCenter.toFixed(6)) }
      }
    }
  }
  // Plain text — try geocoding the whole string
  return geocodeCity(trimmed)
}

const serverClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
})

async function getAuth(request) {
  // Try cookie from request headers first
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

    const sitter = await serverClient.fetch(
      `*[_type == "catSitter" && _id == $id][0]`,
      { id: payload.sitterId }
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
    const payload = await getAuth(request)
    if (!payload) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Only allow member-editable fields
    const allowedFields = [
      'name', 'location', 'contactPreference', 'bio', 'bedrooms', 'householdSize',
      'cats', 'alwaysAvailable', 'unavailableDates', 'availableDates',
      'maxCats', 'feedingTypes', 'behavioralTraits', 'canSit', 'needsSitting',
      'hideEmail', 'hideWhatsApp',
    ]

    const patch = {}
    for (const field of allowedFields) {
      if (field in body) {
        patch[field] = body[field]
      }
    }

    // Resolve location coords if name is set but coords are missing
    if (patch.location?.name && (patch.location.lat == null || patch.location.lng == null)) {
      try {
        const coords = await resolveLocation(patch.location.name)
        if (coords) patch.location = { ...patch.location, ...coords }
      } catch {
        // proceed without coords
      }
    }

    const updated = await serverClient
      .patch(payload.sitterId)
      .set(patch)
      .commit()

    return Response.json(updated)
  } catch (error) {
    console.error('profile PATCH error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
