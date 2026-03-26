import { useState } from 'react'
import { useFormValue } from 'sanity'

export function SendContractButton() {
  const documentId = useFormValue(['_id'])
  const interviewCompleted = useFormValue(['interviewCompleted'])
  const homeVisitCompleted = useFormValue(['homeVisitCompleted'])
  const contractSentAt = useFormValue(['contractSentAt'])
  const applicantName = useFormValue(['applicantName'])
  const email = useFormValue(['email'])

  const [status, setStatus] = useState('idle') // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState('')

  const missingSteps = []
  if (!interviewCompleted) missingSteps.push('Interview')
  if (!homeVisitCompleted) missingSteps.push('Home Visit')
  const isReady = missingSteps.length === 0

  const formatDate = (iso) =>
    new Date(iso).toLocaleString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })

  const handleSend = async () => {
    if (!isReady || status === 'loading') return
    setStatus('loading')
    setErrorMsg('')
    try {
      const res = await fetch('/api/send-adoption-contract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId })
      })
      const data = await res.json()
      if (!res.ok) {
        setStatus('error')
        setErrorMsg(data.error || 'Something went wrong')
      } else {
        setStatus('success')
      }
    } catch (err) {
      setStatus('error')
      setErrorMsg(err.message)
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

  const getButtonStyle = () => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '9px 18px',
    borderRadius: '6px',
    border: 'none',
    cursor: isReady && status !== 'loading' ? 'pointer' : 'not-allowed',
    fontSize: '13px',
    fontWeight: 600,
    transition: 'all 0.15s ease',
    backgroundColor:
      !isReady ? '#E5E7EB'
      : status === 'loading' ? '#93C5FD'
      : status === 'success' ? '#22c55e'
      : status === 'error' ? '#ef4444'
      : '#2C5F4F',
    color:
      !isReady ? '#9CA3AF'
      : '#ffffff',
  })

  const getButtonLabel = () => {
    if (status === 'loading') return '⏳ Sending...'
    if (status === 'success') return '✓ Contract Sent!'
    if (status === 'error') return '✗ Failed — Retry'
    if (contractSentAt) return '↺ Resend Contract'
    return '📄 Send Adoption Contract'
  }

  return (
    <div style={containerStyle}>
      <span style={labelStyle}>Adoption Contract</span>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <button
          style={getButtonStyle()}
          onClick={handleSend}
          disabled={!isReady || status === 'loading'}
          title={!isReady ? `Complete the following first: ${missingSteps.join(', ')}` : ''}
        >
          {getButtonLabel()}
        </button>

        {isReady && applicantName && email && status === 'idle' && (
          <span style={{ fontSize: '12px', color: '#6B7280' }}>
            → {applicantName} ({email})
          </span>
        )}
      </div>

      {/* Blocked: explain why */}
      {!isReady && (
        <div style={{
          marginTop: '10px',
          padding: '8px 12px',
          backgroundColor: '#FEF3C7',
          borderRadius: '5px',
          fontSize: '12px',
          color: '#92400E',
          lineHeight: 1.6,
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

      {/* Error message */}
      {status === 'error' && errorMsg && (
        <div style={{
          marginTop: '10px',
          padding: '8px 12px',
          backgroundColor: '#FEF2F2',
          borderRadius: '5px',
          fontSize: '12px',
          color: '#991B1B',
        }}>
          {errorMsg}
        </div>
      )}

      {/* Last sent timestamp */}
      {contractSentAt && status !== 'success' && (
        <div style={{ marginTop: '8px', fontSize: '11px', color: '#9CA3AF' }}>
          Last sent: {formatDate(contractSentAt)}
        </div>
      )}

      {/* Success message */}
      {status === 'success' && (
        <div style={{
          marginTop: '10px',
          padding: '8px 12px',
          backgroundColor: '#F0FDF4',
          borderRadius: '5px',
          fontSize: '12px',
          color: '#166534',
        }}>
          Contract emailed to {email}. The PDF includes pre-filled adopter and cat details.
        </div>
      )}
    </div>
  )
}
