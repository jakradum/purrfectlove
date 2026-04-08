export default {
  name: 'portalFeedback',
  title: 'Portal Feedback',
  type: 'document',
  fields: [
    {
      name: 'body',
      title: 'Report Body',
      type: 'text',
      rows: 4,
      validation: Rule => Rule.required(),
    },
    {
      name: 'pageUrl',
      title: 'Page URL',
      type: 'string',
    },
    {
      name: 'screenshotUrl',
      title: 'Screenshot URL',
      type: 'url',
    },
    {
      name: 'submittedBy',
      title: 'Submitted By',
      type: 'reference',
      to: [{ type: 'catSitter' }],
    },
    {
      name: 'date',
      title: 'Date',
      type: 'date',
      initialValue: () => new Date().toISOString().slice(0, 10),
    },
    {
      name: 'status',
      title: 'Status',
      type: 'string',
      initialValue: 'new',
      options: {
        list: [
          { title: 'New', value: 'new' },
          { title: 'Reviewed', value: 'reviewed' },
          { title: 'Resolved', value: 'resolved' },
        ],
        layout: 'radio',
      },
    },
  ],
  preview: {
    select: {
      body: 'body',
      submittedBy: 'submittedBy.name',
      date: 'date',
      status: 'status',
    },
    prepare({ body, submittedBy, date, status }) {
      return {
        title: body ? body.slice(0, 60) : '(no content)',
        subtitle: `${submittedBy || 'Unknown'} · ${date || ''} · ${status || 'new'}`,
      };
    },
  },
}
