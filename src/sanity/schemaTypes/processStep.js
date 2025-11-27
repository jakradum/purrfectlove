import {defineType, defineField} from 'sanity'

export default defineType({
  name: 'processStep',
  title: 'Process Steps',
  type: 'document',
  preview: {
    select: {
      stepNumber: 'stepNumber',
      titleEn: 'title.en',
      titleDe: 'title.de'
    },
    prepare({ stepNumber, titleEn, titleDe }) {
      const title = [titleEn, titleDe].filter(Boolean).join(' | ')
      return {
        title: title || 'Untitled',
        subtitle: stepNumber ? `Step ${stepNumber}` : ''
      }
    }
  },
  fields: [
    defineField({
      name: 'stepNumber',
      title: 'Step Number',
      type: 'number',
      validation: Rule => Rule.required().min(1).max(7)
    }),
    defineField({
      name: 'title',
      title: 'Title',
      type: 'localeString',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'localeText'
    }),
    defineField({
      name: 'icon',
      title: 'Icon (optional)',
      type: 'string'
    })
  ]
})