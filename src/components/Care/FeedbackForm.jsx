'use client'

import { useState } from 'react'
import styles from './Care.module.css'
import contentEN from '@/data/careMessaging.en.json'
import contentDE from '@/data/careMessaging.de.json'

export default function FeedbackForm({ revieweeId, revieweeName, locale = 'en', onSubmitted }) {
  const t = locale === 'de' ? contentDE.feedback : contentEN.feedback

  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [fulfilled, setFulfilled] = useState(null)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!rating) {
      setError('Please select a rating.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/care/feedback/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ revieweeId, fulfilled: fulfilled === true, rating, comment }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to submit feedback.')
        return
      }

      setSubmitted(true)
      onSubmitted?.()
    } catch {
      setError('Failed to submit feedback.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className={styles.section}>
        <p style={{ color: 'var(--hunter-green)', fontWeight: 600 }}>{t.submitted}</p>
      </div>
    )
  }

  const displayRating = hoverRating || rating
  const fulfilledLabel = t.fulfilled.replace('{name}', revieweeName || 'them')

  return (
    <form className={styles.section} onSubmit={handleSubmit}>
      <h2 className={styles.sectionTitle}>{t.title}</h2>

      {/* Fulfilled yes/no */}
      <div className={styles.formGroup}>
        <label className={styles.profileLabel}>{fulfilledLabel}</label>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
          <label className={styles.checkboxLabel} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <input
              type="radio"
              name="fulfilled"
              checked={fulfilled === true}
              onChange={() => setFulfilled(true)}
            />
            {t.yes}
          </label>
          <label className={styles.checkboxLabel} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <input
              type="radio"
              name="fulfilled"
              checked={fulfilled === false}
              onChange={() => setFulfilled(false)}
            />
            {t.no}
          </label>
        </div>
      </div>

      {/* Star rating */}
      <div className={styles.formGroup}>
        <label className={styles.profileLabel}>{t.rating}</label>
        <div className={styles.starRow} style={{ marginTop: '0.5rem' }}>
          {[1, 2, 3, 4, 5].map((star) => (
            <span
              key={star}
              className={`${styles.star} ${displayRating >= star ? styles.starFilled : ''}`}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && setRating(star)}
              aria-label={`${star} star${star !== 1 ? 's' : ''}`}
            >
              ★
            </span>
          ))}
        </div>
      </div>

      {/* Comment */}
      <div className={styles.formGroup}>
        <label className={styles.profileLabel}>{t.comment}</label>
        <textarea
          className={styles.profileTextarea}
          value={comment}
          onChange={(e) => setComment(e.target.value.slice(0, 500))}
          placeholder={t.commentPlaceholder}
          rows={4}
          maxLength={500}
        />
        <p className={styles.hint}>{comment.length}/500</p>
      </div>

      {error && <p style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: '0.75rem' }}>{error}</p>}

      <button
        type="submit"
        className={styles.btn}
        style={{ width: 'auto', padding: '0.65rem 1.75rem' }}
        disabled={loading || !rating}
      >
        {loading ? 'Submitting…' : t.submit}
      </button>
    </form>
  )
}
