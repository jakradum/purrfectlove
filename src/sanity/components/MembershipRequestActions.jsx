'use client'

import { useState } from 'react'

export function MembershipRequestActions({ documentId, document: doc }) {
  const [loading, setLoading] = useState(null) // 'approve' | 'reject' | null
  const [result, setResult] = useState(null)

  const status   = doc?.displayed?.status
  const name     = doc?.displayed?.name
  const email    = doc?.displayed?.email
  const phone    = doc?.displayed?.phone
  const message  = doc?.displayed?.message
  const submitted = doc?.displayed?.submittedAt
    ? new Date(doc.displayed.submittedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : null

  if (status === 'approved') {
    return (
      <div style={s.wrap}>
        <div style={{ ...s.banner, ...s.bannerSuccess }}>
          ✅ Approved{email ? ` — welcome email sent to ${email}` : ''}
        </div>
      </div>
    )
  }

  if (status === 'entry_denied') {
    return (
      <div style={s.wrap}>
        <div style={{ ...s.banner, ...s.bannerDenied }}>
          ❌ Entry denied — inbox approval permanently blocked for this applicant.
        </div>
      </div>
    )
  }

  const handleApprove = async () => {
    if (!documentId) return
    if (!confirm(`Approve "${name || 'this request'}" and send a welcome email?`)) return
    setLoading('approve')
    setResult(null)
    try {
      const res = await fetch('/api/care/admin/approve-member', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId: documentId }),
      })
      const data = await res.json()
      if (!res.ok) {
        setResult({ type: 'error', message: data.error || 'Something went wrong.' })
      } else if (data.alreadyApproved) {
        setResult({ type: 'warn', message: 'Already approved — Sanity status updated.' })
      } else if (data.emailSent) {
        setResult({ type: 'success', message: `✅ Approved. Welcome email sent to ${email || 'member'}.` })
      } else {
        setResult({ type: 'warn', message: '✅ Approved, but no email on file — welcome email not sent.' })
      }
    } catch (err) {
      setResult({ type: 'error', message: 'Network error: ' + err.message })
    } finally {
      setLoading(null)
    }
  }

  const handleReject = async () => {
    if (!documentId) return
    if (!confirm(`Deny entry for "${name || 'this applicant'}"? No email will be sent. This blocks them from inbox approval permanently.`)) return
    setLoading('reject')
    setResult(null)
    try {
      const res = await fetch('/api/care/admin/reject-member', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId: documentId }),
      })
      const data = await res.json()
      if (!res.ok) {
        setResult({ type: 'error', message: data.error || 'Something went wrong.' })
      } else {
        setResult({ type: 'denied', message: '❌ Entry denied. No email sent. Inbox approval permanently blocked.' })
      }
    } catch (err) {
      setResult({ type: 'error', message: 'Network error: ' + err.message })
    } finally {
      setLoading(null)
    }
  }

  return (
    <div style={s.wrap}>
      {/* Applicant summary */}
      <table style={s.table}>
        <tbody>
          {name     && <Row label="Name"      value={name} />}
          {email    && <Row label="Email"     value={email} />}
          {phone    && <Row label="Phone"     value={phone} />}
          {submitted && <Row label="Submitted" value={submitted} />}
          {message  && <Row label="Message"   value={message} />}
        </tbody>
      </table>

      {result ? (
        <div style={{ ...s.resultBox, ...s[result.type] }}>{result.message}</div>
      ) : (
        <div style={s.actions}>
          <button
            type="button"
            onClick={handleApprove}
            disabled={!!loading}
            style={{ ...s.btn, ...s.btnApprove, ...(loading ? s.btnDisabled : {}) }}
          >
            {loading === 'approve' ? 'Approving…' : '✓ Approve & send welcome email'}
          </button>
          <button
            type="button"
            onClick={handleReject}
            disabled={!!loading}
            style={{ ...s.btn, ...s.btnReject, ...(loading ? s.btnDisabled : {}) }}
          >
            {loading === 'reject' ? 'Denying…' : '✗ Deny entry'}
          </button>
        </div>
      )}
    </div>
  )
}

function Row({ label, value }) {
  return (
    <tr>
      <td style={s.tdLabel}>{label}</td>
      <td style={s.tdValue}>{value}</td>
    </tr>
  )
}

const s = {
  wrap:        { padding: '2rem', fontFamily: 'system-ui, sans-serif', maxWidth: '520px' },
  table:       { width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem', border: '1px solid #eee', borderRadius: '8px', overflow: 'hidden' },
  tdLabel:     { padding: '8px 12px', fontSize: '0.75rem', fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em', width: '90px', borderBottom: '1px solid #f0f0f0', background: '#fafaf8' },
  tdValue:     { padding: '8px 12px', fontSize: '0.875rem', color: '#2C2C2A', borderBottom: '1px solid #f0f0f0', whiteSpace: 'pre-wrap', wordBreak: 'break-word' },
  actions:     { display: 'flex', gap: '0.75rem', flexWrap: 'wrap' },
  btn:         { border: 'none', borderRadius: '8px', padding: '0.6rem 1.25rem', fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
  btnApprove:  { background: '#2C5F4F', color: '#fff' },
  btnReject:   { background: '#FAECE7', color: '#C85C3F', border: '1px solid #C85C3F' },
  btnDisabled: { opacity: 0.5, cursor: 'not-allowed' },
  resultBox:   { padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 500 },
  success:     { background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d' },
  warn:        { background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e' },
  error:       { background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c' },
  denied:      { background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c' },
  banner:      { padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 500 },
  bannerSuccess: { background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d' },
  bannerDenied:  { background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c' },
}
