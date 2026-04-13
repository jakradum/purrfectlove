export default {
  name: 'catSitter',
  title: 'Cat Sitter',
  type: 'document',
  fields: [
    // Team-set fields
    { name: 'name', title: 'Display Name', type: 'string' },
    { name: 'email', title: 'Email', type: 'string', description: 'Login email. If set here without going through the email flow, also create a matching Supabase auth user with this sitterId in user_metadata.', validation: Rule => Rule.email() },
    { name: 'phone', title: 'Phone (used for login)', type: 'string', description: 'Optional. Format: +91XXXXXXXXXX or +49XXXXXXXXXX. Spaces are ignored automatically. Used for SMS OTP login.' },
    { name: 'memberVerified', title: 'Member Verified', type: 'boolean', initialValue: false, readOnly: true, description: 'Set automatically when member authenticates for the first time — do not edit manually.' },
    { name: 'admitted', title: 'Admitted', type: 'boolean', description: 'Set to true when approved, false when entry denied. If false, inbox-based approval is permanently blocked — override only via codebase.' },
    { name: 'siteAdmin', title: 'Site Admin', type: 'boolean', initialValue: false, description: 'Core team member — shown with Site Admin badge on the portal' },
    { name: 'photo', title: 'Photo', type: 'image', options: { hotspot: true }, description: 'Team members: set from Sanity. Regular members set their photo via their profile.' },
    { name: 'addedBy', title: 'Added By', type: 'reference', to: [{ type: 'teamMember' }], options: { disableNew: true } },
    { name: 'hideEmail', title: 'Hide Email from Profile', type: 'boolean', initialValue: false, readOnly: true, description: 'Managed by member via portal privacy settings' },
    { name: 'hideWhatsApp', title: 'Hide WhatsApp from Profile', type: 'boolean', initialValue: false, readOnly: true, description: 'Managed by member via portal privacy settings' },
    { name: 'memberScore', title: 'Member Score', type: 'number', initialValue: 100, readOnly: true },
    {
      name: 'scoreHistory',
      title: 'Score History',
      type: 'array',
      readOnly: true,
      of: [{
        type: 'object',
        fields: [
          { name: 'change', type: 'number' },
          { name: 'reason', type: 'string' },
          { name: 'timestamp', type: 'datetime' },
        ],
      }],
    },
    { name: 'locale', title: 'Locale', type: 'string', options: { list: [{ title: 'English (India)', value: 'en' }, { title: 'German (Germany)', value: 'de' }] }, initialValue: 'en' },

    // Member-set fields (read-only in Studio — members edit via portal)
    {
      name: 'location',
      title: 'Location',
      type: 'object',
      readOnly: true,
      fields: [
        { name: 'name', title: 'Plus Code / Area', type: 'string' },
        { name: 'lat', title: 'Latitude', type: 'number' },
        { name: 'lng', title: 'Longitude', type: 'number' },
      ],
    },
    { name: 'locationName', title: 'Location Name (cached)', type: 'string', readOnly: true, description: 'Human-readable neighbourhood name cached from reverse geocoding. Auto-populated by the booking detail API.' },
    { name: 'contactPreference', title: 'Contact Preference', type: 'string', readOnly: true, options: { list: [{ title: 'Email', value: 'email' }, { title: 'WhatsApp', value: 'whatsapp' }] } },
    { name: 'bio', title: 'Bio', type: 'text', rows: 4, readOnly: true, validation: Rule => Rule.max(250) },

    // Home details
    { name: 'bedrooms', title: 'Bedrooms', type: 'number', readOnly: true },
    { name: 'householdSize', title: 'Household Size', type: 'number', readOnly: true },

    // Cats
    {
      name: 'cats',
      title: 'My Cats',
      type: 'array',
      readOnly: true,
      of: [{
        type: 'object',
        fields: [
          { name: 'name', title: 'Name', type: 'string' },
          { name: 'age', title: 'Age (years)', type: 'number' },
          { name: 'personality', title: 'Personality & Care', type: 'array', of: [{ type: 'string' }], options: { layout: 'grid', list: [
            { title: 'Shy', value: 'shy' }, { title: 'Confident', value: 'confident' }, { title: 'Gentle', value: 'gentle' }, { title: 'Playful', value: 'playful' }, { title: 'Independent', value: 'independent' },
            { title: 'Good with other cats', value: 'good_with_cats' }, { title: 'Prefers to be only cat', value: 'prefers_solo' }, { title: 'Good with kids', value: 'good_with_kids' },
            { title: 'Senior (10+ yrs)', value: 'senior' }, { title: 'Special needs', value: 'special_needs' }, { title: 'On medication', value: 'on_medication' }, { title: 'Indoor only', value: 'indoor_only' },
          ] } },
          { name: 'diet', title: 'Diet', type: 'array', of: [{ type: 'string' }], options: { list: ['wet', 'dry', 'medication', 'special diet'] } },
        ],
        preview: { select: { title: 'name', subtitle: 'age' }, prepare({ title, subtitle }) { return { title: title || 'Unnamed cat', subtitle: subtitle ? `${subtitle} years old` : '' } } }
      }]
    },

    // Availability
    { name: 'alwaysAvailable', title: 'Always Available', type: 'boolean', initialValue: false, readOnly: true },
    { name: 'unavailableDates', title: 'Unavailable Dates (legacy)', type: 'array', readOnly: true, of: [{ type: 'date' }], hidden: ({ parent }) => !parent?.alwaysAvailable, description: 'Legacy single-date list. New UI uses unavailableRanges.' },
    {
      name: 'unavailableRanges',
      title: 'Unavailable Ranges',
      type: 'array',
      readOnly: true,
      of: [{
        type: 'object',
        fields: [
          { name: 'start', title: 'Unavailable From', type: 'date' },
          { name: 'end', title: 'Unavailable Until', type: 'date' },
        ],
        preview: { select: { start: 'start', end: 'end' }, prepare({ start, end }) { return { title: `${start || '?'} → ${end || '?'}` } } }
      }],
      hidden: ({ parent }) => !parent?.alwaysAvailable,
      description: 'Date ranges when the member is not available, despite alwaysAvailable being true.'
    },
    {
      name: 'availableDates',
      title: 'Available Date Ranges',
      type: 'array',
      readOnly: true,
      of: [{
        type: 'object',
        fields: [
          { name: 'start', title: 'Start Date', type: 'date' },
          { name: 'end', title: 'End Date', type: 'date' },
        ],
        preview: { select: { start: 'start', end: 'end' }, prepare({ start, end }) { return { title: `${start || '?'} → ${end || '?'}` } } }
      }],
      hidden: ({ parent }) => parent?.alwaysAvailable
    },

    // Sitter capabilities
    { name: 'maxHomesPerDay', title: 'Max Homes Per Day (Visits)', type: 'number', readOnly: true },
    { name: 'maxCatsPerDay', title: 'Max Cats Per Day', type: 'number', description: 'Maximum number of cats this sitter is comfortable with per day.' },
    { name: 'feedingTypes', title: 'Can Feed', type: 'array', readOnly: true, of: [{ type: 'string' }], options: { list: ['wet', 'dry', 'medication', 'special diet'] } },
    { name: 'behavioralTraits', title: 'Comfortable With (cat types)', type: 'array', readOnly: true, of: [{ type: 'string' }], description: 'Temperament: shy, confident, gentle, playful, independent · Social: good_with_cats, prefers_solo, good_with_kids · Care: senior, special_needs, on_medication, indoor_only', options: { layout: 'grid', list: [
      { title: 'Shy', value: 'shy' }, { title: 'Confident', value: 'confident' }, { title: 'Gentle', value: 'gentle' }, { title: 'Playful', value: 'playful' }, { title: 'Independent', value: 'independent' },
      { title: 'Good with other cats', value: 'good_with_cats' }, { title: 'Prefers to be only cat', value: 'prefers_solo' }, { title: 'Good with kids', value: 'good_with_kids' },
      { title: 'Senior (10+ yrs)', value: 'senior' }, { title: 'Special needs', value: 'special_needs' }, { title: 'On medication', value: 'on_medication' }, { title: 'Indoor only', value: 'indoor_only' },
    ] } },

    // Toggles
    { name: 'canSit', title: 'I Can Sit', type: 'boolean', initialValue: false, readOnly: true },
    { name: 'needsSitting', title: 'I Need Sitting', type: 'boolean', initialValue: false, readOnly: true },
    { name: 'canDoHomeVisit', title: 'Can Do Home Visits', type: 'boolean', initialValue: false, readOnly: true, description: 'Sitter travels to the cat\'s home. Set by member via portal.' },
    { name: 'canHostCats', title: 'Can Host Cats', type: 'boolean', initialValue: false, readOnly: true, description: 'Cat parents drop off their cat with this sitter. Set by member via portal.' },

    // Email preferences
    { name: 'welcomeSent', title: 'Welcome Email Sent', type: 'boolean', initialValue: false, description: 'Set to true after first login welcome email is sent. Never send again.' },
    { name: 'newsletterOptOut', title: 'Newsletter Opt-Out', type: 'boolean', initialValue: false, description: 'Set to true when member unsubscribes from community emails.' },

    // Username (legacy — no longer displayed)
    { name: 'username', title: 'Username (legacy)', type: 'string', readOnly: true, description: 'Legacy anonymous display name. No longer shown in the portal. Kept for historical data only.' },
    { name: 'usernameRegenerated', title: 'Username Regenerated (legacy)', type: 'boolean', hidden: true, description: 'Legacy flag. No longer used.' },

    // Sitter scoring — computed by cron after each completed sit, never entered manually
    {
      name: 'sitterScore',
      title: 'Sitter Score',
      type: 'object',
      readOnly: true,
      description: 'Computed metrics. Updated by cron after completed sits. Do not edit manually.',
      fields: [
        { name: 'responseTimeAvg', title: 'Avg Response Time (hours)', type: 'number', description: 'Average hours to accept/decline a booking request.' },
        { name: 'rating', title: 'Rating', type: 'number', description: 'Average rating from cat parents (0–5). Null until first rating received.' },
        { name: 'completionRate', title: 'Completion Rate', type: 'number', description: 'Fraction of accepted bookings that completed without cancellation (0–1).' },
        { name: 'totalSits', title: 'Total Sits', type: 'number', description: 'Number of completed sits.' },
      ],
    },

    // Auto-blocked dates from accepted bookings (denormalised for fast marketplace filtering)
    // Written by the booking accept route. Members can override individual dates via their profile
    // (those dates are removed from this array on the next availability save).
    {
      name: 'blockedByBooking',
      title: 'Blocked by Booking',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'YYYY-MM-DD dates auto-blocked when a booking is accepted. Members can override. Do not edit manually.',
    },

    // Availability v2 — single source of truth array of YYYY-MM-DD strings
    {
      name: 'availabilityDefault',
      title: 'Availability Default',
      type: 'string',
      options: { list: [{ title: 'Generally available (mark exceptions)', value: 'available' }, { title: 'Generally unavailable (mark available days)', value: 'unavailable' }], layout: 'radio' },
      initialValue: 'available',
      readOnly: true,
      description: 'Set by member. "available" = all days available by default, tap to mark unavailable. "unavailable" = all days unavailable by default, tap to mark available.',
    },
    {
      name: 'unavailableDatesV2',
      title: 'Marked Dates (v2)',
      type: 'array',
      readOnly: true,
      of: [{ type: 'string' }],
      description: 'When availabilityDefault=available: YYYY-MM-DD strings of unavailable days. When availabilityDefault=unavailable: YYYY-MM-DD strings of available days.',
    },

    // Avatar & cover
    { name: 'avatarColour', title: 'Avatar Background Colour', type: 'string', description: 'Assigned randomly on signup. One of: whisker-cream, paw-pink, hunter-green, tabby-brown. Used when no photo uploaded.' },
    { name: 'coverImage', title: 'Cover Image', type: 'image', options: { hotspot: true }, description: 'Member-uploaded profile cover image. If absent, a wavy pattern PNG is shown as fallback.' },

    // Trust & verification
    { name: 'identityVerified', title: 'Identity Verified', type: 'boolean', initialValue: false, description: 'Admin-granted after manual identity check.' },
    { name: 'trustedSitter', title: 'Trusted Sitter', type: 'boolean', initialValue: false, description: 'Admin-granted. Not yet shown in member-facing UI — will be activated once sitting history is established.' },

    // Community guidelines
    { name: 'guidelinesAccepted', title: 'Guidelines Accepted', type: 'boolean', initialValue: false, description: 'Set to true when member accepts community guidelines on first login.' },

    // Notification preferences
    { name: 'notifEmailMessage', title: 'Email on new inbox message', type: 'boolean', initialValue: true },
    { name: 'notifEmailSitRequest', title: 'Email on sit request', type: 'boolean', initialValue: true },

    // Deletion request
    { name: 'deletionRequested', title: 'Deletion Requested', type: 'boolean', initialValue: false, description: '⚠ Member has requested account deletion. Delete promptly and log a deletedAccount record.' },
    { name: 'deletionReason', title: 'Deletion Reason', type: 'text', rows: 3 },
    { name: 'deletionRequestedAt', title: 'Deletion Requested At', type: 'datetime' },
    { name: 'confirmationSentAt', title: 'Deletion Confirmation Email Sent At', type: 'datetime', description: 'Timestamp when the deletion confirmation email was sent to the member.' },

    // OTP lockout — managed automatically by verify-otp; do not edit manually
    { name: 'otpFailedAttempts', title: 'OTP Failed Attempts', type: 'number', initialValue: 0, readOnly: true, description: 'Consecutive failed login attempts. Resets to 0 on successful login.' },
    { name: 'otpCoolUntil', title: 'OTP Cool-off Until', type: 'datetime', readOnly: true, description: 'Account is locked out until this timestamp (set after 5 failed attempts). Cleared on successful login.' },
    { name: 'otpPermanentlyBlocked', title: 'OTP Permanently Blocked', type: 'boolean', initialValue: false, readOnly: true, description: 'Set to true after 10 consecutive failed OTP attempts. Login is blocked indefinitely — contact support to reset.' },
  ],
  preview: {
    select: { title: 'name', username: 'username', subtitle: 'email', verified: 'memberVerified', admin: 'siteAdmin', deletionRequested: 'deletionRequested', media: 'photo' },
    prepare({ title, username, subtitle, verified, admin, deletionRequested, media }) {
      const status = verified ? '✓ Verified' : '⏳ Pending'
      const adminTag = admin ? ' · 🛡 Admin' : ''
      const deletionTag = deletionRequested ? ' · 🔴 DELETION REQUESTED' : ''
      const displayName = username ? `${username} (${title || 'no name'})` : (title || subtitle || 'Unknown')
      return { title: displayName + deletionTag, subtitle: `${status}${adminTag} · ${subtitle || ''}`, media }
    }
  }
}
