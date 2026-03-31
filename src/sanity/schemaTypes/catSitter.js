export default {
  name: 'catSitter',
  title: 'Cat Sitter',
  type: 'document',
  fields: [
    // Team-set fields
    { name: 'email', title: 'Email', type: 'string', readOnly: true, description: 'Set by member via profile — do not edit manually. Required for members to log in via email.', validation: Rule => Rule.email() },
    { name: 'phone', title: 'Phone (used for login)', type: 'string', description: 'Optional. Format: +91XXXXXXXXXX or +49XXXXXXXXXX. Spaces are ignored automatically. Used for SMS OTP login.' },
    { name: 'memberVerified', title: 'Member Verified', type: 'boolean', initialValue: false },
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
    { name: 'name', title: 'Display Name', type: 'string', readOnly: true },
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
          { name: 'personality', title: 'Personality', type: 'array', of: [{ type: 'string' }], options: { list: ['shy', 'energetic', 'senior', 'special needs'] } },
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
    { name: 'feedingTypes', title: 'Can Feed', type: 'array', readOnly: true, of: [{ type: 'string' }], options: { list: ['wet', 'dry', 'medication', 'special diet'] } },
    { name: 'behavioralTraits', title: 'Comfortable With', type: 'array', readOnly: true, of: [{ type: 'string' }], options: { list: ['shy', 'energetic', 'senior', 'special needs'] } },

    // Toggles
    { name: 'canSit', title: 'I Can Sit', type: 'boolean', initialValue: false, readOnly: true },
    { name: 'needsSitting', title: 'I Need Sitting', type: 'boolean', initialValue: false, readOnly: true },

    // Email preferences
    { name: 'welcomeSent', title: 'Welcome Email Sent', type: 'boolean', initialValue: false, description: 'Set to true after first login welcome email is sent. Never send again.' },
    { name: 'newsletterOptOut', title: 'Newsletter Opt-Out', type: 'boolean', initialValue: false, description: 'Set to true when member unsubscribes from community emails.' },

    // Username (anonymous display name)
    { name: 'username', title: 'Username', type: 'string', description: 'Auto-generated three-word anonymous display name (e.g. FluffyWhiskerPurrs). Shown in the portal instead of real name.' },
    { name: 'usernameRegenerated', title: 'Username Regenerated', type: 'boolean', initialValue: false, description: 'Set to true after member uses their one-time username regeneration.' },

    // Deletion request
    { name: 'deletionRequested', title: 'Deletion Requested', type: 'boolean', initialValue: false, description: '⚠ Member has requested account deletion. Delete promptly and log a deletedAccount record.' },
    { name: 'deletionReason', title: 'Deletion Reason', type: 'text', rows: 3 },
    { name: 'deletionRequestedAt', title: 'Deletion Requested At', type: 'datetime' },
    { name: 'confirmationSentAt', title: 'Deletion Confirmation Email Sent At', type: 'datetime', description: 'Timestamp when the deletion confirmation email was sent to the member.' },
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
