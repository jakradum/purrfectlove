export default {
  name: 'sitRecord',
  title: 'Sit Record',
  type: 'document',
  fields: [
    { name: 'sitter', title: 'Sitter', type: 'reference', to: [{ type: 'catSitter' }], validation: Rule => Rule.required() },
    { name: 'parent', title: 'Cat Parent', type: 'reference', to: [{ type: 'catSitter' }], validation: Rule => Rule.required() },
    { name: 'startDate', title: 'Sit Start Date', type: 'date', validation: Rule => Rule.required() },
    { name: 'endDate', title: 'Sit End Date', type: 'date', validation: Rule => Rule.required() },
    {
      name: 'sitterResponse',
      title: 'Sitter Response',
      type: 'string',
      options: { list: [
        { title: 'Yes, great', value: 'yes_great' },
        { title: 'Yes, with feedback', value: 'yes_feedback' },
        { title: "Didn't happen", value: 'no' },
      ]},
    },
    {
      name: 'parentResponse',
      title: 'Parent Response',
      type: 'string',
      options: { list: [
        { title: 'Yes, great', value: 'yes_great' },
        { title: 'Yes, with feedback', value: 'yes_feedback' },
        { title: "Didn't happen", value: 'no' },
      ]},
    },
    { name: 'sitterFeedbackNote', title: 'Sitter Feedback Note', type: 'text', rows: 3, description: 'Admin-only' },
    { name: 'parentFeedbackNote', title: 'Parent Feedback Note', type: 'text', rows: 3, description: 'Admin-only' },
    { name: 'promptSentAt', title: 'Confirmation Prompt Sent At', type: 'datetime' },
    { name: 'createdAt', title: 'Created At', type: 'datetime', initialValue: () => new Date().toISOString() },
  ],
  preview: {
    select: { sitter: 'sitter.username', parent: 'parent.username', start: 'startDate', end: 'endDate' },
    prepare({ sitter, parent, start, end }) {
      return { title: `${sitter || '?'} ↔ ${parent || '?'}`, subtitle: `${start || '?'} – ${end || '?'}` }
    },
  },
}
