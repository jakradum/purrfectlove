'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import styles from './Care.module.css'
import { CatChipsSkeleton } from './Skeletons'

function formatDate(ymd) {
  if (!ymd) return ''
  const [y, m, d] = ymd.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function BookingRequestModal({ sitterId, sitterName, startDate: initialStart, endDate: initialEnd, onClose, onSuccess }) {
  const [startDate, setStartDate] = useState(initialStart || '')
  const [endDate, setEndDate] = useState(initialEnd || '')
  const [cats, setCats] = useState(null) // null = loading
  const [selectedCats, setSelectedCats] = useState([])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(null) // { bookingRef }

  const needsDates = !initialStart || !initialEnd

  useEffect(() => {
    fetch('/api/care/profile')
      .then(r => r.json())
      .then(doc => {
        const catNames = (doc.cats || []).map(c => c.name).filter(Boolean)
        setCats(catNames)
      })
      .catch(() => setCats([]))
  }, [])

  const toggleCat = (name) => {
    setSelectedCats(prev =>
      prev.includes(name) ? prev.filter(c => c !== name) : [...prev, name]
    )
  }

  const handleSubmit = async () => {
    setError('')
    if (!startDate || !endDate) {
      setError('Please select start and end dates.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/care/bookings/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sitterId, startDate, endDate, cats: selectedCats, message: message.trim() || null }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to send request.')
        return
      }
      setSubmitted({ bookingRef: data.bookingRef })
      onSuccess?.({ bookingRef: data.bookingRef })
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.modalOverlay} onClick={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className={styles.modal} style={{ maxWidth: 460, maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          style={{
            position: 'absolute', top: 12, right: 14,
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#aaa', padding: 4, display: 'flex', alignItems: 'center', borderRadius: 4,
          }}
        >
          <svg viewBox="0 0 12 12" fill="none" width="13" height="13">
            <path d="M1.5 1.5l9 9M10.5 1.5l-9 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>

        {submitted ? (
          <>
            <p className={styles.modalTitle} style={{ color: '#2C5F4F' }}>Request sent!</p>
            <p style={{ fontSize: '0.9rem', color: '#555', margin: '0 0 0.5rem' }}>
              Your booking request has been sent to <strong>{sitterName}</strong>.
            </p>
            <p style={{ fontSize: '0.85rem', color: '#888', margin: '0 0 1.5rem' }}>
              Booking ID: <strong style={{ color: '#2C5F4F' }}>#{submitted.bookingRef}</strong>
            </p>
            <div className={styles.modalActions}>
              <button type="button" className={styles.btn} style={{ width: 'auto', marginTop: 0, padding: '0.5rem 1.25rem' }} onClick={onClose}>
                Done
              </button>
            </div>
          </>
        ) : (
          <>
            <p className={styles.modalTitle}>Request a sit</p>
            <p style={{ fontSize: '0.85rem', color: '#666', margin: '-0.5rem 0 1.25rem' }}>
              with <strong>{sitterName}</strong>
              {!needsDates && ` · ${formatDate(startDate)} – ${formatDate(endDate)}`}
            </p>

            {needsDates && (
              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#555', margin: '0 0 0.4rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>From</p>
                  <input
                    type="date"
                    value={startDate}
                    min={new Date().toISOString().slice(0, 10)}
                    onChange={e => setStartDate(e.target.value)}
                    style={{ width: '100%', padding: '0.5rem 0.6rem', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: '0.875rem', fontFamily: 'inherit', boxSizing: 'border-box' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#555', margin: '0 0 0.4rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>To</p>
                  <input
                    type="date"
                    value={endDate}
                    min={startDate || new Date().toISOString().slice(0, 10)}
                    onChange={e => setEndDate(e.target.value)}
                    style={{ width: '100%', padding: '0.5rem 0.6rem', borderRadius: 8, border: '1.5px solid #e5e7eb', fontSize: '0.875rem', fontFamily: 'inherit', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
            )}

            {/* Cat selector */}
            <div style={{ marginBottom: '1.25rem' }}>
              <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#555', margin: '0 0 0.6rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Your cats</p>
              {cats === null ? (
                <CatChipsSkeleton />
              ) : cats.length === 0 ? (
                <p style={{ fontSize: '0.875rem', color: '#888', lineHeight: 1.5 }}>
                  You haven&apos;t added any cats yet.{' '}
                  <Link href="/care/profile" style={{ color: '#2C5F4F', fontWeight: 600 }}>
                    Add cats to your profile →
                  </Link>
                </p>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {cats.map(name => {
                    const selected = selectedCats.includes(name)
                    return (
                      <button
                        key={name}
                        type="button"
                        onClick={() => toggleCat(name)}
                        style={{
                          padding: '0.35rem 0.8rem',
                          borderRadius: 20,
                          fontSize: '0.875rem',
                          fontWeight: 500,
                          cursor: 'pointer',
                          border: selected ? '1.5px solid #2C5F4F' : '1.5px solid #ddd',
                          background: selected ? '#EAF3DE' : '#fafafa',
                          color: selected ? '#2C5F4F' : '#555',
                          transition: 'all 0.15s',
                        }}
                      >
                        {name}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Optional message */}
            <div style={{ marginBottom: '1rem' }}>
              <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#555', margin: '0 0 0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Message <span style={{ fontWeight: 400, color: '#aaa', textTransform: 'none' }}>(optional)</span>
              </p>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Any notes for the sitter…"
                rows={3}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.75rem',
                  borderRadius: 8,
                  border: '1.5px solid #e5e7eb',
                  fontSize: '0.875rem',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  color: '#333',
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
              />
            </div>

            {error && (
              <p style={{ color: '#dc2626', fontSize: '0.8rem', margin: '0 0 0.75rem' }}>{error}</p>
            )}

            <div className={styles.modalActions}>
              <button type="button" className={styles.btnSecondary} onClick={onClose} disabled={loading}>
                Cancel
              </button>
              <button
                type="button"
                className={styles.btn}
                style={{ width: 'auto', marginTop: 0, padding: '0.5rem 1.25rem' }}
                onClick={handleSubmit}
                disabled={loading || cats === null}
              >
                {loading ? 'Sending…' : 'Send request'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
