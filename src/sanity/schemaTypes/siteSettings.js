import {defineType, defineField} from 'sanity'

export default defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  fields: [
    defineField({
      name: 'successStoriesEnabled',
      title: 'Show Success Stories Section',
      type: 'boolean',
      description: 'Enable to display success stories on the website. Requires at least 4 published stories.',
      initialValue: false,
      validation: Rule => Rule.custom(async (value, context) => {
        if (!value) return true

        const {getClient} = context
        const client = getClient({apiVersion: '2024-01-01'})

        const publishedCount = await client.fetch(
          `count(*[_type == "successStory" && published == true])`
        )

        if (publishedCount < 4) {
          return `Cannot enable: need at least 4 published stories (currently ${publishedCount})`
        }

        return true
      })
    })
  ],
  preview: {
    prepare() {
      return {
        title: 'Site Settings'
      }
    }
  }
})
