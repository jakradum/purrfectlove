import { useCallback } from 'react'
import { useFormValue, useDocumentOperation, useClient } from 'sanity'

// Wraps the standard status select. When the value changes to 'adopted':
// - auto-patches adoptionDate to now (if not already set)
// - auto-patches adoptedAt to now (if not already set)
// - auto-patches feedbackToken to a new UUID v4 (if not already set)
// - auto-patches feedbackLocale to 'de' or 'en' based on contractLanguage (if not already set)
// When the value changes to 'rejected':
// - finds all applications where isDuplicateOf._ref == this doc and status is new/evaluation
// - patches them all to rejected
export function StatusInput(props) {
  const { onChange, renderDefault } = props

  const rawId = useFormValue(['_id']) ?? ''
  const docId = rawId.replace(/^drafts\./, '')
  const adoptionDate = useFormValue(['adoptionDate'])
  const adoptedAt = useFormValue(['adoptedAt'])
  const feedbackToken = useFormValue(['feedbackToken'])
  const feedbackLocale = useFormValue(['feedbackLocale'])
  const contractLanguage = useFormValue(['contractLanguage'])

  const { patch } = useDocumentOperation(docId || '_placeholder', 'application')
  const client = useClient({ apiVersion: '2024-01-01' })

  const handleChange = useCallback((patchEvent) => {
    onChange(patchEvent)
    const newStatus = patchEvent?.patches?.[0]?.value

    if (newStatus === 'adopted' && docId) {
      const patches = []
      if (!adoptionDate) patches.push({ set: { adoptionDate: new Date().toISOString() } })
      if (!adoptedAt) patches.push({ set: { adoptedAt: new Date().toISOString() } })
      if (!feedbackToken) patches.push({ set: { feedbackToken: crypto.randomUUID() } })
      if (!feedbackLocale) {
        const locale = contractLanguage === 'de' ? 'de' : 'en'
        patches.push({ set: { feedbackLocale: locale } })
      }
      if (patches.length > 0) patch.execute(patches)
    }

    if (newStatus === 'rejected' && docId) {
      client.fetch(
        `*[_type == "application" && isDuplicateOf._ref == $id && status in ["new", "evaluation"]]{ _id }`,
        { id: docId }
      ).then(duplicates => {
        duplicates.forEach(dup => client.patch(dup._id).set({ status: 'rejected' }).commit())
      }).catch(err => console.error('[StatusInput] failed to reject duplicates:', err))
    }
  }, [onChange, patch, client, adoptionDate, adoptedAt, feedbackToken, feedbackLocale, contractLanguage, docId])

  return renderDefault({ ...props, onChange: handleChange })
}
