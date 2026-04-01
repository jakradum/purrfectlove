'use client';

import { useState } from 'react';
import styles from './Care.module.css';

const REASONS = [
  { value: 'spam', label: 'Spam or unsolicited messages' },
  { value: 'inappropriate', label: 'Inappropriate behaviour' },
  { value: 'impersonation', label: 'Impersonation' },
  { value: 'other', label: 'Other' },
];

/**
 * ReportModal
 *
 * Props:
 *   memberName   – display name of the reported member
 *   memberId     – Sanity _id of the reported member
 *   onClose      – () => void
 */
export default function ReportModal({ memberName, memberId, onClose }) {
  const [reason, setReason] = useState('spam');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/care/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportedId: memberId, reason, note }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to submit report.');
        return;
      }
      setDone(true);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className={styles.modalOverlay}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={styles.modal}>
        {done ? (
          <>
            <p className={styles.modalTitle}>Report submitted</p>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-light)', marginBottom: '1.25rem', lineHeight: 1.6 }}>
              Thank you. We review every report and take action where needed.
            </p>
            <div className={styles.modalActions}>
              <button type="button" className={styles.btn} onClick={onClose}>Close</button>
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <p className={styles.modalTitle}>Report {memberName}</p>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-light)', marginBottom: '1rem', lineHeight: 1.5 }}>
              Reports are confidential and reviewed by our team.
            </p>

            <div className={styles.formGroup}>
              <label className={styles.profileLabel}>Reason</label>
              <select
                className={styles.profileInput}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              >
                {REASONS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.profileLabel}>Additional details (optional)</label>
              <textarea
                className={styles.profileInput}
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Describe what happened…"
                maxLength={500}
                style={{ resize: 'vertical', minHeight: '70px' }}
              />
            </div>

            {error && (
              <p style={{ color: '#b91c1c', fontSize: '0.85rem', marginBottom: '0.75rem' }}>{error}</p>
            )}

            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={onClose}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={styles.dangerBtn}
                style={{ padding: '0.5rem 1.25rem' }}
                disabled={submitting}
              >
                {submitting ? 'Submitting…' : 'Submit report'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
