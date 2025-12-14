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
      featuredOnHomePageEn: 'featuredOnHomePageEn',
      featuredOnHomePageDe: 'featuredOnHomePageDe'
    },
    prepare({titleEn, titleDe, media, featuredOnHomePageEn, featuredOnHomePageDe}) {
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

      const featured = []
      if (featuredOnHomePageEn) featured.push('EN')
      if (featuredOnHomePageDe) featured.push('DE')
      const subtitle = featured.length > 0 ? `Featured: ${featured.join(', ')}` : undefined

      return {
        title: displayTitle,
        subtitle,
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
      validation: Rule => Rule.custom((value, context) => {
        const language = context.document?.language
        // Only required if site version is English or Both
        if ((language === 'en' || language === 'both') && !value?.current) {
          return 'English slug is required for English site'
        }
        return true
      })
    }),
    defineField({
      name: 'slugDe',
      title: 'Slug (German)',
      type: 'slug',
      options: {source: 'title.de'},
      description: 'URL path for German (e.g. "katzen-tipps" → /de/guides/blog/katzen-tipps)',
      validation: Rule => Rule.custom((value, context) => {
        const language = context.document?.language
        // Only required if site version is German or Both
        if ((language === 'de' || language === 'both') && !value?.current) {
          return 'German slug is required for German site'
        }
        return true
      })
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
      name: 'featuredOnHomePageEn',
      title: 'Feature on English Home Page',
      type: 'boolean',
      initialValue: false,
      description: 'Show this post on the English homepage (maximum 4)',
      validation: Rule => Rule.custom(async (value, context) => {
        if (!value) return true

        const {document, getClient} = context
        const client = getClient({apiVersion: '2024-01-01'})

        const featuredCount = await client.fetch(
          `count(*[_type == "blogPost" && featuredOnHomePageEn == true && _id != $currentId])`,
          {currentId: document._id}
        )

        if (featuredCount >= 4) {
          return 'Maximum 4 posts can be featured on English homepage. Please unfeature another post first.'
        }

        return true
      })
    }),
    defineField({
      name: 'featuredOnHomePageDe',
      title: 'Feature on German Home Page',
      type: 'boolean',
      initialValue: false,
      description: 'Show this post on the German homepage (maximum 4)',
      validation: Rule => Rule.custom(async (value, context) => {
        if (!value) return true

        const {document, getClient} = context
        const client = getClient({apiVersion: '2024-01-01'})

        const featuredCount = await client.fetch(
          `count(*[_type == "blogPost" && featuredOnHomePageDe == true && _id != $currentId])`,
          {currentId: document._id}
        )

        if (featuredCount >= 4) {
          return 'Maximum 4 posts can be featured on German homepage. Please unfeature another post first.'
        }

        return true
      })
    }),
    defineField({
      name: 'language',
      title: 'Site Version',
      type: 'string',
      description: 'Select which site(s) this post appears on. Content (title, slug, body) must be filled for the selected language(s) before publishing.',
      options: {
        list: [
          {title: 'English site only', value: 'en'},
          {title: 'German site only', value: 'de'},
          {title: 'Both sites', value: 'both'}
        ]
      },
      initialValue: 'both',
      validation: Rule => Rule.required().custom((value, context) => {
        const {document} = context
        const titleEn = document?.title?.en
        const titleDe = document?.title?.de
        const contentEn = document?.content?.en
        const contentDe = document?.content?.de

        if (value === 'en') {
          const missingFields = []
          if (!titleEn) missingFields.push('English title')
          if (!contentEn || contentEn.length === 0) missingFields.push('English content')

          if (missingFields.length > 0) {
            return `"English" requires: ${missingFields.join(', ')}`
          }
        }

        if (value === 'de') {
          const missingFields = []
          if (!titleDe) missingFields.push('German title')
          if (!contentDe || contentDe.length === 0) missingFields.push('German content')

          if (missingFields.length > 0) {
            return `"German" requires: ${missingFields.join(', ')}`
          }
        }

        if (value === 'both') {
          const missingFields = []
          if (!titleEn) missingFields.push('English title')
          if (!titleDe) missingFields.push('German title')
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