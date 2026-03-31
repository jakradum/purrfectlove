'use client'

import { useState } from 'react'

export function DeletionRequestedActions({ document: doc }) {
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)

  const documentId = doc?.displayed?._id

  const handleSendEmail = async () => {
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
        setStatus({ type: 'success', message: `Confirmation email sent. Timestamp logged.` })
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
    <div style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif', maxWidth: '520px' }}>
      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem', color: '#b91c1c' }}>
        Deletion Requested
      </h2>
      <p style={{ fontSize: '0.875rem', color: '#555', lineHeight: 1.6, marginBottom: '1.5rem' }}>
        This member has requested account deletion. Once you have manually deleted the Sanity document,
        send the confirmation email below so they know the deletion was actioned.
      </p>

      <button
        type="button"
        onClick={handleSendEmail}
        disabled={loading}
        style={{
          padding: '0.6rem 1.25rem',
          borderRadius: '8px',
          background: loading ? '#d1d5db' : '#2C5F4F',
          color: '#fff',
          border: 'none',
          fontFamily: 'inherit',
          fontSize: '0.9rem',
          fontWeight: 600,
          cursor: loading ? 'not-allowed' : 'pointer',
        }}
      >
        {loading ? 'Sending…' : 'Send deletion confirmation email'}
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
