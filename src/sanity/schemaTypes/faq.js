// sanity/schemas/faq.js
export default {
  name: 'faq',
  title: 'FAQs',
  type: 'document',
  fieldsets: [
    {
      name: 'english',
      title: 'English Content',
      options: { collapsible: true, collapsed: false }
    },
    {
      name: 'german',
      title: 'German Content (Deutscher Inhalt)',
      options: { collapsible: true, collapsed: false }
    }
  ],
  fields: [
    {
      name: 'questionEn',
      title: 'Question (English)',
      type: 'string',
      fieldset: 'english',
      validation: Rule => Rule.required().error('English question is required')
    },
    {
      name: 'answerEn',
      title: 'Answer (English)',
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
      fieldset: 'english',
      validation: Rule => Rule.required().error('English answer is required')
    },
    {
      name: 'questionDe',
      title: 'Question (German / Frage)',
      type: 'string',
      fieldset: 'german',
      validation: Rule => Rule.required().error('German question is required')
    },
    {
      name: 'answerDe',
      title: 'Answer (German / Antwort)',
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
      fieldset: 'german',
      validation: Rule => Rule.required().error('German answer is required')
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
      description: 'Lower numbers appear first',
      validation: Rule => Rule.required().min(1).error('Display order is required')
    }
  ],
  preview: {
    select: {
      questionEn: 'questionEn',
      questionDe: 'questionDe',
      category: 'category'
    },
    prepare({questionEn, questionDe, category}) {
      const categoryLabels = {
        process: 'Adoption Process',
        requirements: 'Requirements',
        fees: 'Costs & Fees',
        cats: 'The Cats',
        after: 'After Adoption',
        location: 'Location & Logistics',
        general: 'General'
      }
      return {
        title: questionEn || questionDe || 'Untitled FAQ',
        subtitle: categoryLabels[category] || category
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
    }
  ]
}