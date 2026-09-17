const MONTHS = [
  { title: 'January', value: 1 }, { title: 'February', value: 2 }, { title: 'March', value: 3 },
  { title: 'April', value: 4 }, { title: 'May', value: 5 }, { title: 'June', value: 6 },
  { title: 'July', value: 7 }, { title: 'August', value: 8 }, { title: 'September', value: 9 },
  { title: 'October', value: 10 }, { title: 'November', value: 11 }, { title: 'December', value: 12 },
]

export default {
  name: 'newsletterTheme',
  title: 'Newsletter Theme',
  type: 'document',
  fields: [
    { name: 'name', title: 'Theme Name', type: 'string', validation: Rule => Rule.required() },
    // Which calendar months this theme is appropriate for. Evergreen themes
    // (adoption, donations, etc.) list all 12; seasonal ones (heat, Diwali,
    // winter) list only their real-world window. The send script picks
    // randomly among whichever themes are eligible for the actual send
    // month - see src/lib/newsletterCycle.js. A theme is never assigned
    // outside its listed months.
    {
      name: 'eligibleMonths',
      title: 'Eligible Months',
      type: 'array',
      of: [{ type: 'number' }],
      options: { list: MONTHS },
      validation: Rule => Rule.required().min(1),
    },
    // Half-to-one-page researched brief fed to the model as grounding
    // material when generating that cycle's newsletter content. Not reader-
    // facing - this is input context, not the newsletter copy itself.
    { name: 'knowledge', title: 'Knowledge Brief', type: 'text', rows: 20, validation: Rule => Rule.required() },
  ],
  preview: {
    select: { name: 'name', months: 'eligibleMonths' },
    prepare({ name, months }) {
      const label = months?.length === 12 ? 'evergreen' : (months || []).map(m => MONTHS.find(x => x.value === m)?.title.slice(0, 3)).join(', ')
      return { title: name, subtitle: label }
    }
  }
}
