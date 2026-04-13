'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import styles from './Care.module.css'
import CatAvatar from './CatAvatar'
import { CatChipsSkeleton } from './Skeletons'

const COVERS = [
  '/images/care/cover-pattern-1.png',
  '/images/care/cover-pattern-2.png',
  '/images/care/cover-pattern-3.png',
]
const COVER_FALLBACKS = ['#F6F4F0', '#F5D5C8', '#D4E4DF']

function coverIndex(id) {
  if (!id) return 0
  let h = 0
  for (let i = 0; i < id.length; i++) h = ((h * 31) + id.charCodeAt(i)) >>> 0
  return h % 3
}

function formatDate(ymd) {
  if (!ymd) return ''
  const [y, m, d] = ymd.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
}

/**
 * sitterProfile (optional) — when provided, a profile header is shown at the top.
 * Shape: { photoUrl, avatarColour, bio, coverImageUrl, _distance, location, _createdAt, identityVerified, trustedSitter }
 */
export default function BookingRequestModal({
  sitterId,
  sitterName,
  startDate: initialStart,
  endDate: initialEnd,
  canDoHomeVisit,
  canHostCats,
  sitterProfile,
  onClose,
  onSuccess,
}) {
  const [startDate, setStartDate] = useState(initialStart || '')
  const [endDate, setEndDate] = useState(initialEnd || '')
  const [cats, setCats] = useState(null) // null = loading
  const [selectedCats, setSelectedCats] = useState([])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(null) // { bookingRef }

  // Sit type: auto-select when sitter only offers one type
  const sitterDoesBoth = canDoHomeVisit && canHostCats
  const [sitType, setSitType] = useState(() => {
    if (canDoHomeVisit && !canHostCats) return 'home_visit'
    if (canHostCats && !canDoHomeVisit) return 'drop_off'
    return null
  })

  const needsDates = !initialStart || !initialEnd

  // Drag-to-close
  const sheetRef = useRef(null)
  const dragStartY = useRef(null)
  const [dragOffset, setDragOffset] = useState(0)

  const onTouchStart = (e) => { dragStartY.current = e.touches[0].clientY; setDragOffset(0) }
  const onTouchMove  = (e) => { const d = e.touches[0].clientY - dragStartY.current; if (d > 0) setDragOffset(d) }
  const onTouchEnd   = () => { if (dragOffset > 80) onClose?.(); else setDragOffset(0) }

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
    if (!startDate || !endDate) { setError('Please select start and end dates.'); return }
    if (!sitType) { setError('Please select a sit type.'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/care/bookings/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sitterId, startDate, endDate, cats: selectedCats, message: message.trim() || null, sitType }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to send request.'); return }
      setSubmitted({ bookingRef: data.bookingRef })
      onSuccess?.({ bookingRef: data.bookingRef, bookingId: data.bookingId })
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Profile header data
  const profile = sitterProfile || {}
  const idx = coverIndex(sitterId || '')
  const coverSrc = profile.coverImageUrl || COVERS[idx]
  const coverBg  = COVER_FALLBACKS[idx]
  const isCoverPattern = !profile.coverImageUrl

  const memberSince = profile._createdAt
    ? new Date(profile._createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : null
  const metaParts = [
    profile._distance != null ? `~${profile._distance.toFixed(1)} km away` : null,
    profile.location?.name || null,
    memberSince ? `Member since ${memberSince}` : null,
  ].filter(Boolean)

  const content = (
    <div
      className={styles.bookReqOverlay}
      onClick={e => e.target === e.currentTarget && onClose?.()}
    >
      <div
        className={styles.bookReqSheet}
        ref={sheetRef}
        style={dragOffset > 0 ? { transform: `translateY(${dragOffset}px)`, transition: 'none' } : undefined}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div className={styles.bookReqHandle} />

        {/* ── Sitter profile header ── */}
        {sitterProfile && (
          <>
            <div
              className={styles.bookReqCover}
              style={isCoverPattern
                ? { backgroundImage: `url(${coverSrc})`, backgroundColor: coverBg }
                : { backgroundImage: `url(${coverSrc})`, backgroundSize: 'cover', backgroundPosition: 'center' }
              }
            >
              <button
                type="button"
                className={styles.bookReqCloseBtn}
                onClick={onClose}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className={styles.bookReqAvatarRow}>
              <CatAvatar
                photoUrl={profile.photoUrl}
                avatarColour={profile.avatarColour}
                name={sitterName}
                size={52}
                style={{ border: '3px solid #fff', boxShadow: '0 2px 8px rgba(0,0,0,0.12)', flexShrink: 0 }}
              />
            </div>

            <div className={styles.bookReqProfileInfo}>
              <p className={styles.bookReqSitterName}>
                {sitterName}
                {profile.identityVerified && <span style={{ color: '#2C5F4F', marginLeft: 4 }}>✓</span>}
                {profile.trustedSitter && <span style={{ marginLeft: 4 }}>⭐</span>}
              </p>
              {metaParts.length > 0 && (
                <p className={styles.bookReqSitterMeta}>{metaParts.join(' · ')}</p>
              )}
              {profile.bio && (
                <p className={styles.bookReqSitterBio}>{profile.bio}</p>
              )}
              {(canDoHomeVisit || canHostCats) && (
                <div className={styles.bookReqSitsPills}>
                  {canDoHomeVisit && <span className={styles.capabilityPill}>Home visits</span>}
                  {canHostCats    && <span className={styles.capabilityPill}>Drop-off</span>}
                </div>
              )}
            </div>
          </>
        )}

        {/* ── Form ── */}
        <div className={styles.bookReqForm}>
          {/* Close button when no profile header */}
          {!sitterProfile && (
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
          )}

          {submitted ? (
            <>
              <p className={styles.modalTitle} style={{ color: '#2C5F4F', marginTop: sitterProfile ? 0 : '1.5rem' }}>Request sent!</p>
              <p style={{ fontSize: '0.9rem', color: '#555', margin: '0 0 0.5rem' }}>
                Your booking request has been sent to <strong>{sitterName}</strong>.
              </p>
              <p style={{ fontSize: '0.85rem', color: '#888', margin: '0 0 1.5rem' }}>
                Booking ID: <strong style={{ color: '#2C5F4F' }}>#{submitted.bookingRef}</strong>
              </p>
              <div className={styles.modalActions} style={{ justifyContent: 'flex-start' }}>
                <button type="button" className={styles.btn} style={{ width: 'auto', marginTop: 0, padding: '0.5rem 1.25rem' }} onClick={onClose}>
                  Done
                </button>
              </div>
            </>
          ) : (
            <>
              <p className={styles.modalTitle} style={{ marginTop: sitterProfile ? 0 : '1.5rem' }}>Request a sit</p>
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

              {/* Sit type */}
              <div style={{ marginBottom: '1.25rem' }}>
                <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#555', margin: '0 0 0.6rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Sit type</p>
                {sitterDoesBoth ? (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {[
                      { value: 'home_visit', label: 'Home visit', desc: 'sitter comes to you' },
                      { value: 'drop_off',   label: 'Drop-off',   desc: 'you bring your cat' },
                    ].map(({ value, label, desc }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setSitType(value)}
                        style={{
                          flex: 1,
                          padding: '0.5rem 0.75rem',
                          borderRadius: 8,
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          border: sitType === value ? '1.5px solid #2C5F4F' : '1.5px solid #ddd',
                          background: sitType === value ? '#EAF3DE' : '#fafafa',
                          color: sitType === value ? '#2C5F4F' : '#555',
                          textAlign: 'left',
                          lineHeight: 1.4,
                        }}
                      >
                        {label}
                        <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 400, color: sitType === value ? '#2C5F4F' : '#999', marginTop: 2 }}>{desc}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: '0.875rem', color: '#2C5F4F', fontWeight: 600, margin: 0 }}>
                    {sitType === 'home_visit' ? 'Home visit — sitter comes to you' : 'Drop-off — you bring your cat to the sitter'}
                  </p>
                )}
              </div>

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

              <div className={styles.modalActions} style={{ justifyContent: 'space-between' }}>
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
    </div>
  )

  if (typeof document === 'undefined') return null
  return createPortal(content, document.body)
}
