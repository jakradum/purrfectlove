export default {
  name: 'blockedUser',
  type: 'document',
  title: 'Blocked User',
  fields: [
    { name: 'blocker', type: 'reference', to: [{ type: 'catSitter' }] },
    { name: 'blocked', type: 'reference', to: [{ type: 'catSitter' }] },
    {
      name: 'reason',
      type: 'string',
      options: { list: ['Spam', 'Harassment', 'Other'] },
    },
    { name: 'createdAt', type: 'datetime' },
  ],
}
