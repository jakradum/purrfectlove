import { useState, useEffect } from 'react'
import { useFormValue, useClient } from 'sanity'

export function SendContractButton() {
  const catId = useFormValue(['_id'])
  const contractSentAt = useFormValue(['contractSentAt'])
  const contractLanguage = useFormValue(['contractLanguage'])
  const adopterRef = useFormValue(['adopterApplication', '_ref'])

  const client = useClient({ apiVersion: '2024-01-01' })
  const [application, setApplication] = useState(null)
  const [loadingApp, setLoadingApp] = useState(false)

  const [statusEn, setStatusEn] = useState('idle')
  const [statusDe, setStatusDe] = useState('idle')
  const [errorEn, setErrorEn] = useState('')
  const [errorDe, setErrorDe] = useState('')

  useEffect(() => {
    if (!adopterRef) { setApplication(null); return }
    setLoadingApp(true)
    const cleanRef = adopterRef.replace(/^drafts\./, '')
    client.fetch(
      `*[_type == "application" && (_id == $id || _id == $draftId)][0]{ interviewCompleted, homeVisitCompleted, applicantName, email }`,
      { id: cleanRef, draftId: `drafts.${cleanRef}` }
    ).then(app => { setApplication(app); setLoadingApp(false) })
     .catch(() => setLoadingApp(false))
  }, [adopterRef])

  const missingSteps = []
  if (!application?.interviewCompleted) missingSteps.push('Interview')
  if (!application?.homeVisitCompleted) missingSteps.push('Home Visit')
  const isReady = !!adopterRef && !!application && missingSteps.length === 0

  const formatDate = (iso) =>
    new Date(iso).toLocaleString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })

  const handleSend = async (language) => {
    const setStatus = language === 'en' ? setStatusEn : setStatusDe
    const setError  = language === 'en' ? setErrorEn  : setErrorDe
    const current   = language === 'en' ? statusEn    : statusDe
    if (!isReady || current === 'loading') return

    setStatus('loading')
    setError('')
    try {
      const cleanCatId = (catId || '').replace(/^drafts\./, '')
      const cleanAppId = (adopterRef || '').replace(/^drafts\./, '')
      const res = await fetch('/api/send-adoption-contract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId: cleanAppId, catId: cleanCatId, catOverrideId: cleanCatId, language }),
      })
      const data = await res.json()
      if (!res.ok) { setStatus('error'); setError(data.error || 'Something went wrong') }
      else setStatus('success')
    } catch (err) {
      setStatus('error')
      setError(err.message)
    }
  }

  const containerStyle = {
    padding: '16px 20px', backgroundColor: '#f8faff',
    border: '1px solid #e0e7ff', borderRadius: '8px', marginBottom: '8px',
  }
  const labelStyle = {
    fontSize: '11px', fontWeight: 700, color: '#6B7280',
    textTransform: 'uppercase', letterSpacing: '0.08em',
    marginBottom: '12px', display: 'block',
  }
  const getBtnStyle = (lang) => {
    const status = lang === 'en' ? statusEn : statusDe
    return {
      display: 'inline-flex', alignItems: 'center', gap: '6px',
      padding: '8px 14px', borderRadius: '6px', border: 'none',
      cursor: isReady && status !== 'loading' ? 'pointer' : 'not-allowed',
      fontSize: '12px', fontWeight: 600, transition: 'all 0.15s ease',
      backgroundColor:
        !isReady ? '#E5E7EB'
        : status === 'loading' ? '#93C5FD'
        : status === 'success' ? '#22c55e'
        : status === 'error' ? '#ef4444'
        : lang === 'en' ? '#2C5F4F' : '#1a3a6e',
      color: !isReady ? '#9CA3AF' : '#ffffff',
    }
  }
  const getBtnLabel = (lang) => {
    const status = lang === 'en' ? statusEn : statusDe
    const label = lang === 'en' ? 'English' : 'German'
    if (status === 'loading') return `⏳ Sending...`
    if (status === 'success') return `✓ ${label} Agreement Sent!`
    if (status === 'error') return `✗ Failed — Retry`
    return lang === 'en' ? '📄 Send English Agreement' : '📄 Send German Agreement'
  }

  const LANG_LABELS = { en: 'English', de: 'German (Deutsch)' }

  return (
    <div style={containerStyle}>
      <span style={labelStyle}>Adoption Agreement</span>

      {!adopterRef && (
        <div style={{ fontSize: '13px', color: '#92400E', backgroundColor: '#FEF3C7', padding: '8px 12px', borderRadius: '5px', marginBottom: '10px' }}>
          Link an adopter application above to enable contract sending.
        </div>
      )}

      {loadingApp && adopterRef && (
        <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '10px' }}>Loading applicant details…</div>
      )}

      {isReady && application?.applicantName && application?.email && (
        <div style={{ marginBottom: '12px', fontSize: '12px', color: '#6B7280' }}>
          → {application.applicantName} ({application.email})
        </div>
      )}

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
        <button style={getBtnStyle('en')} onClick={() => handleSend('en')}
          disabled={!isReady || statusEn === 'loading'}
          title={!isReady ? (adopterRef ? `Complete first: ${missingSteps.join(', ')}` : 'Link an application first') : 'Send English Adoption Agreement'}>
          {getBtnLabel('en')}
        </button>
        <button style={getBtnStyle('de')} onClick={() => handleSend('de')}
          disabled={!isReady || statusDe === 'loading'}
          title={!isReady ? (adopterRef ? `Complete first: ${missingSteps.join(', ')}` : 'Link an application first') : 'Send German Adoption Agreement'}>
          {getBtnLabel('de')}
        </button>
      </div>

      {!isReady && adopterRef && !loadingApp && missingSteps.length > 0 && (
        <div style={{ padding: '8px 12px', backgroundColor: '#FEF3C7', borderRadius: '5px', fontSize: '12px', color: '#92400E', lineHeight: 1.6, marginBottom: '8px' }}>
          <strong>Cannot send yet.</strong> Complete the following steps first:{' '}
          {missingSteps.map((step, i) => (
            <span key={step}>
              <span style={{ display: 'inline-block', backgroundColor: '#F59E0B', color: '#fff', borderRadius: '3px', padding: '1px 6px', fontSize: '11px', fontWeight: 600, marginLeft: i === 0 ? '4px' : '6px' }}>
                {step}
              </span>
            </span>
          ))}
        </div>
      )}

      {contractSentAt && statusEn !== 'success' && statusDe !== 'success' && (
        <div style={{ padding: '8px 12px', backgroundColor: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '5px', fontSize: '12px', color: '#92400E', marginBottom: '6px' }}>
          ⚠️ A {LANG_LABELS[contractLanguage] || 'previous'} agreement was already sent on {formatDate(contractSentAt)}. Clicking above will send again.
        </div>
      )}

      {statusEn === 'error' && errorEn && <div style={{ padding: '8px 12px', backgroundColor: '#FEF2F2', borderRadius: '5px', fontSize: '12px', color: '#991B1B', marginBottom: '4px' }}>English: {errorEn}</div>}
      {statusDe === 'error' && errorDe && <div style={{ padding: '8px 12px', backgroundColor: '#FEF2F2', borderRadius: '5px', fontSize: '12px', color: '#991B1B', marginBottom: '4px' }}>German: {errorDe}</div>}
      {statusEn === 'success' && <div style={{ padding: '8px 12px', backgroundColor: '#F0FDF4', borderRadius: '5px', fontSize: '12px', color: '#166534', marginBottom: '4px' }}>English agreement sent to {application?.email}.</div>}
      {statusDe === 'success' && <div style={{ padding: '8px 12px', backgroundColor: '#F0FDF4', borderRadius: '5px', fontSize: '12px', color: '#166534', marginBottom: '4px' }}>German agreement sent to {application?.email}.</div>}
    </div>
  )
}
