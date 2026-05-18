import { useCallback } from 'react'
import { useFormValue, useDocumentOperation } from 'sanity'

// Wraps the standard status select. When the value changes to 'adopted':
// - auto-patches adoptionDate to now (if not already set)
// - auto-patches adoptedAt to now (if not already set)
// - auto-patches feedbackToken to a new UUID v4 (if not already set)
export function StatusInput(props) {
  const { onChange, renderDefault } = props

  const rawId = useFormValue(['_id']) ?? ''
  const docId = rawId.replace(/^drafts\./, '')
  const adoptionDate = useFormValue(['adoptionDate'])
  const adoptedAt = useFormValue(['adoptedAt'])
  const feedbackToken = useFormValue(['feedbackToken'])

  const { patch } = useDocumentOperation(docId || '_placeholder', 'application')

  const handleChange = useCallback((patchEvent) => {
    onChange(patchEvent)
    const newStatus = patchEvent?.patches?.[0]?.value
    if (newStatus === 'adopted' && docId) {
      const patches = []
      if (!adoptionDate) patches.push({ set: { adoptionDate: new Date().toISOString() } })
      if (!adoptedAt) patches.push({ set: { adoptedAt: new Date().toISOString() } })
      if (!feedbackToken) patches.push({ set: { feedbackToken: crypto.randomUUID() } })
      if (patches.length > 0) patch.execute(patches)
    }
  }, [onChange, patch, adoptionDate, adoptedAt, feedbackToken, docId])

  return renderDefault({ ...props, onChange: handleChange })
}
