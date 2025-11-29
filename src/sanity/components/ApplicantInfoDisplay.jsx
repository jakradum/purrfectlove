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

export function ApplicantInfoDisplay(props) {
  const { document } = props
  const client = useClient({ apiVersion: '2024-01-01' })
  const [catName, setCatName] = useState('')

  const doc = document.displayed

  useEffect(() => {
    if (doc?.cat?._ref) {
      client.fetch(`*[_id == $id][0].name`, { id: doc.cat._ref })
        .then(name => setCatName(name || 'Unknown'))
    }
  }, [doc?.cat?._ref, client])

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

  const idStyle = {
    display: 'inline-block',
    backgroundColor: '#e8e4df',
    padding: '0.25rem 0.5rem',
    borderRadius: '4px',
    fontFamily: 'monospace',
    fontSize: '0.875rem',
    fontWeight: 600,
    letterSpacing: '0.05em'
  }

  return (
    <div style={styles.container}>
      <div style={{ ...styles.title, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Applicant Information</span>
        {doc.applicationId && (
          <span style={idStyle}>#{doc.applicationId}</span>
        )}
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
        <span style={styles.value}>{catName || '—'}</span>
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
