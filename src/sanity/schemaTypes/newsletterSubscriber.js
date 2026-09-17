export default {
  name: 'newsletterSubscriber',
  title: 'Newsletter Subscriber',
  type: 'document',
  fields: [
    { name: 'email',        title: 'Email',        type: 'string',   readOnly: true, validation: Rule => Rule.required().email() },
    { name: 'locale',       title: 'Locale',       type: 'string',   readOnly: true, options: { list: [{ title: 'English', value: 'en' }, { title: 'German', value: 'de' }] } },
    { name: 'subscribedAt', title: 'Subscribed At', type: 'datetime', readOnly: true },
    // 'footer_form' for real signups via the site; 'backfill' for the records
    // migrated in from the old Airtable-based capture.
    { name: 'source',       title: 'Source',       type: 'string',   readOnly: true, hidden: true },
  ],
  orderings: [
    { title: 'Newest first', name: 'subscribedAtDesc', by: [{ field: 'subscribedAt', direction: 'desc' }] },
  ],
  preview: {
    select: { email: 'email', locale: 'locale', subscribedAt: 'subscribedAt' },
    prepare({ email, locale, subscribedAt }) {
      const ts = subscribedAt
        ? new Date(subscribedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
        : ''
      const flag = locale === 'de' ? '🇩🇪' : '🇮🇳'
      return {
        title: email || 'Unknown subscriber',
        subtitle: `${flag} ${locale || 'en'} · ${ts}`,
      }
    }
  }
}
