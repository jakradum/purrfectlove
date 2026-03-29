export default {
  name: 'sittingFeedback',
  type: 'document',
  title: 'Sitting Feedback',
  fields: [
    { name: 'reviewer', type: 'reference', to: [{ type: 'catSitter' }] },
    { name: 'reviewee', type: 'reference', to: [{ type: 'catSitter' }] },
    { name: 'fulfilled', type: 'boolean', title: 'Was request fulfilled?' },
    { name: 'rating', type: 'number', validation: Rule => Rule.min(1).max(5) },
    { name: 'comment', type: 'text', validation: Rule => Rule.max(500) },
    { name: 'createdAt', type: 'datetime' },
  ],
}
