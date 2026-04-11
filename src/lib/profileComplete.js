/**
 * A profile is considered complete when the member has set:
 * - display name
 * - location (lat/lng from a valid Plus Code)
 * - if canSit: at least one sit type (canDoHomeVisit or canHostCats),
 *   feeding types, behavioral traits, and capacity for each selected sit type
 *
 * Checked server-side in page routes to gate access.
 */
export function isProfileComplete(profile) {
  if (!profile?.name?.trim()) return false;
  if (!profile?.location?.lat) return false;

  if (profile.canSit) {
    if (!profile.canDoHomeVisit && !profile.canHostCats) return false;
    if (profile.canDoHomeVisit && !profile.maxHomesPerDay) return false;
    if (profile.canHostCats && !profile.maxCatsPerDay) return false;
    if (!profile.feedingTypes?.length) return false;
    if (!profile.behavioralTraits?.length) return false;
  }

  return true;
}

/** Fields to fetch when checking profile completeness */
export const COMPLETENESS_FIELDS = `name, "location": location { lat }, canSit, canDoHomeVisit, canHostCats, maxHomesPerDay, maxCatsPerDay, feedingTypes, behavioralTraits`
