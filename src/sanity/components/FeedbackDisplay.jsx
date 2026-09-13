import { useState } from 'react'
import { useFormValue } from 'sanity'

const GOLD = '#d4a017'
const GREY = '#d1d5db'

function CopyButton({ value }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    if (!value) return
    await navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
  }

  return (
    <span
      onClick={handleCopy}
      title={copied ? 'Copied!' : 'Copy'}
      style={{ marginLeft: '8px', cursor: 'pointer', opacity: 0.6, fontSize: '0.875rem', userSelect: 'none' }}
    >
      {copied ? '✓' : '⧉'}
    </span>
  )
}

// Read-only star rating, e.g. 4/5 -> ★★★★☆, 3.5/5 -> ★★★⯪☆ (half star rendered
// as a gold star clipped to 50% width over a grey one).
function Stars({ value, max = 5 }) {
  const rounded = Math.round(value * 2) / 2
  const stars = []
  for (let i = 1; i <= max; i++) {
    const diff = rounded - (i - 1)
    stars.push(diff >= 1 ? 1 : diff >= 0.5 ? 0.5 : 0)
  }

  return (
    <span aria-label={`${value} out of ${max} stars`} style={{ display: 'inline-flex', alignItems: 'center' }}>
      {stars.map((fill, i) => (
        <span key={i} style={{ position: 'relative', display: 'inline-block', width: '1em', fontSize: '1rem', lineHeight: 1 }}>
          <span style={{ color: GREY }}>★</span>
          {fill > 0 && (
            <span
              style={{
                position: 'absolute', top: 0, left: 0,
                width: fill === 1 ? '100%' : '50%',
                overflow: 'hidden', color: GOLD
              }}
            >
              ★
            </span>
          )}
        </span>
      ))}
      <span style={{ marginLeft: '6px', fontSize: '0.8125rem', color: '#9ca3af' }}>{value}/{max}</span>
    </span>
  )
}

// Feedback responses are stored as one plain-text blob (see
// /api/feedback/submit). Lines look like:
//   "Overall experience"              <- section header (no colon)
//   "  Overall satisfaction: 5/5"     <- rating line, rendered as stars
//   "What they appreciated: ..."      <- free-text line, rendered as-is
function parseFeedbackLine(line) {
  const trimmed = line.trim()
  if (!trimmed) return { type: 'blank' }

  const colonIdx = trimmed.indexOf(':')
  if (colonIdx === -1) return { type: 'header', text: trimmed }

  const label = trimmed.slice(0, colonIdx).trim()
  const value = trimmed.slice(colonIdx + 1).trim()
  const ratingMatch = value.match(/^(\d+(?:\.\d+)?)\s*\/\s*5$/)
  const indented = /^\s/.test(line)

  if (ratingMatch) {
    return { type: 'rating', label, value: parseFloat(ratingMatch[1]), indented }
  }
  return { type: 'text', label, value, indented }
}

function FeedbackResponses({ raw }) {
  const lines = raw.split('\n').map(parseFeedbackLine)

  return (
    <div>
      {lines.map((line, i) => {
        if (line.type === 'blank') return <div key={i} style={{ height: '0.75rem' }} />

        if (line.type === 'header') {
          return (
            <div key={i} style={{ fontWeight: 600, color: '#333', marginTop: '0.25rem', marginBottom: '0.375rem' }}>
              {line.text}
            </div>
          )
        }

        const rowStyle = {
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: '0.375rem', paddingLeft: line.indented ? '1rem' : 0
        }

        if (line.type === 'rating') {
          return (
            <div key={i} style={rowStyle}>
              <span style={{ color: '#666' }}>{line.label}</span>
              <Stars value={line.value} />
            </div>
          )
        }

        return (
          <div key={i} style={{ ...rowStyle, alignItems: 'flex-start' }}>
            <span style={{ color: '#666', flexShrink: 0, marginRight: '1rem' }}>{line.label}:</span>
            <span style={{ color: '#333', textAlign: 'right' }}>{line.value}</span>
          </div>
        )
      })}
    </div>
  )
}

export function FeedbackDisplay(props) {
  const doc = useFormValue([])
  if (!doc || doc.status !== 'adopted') return null

  const formatDate = (dateStr) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }

  const styles = {
    container: {
      padding: '1.5rem',
      backgroundColor: '#faf9f7',
      borderRadius: '8px',
    },
    title: {
      fontSize: '1rem',
      fontWeight: 600,
      marginBottom: '1rem',
      color: '#333'
    },
    row: {
      display: 'flex',
      marginBottom: '0.5rem',
      fontSize: '0.9375rem',
      lineHeight: 1.5
    },
    label: {
      color: '#666',
      minWidth: '160px',
      flexShrink: 0
    },
    value: {
      color: '#333',
      fontWeight: 500
    },
    textBlock: {
      marginTop: '1rem',
      padding: '1rem',
      backgroundColor: '#fff',
      borderRadius: '4px',
      fontSize: '0.9375rem',
      lineHeight: 1.6,
      color: '#333'
    },
    textLabel: {
      fontSize: '0.8125rem',
      color: '#666',
      marginBottom: '0.5rem'
    },
    emptyNote: {
      fontSize: '0.875rem',
      color: '#9ca3af',
      fontStyle: 'italic'
    }
  }

  const hasAnyFeedback = doc.feedbackSentAt || doc.feedbackSubmittedAt || doc.feedbackResponses

  return (
    <div style={styles.container}>
      <div style={styles.title}>30-Day Adoption Feedback</div>

      <div style={styles.row}>
        <span style={styles.label}>Adopted At:</span>
        <span style={styles.value}>{formatDate(doc.adoptedAt)}</span>
      </div>

      <div style={styles.row}>
        <span style={styles.label}>Locale:</span>
        <span style={styles.value}>{doc.feedbackLocale === 'de' ? '🇩🇪 German' : '🇮🇳 English'}</span>
      </div>

      {!hasAnyFeedback && (
        <div style={{ ...styles.row, marginTop: '0.5rem' }}>
          <span style={styles.emptyNote}>Feedback email not yet sent — will be triggered 30 days after adoption.</span>
        </div>
      )}

      {doc.feedbackSentAt && (
        <div style={styles.row}>
          <span style={styles.label}>Email Sent:</span>
          <span style={styles.value}>{formatDate(doc.feedbackSentAt)}</span>
        </div>
      )}

      {doc.feedbackSubmittedAt ? (
        <div style={styles.row}>
          <span style={styles.label}>Submitted:</span>
          <span style={styles.value}>{formatDate(doc.feedbackSubmittedAt)}</span>
        </div>
      ) : doc.feedbackSentAt ? (
        <div style={styles.row}>
          <span style={styles.label}>Submitted:</span>
          <span style={{ ...styles.value, color: '#9ca3af', fontStyle: 'italic', fontWeight: 400 }}>Not yet submitted</span>
        </div>
      ) : null}

      {doc.feedbackResponses && (
        <div style={styles.textBlock}>
          <div style={{ ...styles.textLabel, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Responses</span>
            <CopyButton value={doc.feedbackResponses} />
          </div>
          <FeedbackResponses raw={doc.feedbackResponses} />
        </div>
      )}
    </div>
  )
}
