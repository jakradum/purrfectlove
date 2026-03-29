export default {
  name: 'message',
  type: 'document',
  title: 'Message',
  fields: [
    { name: 'from', type: 'reference', to: [{ type: 'catSitter' }], readOnly: true },
    { name: 'to', type: 'reference', to: [{ type: 'catSitter' }], readOnly: true },
    { name: 'body', type: 'text', readOnly: true },
    { name: 'read', type: 'boolean', initialValue: false },
    { name: 'readAt', type: 'datetime' },
    { name: 'markedAsSpam', type: 'boolean', initialValue: false },
    { name: 'createdAt', type: 'datetime', readOnly: true },
  ],
  preview: { select: { title: 'from.name', subtitle: 'body' } },
}
