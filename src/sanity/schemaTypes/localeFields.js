export const localeString = {
  name: 'localeString',
  type: 'object',
  fields: [
    {name: 'en', type: 'string', title: 'English'},
    {name: 'de', type: 'string', title: 'German'}
  ]
}

export const localeText = {
  name: 'localeText',
  type: 'object',
  fields: [
    {name: 'en', type: 'text', title: 'English'},
    {name: 'de', type: 'text', title: 'German'}
  ]
}

export const localeBlock = {
  name: 'localeBlock',
  type: 'object',
  fields: [
    {
      name: 'en',
      type: 'array',
      of: [{type: 'block'}],
      title: 'English'
    },
    {
      name: 'de',
      type: 'array',
      of: [{type: 'block'}],
      title: 'German'
    }
  ]
}