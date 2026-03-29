/**
 * A profile is considered complete when the member has set:
 * - display name
 * - email address
 * - location (lat/lng from a valid Plus Code)
 *
 * These are the minimum fields needed to be discoverable and contactable
 * on the network. Checked server-side in page routes to gate access.
 */
export function isProfileComplete(profile) {
  return !!(
    profile?.name?.trim() &&
    profile?.email?.trim() &&
    profile?.location?.lat
  )
}

/** Fields to fetch when checking profile completeness */
export const COMPLETENESS_FIELDS = `name, email, "location": location { lat }`
