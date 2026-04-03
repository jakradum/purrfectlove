import { useState } from 'react'

export function ApproveJoinRequest({ documentId, document: doc }) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const status = doc?.displayed?.status
  const email = doc?.displayed?.email
  const name = doc?.displayed?.name

  if (status === 'approved') {
    return (
      <div style={s.wrap}>
        <div style={s.successBox}>
          <p style={{ margin: 0, fontWeight: 600 }}>✅ Already approved</p>
          {email && <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#555' }}>Welcome email sent to {email}</p>}
        </div>
      </div>
    )
  }

  const handleApprove = async () => {
    if (!documentId) return
    if (!confirm(`Approve "${name || 'this request'}" and send a welcome email?`)) return

    setLoading(true)
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
      } else if (data.emailSent) {
        setResult({ type: 'success', message: 'Member created and welcome email sent.' })
      } else {
        setResult({ type: 'warn', message: 'Member created — no email on file, welcome email not sent.' })
      }
    } catch (err) {
      setResult({ type: 'error', message: 'Network error: ' + err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={s.wrap}>
      <p style={s.info}>
        This will create a new community member account using the name, phone, and email on this request, then send a welcome email.
      </p>

      {result && (
        <div style={{ ...s.resultBox, ...(result.type === 'success' ? s.success : result.type === 'warn' ? s.warn : s.error) }}>
          {result.message}
        </div>
      )}

      {!result && (
        <button
          type="button"
          onClick={handleApprove}
          disabled={loading}
          style={{ ...s.btn, ...(loading ? s.btnDisabled : {}) }}
        >
          {loading ? 'Processing…' : '✓ Approve & send welcome email'}
        </button>
      )}
    </div>
  )
}

const s = {
  wrap: { padding: '2rem', fontFamily: 'system-ui, sans-serif', maxWidth: '480px' },
  info: { fontSize: '0.875rem', color: '#555', marginBottom: '1.25rem', lineHeight: 1.6 },
  btn: { background: '#2C5F4F', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.6rem 1.25rem', fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer' },
  btnDisabled: { opacity: 0.5, cursor: 'not-allowed' },
  resultBox: { padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 500 },
  success: { background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d' },
  warn: { background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e' },
  error: { background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c' },
  successBox: { background: '#f0fdf4', borderRadius: '8px', padding: '0.75rem 1rem', border: '1px solid #bbf7d0' },
}
