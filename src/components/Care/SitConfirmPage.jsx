'use client';

import { useState } from 'react';
import styles from './Care.module.css';

const RESPONSE_OPTIONS = [
  { value: 'yes_great', label: '✅ Yes, it went great!' },
  { value: 'yes_feedback', label: '💬 Yes, but I have some feedback' },
  { value: 'no', label: "❌ It didn't happen" },
];

export default function SitConfirmPage({ record, role }) {
  const existingResponse = role === 'sitter' ? record.sitterResponse : record.parentResponse;
  const [response, setResponse] = useState(existingResponse || '')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(!!existingResponse)
  const [error, setError] = useState(null)

  const otherName = role === 'sitter' ? record.parentName : record.sitterName

  const handleSubmit = async () => {
    if (!response) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/care/sit-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sitRecordId: record._id, response, note: note || undefined }),
        credentials: 'include',
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Something went wrong.')
      } else {
        setDone(true)
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className={styles.pageWrap}>
      <div className={styles.pageInner} style={{ maxWidth: '540px' }}>
        <h1 className={styles.pageTitle}>Confirm Sit</h1>

        <div className={styles.card} style={{ padding: '1.5rem' }}>
          <p className={styles.infoText}>
            Sit with <strong>{otherName || 'your match'}</strong>
            <br />
            <span style={{ color: '#666', fontSize: '0.85rem' }}>
              {record.startDate} – {record.endDate}
            </span>
          </p>

          {done ? (
            <div className={styles.successBox}>
              <p style={{ margin: 0, fontWeight: 600 }}>Thanks for confirming!</p>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#555' }}>
                Your response has been recorded.
              </p>
            </div>
          ) : (
            <>
              <p style={{ fontWeight: 600, marginBottom: '0.75rem' }}>Did the sit happen?</p>
              <div className={styles.radioGroup}>
                {RESPONSE_OPTIONS.map((opt) => (
                  <label key={opt.value} className={styles.radioLabel}>
                    <input
                      type="radio"
                      name="sitResponse"
                      value={opt.value}
                      checked={response === opt.value}
                      onChange={() => setResponse(opt.value)}
                    />
                    {opt.label}
                  </label>
                ))}
              </div>

              {(response === 'yes_feedback' || response === 'no') && (
                <div style={{ marginTop: '1rem' }}>
                  <label className={styles.formLabel}>
                    {response === 'yes_feedback' ? 'Your feedback (optional)' : 'What happened? (optional)'}
                  </label>
                  <textarea
                    className={styles.formTextarea}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Share any details with our team..."
                    maxLength={1000}
                    rows={4}
                  />
                </div>
              )}

              {error && <p className={styles.errorText}>{error}</p>}

              <button
                className={styles.primaryBtn}
                onClick={handleSubmit}
                disabled={!response || submitting}
                style={{ marginTop: '1.25rem' }}
              >
                {submitting ? 'Saving…' : 'Submit'}
              </button>
            </>
          )}
        </div>
      </div>
    </main>
  )
}
