'use client'

import { useState } from 'react'

export function DeletionRequestedActions({ document: doc }) {
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)

  const documentId = doc?.displayed?._id

  const handleAction = async () => {
    if (!documentId) return
    setLoading(true)
    setStatus(null)
    try {
      const res = await fetch('/api/care/admin/send-deletion-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId }),
      })
      const data = await res.json()
      if (res.ok) {
        setStatus({ type: 'success', message: 'Done. Confirmation email sent, document deleted, audit record created.' })
      } else {
        setStatus({ type: 'error', message: data.error || 'Unknown error' })
      }
    } catch (err) {
      setStatus({ type: 'error', message: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif', maxWidth: '480px' }}>
      <p style={{ fontSize: '0.9rem', color: '#555', marginBottom: '1.5rem' }}>
        This member has requested deletion.
      </p>

      <button
        type="button"
        onClick={handleAction}
        disabled={loading || status?.type === 'success'}
        style={{
          padding: '0.6rem 1.25rem',
          borderRadius: '8px',
          background: (loading || status?.type === 'success') ? '#d1d5db' : '#b91c1c',
          color: '#fff',
          border: 'none',
          fontFamily: 'inherit',
          fontSize: '0.9rem',
          fontWeight: 600,
          cursor: (loading || status?.type === 'success') ? 'not-allowed' : 'pointer',
        }}
      >
        {loading ? 'Processing…' : 'Send confirmation email & delete'}
      </button>

      {status && (
        <div
          style={{
            marginTop: '1rem',
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            background: status.type === 'success' ? '#f0fdf4' : '#fef2f2',
            border: `1px solid ${status.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
            color: status.type === 'success' ? '#15803d' : '#b91c1c',
            fontSize: '0.875rem',
          }}
        >
          {status.message}
        </div>
      )}
    </div>
  )
}
