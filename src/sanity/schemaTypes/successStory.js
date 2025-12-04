import {defineType, defineField} from 'sanity'

export default defineType({
  name: 'successStory',
  title: 'Success Stories',
  type: 'document',
  fields: [
    defineField({
      name: 'published',
      title: 'Published',
      type: 'boolean',
      description: 'Toggle to include this story on the website',
      initialValue: false
    }),
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
      options: {hotspot: true},
      description: '1:1 square ratio recommended'
    }),
    defineField({
      name: 'language',
      title: 'Site Version',
      type: 'string',
      description: 'Which site version(s) will this story appear on?',
      options: {
        list: [
          {title: 'English site only', value: 'en'},
          {title: 'German site only', value: 'de'},
          {title: 'Both sites', value: 'both'}
        ]
      },
      initialValue: 'both',
      validation: Rule => Rule.required()
    })
  ],
  preview: {
    select: {
      catName: 'catName',
      adopterName: 'adopterName',
      published: 'published',
      media: 'image'
    },
    prepare({catName, adopterName, published, media}) {
      return {
        title: `${published ? '✓ ' : ''}${catName || 'Untitled'}`,
        subtitle: adopterName ? `Adopted by ${adopterName}` : 'No adopter name',
        media
      }
    }
  }
})