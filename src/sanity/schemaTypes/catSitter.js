export default {
  name: 'catSitter',
  title: 'Cat Sitter',
  type: 'document',
  fields: [
    // Team-set fields
    { name: 'email', title: 'Email', type: 'string', validation: Rule => Rule.required().email() },
    { name: 'phone', title: 'Phone (used for login — format: +91XXXXXXXXXX)', type: 'string', validation: Rule => Rule.required() },
    { name: 'memberVerified', title: 'Member Verified', type: 'boolean', initialValue: false },
    { name: 'addedBy', title: 'Added By', type: 'reference', to: [{ type: 'teamMember' }], options: { disableNew: true } },
    { name: 'hideEmail', title: 'Hide Email from Profile', type: 'boolean', initialValue: false },
    { name: 'hideWhatsApp', title: 'Hide WhatsApp from Profile', type: 'boolean', initialValue: false },
    { name: 'isAdmin', title: 'Is Admin', type: 'boolean', initialValue: false },
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
    { name: 'unavailableDates', title: 'Unavailable Dates', type: 'array', readOnly: true, of: [{ type: 'date' }], hidden: ({ parent }) => !parent?.alwaysAvailable },
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
    { name: 'maxCats', title: 'Max Cats I Can Sit', type: 'number', readOnly: true },
    { name: 'feedingTypes', title: 'Can Feed', type: 'array', readOnly: true, of: [{ type: 'string' }], options: { list: ['wet', 'dry', 'medication', 'special diet'] } },
    { name: 'behavioralTraits', title: 'Comfortable With', type: 'array', readOnly: true, of: [{ type: 'string' }], options: { list: ['shy', 'energetic', 'senior', 'special needs'] } },

    // Toggles
    { name: 'canSit', title: 'I Can Sit', type: 'boolean', initialValue: false, readOnly: true },
    { name: 'needsSitting', title: 'I Need Sitting', type: 'boolean', initialValue: false, readOnly: true },
  ],
  preview: {
    select: { title: 'name', subtitle: 'email', verified: 'memberVerified' },
    prepare({ title, subtitle, verified }) {
      return { title: title || subtitle || 'Unknown', subtitle: `${verified ? '✓ Verified' : '⏳ Pending'} · ${subtitle || ''}` }
    }
  }
}
