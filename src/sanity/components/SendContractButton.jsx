import { useState } from 'react'
import { useFormValue } from 'sanity'

const LANG_LABELS = {
  en: 'English',
  de: 'German (Deutsch)',
}

export function SendContractButton() {
  const documentId = useFormValue(['_id'])
  const interviewCompleted = useFormValue(['interviewCompleted'])
  const homeVisitCompleted = useFormValue(['homeVisitCompleted'])
  const contractSentAt = useFormValue(['contractSentAt'])
  const contractLanguage = useFormValue(['contractLanguage'])
  const applicantName = useFormValue(['applicantName'])
  const email = useFormValue(['email'])

  // Per-language status: idle | loading | success | error
  const [statusEn, setStatusEn] = useState('idle')
  const [statusDe, setStatusDe] = useState('idle')
  const [errorEn, setErrorEn] = useState('')
  const [errorDe, setErrorDe] = useState('')

  const missingSteps = []
  if (!interviewCompleted) missingSteps.push('Interview')
  if (!homeVisitCompleted) missingSteps.push('Home Visit')
  const isReady = missingSteps.length === 0

  const formatDate = (iso) =>
    new Date(iso).toLocaleString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })

  const handleSend = async (language) => {
    const setStatus = language === 'en' ? setStatusEn : setStatusDe
    const setError = language === 'en' ? setErrorEn : setErrorDe
    const currentStatus = language === 'en' ? statusEn : statusDe
    if (!isReady || currentStatus === 'loading') return

    setStatus('loading')
    setError('')
    try {
      const res = await fetch('/api/send-adoption-contract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId, language }),
      })
      const data = await res.json()
      if (!res.ok) {
        setStatus('error')
        setError(data.error || 'Something went wrong')
      } else {
        setStatus('success')
      }
    } catch (err) {
      setStatus('error')
      setError(err.message)
    }
  }

  const containerStyle = {
    padding: '16px 20px',
    backgroundColor: '#f8faff',
    border: '1px solid #e0e7ff',
    borderRadius: '8px',
    marginBottom: '8px',
  }

  const labelStyle = {
    fontSize: '11px',
    fontWeight: 700,
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: '12px',
    display: 'block',
  }

  const getBtnStyle = (lang) => {
    const status = lang === 'en' ? statusEn : statusDe
    return {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '8px 14px',
      borderRadius: '6px',
      border: 'none',
      cursor: isReady && status !== 'loading' ? 'pointer' : 'not-allowed',
      fontSize: '12px',
      fontWeight: 600,
      transition: 'all 0.15s ease',
      backgroundColor:
        !isReady ? '#E5E7EB'
        : status === 'loading' ? '#93C5FD'
        : status === 'success' ? '#22c55e'
        : status === 'error' ? '#ef4444'
        : lang === 'en' ? '#2C5F4F'
        : '#1a3a6e',
      color: !isReady ? '#9CA3AF' : '#ffffff',
    }
  }

  const getBtnLabel = (lang) => {
    const status = lang === 'en' ? statusEn : statusDe
    const langLabel = lang === 'en' ? 'English' : 'German'
    if (status === 'loading') return `⏳ Sending...`
    if (status === 'success') return `✓ ${langLabel} Agreement Sent!`
    if (status === 'error') return `✗ Failed — Retry`
    return lang === 'en' ? '📄 Send English Agreement' : '📄 Send German Agreement'
  }

  // Warning: already sent — which language and when
  const alreadySentLabel = contractLanguage ? LANG_LABELS[contractLanguage] || contractLanguage : null

  return (
    <div style={containerStyle}>
      <span style={labelStyle}>Adoption Agreement</span>

      {/* Recipient line */}
      {isReady && applicantName && email && (
        <div style={{ marginBottom: '12px', fontSize: '12px', color: '#6B7280' }}>
          → {applicantName} ({email})
        </div>
      )}

      {/* Two send buttons */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
        <button
          style={getBtnStyle('en')}
          onClick={() => handleSend('en')}
          disabled={!isReady || statusEn === 'loading'}
          title={!isReady ? `Complete the following first: ${missingSteps.join(', ')}` : 'Send English Adoption Agreement'}
        >
          {getBtnLabel('en')}
        </button>
        <button
          style={getBtnStyle('de')}
          onClick={() => handleSend('de')}
          disabled={!isReady || statusDe === 'loading'}
          title={!isReady ? `Complete the following first: ${missingSteps.join(', ')}` : 'Send German Adoption Agreement'}
        >
          {getBtnLabel('de')}
        </button>
      </div>

      {/* Blocked: explain missing steps */}
      {!isReady && (
        <div style={{
          padding: '8px 12px',
          backgroundColor: '#FEF3C7',
          borderRadius: '5px',
          fontSize: '12px',
          color: '#92400E',
          lineHeight: 1.6,
          marginBottom: '8px',
        }}>
          <strong>Cannot send yet.</strong> Complete the following steps first:{' '}
          {missingSteps.map((step, i) => (
            <span key={step}>
              <span style={{
                display: 'inline-block',
                backgroundColor: '#F59E0B',
                color: '#fff',
                borderRadius: '3px',
                padding: '1px 6px',
                fontSize: '11px',
                fontWeight: 600,
                marginLeft: i === 0 ? '4px' : '6px',
              }}>
                {step}
              </span>
            </span>
          ))}
        </div>
      )}

      {/* Warning: already sent */}
      {contractSentAt && statusEn !== 'success' && statusDe !== 'success' && (
        <div style={{
          padding: '8px 12px',
          backgroundColor: '#FFFBEB',
          border: '1px solid #FDE68A',
          borderRadius: '5px',
          fontSize: '12px',
          color: '#92400E',
          marginBottom: '6px',
        }}>
          ⚠️ A {alreadySentLabel || 'previous'} agreement was already sent on {formatDate(contractSentAt)}. Clicking a button above will send again.
        </div>
      )}

      {/* Per-language error messages */}
      {statusEn === 'error' && errorEn && (
        <div style={{
          padding: '8px 12px',
          backgroundColor: '#FEF2F2',
          borderRadius: '5px',
          fontSize: '12px',
          color: '#991B1B',
          marginBottom: '4px',
        }}>
          English: {errorEn}
        </div>
      )}
      {statusDe === 'error' && errorDe && (
        <div style={{
          padding: '8px 12px',
          backgroundColor: '#FEF2F2',
          borderRadius: '5px',
          fontSize: '12px',
          color: '#991B1B',
          marginBottom: '4px',
        }}>
          German: {errorDe}
        </div>
      )}

      {/* Per-language success messages */}
      {statusEn === 'success' && (
        <div style={{
          padding: '8px 12px',
          backgroundColor: '#F0FDF4',
          borderRadius: '5px',
          fontSize: '12px',
          color: '#166534',
          marginBottom: '4px',
        }}>
          English agreement sent to {email}.
        </div>
      )}
      {statusDe === 'success' && (
        <div style={{
          padding: '8px 12px',
          backgroundColor: '#F0FDF4',
          borderRadius: '5px',
          fontSize: '12px',
          color: '#166534',
          marginBottom: '4px',
        }}>
          German agreement sent to {email}.
        </div>
      )}
    </div>
  )
}
