export default {
  name: 'donor',
  title: 'Donor',
  type: 'document',
  fields: [
    { name: 'name',  title: 'Name',  type: 'string', validation: Rule => Rule.required() },
    { name: 'email', title: 'Email', type: 'string', validation: Rule => Rule.required().email() },
    // Drives the German salutation ("Liebe" / "Lieber ..."). 'neutral' falls
    // back to a gender-free greeting for anyone we're unsure about.
    {
      name: 'salutation',
      title: 'Salutation',
      type: 'string',
      options: { list: [{ title: 'Female (Liebe)', value: 'female' }, { title: 'Male (Lieber)', value: 'male' }, { title: 'Neutral', value: 'neutral' }] },
      initialValue: 'neutral',
      validation: Rule => Rule.required()
    },
    {
      name: 'locale',
      title: 'Locale',
      type: 'string',
      options: { list: [{ title: 'German', value: 'de' }, { title: 'English', value: 'en' }] },
      initialValue: 'de',
      validation: Rule => Rule.required()
    },
    // Staff can pause a donor here (e.g. asked not to be emailed) without deleting the record.
    { name: 'active', title: 'Active', type: 'boolean', initialValue: true },
    { name: 'addedAt', title: 'Added At', type: 'datetime', initialValue: () => new Date().toISOString() },
    { name: 'lastThankYouSentAt', title: 'Last Thank-You Sent At', type: 'datetime' },
    { name: 'notes', title: 'Notes', type: 'text', rows: 2 },
  ],
  orderings: [
    { title: 'Name A-Z', name: 'nameAsc', by: [{ field: 'name', direction: 'asc' }] },
    { title: 'Newest first', name: 'addedAtDesc', by: [{ field: 'addedAt', direction: 'desc' }] },
  ],
  preview: {
    select: { name: 'name', email: 'email', locale: 'locale', active: 'active', lastThankYouSentAt: 'lastThankYouSentAt' },
    prepare({ name, email, locale, active, lastThankYouSentAt }) {
      const flag = locale === 'de' ? '🇩🇪' : '🇬🇧'
      const sent = lastThankYouSentAt
        ? `last emailed ${new Date(lastThankYouSentAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`
        : 'never emailed'
      const status = active === false ? ' · inactive' : ''
      return {
        title: name || 'Unknown donor',
        subtitle: `${flag} ${email} · ${sent}${status}`,
      }
    }
  }
}
