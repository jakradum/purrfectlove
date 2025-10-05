// sanity/schemas/successStory.js
export default {
  name: 'successStory',
  title: 'Success Stories',
  type: 'document',
  fields: [
    {
      name: 'cat',
      title: 'Cat',
      type: 'reference',
      to: [{type: 'cat'}],
      validation: Rule => Rule.required()
    },
    {
      name: 'adopterName',
      title: 'Adopter Name',
      type: 'string',
      validation: Rule => Rule.required()
    },
    {
      name: 'adoptionDate',
      title: 'Adoption Date',
      type: 'date',
      validation: Rule => Rule.required()
    },
    {
      name: 'testimonial',
      title: 'Testimonial',
      type: 'text',
      rows: 6,
      validation: Rule => Rule.required().min(50).max(500)
    },
    {
      name: 'photos',
      title: 'Photos',
      type: 'array',
      of: [{
        type: 'image',
        options: {
          hotspot: true
        }
      }],
      description: 'Photos of the cat in their new home'
    },
    {
      name: 'featured',
      title: 'Featured on Homepage',
      type: 'boolean',
      initialValue: false
    },
    {
      name: 'consentGiven',
      title: 'Consent to Publish',
      type: 'boolean',
      description: 'Adopter has given permission to share this story',
      validation: Rule => Rule.required().valid(true)
    }
  ],
  preview: {
    select: {
      catName: 'cat.name',
      adopter: 'adopterName',
      date: 'adoptionDate'
    },
    prepare({catName, adopter, date}) {
      return {
        title: catName || 'Unknown Cat',
        subtitle: `Adopted by ${adopter} on ${date || 'Unknown date'}`
      }
    }
  },
  orderings: [
    {
      title: 'Most Recent First',
      name: 'dateDesc',
      by: [{field: 'adoptionDate', direction: 'desc'}]
    }
  ]
}