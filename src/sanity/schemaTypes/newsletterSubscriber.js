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
    // Not readOnly - staff can manually toggle this in Studio too, not just
    // via the unsubscribe link. The newsletter-send cron excludes anyone
    // with this set to true.
    { name: 'unsubscribed', title: 'Unsubscribed', type: 'boolean', initialValue: false },
    // One-time token embedded in each sent newsletter's unsubscribe link -
    // see /api/newsletter/unsubscribe. Not tied to a session or login, so
    // this token is effectively the only thing authorizing that action.
    { name: 'unsubscribeToken', title: 'Unsubscribe Token', type: 'string', readOnly: true, hidden: true },
  ],
  orderings: [
    { title: 'Newest first', name: 'subscribedAtDesc', by: [{ field: 'subscribedAt', direction: 'desc' }] },
  ],
  preview: {
    select: { email: 'email', locale: 'locale', subscribedAt: 'subscribedAt', unsubscribed: 'unsubscribed' },
    prepare({ email, locale, subscribedAt, unsubscribed }) {
      const ts = subscribedAt
        ? new Date(subscribedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
        : ''
      const flag = locale === 'de' ? '🇩🇪' : '🇮🇳'
      const status = unsubscribed ? ' · unsubscribed' : ''
      return {
        title: email || 'Unknown subscriber',
        subtitle: `${flag} ${locale || 'en'} · ${ts}${status}`,
      }
    }
  }
}
