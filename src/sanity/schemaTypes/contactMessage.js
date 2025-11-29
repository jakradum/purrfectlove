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
      type: 'string',
      options: {
        list: [
          { title: 'Lucia', value: 'lucia' },
          { title: 'Besly', value: 'besly' },
          { title: 'Devraj', value: 'devraj' }
        ]
      }
    },
    {
      name: 'notes',
      title: 'Internal Notes',
      type: 'text',
      rows: 3
    }
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
      assignedTo: 'assignedTo',
      date: 'submittedAt'
    },
    prepare({ name, email, locale, status, assignedTo, date }) {
      const statusLabels = {
        open: 'Open',
        closed: 'Closed'
      }

      const assignedLabels = {
        lucia: 'Lucia',
        besly: 'Besly',
        devraj: 'Devraj'
      }

      const countryFlag = locale === 'de' ? '🇩🇪' : '🇮🇳'
      const statusIcon = status === 'open' ? '🔵' : '✅'

      return {
        title: `${countryFlag} ${name}`,
        subtitle: `${statusIcon} ${statusLabels[status] || 'Open'} • ${assignedLabels[assignedTo] || 'Unassigned'} • ${new Date(date).toLocaleDateString()}`
      }
    }
  }
}
