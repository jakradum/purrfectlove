// sanity/schemas/faq.js
export default {
  name: 'faq',
  title: 'FAQs',
  type: 'document',
  fields: [
    {
      name: 'question',
      title: 'Question',
      type: 'string',
      validation: Rule => Rule.required()
    },
    {
      name: 'answer',
      title: 'Answer',
      type: 'text',
      rows: 5,
      validation: Rule => Rule.required()
    },
    {
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          {title: 'Adoption Process', value: 'process'},
          {title: 'Cat Care', value: 'care'},
          {title: 'Fees & Costs', value: 'fees'},
          {title: 'Requirements', value: 'requirements'},
          {title: 'General', value: 'general'}
        ]
      },
      validation: Rule => Rule.required()
    },
    {
      name: 'order',
      title: 'Display Order',
      type: 'number',
      description: 'Lower numbers appear first'
    }
  ],
  preview: {
    select: {
      title: 'question',
      subtitle: 'category'
    }
  },
  orderings: [
    {
      title: 'Display Order',
      name: 'orderAsc',
      by: [{field: 'order', direction: 'asc'}]
    }
  ]
}