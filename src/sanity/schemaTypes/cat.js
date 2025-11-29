// sanity/schemas/cat.js
import {client} from '../lib/client'
import {CatApplicationsDisplay} from '../components/CatApplicationsDisplay'

// Custom slugify function that adds number suffix for duplicates
async function slugifyWithUnique(input, schemaType, context) {
  // Create base slug from input
  const baseSlug = input
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')

  // Check if this slug already exists (excluding current document)
  const currentId = context.parent._id || ''
  const existing = await client.fetch(
    `*[_type == "cat" && slug.current == $slug && _id != $currentId][0]`,
    { slug: baseSlug, currentId }
  )

  if (!existing) {
    return baseSlug
  }

  // Find highest number suffix for this base slug
  const similarSlugs = await client.fetch(
    `*[_type == "cat" && slug.current match $pattern && _id != $currentId].slug.current`,
    { pattern: `${baseSlug}*`, currentId }
  )

  // Extract numbers from existing slugs
  let maxNum = 1
  similarSlugs.forEach(slug => {
    const match = slug.match(new RegExp(`^${baseSlug}(\\d+)$`))
    if (match) {
      const num = parseInt(match[1], 10)
      if (num >= maxNum) maxNum = num + 1
    }
  })

  return `${baseSlug}${maxNum}`
}

export default {
  name: 'cat',
  title: 'Cats',
  type: 'document',
  fields: [
    // Applications display at the top - shows adoption status derived from applications
    {
      name: 'applicationsDisplay',
      title: 'Applications & Adoption Status',
      type: 'string',
      components: {
        field: CatApplicationsDisplay
      }
    },
    {
      name: 'name',
      title: 'Cat Name',
      type: 'string',
      validation: Rule => Rule.required()
    },
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'name',
        maxLength: 96,
        slugify: slugifyWithUnique
      },
      validation: Rule => Rule.required()
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
      validation: Rule => Rule.min(1).max(10).required()
    },
    {
      name: 'age',
      title: 'Age Group',
      type: 'string',
      options: {
        list: [
          {title: 'Kitten (0-6 months)', value: 'kitten'},
          {title: 'Young (6 months - 2 years)', value: 'young'},
          {title: 'Adult (2-7 years)', value: 'adult'},
          {title: 'Senior (7+ years)', value: 'senior'}
        ],
        layout: 'radio'
      },
      validation: Rule => Rule.required()
    },
    {
      name: 'ageMonths',
      title: 'Age (in months)',
      type: 'number',
      description: 'Exact age in months (optional)'
    },
    {
      name: 'gender',
      title: 'Gender',
      type: 'string',
      options: {
        list: [
          {title: 'Male', value: 'male'},
          {title: 'Female', value: 'female'}
        ],
        layout: 'radio'
      },
      validation: Rule => Rule.required()
    },
    {
      name: 'traits',
      title: 'Main Traits',
      type: 'string',
      description: 'One or two words separated by comma (e.g., quiet, moody eater, cuddler)',
      placeholder: 'quiet, playful, cuddler'
    },
    {
      name: 'description',
      title: 'Personality Description',
      type: 'text',
      rows: 5,
      description: 'Around 100 words',
      validation: Rule => Rule.max(500).required()
    },
    {
      name: 'locationEn',
      title: 'Locality (English)',
      type: 'string',
      description: 'Enter locality in English (e.g., Jayanagar, Koramangala). Cat will appear on English website only.',
      placeholder: 'Jayanagar',
      hidden: ({document}) => !!document?.locationDe,
      validation: Rule => Rule.custom((value, context) => {
        if (value && context.document?.locationDe) {
          return 'Cannot have both English and German locality. Please remove one.'
        }
        if (!value && !context.document?.locationDe) {
          return 'Please enter a locality (either English or German)'
        }
        return true
      })
    },
    {
      name: 'locationDe',
      title: 'Locality (German)',
      type: 'string',
      description: 'Enter locality in German (e.g., Berlin, München). Cat will appear on German website only.',
      placeholder: 'Berlin',
      hidden: ({document}) => !!document?.locationEn,
      validation: Rule => Rule.custom((value, context) => {
        if (value && context.document?.locationEn) {
          return 'Cannot have both English and German locality. Please remove one.'
        }
        if (!value && !context.document?.locationEn) {
          return 'Please enter a locality (either English or German)'
        }
        return true
      })
    },
    {
      name: 'healthStatus',
      title: 'Health Status',
      type: 'object',
      validation: Rule => Rule.required(),
      fields: [
        {
          name: 'vaccinated',
          type: 'boolean',
          title: 'Vaccinated',
          initialValue: false
        },
        {
          name: 'healthNotes',
          type: 'text',
          title: 'Additional Health Notes',
          rows: 3,
          description: 'Any special health information (neutering is assumed by default)'
        }
      ]
    },
    {
      name: 'specialNeeds',
      title: 'Special Needs',
      type: 'text',
      rows: 3,
      description: 'Any special care requirements or medical conditions'
    },
    {
      name: 'goodWith',
      title: 'Good With',
      type: 'object',
      fields: [
        {name: 'children', type: 'boolean', title: 'Children'},
        {name: 'cats', type: 'boolean', title: 'Other Cats'},
        {name: 'dogs', type: 'boolean', title: 'Dogs'}
      ]
    },
    {
      name: 'status',
      title: 'Adoption Status (Legacy)',
      type: 'string',
      options: {
        list: [
          {title: 'Available for Adoption', value: 'available'},
          {title: 'Application Pending', value: 'pending'},
          {title: 'Adopted', value: 'adopted'},
          {title: 'In Foster Care', value: 'foster'}
        ],
        layout: 'radio'
      },
      initialValue: 'available',
      hidden: true,
      readOnly: true
    },
    {
      name: 'featured',
      title: 'Featured on Homepage',
      type: 'boolean',
      description: 'Show this cat on the homepage featured section',
      initialValue: false
    }
  ],
  preview: {
    select: {
      title: 'name',
      media: 'photos.0',
      status: 'status',
      age: 'age',
      locationEn: 'locationEn',
      locationDe: 'locationDe'
    },
    prepare({title, media, status, age, locationEn, locationDe}) {
      const statusLabels = {
        available: 'Available',
        pending: 'Pending',
        adopted: 'Adopted',
        foster: 'Foster'
      }
      const lang = locationDe ? 'DE' : locationEn ? 'EN' : 'No locale'
      return {
        title,
        subtitle: `${age || 'Unknown age'} | ${statusLabels[status] || 'No status'} | ${lang}`,
        media
      }
    }
  },
  orderings: [
    {
      title: 'Name, A-Z',
      name: 'nameAsc',
      by: [{field: 'name', direction: 'asc'}]
    },
    {
      title: 'Status',
      name: 'statusAsc',
      by: [{field: 'status', direction: 'asc'}]
    },
    {
      title: 'Newest First',
      name: 'newestFirst',
      by: [{field: '_createdAt', direction: 'desc'}]
    }
  ]
}
