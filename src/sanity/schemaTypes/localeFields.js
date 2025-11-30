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

// Rich text block configuration with headings and links
const richTextBlock = {
  type: 'block',
  styles: [
    {title: 'Normal', value: 'normal'},
    {title: 'H1', value: 'h1'},
    {title: 'H2', value: 'h2'},
    {title: 'H3', value: 'h3'},
    {title: 'Quote', value: 'blockquote'}
  ],
  lists: [
    {title: 'Bullet', value: 'bullet'},
    {title: 'Numbered', value: 'number'}
  ],
  marks: {
    decorators: [
      {title: 'Bold', value: 'strong'},
      {title: 'Italic', value: 'em'},
      {title: 'Underline', value: 'underline'},
      {title: 'Strike', value: 'strike-through'}
    ],
    annotations: [
      {
        name: 'link',
        type: 'object',
        title: 'Link',
        fields: [
          {
            name: 'href',
            type: 'url',
            title: 'URL',
            validation: Rule => Rule.uri({
              scheme: ['http', 'https', 'mailto', 'tel']
            })
          },
          {
            name: 'openInNewTab',
            type: 'boolean',
            title: 'Open in new tab',
            initialValue: false
          }
        ]
      }
    ]
  }
}

export const localeBlock = {
  name: 'localeBlock',
  type: 'object',
  fields: [
    {
      name: 'en',
      type: 'array',
      of: [richTextBlock],
      title: 'English'
    },
    {
      name: 'de',
      type: 'array',
      of: [richTextBlock],
      title: 'German'
    }
  ]
}