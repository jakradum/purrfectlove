export default {
  name: 'membershipRequest',
  title: 'Membership Request',
  type: 'document',
  fields: [
    { name: 'name', title: 'Name', type: 'string', validation: Rule => Rule.required() },
    { name: 'phone', title: 'Phone', type: 'string' },
    { name: 'email', title: 'Email', type: 'string' },
    { name: 'message', title: 'Why they want to join', type: 'text', rows: 4 },
    { name: 'submittedAt', title: 'Submitted At', type: 'datetime', validation: Rule => Rule.required() },
    {
      name: 'status',
      title: 'Status',
      type: 'string',
      options: { list: ['pending', 'approved', 'rejected'] },
      initialValue: 'pending',
    },
  ],
  preview: {
    select: { title: 'name', subtitle: 'status', date: 'submittedAt' },
    prepare({ title, subtitle, date }) {
      return {
        title: title || 'Unknown',
        subtitle: `${subtitle || 'pending'} · ${date ? new Date(date).toLocaleDateString() : ''}`,
      }
    },
  },
}
