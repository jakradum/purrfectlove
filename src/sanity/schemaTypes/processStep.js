import {defineType, defineField} from 'sanity'

export default defineType({
  name: 'processStep',
  title: 'Process Steps',
  type: 'document',
  fields: [
    defineField({
      name: 'stepNumber',
      title: 'Step Number',
      type: 'number',
      validation: Rule => Rule.required().min(1).max(6)
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