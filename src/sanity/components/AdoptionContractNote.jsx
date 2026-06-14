import { useState, useEffect } from 'react'
import { useFormValue, useClient } from 'sanity'

export function AdoptionContractNote() {
  const adoptionDate = useFormValue(['adoptionDate'])
  const catRef = useFormValue(['cat', '_ref'])
  const appId = useFormValue(['_id'])

  const client = useClient({ apiVersion: '2024-01-01' })
  const [contractSentAt, setContractSentAt] = useState(null)
  const [contractLanguage, setContractLanguage] = useState(null)

  useEffect(() => {
    if (!appId) return
    const cleanAppId = appId.replace(/^drafts\./, '')
    const cleanCatRef = catRef ? catRef.replace(/^drafts\./, '') : null

    // 1. Check the cat formally linked to this application via adopterApplication._ref
    // 2. Fallback: check the cat the application directly references
    // Using two separate queries merged by whichever has contractSentAt
    const queries = [
      client.fetch(
        `*[_type == "cat" && (adopterApplication._ref == $appId || adopterApplication._ref == $draftAppId)][0]{ contractSentAt, contractLanguage }`,
        { appId: cleanAppId, draftAppId: `drafts.${cleanAppId}` }
      ),
      cleanCatRef
        ? client.fetch(
            `*[_type == "cat" && (_id == $id || _id == $draftId)][0]{ contractSentAt, contractLanguage }`,
            { id: cleanCatRef, draftId: `drafts.${cleanCatRef}` }
          )
        : Promise.resolve(null),
    ]

    Promise.all(queries).then(([linkedCat, directCat]) => {
      const result = [linkedCat, directCat].find(c => c?.contractSentAt) ?? null
      setContractSentAt(result?.contractSentAt ?? null)
      setContractLanguage(result?.contractLanguage ?? null)
    }).catch(() => {})
  }, [appId, catRef])

  const formatDate = (iso) =>
    new Date(iso).toLocaleString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })

  const LANG_LABELS = { en: 'English', de: 'German (Deutsch)' }

  return (
    <div style={{
      padding: '14px 18px', backgroundColor: '#F0F7F4',
      border: '1px solid #C6DDD7', borderRadius: '8px', marginBottom: '8px',
    }}>
      <div style={{ fontSize: '11px', fontWeight: 700, color: '#2C5F4F', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
        Adoption Contract
      </div>

      {adoptionDate && (
        <div style={{ fontSize: '13px', color: '#2A2A2A', marginBottom: '6px' }}>
          <strong>Adoption date:</strong> {formatDate(adoptionDate)}
        </div>
      )}

      {contractSentAt ? (
        <div style={{ fontSize: '13px', color: '#2A2A2A', marginBottom: '6px' }}>
          <strong>Contract sent:</strong> {formatDate(contractSentAt)}
          {contractLanguage && ` (${LANG_LABELS[contractLanguage] || contractLanguage})`}
        </div>
      ) : (
        <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '6px' }}>
          Contract not yet sent.
        </div>
      )}

      <div style={{ marginTop: '10px', fontSize: '12px', color: '#6B7280', borderTop: '1px solid #C6DDD7', paddingTop: '10px' }}>
        To send the adoption contract, go to the <strong>cat's record</strong> and use the Send Adoption Contract button there.
      </div>
    </div>
  )
}
