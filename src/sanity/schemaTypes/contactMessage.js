export default {
  name: 'contactMessage',
  title: 'Contact Message',
  type: 'document',
  fields: [
    {
      name: 'name',
      title: 'Name',
      type: 'string',
      readOnly: true
    },
    {
      name: 'email',
      title: 'Email',
      type: 'string',
      readOnly: true
    },
    {
      name: 'phone',
      title: 'Phone',
      type: 'string',
      readOnly: true
    },
    {
      name: 'message',
      title: 'Message',
      type: 'text',
      readOnly: true
    },
    {
      name: 'locale',
      title: 'Language',
      type: 'string',
      readOnly: true,
      options: {
        list: [
          { title: 'English (India)', value: 'en' },
          { title: 'German', value: 'de' }
        ]
      }
    },
    {
      name: 'submittedAt',
      title: 'Submitted At',
      type: 'datetime',
      readOnly: true
    },
    // For official use
    {
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          { title: 'Open', value: 'open' },
          { title: 'Closed', value: 'closed' }
        ]
      },
      initialValue: 'open'
    },
    {
      name: 'assignedTo',
      title: 'Assigned To',
      type: 'reference',
      to: [{ type: 'teamMember' }],
      options: { disableNew: true }
    },
    {
      name: 'notes',
      title: 'Internal Notes',
      type: 'text',
      rows: 3
    },
    {
      name: 'aiResponded',
      title: 'AI Response Sent',
      type: 'boolean',
      readOnly: true,
      initialValue: false,
    },
    {
      name: 'aiRespondedAt',
      title: 'AI Response Sent At',
      type: 'datetime',
      readOnly: true,
      hidden: ({parent}) => !parent?.aiResponded,
    },
    {
      name: 'aiResponseText',
      title: 'AI Response (sent to applicant)',
      type: 'text',
      readOnly: true,
      rows: 10,
      hidden: ({parent}) => !parent?.aiResponded,
    },
  ],

  orderings: [
    {
      title: 'Newest First',
      name: 'submittedAtDesc',
      by: [{ field: 'submittedAt', direction: 'desc' }]
    },
    {
      title: 'Oldest First',
      name: 'submittedAtAsc',
      by: [{ field: 'submittedAt', direction: 'asc' }]
    },
    {
      title: 'Status',
      name: 'status',
      by: [{ field: 'status', direction: 'asc' }]
    }
  ],

  preview: {
    select: {
      name: 'name',
      email: 'email',
      locale: 'locale',
      status: 'status',
      assignedToName: 'assignedTo.name',
      date: 'submittedAt',
      aiResponded: 'aiResponded',
    },
    prepare({ name, email, locale, status, assignedToName, date, aiResponded }) {
      const statusLabels = {
        open: 'Open',
        closed: 'Closed'
      }

      const countryFlag = locale === 'de' ? '🇩🇪' : '🇮🇳'
      const statusIcon = status === 'open' ? '🔵' : '✅'
      const aiPrefix = aiResponded ? '🤖 AI Responded • ' : ''

      return {
        title: `${countryFlag} ${name}`,
        subtitle: `${aiPrefix}${statusIcon} ${statusLabels[status] || 'Open'} • ${assignedToName || 'Unassigned'} • ${new Date(date).toLocaleDateString()}`
      }
    }
  }
}
