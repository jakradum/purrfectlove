'use client'

import { useState } from 'react'
import styles from './Care.module.css'
import contentEN from '@/data/careMessaging.en.json'
import contentDE from '@/data/careMessaging.de.json'

export default function ContactShareModal({ partnerName, partnerId, locale = 'en', onClose, onShared }) {
  const t = locale === 'de' ? contentDE.contact : contentEN.contact
  const [shareEmail, setShareEmail] = useState(false)
  const [shareWhatsApp, setShareWhatsApp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleShare = async () => {
    if (!shareEmail && !shareWhatsApp) {
      setError('Select at least one contact method to share.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/care/contact/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientId: partnerId, shareEmail, shareWhatsApp }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to share. Please try again.')
        return
      }

      onShared?.({ shareEmail, shareWhatsApp })
      onClose?.()
    } catch {
      setError('Failed to share. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const title = t.shareTitle.replace('{name}', partnerName)

  return (
    <div className={styles.modalOverlay} onClick={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className={styles.modal}>
        <p className={styles.modalTitle}>{title}</p>

        <label className={styles.checkboxLabel} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <input
            type="checkbox"
            checked={shareEmail}
            onChange={(e) => setShareEmail(e.target.checked)}
          />
          {t.shareEmail}
        </label>

        <label className={styles.checkboxLabel} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input
            type="checkbox"
            checked={shareWhatsApp}
            onChange={(e) => setShareWhatsApp(e.target.checked)}
          />
          {t.shareWhatsApp}
        </label>

        {error && (
          <p style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.75rem' }}>{error}</p>
        )}

        <div className={styles.modalActions}>
          <button
            type="button"
            className={styles.btnSecondary}
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            className={styles.btn}
            style={{ width: 'auto', marginTop: 0, padding: '0.5rem 1.25rem' }}
            onClick={handleShare}
            disabled={loading}
          >
            {loading ? 'Sharing…' : t.shareConfirm}
          </button>
        </div>
      </div>
    </div>
  )
}
