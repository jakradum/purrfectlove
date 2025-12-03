// sanity/schemas/faq.js
export default {
  name: 'faq',
  title: 'FAQs',
  type: 'document',
  fields: [
    {
      name: 'language',
      title: 'Language',
      type: 'string',
      hidden: true,
      options: {
        list: [
          {title: 'English', value: 'en'},
          {title: 'German (Deutsch)', value: 'de'}
        ]
      },
      validation: Rule => Rule.required().error('Please select a language')
    },
    {
      name: 'question',
      title: 'Question',
      type: 'string',
      validation: Rule => Rule.required().error('Question is required')
    },
    {
      name: 'answer',
      title: 'Answer',
      type: 'array',
      of: [
        {
          type: 'block',
          styles: [{title: 'Normal', value: 'normal'}],
          lists: [],
          marks: {
            decorators: [
              {title: 'Bold', value: 'strong'},
              {title: 'Italic', value: 'em'}
            ],
            annotations: [
              {
                name: 'link',
                type: 'object',
                title: 'Link',
                fields: [
                  {
                    name: 'href',
                    type: 'url',
                    title: 'URL',
                    validation: Rule => Rule.uri({
                      scheme: ['http', 'https', 'mailto', 'tel']
                    })
                  }
                ]
              }
            ]
          }
        }
      ],
      validation: Rule => Rule.required().error('Answer is required')
    },
    {
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          {title: 'Adoption Process', value: 'process'},
          {title: 'Requirements', value: 'requirements'},
          {title: 'Costs & Fees', value: 'fees'},
          {title: 'The Cats', value: 'cats'},
          {title: 'After Adoption', value: 'after'},
          {title: 'Location & Logistics', value: 'location'},
          {title: 'General', value: 'general'}
        ]
      },
      validation: Rule => Rule.required().error('Category is required')
    },
    {
      name: 'order',
      title: 'Display Order',
      type: 'number',
      description: 'Position within category (1 = first)',
      validation: Rule => Rule.required().min(1).error('Display order is required')
    }
  ],
  preview: {
    select: {
      question: 'question',
      category: 'category',
      language: 'language'
    },
    prepare({question, category, language}) {
      const categoryLabels = {
        process: 'Adoption Process',
        requirements: 'Requirements',
        fees: 'Costs & Fees',
        cats: 'The Cats',
        after: 'After Adoption',
        location: 'Location & Logistics',
        general: 'General'
      }
      const langLabel = language === 'de' ? 'DE' : 'EN'
      return {
        title: question || 'Untitled FAQ',
        subtitle: `${langLabel} | ${categoryLabels[category] || category}`
      }
    }
  },
  orderings: [
    {
      title: 'Display Order',
      name: 'orderAsc',
      by: [{field: 'order', direction: 'asc'}]
    },
    {
      title: 'Category, then Order',
      name: 'categoryOrder',
      by: [
        {field: 'category', direction: 'asc'},
        {field: 'order', direction: 'asc'}
      ]
    },
    {
      title: 'Language',
      name: 'languageAsc',
      by: [{field: 'language', direction: 'asc'}]
    }
  ]
}
