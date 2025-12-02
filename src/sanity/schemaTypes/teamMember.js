import {defineType, defineField} from 'sanity'

export default defineType({
  name: 'teamMember',
  title: 'Team Members',
  type: 'document',
  fields: [
    defineField({
      name: 'showOnWebsite',
      title: 'Show on Website',
      type: 'boolean',
      description: 'Toggle to display this team member on the public website',
      initialValue: false
    }),
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'slug',
      title: 'URL Slug',
      type: 'slug',
      options: {
        source: 'name',
        maxLength: 96
      },
      description: 'URL path (e.g. "jane-doe" → /about/jane-doe)',
      validation: Rule => Rule.custom((value, context) => {
        if (!context.document?.showOnWebsite) return true
        if (!value?.current) {
          return 'Slug is required when showing on website'
        }
        return true
      })
    }),
    defineField({
      name: 'role',
      title: 'Role',
      type: 'localeString',
      validation: Rule => Rule.custom((value, context) => {
        if (!context.document?.showOnWebsite) return true
        if (!value?.en && !value?.de) {
          return 'Role must be filled in at least one language when showing on website'
        }
        return true
      })
    }),
    defineField({
      name: 'bio',
      title: 'Bio',
      type: 'localeBlock',
      validation: Rule => Rule.custom((value, context) => {
        if (!context.document?.showOnWebsite) return true
        const hasEn = value?.en && value.en.length > 0
        const hasDe = value?.de && value.de.length > 0
        if (!hasEn && !hasDe) {
          return 'Bio must be filled in at least one language when showing on website'
        }
        return true
      })
    }),
    defineField({
      name: 'image',
      title: 'Photo',
      type: 'image',
      options: {hotspot: true},
      description: '1:1 square ratio recommended',
      validation: Rule => Rule.custom((value, context) => {
        if (!context.document?.showOnWebsite) return true
        if (!value?.asset) {
          return 'Photo is required when showing on website'
        }
        return true
      })
    }),
    defineField({
      name: 'order',
      title: 'Display Order',
      type: 'number',
      description: 'Position in the team grid (1 = first)',
      validation: Rule => Rule.required()
    })
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'role.en',
      media: 'image',
      showOnWebsite: 'showOnWebsite'
    },
    prepare({title, subtitle, media, showOnWebsite}) {
      return {
        title: `${showOnWebsite ? '✓ ' : ''}${title}`,
        subtitle: subtitle || 'No role set',
        media
      }
    }
  }
})