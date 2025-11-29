import { useEffect, useState } from 'react'
import { useClient } from 'sanity'

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

function ShareButton({ doc, catName, reassignedCatName }) {
  const [copied, setCopied] = useState(false)

  const housingLabels = {
    own: 'Own House',
    rent: 'Rented Apartment',
    other: 'Other'
  }

  const getInterestedInText = () => {
    if (doc.isOpenToAnyCat) {
      return reassignedCatName ? `Any Cat → ${reassignedCatName}` : 'Any Cat'
    }
    return catName || '—'
  }

  const formatShareText = () => {
    const lines = [
      `*Adoption Application #${doc.applicationId}*`,
      '',
      `*Applicant:* ${doc.applicantName || '—'}`,
      `*Phone:* ${doc.phone || '—'}`,
      `*Email:* ${doc.email || '—'}`,
      `*Address:* ${doc.address || '—'}`,
      '',
      `*Interested in:* ${getInterestedInText()}`,
      `*Housing:* ${housingLabels[doc.housingType] || doc.housingType || '—'}`,
      `*Has Other Pets:* ${doc.hasOtherPets ? 'Yes' : 'No'}`,
    ]

    if (doc.hasOtherPets && doc.otherPetsDetails) {
      lines.push(`*Other Pets:* ${doc.otherPetsDetails}`)
    }

    lines.push('')

    if (doc.whyAdopt) {
      lines.push(`*Why they want to adopt:*`)
      lines.push(doc.whyAdopt)
      lines.push('')
    }

    if (doc.experience) {
      lines.push(`*Experience with cats:*`)
      lines.push(doc.experience)
    }

    return lines.join('\n')
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
    <button style={buttonStyle} onClick={handleShare} title="Copy all info for sharing on WhatsApp">
      <span style={{ fontSize: '1rem' }}>{copied ? '✓' : '↗'}</span>
      <span>{copied ? 'Copied!' : 'Share'}</span>
    </button>
  )
}

export function ApplicantInfoDisplay(props) {
  const { document } = props
  const client = useClient({ apiVersion: '2024-01-01' })
  const [catName, setCatName] = useState('')
  const [reassignedCatName, setReassignedCatName] = useState('')
  const [originalAppId, setOriginalAppId] = useState(null)

  const doc = document.displayed

  useEffect(() => {
    if (doc?.cat?._ref) {
      client.fetch(`*[_id == $id][0].name`, { id: doc.cat._ref })
        .then(name => setCatName(name || 'Unknown'))
    }
  }, [doc?.cat?._ref, client])

  // Fetch reassigned cat name if exists
  useEffect(() => {
    if (doc?.reassignToCat?._ref) {
      client.fetch(`*[_id == $id][0].name`, { id: doc.reassignToCat._ref })
        .then(name => setReassignedCatName(name || 'Unknown'))
    } else {
      setReassignedCatName('')
    }
  }, [doc?.reassignToCat?._ref, client])

  // Fetch original application ID if this is a duplicate
  useEffect(() => {
    if (doc?.isDuplicateOf && doc.isDuplicateOf.length > 0) {
      const firstDuplicateRef = doc.isDuplicateOf[0]._ref
      client.fetch(`*[_id == $id][0].applicationId`, { id: firstDuplicateRef })
        .then(id => setOriginalAppId(id))
    } else {
      setOriginalAppId(null)
    }
  }, [doc?.isDuplicateOf, client])

  if (!doc) return null

  const housingLabels = {
    own: 'Own House',
    rent: 'Rented Apartment',
    other: 'Other'
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
      minWidth: '140px',
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
    }
  }

  // Color coding for Adopter ID based on status
  // Status colors: new=#3b82f6 (blue), evaluation=#f59e0b (amber), adopted=#22c55e (green), rejected=#ef4444 (red), returned=#8b5cf6 (purple)
  const getIdStyle = (status, isDuplicate) => {
    const baseStyle = {
      display: 'inline-flex',
      alignItems: 'center',
      padding: '0.25rem 0.5rem',
      borderRadius: '4px',
      fontFamily: 'monospace',
      fontSize: '0.875rem',
      fontWeight: 600,
      letterSpacing: '0.05em'
    }

    // If this is a duplicate, show greyed out
    if (isDuplicate) {
      return { ...baseStyle, backgroundColor: '#9ca3af', color: '#fff' } // Grey
    }

    const statusColors = {
      new: { bg: '#3b82f6', color: '#fff' },        // Blue
      evaluation: { bg: '#f59e0b', color: '#fff' }, // Amber
      adopted: { bg: '#22c55e', color: '#fff' },    // Green
      rejected: { bg: '#ef4444', color: '#fff' },   // Red
      returned: { bg: '#8b5cf6', color: '#fff' }    // Purple
    }

    const colors = statusColors[status] || { bg: '#6b7280', color: '#fff' }
    return { ...baseStyle, backgroundColor: colors.bg, color: colors.color }
  }

  const isDuplicate = doc.isDuplicateOf && doc.isDuplicateOf.length > 0

  return (
    <div style={styles.container}>
      <div style={{ ...styles.title, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Applicant Information</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShareButton doc={doc} catName={catName} reassignedCatName={reassignedCatName} />
          <span style={{ fontSize: '0.6875rem', color: '#94a3b8', fontWeight: 400 }}>
            Copy all info
          </span>
        </div>
      </div>

      {/* Show repeat applicant warning if this is a duplicate */}
      {isDuplicate && (
        <div style={{
          backgroundColor: '#fef3c7',
          border: '1px solid #f59e0b',
          borderRadius: '6px',
          padding: '0.75rem 1rem',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <span style={{ fontSize: '1rem' }}>⚠️</span>
          <span style={{ fontSize: '0.875rem', color: '#92400e' }}>
            <strong>Repeat Applicant</strong> — Use original ID{' '}
            {originalAppId && (
              <>
                <span style={{
                  fontFamily: 'monospace',
                  fontWeight: 600,
                  backgroundColor: '#22c55e',
                  color: '#fff',
                  padding: '0.125rem 0.375rem',
                  borderRadius: '3px'
                }}>#{originalAppId}</span>
                <CopyButton value={originalAppId} />
              </>
            )}
          </span>
        </div>
      )}

      <div style={styles.row}>
        <span style={styles.label}>Adopter ID:</span>
        <span style={styles.value}>
          {doc.applicationId ? (
            <>
              <span style={getIdStyle(doc.status, isDuplicate)}>#{doc.applicationId}</span>
              {!isDuplicate && <CopyButton value={doc.applicationId} />}
              {!isDuplicate && (
                <span style={{ marginLeft: '12px', fontSize: '0.75rem', color: '#888', fontWeight: 400 }}>
                  Refer this ID to communicate with the PL team
                </span>
              )}
              {isDuplicate && (
                <span style={{ marginLeft: '12px', fontSize: '0.75rem', color: '#9ca3af', fontWeight: 400, fontStyle: 'italic' }}>
                  (superseded by #{originalAppId || '...'})
                </span>
              )}
            </>
          ) : '—'}
        </span>
      </div>

      <div style={styles.row}>
        <span style={styles.label}>Name:</span>
        <span style={styles.value}>
          {doc.applicantName || '—'}
          {doc.applicantName && <CopyButton value={doc.applicantName} />}
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
        <span style={styles.label}>Phone:</span>
        <span style={styles.value}>
          {doc.phone || '—'}
          {doc.phone && <CopyButton value={doc.phone} />}
        </span>
      </div>

      <div style={styles.row}>
        <span style={styles.label}>Address:</span>
        <span style={styles.value}>{doc.address || '—'}</span>
      </div>

      <div style={styles.row}>
        <span style={styles.label}>Housing Type:</span>
        <span style={styles.value}>{housingLabels[doc.housingType] || doc.housingType || '—'}</span>
      </div>

      <div style={styles.row}>
        <span style={styles.label}>Interested in:</span>
        <span style={styles.value}>
          {doc.isOpenToAnyCat ? (
            reassignedCatName ? (
              <span style={{ color: '#22c55e', fontWeight: 600 }}>
                🐱 Any → {reassignedCatName}
              </span>
            ) : (
              <span style={{ color: '#3b82f6', fontWeight: 600 }}>🐱 Any Cat</span>
            )
          ) : (
            catName || '—'
          )}
        </span>
      </div>

      <div style={styles.row}>
        <span style={styles.label}>Has Other Pets:</span>
        <span style={styles.value}>{doc.hasOtherPets ? 'Yes' : 'No'}</span>
      </div>

      {doc.hasOtherPets && doc.otherPetsDetails && (
        <div style={styles.row}>
          <span style={styles.label}>Other Pets:</span>
          <span style={styles.value}>{doc.otherPetsDetails}</span>
        </div>
      )}

      <div style={styles.row}>
        <span style={styles.label}>Submitted:</span>
        <span style={styles.value}>{formatDate(doc.submittedAt)}</span>
      </div>

      {doc.whyAdopt && (
        <div style={styles.textBlock}>
          <div style={styles.textLabel}>Why they want to adopt:</div>
          {doc.whyAdopt}
        </div>
      )}

      {doc.experience && (
        <div style={styles.textBlock}>
          <div style={styles.textLabel}>Experience with cats:</div>
          {doc.experience}
        </div>
      )}
    </div>
  )
}
