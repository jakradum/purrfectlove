import { useState } from 'react'

function CopyButton({ value }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    if (!value) return
    await navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
  }

  const iconStyle = {
    marginLeft: '8px',
    cursor: 'pointer',
    opacity: 0.6,
    fontSize: '0.875rem',
    userSelect: 'none'
  }

  return (
    <span style={iconStyle} onClick={handleCopy} title={copied ? 'Copied!' : 'Copy'}>
      {copied ? '✓' : '⧉'}
    </span>
  )
}

function ShareButton({ doc }) {
  const [copied, setCopied] = useState(false)

  const formatShareText = () => {
    const localeLabel = doc.locale === 'de' ? 'German' : 'English (India)'
    const lines = [
      `*Contact Message*`,
      '',
      `*From:* ${doc.name || '—'}`,
      `*Email:* ${doc.email || '—'}`,
      `*Language:* ${localeLabel}`,
      `*Received:* ${formatDate(doc.submittedAt)}`,
      '',
      `*Message:*`,
      doc.message || '—'
    ]

    return lines.join('\n')
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleShare = async () => {
    const text = formatShareText()
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
  }

  const buttonStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    backgroundColor: copied ? '#22c55e' : '#f1f5f9',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.8125rem',
    fontWeight: 500,
    color: copied ? '#fff' : '#475569',
    transition: 'all 0.2s ease'
  }

  return (
    <button style={buttonStyle} onClick={handleShare} title="Copy message for sharing">
      <span style={{ fontSize: '1rem' }}>{copied ? '✓' : '↗'}</span>
      <span>{copied ? 'Copied!' : 'Share'}</span>
    </button>
  )
}

export function ContactMessageDisplay(props) {
  const { document } = props
  const doc = document.displayed

  if (!doc) return null

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const styles = {
    container: {
      padding: '1.5rem',
      backgroundColor: '#faf9f7',
      borderRadius: '8px',
      marginBottom: '1.5rem'
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
      minWidth: '100px',
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
    flag: {
      fontSize: '1.25rem',
      marginRight: '0.5rem'
    }
  }

  const countryFlag = doc.locale === 'de' ? '🇩🇪' : '🇮🇳'
  const localeLabel = doc.locale === 'de' ? 'German' : 'English (India)'

  return (
    <div style={styles.container}>
      <div style={{ ...styles.title, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>
          <span style={styles.flag}>{countryFlag}</span>
          Message Details
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShareButton doc={doc} />
          <span style={{ fontSize: '0.6875rem', color: '#94a3b8', fontWeight: 400 }}>
            Copy all info
          </span>
        </div>
      </div>

      <div style={styles.row}>
        <span style={styles.label}>From:</span>
        <span style={styles.value}>
          {doc.name || '—'}
          {doc.name && <CopyButton value={doc.name} />}
        </span>
      </div>

      <div style={styles.row}>
        <span style={styles.label}>Email:</span>
        <span style={styles.value}>
          {doc.email || '—'}
          {doc.email && <CopyButton value={doc.email} />}
        </span>
      </div>

      <div style={styles.row}>
        <span style={styles.label}>Language:</span>
        <span style={styles.value}>{localeLabel}</span>
      </div>

      <div style={styles.row}>
        <span style={styles.label}>Received:</span>
        <span style={styles.value}>{formatDate(doc.submittedAt)}</span>
      </div>

      {doc.message && (
        <div style={styles.textBlock}>
          <div style={styles.textLabel}>Message:</div>
          {doc.message}
        </div>
      )}
    </div>
  )
}
