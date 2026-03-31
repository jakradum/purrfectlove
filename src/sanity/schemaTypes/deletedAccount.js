export default {
  name: 'deletedAccount',
  title: 'Deleted Account',
  type: 'document',
  fields: [
    { name: 'generatedUsername', title: 'Generated Username', type: 'string', description: 'The anonymised username (no PII).' },
    { name: 'deletedAt', title: 'Deleted At', type: 'datetime', validation: Rule => Rule.required() },
    { name: 'reason', title: 'Reason Given', type: 'text', rows: 3 },
    { name: 'actionedBy', title: 'Actioned By', type: 'reference', to: [{ type: 'teamMember' }] },
  ],
  preview: {
    select: { title: 'generatedUsername', subtitle: 'deletedAt' },
    prepare({ title, subtitle }) {
      return { title: title || 'Deleted member', subtitle }
    }
  }
}
