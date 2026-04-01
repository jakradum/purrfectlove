export default {
  name: 'broadcastMessage',
  title: 'Broadcast Message',
  type: 'document',
  fields: [
    {
      name: 'subject',
      title: 'Subject',
      type: 'string',
      validation: (Rule) => Rule.required().min(3).max(200),
    },
    {
      name: 'body',
      title: 'Body (plain text)',
      type: 'text',
      rows: 8,
      validation: (Rule) => Rule.required().min(10),
    },
    {
      name: 'signOff',
      title: 'Sign off name',
      type: 'string',
      description: 'Name that appears at the end of the message, e.g. "Pranav & the Purrfect Love team"',
    },
    {
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          { title: 'Draft', value: 'draft' },
          { title: 'Sent', value: 'sent' },
        ],
        layout: 'radio',
      },
      initialValue: 'draft',
    },
    {
      name: 'sentAt',
      title: 'Sent At',
      type: 'datetime',
      readOnly: true,
    },
    {
      name: 'sentCount',
      title: 'Recipients Sent To',
      type: 'number',
      readOnly: true,
    },
  ],
  preview: {
    select: {
      title: 'subject',
      status: 'status',
      sentAt: 'sentAt',
    },
    prepare({ title, status, sentAt }) {
      return {
        title: title || 'Untitled broadcast',
        subtitle: status === 'sent'
          ? `Sent ${sentAt ? new Date(sentAt).toLocaleDateString() : ''}`
          : 'Draft',
      }
    },
  },
}
