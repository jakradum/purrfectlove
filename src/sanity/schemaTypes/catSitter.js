export default {
  name: 'catSitter',
  title: 'Cat Sitter',
  type: 'document',
  fields: [
    // Team-set fields
    { name: 'email', title: 'Email', type: 'string', validation: Rule => Rule.required().email() },
    { name: 'phone', title: 'Phone', type: 'string' },
    { name: 'location', title: 'Location', type: 'geopoint' },
    { name: 'neighborhood', title: 'Neighborhood', type: 'string' },
    { name: 'memberVerified', title: 'Member Verified', type: 'boolean', initialValue: false },
    { name: 'addedBy', title: 'Added By', type: 'reference', to: [{ type: 'teamMember' }], options: { disableNew: true } },
    { name: 'locale', title: 'Locale', type: 'string', options: { list: [{ title: 'English (India)', value: 'en' }, { title: 'German (Germany)', value: 'de' }] }, initialValue: 'en' },

    // Member-set fields
    { name: 'name', title: 'Display Name', type: 'string' },
    { name: 'contactPreference', title: 'Contact Preference', type: 'string', options: { list: [{ title: 'Email', value: 'email' }, { title: 'WhatsApp', value: 'whatsapp' }] } },
    { name: 'bio', title: 'Bio', type: 'text', rows: 4, validation: Rule => Rule.max(250) },

    // Home details
    { name: 'bedrooms', title: 'Bedrooms', type: 'number' },
    { name: 'householdSize', title: 'Household Size', type: 'number' },

    // Cats
    {
      name: 'cats',
      title: 'My Cats',
      type: 'array',
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
    { name: 'alwaysAvailable', title: 'Always Available', type: 'boolean', initialValue: false },
    { name: 'unavailableDates', title: 'Unavailable Dates', type: 'array', of: [{ type: 'date' }], hidden: ({ parent }) => !parent?.alwaysAvailable },
    {
      name: 'availableDates',
      title: 'Available Date Ranges',
      type: 'array',
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
    { name: 'maxCats', title: 'Max Cats I Can Sit', type: 'number' },
    { name: 'feedingTypes', title: 'Can Feed', type: 'array', of: [{ type: 'string' }], options: { list: ['wet', 'dry', 'medication', 'special diet'] } },
    { name: 'behavioralTraits', title: 'Comfortable With', type: 'array', of: [{ type: 'string' }], options: { list: ['shy', 'energetic', 'senior', 'special needs'] } },

    // Toggles
    { name: 'canSit', title: 'I Can Sit', type: 'boolean', initialValue: false },
    { name: 'needsSitting', title: 'I Need Sitting', type: 'boolean', initialValue: false },
  ],
  preview: {
    select: { title: 'name', subtitle: 'email', verified: 'memberVerified' },
    prepare({ title, subtitle, verified }) {
      return { title: title || subtitle || 'Unknown', subtitle: `${verified ? '✓ Verified' : '⏳ Pending'} · ${subtitle || ''}` }
    }
  }
}
