import { createClient } from '@sanity/client'
import { getSupabaseUser, createSupabaseDbClient } from '@/lib/supabaseServer'
import { rateLimit } from '@/lib/rateLimit'
import { captureServerEvent } from '@/lib/posthogServer'
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

    const db = createSupabaseDbClient()
    const [sitter, availRow] = await Promise.all([
      serverClient.fetch(
        `*[_type == "catSitter" && _id == $id][0]{ ..., "cats": cats[] { ..., "vaccinationRecord": vaccinationRecord { "fileUrl": file.asset->url, "fileName": file.asset->originalFilename, date } } }`,
        { id: user.sitterId }
      ),
      db.from('sitter_availability').select('*').eq('sitter_id', user.sitterId).maybeSingle(),
    ])

    if (!sitter) {
      return Response.json({ error: 'Profile not found' }, { status: 404 })
    }

    const avail = availRow.data
    return Response.json({
      ...sitter,
      availabilityDefault: avail?.availability_default ?? sitter.availabilityDefault ?? 'available',
      unavailableDatesV2:  avail?.unavailable_dates    ?? sitter.unavailableDatesV2  ?? [],
      blockedByBooking:    avail?.blocked_by_booking   ?? sitter.blockedByBooking    ?? [],
    })
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
      'name', 'location', 'contactPreference', 'bio', 'phone', 'bedrooms', 'householdSize',
      'cats', 'alwaysAvailable', 'unavailableDates', 'unavailableRanges', 'availableDates',
      'availabilityDefault', 'unavailableDatesV2', 'maxHomesPerDay', 'maxCatsPerDay', 'feedingTypes', 'behavioralTraits', 'canSit', 'canDoHomeVisit', 'canHostCats',
      'hideEmail', 'hideWhatsApp', 'newsletterOptOut', 'guidelinesAccepted', 'blockedByBooking',
      'notifEmailMessage', 'notifEmailSitRequest',
    ]

    // Availability fields live in Supabase — separate them from the Sanity patch
    const AVAIL_FIELDS = new Set(['availabilityDefault', 'unavailableDatesV2', 'blockedByBooking'])

    const patch = {}
    const availPatch = {}
    for (const field of allowedFields) {
      if (!(field in body)) continue
      if (AVAIL_FIELDS.has(field)) availPatch[field] = body[field]
      else patch[field] = body[field]
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

    // When location is saved with a displayName (from client-side reverse geocode),
    // cache it as locationName so the profile header can show it without a live lookup.
    if (patch.location?.lat && body.location?.displayName) {
      patch.locationName = body.location.displayName
    }

    const db = createSupabaseDbClient()

    // When cats are being saved, re-merge existing vaccinationRecord fields.
    // The client strips vaccinationRecord before sending (it's managed by the
    // upload-vaxx route), but a plain .set({ cats }) replaces the whole array
    // in Sanity and would delete the records. Fetch existing vaxx data first.
    if (patch.cats) {
      const existing = await serverClient.fetch(
        `*[_type == "catSitter" && _id == $id][0]{ "cats": cats[]{ _key, vaccinationRecord } }`,
        { id: user.sitterId }
      )
      const existingVaxx = {}
      for (const c of existing?.cats || []) {
        if (c._key && c.vaccinationRecord) existingVaxx[c._key] = c.vaccinationRecord
      }
      patch.cats = patch.cats.map(cat => ({
        ...cat,
        ...(existingVaxx[cat._key] ? { vaccinationRecord: existingVaxx[cat._key] } : {}),
      }))
    }

    // Write non-availability fields to Sanity (may be empty if availability-only save)
    let updated = null
    if (Object.keys(patch).length > 0) {
      updated = await serverClient.patch(user.sitterId).set(patch).commit()
    } else {
      updated = await serverClient.fetch(`*[_type == "catSitter" && _id == $id][0]`, { id: user.sitterId })
    }

    // Write availability fields to Supabase
    let savedAvail = null
    if (Object.keys(availPatch).length > 0) {
      const availUpsert = { sitter_id: user.sitterId }
      if ('availabilityDefault' in availPatch) availUpsert.availability_default = availPatch.availabilityDefault
      if ('unavailableDatesV2'  in availPatch) availUpsert.unavailable_dates    = availPatch.unavailableDatesV2 ?? []
      if ('blockedByBooking'    in availPatch) availUpsert.blocked_by_booking   = availPatch.blockedByBooking   ?? []
      const { data } = await db
        .from('sitter_availability')
        .upsert(availUpsert, { onConflict: 'sitter_id' })
        .select()
        .single()
      savedAvail = data
    } else {
      const { data } = await db.from('sitter_availability').select('*').eq('sitter_id', user.sitterId).maybeSingle()
      savedAvail = data
    }

    // Analytics (non-blocking)
    const isAvailabilityUpdate = Object.keys(availPatch).length > 0
    const isCanSitToggle = 'canSit' in patch

    captureServerEvent(user.sitterId, 'profile_updated').catch(() => {})
    if (isAvailabilityUpdate) {
      captureServerEvent(user.sitterId, 'availability_updated').catch(() => {})
    }
    if (isCanSitToggle) {
      captureServerEvent(user.sitterId, 'can_sit_toggled', { new_value: !!patch.canSit }).catch(() => {})
    }

    return Response.json({
      ...updated,
      availabilityDefault: savedAvail?.availability_default ?? 'available',
      unavailableDatesV2:  savedAvail?.unavailable_dates    ?? [],
      blockedByBooking:    savedAvail?.blocked_by_booking   ?? [],
    })
  } catch (error) {
    console.error('profile PATCH error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
