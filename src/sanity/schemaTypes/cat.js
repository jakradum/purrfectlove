// sanity/schemas/cat.js
export default {
  name: 'cat',
  title: 'Cats',
  type: 'document',
  fields: [
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
        maxLength: 96
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
      name: 'location',
      title: 'Area/Locality',
      type: 'string',
      description: 'Current location in Bangalore (e.g., Jayanagar, Koramangala)',
      placeholder: 'Jayanagar'
    },
    {
      name: 'healthStatus',
      title: 'Health Status',
      type: 'object',
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
      title: 'Adoption Status',
      type: 'string',
      options: {
        list: [
          {title: '🟢 Available for Adoption', value: 'available'},
          {title: '🟡 Application Pending', value: 'pending'},
          {title: '🔴 Adopted', value: 'adopted'},
          {title: '⚪ In Foster Care', value: 'foster'}
        ],
        layout: 'radio'
      },
      initialValue: 'available',
      validation: Rule => Rule.required()
    },
    {
      name: 'featured',
      title: 'Featured on Homepage',
      type: 'boolean',
      description: 'Show this cat on the homepage featured section',
      initialValue: false
    },
    {
      name: 'adoptionDate',
      title: 'Adoption Date',
      type: 'date',
      hidden: ({document}) => document?.status !== 'adopted'
    }
  ],
  preview: {
    select: {
      title: 'name',
      media: 'photos.0',
      status: 'status',
      age: 'age'
    },
    prepare({title, media, status, age}) {
      return {
        title,
        subtitle: `${age || 'Unknown age'} • ${status || 'No status'}`,
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