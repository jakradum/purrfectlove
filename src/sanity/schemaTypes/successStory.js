import {defineType, defineField} from 'sanity'

export default defineType({
  name: 'successStory',
  title: 'Success Stories',
  type: 'document',
  fields: [
    defineField({
      name: 'catName',
      title: 'Cat Name',
      type: 'string',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'adopterName',
      title: 'Adopter Name',
      type: 'string',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'adoptionDate',
      title: 'Adoption Date',
      type: 'date',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'quote',
      title: 'Quote',
      type: 'localeText'
    }),
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      options: {hotspot: true}
    }),
    defineField({
      name: 'language',
      title: 'Language',
      type: 'string',
      options: {
        list: [
          {title: 'English', value: 'en'},
          {title: 'German', value: 'de'},
          {title: 'Both', value: 'both'}
        ]
      },
      initialValue: 'both'
    })
  ]
})