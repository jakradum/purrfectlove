export default {
  name: 'memberReport',
  title: 'Member Report',
  type: 'document',
  fields: [
    { name: 'reporter', title: 'Reported by', type: 'reference', to: [{ type: 'catSitter' }], validation: Rule => Rule.required() },
    { name: 'reported', title: 'Reported member', type: 'reference', to: [{ type: 'catSitter' }], validation: Rule => Rule.required() },
    {
      name: 'reason',
      title: 'Reason',
      type: 'string',
      options: { list: [
        { title: 'Inappropriate behaviour', value: 'inappropriate' },
        { title: 'Spam', value: 'spam' },
        { title: 'Impersonation', value: 'impersonation' },
        { title: 'Other', value: 'other' },
      ]},
      validation: Rule => Rule.required(),
    },
    { name: 'note', title: 'Additional note', type: 'text', rows: 3 },
    { name: 'resolved', title: 'Resolved', type: 'boolean', initialValue: false },
    { name: 'createdAt', title: 'Created At', type: 'datetime', initialValue: () => new Date().toISOString() },
  ],
  preview: {
    select: { reporter: 'reporter.username', reported: 'reported.username', reason: 'reason', resolved: 'resolved' },
    prepare({ reporter, reported, reason, resolved }) {
      return {
        title: `${resolved ? '✓ ' : '🚨 '}${reporter || '?'} → ${reported || '?'}`,
        subtitle: reason || '',
      }
    },
  },
}
