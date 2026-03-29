'use client'

import styles from './Care.module.css'
import contentEN from '@/data/careMessaging.en.json'
import contentDE from '@/data/careMessaging.de.json'

export default function FeedbackDisplay({ feedbacks = [], locale = 'en' }) {
  const t = locale === 'de' ? contentDE.feedback : contentEN.feedback

  if (!feedbacks || feedbacks.length === 0) return null

  const count = feedbacks.length
  const avg = feedbacks.reduce((sum, f) => sum + (f.rating || 0), 0) / count
  const fulfilledCount = feedbacks.filter(f => f.fulfilled === true).length
  const fulfillmentRate = Math.round((fulfilledCount / count) * 100)
  const avgRounded = Math.round(avg * 10) / 10

  const avgLabel = t.avgRating
    .replace('{rating}', avgRounded)
    .replace('{count}', count)
  const rateLabel = t.fulfillmentRate.replace('{rate}', fulfillmentRate)

  const recent = feedbacks
    .filter(f => f.comment)
    .slice(-3)
    .reverse()

  return (
    <div className={styles.section}>
      <div className={styles.feedbackSummary}>
        <div className={styles.starRow}>
          {[1, 2, 3, 4, 5].map(star => (
            <span
              key={star}
              className={`${styles.star} ${avgRounded >= star ? styles.starFilled : ''}`}
              style={{ cursor: 'default' }}
            >
              ★
            </span>
          ))}
        </div>
        <span className={styles.feedbackAvg}>{avgLabel}</span>
        <span className={styles.feedbackCount}>{rateLabel}</span>
      </div>

      {recent.length > 0 && (
        <div>
          {recent.map((f, i) => (
            <p key={i} className={styles.feedbackComment}>
              &ldquo;{f.comment}&rdquo;
            </p>
          ))}
        </div>
      )}
    </div>
  )
}
