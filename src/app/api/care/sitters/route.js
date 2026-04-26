import { createClient } from '@sanity/client'
import { getSupabaseUser, createSupabaseDbClient } from '@/lib/supabaseServer'

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

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    // Single-member lookup (for compose target resolution)
    if (id) {
      const member = await serverClient.fetch(
        `*[_type == "catSitter" && _id == $id && memberVerified == true][0]{ _id, name }`,
        { id }
      )
      return Response.json(member || null)
    }

    // Seeker-only marketplace: exclude self, only show canSit members.
    // Contact details (email, phone) are intentionally omitted here — they are
    // only released in the booking detail endpoint once the sit is confirmed and
    // within 2 days of the start date.
    const [sitters, availRows] = await Promise.all([
      serverClient.fetch(
        `*[_type == "catSitter" && _id != $selfId && canSit == true && memberVerified == true && deletionRequested != true && defined(name) && defined(location.lat)]{
          _id, _createdAt, name, location, bio, contactPreference, siteAdmin, avatarColour,
          identityVerified, trustedSitter,
          "photoUrl": photo.asset->url,
          "coverImageUrl": coverImage.asset->url,
          hideEmail, hideWhatsApp,
          maxHomesPerDay, maxCatsPerDay, feedingTypes, behavioralTraits, canDoHomeVisit, canHostCats,
          "rating": sitterScore.rating,
          cats[]{ _key, name, breed, age, personality, feedingNotes, "photoUrl": photo.asset->url, "vaccinationRecord": vaccinationRecord { "fileUrl": file.asset->url, date } }
        }`,
        { selfId: user.sitterId }
      ),
      createSupabaseDbClient()
        .from('sitter_availability')
        .select('sitter_id, availability_default, unavailable_dates, blocked_by_booking'),
    ])

    const availMap = Object.fromEntries(
      ((availRows.data) || []).map(r => [r.sitter_id, r])
    )

    const merged = sitters.map(s => {
      const a = availMap[s._id]
      return {
        ...s,
        availabilityDefault: a?.availability_default ?? 'available',
        unavailableDatesV2:  a?.unavailable_dates    ?? [],
        blockedByBooking:    a?.blocked_by_booking   ?? [],
      }
    })

    return Response.json(merged)
  } catch (error) {
    console.error('sitters GET error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
