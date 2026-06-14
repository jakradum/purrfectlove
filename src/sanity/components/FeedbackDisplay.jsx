import { useState } from 'react'

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

export function FeedbackDisplay(props) {
  const doc = props.document?.displayed
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
      color: '#333',
      whiteSpace: 'pre-wrap'
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
          {doc.feedbackResponses}
        </div>
      )}
    </div>
  )
}
