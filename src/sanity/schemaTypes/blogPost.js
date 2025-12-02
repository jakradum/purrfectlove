import {defineType, defineField} from 'sanity'

function truncate(str, maxLength) {
  if (!str) return ''
  if (str.length <= maxLength) return str
  return str.substring(0, maxLength) + '..'
}

export default defineType({
  name: 'blogPost',
  title: 'Blog Posts',
  type: 'document',
  preview: {
    select: {
      titleEn: 'title.en',
      titleDe: 'title.de',
      media: 'featuredImage',
      featuredOnHomePage: 'featuredOnHomePage'
    },
    prepare({titleEn, titleDe, media, featuredOnHomePage}) {
      let displayTitle = ''

      if (titleEn && titleDe) {
        displayTitle = `${truncate(titleEn, 12)} | ${truncate(titleDe, 12)}`
      } else if (titleEn) {
        displayTitle = titleEn
      } else if (titleDe) {
        displayTitle = titleDe
      } else {
        displayTitle = 'Untitled'
      }

      return {
        title: displayTitle,
        subtitle: featuredOnHomePage ? 'Featured' : undefined,
        media
      }
    }
  },
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'localeString',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'author',
      title: 'Author (English)',
      type: 'reference',
      to: [{type: 'teamMember'}],
      description: 'Optional - select a team member as author for English version',
      options: { disableNew: true }
    }),
    defineField({
      name: 'authorDe',
      title: 'Author (German)',
      type: 'reference',
      to: [{type: 'teamMember'}],
      description: 'Optional - select a team member as author for German version',
      options: { disableNew: true }
    }),
    defineField({
      name: 'slug',
      title: 'Slug (English)',
      type: 'slug',
      options: {source: 'title.en'},
      description: 'URL path (e.g. "cat-care-tips" → /guides/blog/cat-care-tips)',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'slugDe',
      title: 'Slug (German)',
      type: 'slug',
      options: {source: 'title.de'},
      description: 'URL path for German (e.g. "katzen-tipps" → /de/guides/blog/katzen-tipps)'
    }),
    defineField({
      name: 'excerpt',
      title: 'Excerpt',
      type: 'localeText',
      description: 'Short preview shown at the top of the blog post'
    }),
    defineField({
      name: 'content',
      title: 'Content',
      type: 'localeBlock'
    }),
    defineField({
      name: 'featuredImage',
      title: 'Featured Image',
      type: 'image',
      options: {hotspot: true},
      description: 'Main image shown on cards and at top of post'
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published Date',
      type: 'datetime',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'featuredOnHomePage',
      title: 'Feature on Home Page',
      type: 'boolean',
      initialValue: false,
      description: 'Maximum 4 posts can be featured at a time',
      validation: Rule => Rule.custom(async (value, context) => {
        if (!value) return true

        const {document, getClient} = context
        const client = getClient({apiVersion: '2024-01-01'})

        const featuredCount = await client.fetch(
          `count(*[_type == "blogPost" && featuredOnHomePage == true && _id != $currentId])`,
          {currentId: document._id}
        )

        if (featuredCount >= 4) {
          return 'Maximum 4 posts can be featured. Please unfeature another post first.'
        }

        return true
      })
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
      initialValue: 'both',
      validation: Rule => Rule.custom((value, context) => {
        const {document} = context
        const titleEn = document?.title?.en
        const titleDe = document?.title?.de
        const contentEn = document?.content?.en
        const contentDe = document?.content?.de
        const slugEn = document?.slug?.current
        const slugDe = document?.slugDe?.current

        const hasEnglish = titleEn && slugEn && contentEn && contentEn.length > 0
        const hasGerman = titleDe && slugDe && contentDe && contentDe.length > 0

        if (value === 'en') {
          const missingFields = []
          if (!titleEn) missingFields.push('English title')
          if (!slugEn) missingFields.push('English slug')
          if (!contentEn || contentEn.length === 0) missingFields.push('English content')

          if (missingFields.length > 0) {
            return `"English" requires: ${missingFields.join(', ')}`
          }
        }

        if (value === 'de') {
          const missingFields = []
          if (!titleDe) missingFields.push('German title')
          if (!slugDe) missingFields.push('German slug')
          if (!contentDe || contentDe.length === 0) missingFields.push('German content')

          if (missingFields.length > 0) {
            return `"German" requires: ${missingFields.join(', ')}`
          }
        }

        if (value === 'both') {
          const missingFields = []
          if (!titleEn) missingFields.push('English title')
          if (!titleDe) missingFields.push('German title')
          if (!slugEn) missingFields.push('English slug')
          if (!slugDe) missingFields.push('German slug')
          if (!contentEn || contentEn.length === 0) missingFields.push('English content')
          if (!contentDe || contentDe.length === 0) missingFields.push('German content')

          if (missingFields.length > 0) {
            return `"Both" requires: ${missingFields.join(', ')}`
          }
        }

        return true
      })
    })
  ]
})