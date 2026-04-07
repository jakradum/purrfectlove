import { createClient } from '@sanity/client'
import { getSupabaseUser } from '@/lib/supabaseServer'

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

    // Seeker-only marketplace: exclude self, only show canSit members
    const sitters = await serverClient.fetch(
      `*[_type == "catSitter" && _id != $selfId && canSit == true && memberVerified == true && deletionRequested != true && defined(name) && defined(location.lat)]{
        _id, _createdAt, name, location, bio, contactPreference, siteAdmin, avatarColour,
        identityVerified, trustedSitter,
        "email": select(hideEmail == true => null, email),
        "phone": select(hideWhatsApp == true => null, phone),
        "photoUrl": photo.asset->url,
        "coverImageUrl": coverImage.asset->url,
        hideEmail, hideWhatsApp,
        maxHomesPerDay, maxCatsPerDay, feedingTypes, behavioralTraits,
        availableDates, alwaysAvailable, unavailableDates, unavailableRanges,
        availabilityDefault, unavailableDatesV2, blockedByBooking,
        "rating": sitterScore.rating
      }`,
      { selfId: user.sitterId }
    )
    return Response.json(sitters)
  } catch (error) {
    console.error('sitters GET error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
