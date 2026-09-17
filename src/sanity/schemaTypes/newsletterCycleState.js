// Singleton document (fixed _id: 'newsletterCycleState', same pattern as
// siteSettings) tracking which theme was sent last, so the next send can be
// picked randomly from the current month's eligible themes while avoiding
// an immediate repeat. See src/lib/newsletterCycle.js.
export default {
  name: 'newsletterCycleState',
  title: 'Newsletter Cycle State',
  type: 'document',
  fields: [
    { name: 'lastTheme', title: 'Last Theme Sent', type: 'reference', to: [{ type: 'newsletterTheme' }], readOnly: true },
    { name: 'lastSentAt', title: 'Last Sent At', type: 'datetime', readOnly: true },
  ],
  preview: {
    select: { themeName: 'lastTheme.name', lastSentAt: 'lastSentAt' },
    prepare({ themeName, lastSentAt }) {
      const ts = lastSentAt ? new Date(lastSentAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'never'
      return { title: 'Newsletter Cycle State', subtitle: `Last theme: ${themeName ?? 'none'} · ${ts}` }
    }
  }
}
