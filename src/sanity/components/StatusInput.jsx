import { useCallback } from 'react'
import { useFormValue, useDocumentOperation } from 'sanity'

// Wraps the standard status select. When the value changes to 'adopted' and
// adoptionDate is not already set, it auto-patches adoptionDate to now.
export function StatusInput(props) {
  const { onChange, renderDefault } = props

  const rawId = useFormValue(['_id']) ?? ''
  const docId = rawId.replace(/^drafts\./, '')
  const adoptionDate = useFormValue(['adoptionDate'])

  const { patch } = useDocumentOperation(docId || '_placeholder', 'application')

  const handleChange = useCallback((patchEvent) => {
    onChange(patchEvent)
    const newStatus = patchEvent?.patches?.[0]?.value
    if (newStatus === 'adopted' && !adoptionDate && docId) {
      patch.execute([{ set: { adoptionDate: new Date().toISOString() } }])
    }
  }, [onChange, patch, adoptionDate, docId])

  return renderDefault({ ...props, onChange: handleChange })
}
