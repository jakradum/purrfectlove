export default {
  name: 'notification',
  title: 'Notification',
  type: 'document',
  fields: [
    {
      name: 'recipient',
      title: 'Recipient',
      type: 'reference',
      to: [{ type: 'catSitter' }],
      validation: Rule => Rule.required(),
    },
    {
      name: 'sender',
      title: 'Sender (optional)',
      type: 'reference',
      to: [{ type: 'catSitter' }],
    },
    {
      name: 'type',
      title: 'Type',
      type: 'string',
      options: {
        list: [
          { title: 'New inbox message', value: 'message' },
          { title: 'Sit request', value: 'sit_request' },
          { title: 'Membership approved', value: 'membership_approved' },
          { title: 'Sit confirmation prompt', value: 'sit_confirm' },
        ],
      },
      validation: Rule => Rule.required(),
    },
    { name: 'linkPath', title: 'Link Path', type: 'string', description: 'Relative URL to navigate to on click (e.g. /inbox?to=abc123)' },
    { name: 'read', title: 'Read', type: 'boolean', initialValue: false },
    { name: 'createdAt', title: 'Created At', type: 'datetime', initialValue: () => new Date().toISOString() },
  ],
  preview: {
    select: { type: 'type', read: 'read', recipient: 'recipient.username' },
    prepare({ type, read, recipient }) {
      return {
        title: `${read ? '✓' : '●'} ${type}`,
        subtitle: `→ ${recipient || 'unknown'}`,
      }
    },
  },
}
