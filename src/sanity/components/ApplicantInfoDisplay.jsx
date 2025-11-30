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
    <button style={buttonStyle} onClick={handleShare} title="Copy applicant info for sharing">
      <span style={{ fontSize: '1rem' }}>{copied ? '✓' : '↗'}</span>
      <span>{copied ? 'Copied!' : 'Share'}</span>
    </button>
  )
}

function ExportButton({ doc, catName, reassignedCatName, assignedToName, interviewedByName, homeVisitByName }) {
  const [copied, setCopied] = useState(false)

  const housingLabels = {
    own: 'Own House',
    rent: 'Rented Apartment',
    other: 'Other'
  }

  const statusLabels = {
    new: 'New',
    evaluation: 'Interview / Evaluation',
    adopted: 'Adopted',
    rejected: 'Rejected',
    returned: 'Returned Cat'
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getInterestedInText = () => {
    if (doc.isOpenToAnyCat) {
      return reassignedCatName ? `Any Cat → ${reassignedCatName}` : 'Any Cat'
    }
    return catName || '—'
  }

  const formatExportText = () => {
    const lines = [
      `═══════════════════════════════════════`,
      `ADOPTION APPLICATION #${doc.applicationId}`,
      `═══════════════════════════════════════`,
      '',
      `APPLICANT DETAILS`,
      `─────────────────`,
      `Name: ${doc.applicantName || '—'}`,
      `Phone: ${doc.phone || '—'}`,
      `Email: ${doc.email || '—'}`,
      `Address: ${doc.address || '—'}`,
      `Housing: ${housingLabels[doc.housingType] || doc.housingType || '—'}`,
      `Has Other Pets: ${doc.hasOtherPets ? 'Yes' : 'No'}`,
    ]

    if (doc.hasOtherPets && doc.otherPetsDetails) {
      lines.push(`Other Pets: ${doc.otherPetsDetails}`)
    }

    lines.push('')
    lines.push(`CAT INTEREST`)
    lines.push(`────────────`)
    lines.push(`Interested in: ${getInterestedInText()}`)

    lines.push('')
    lines.push(`APPLICATION RESPONSES`)
    lines.push(`─────────────────────`)

    if (doc.whyAdopt) {
      lines.push(`Why they want to adopt:`)
      lines.push(doc.whyAdopt)
      lines.push('')
    }

    if (doc.experience) {
      lines.push(`Experience with cats:`)
      lines.push(doc.experience)
      lines.push('')
    }

    lines.push(`OFFICIAL STATUS`)
    lines.push(`───────────────`)
    lines.push(`Status: ${statusLabels[doc.status] || doc.status || '—'}`)
    lines.push(`Assigned To: ${assignedToName || 'Unassigned'}`)
    lines.push(`Submitted: ${formatDate(doc.submittedAt)}`)

    if (doc.notes) {
      lines.push('')
      lines.push(`Internal Notes:`)
      lines.push(doc.notes)
    }

    if (doc.interviewCompleted) {
      lines.push('')
      lines.push(`INTERVIEW`)
      lines.push(`─────────`)
      lines.push(`Interviewed By: ${interviewedByName || '—'}`)
      lines.push(`Interview Date: ${formatDate(doc.interviewDate)}`)
      if (doc.interviewNotes) {
        lines.push(`Interview Notes:`)
        lines.push(doc.interviewNotes)
      }
    }

    if (doc.homeVisitCompleted) {
      lines.push('')
      lines.push(`HOME VISIT`)
      lines.push(`──────────`)
      lines.push(`Conducted By: ${homeVisitByName || '—'}`)
      lines.push(`Visit Date: ${formatDate(doc.homeVisitDate)}`)
      if (doc.homeVisitNotes) {
        lines.push(`Home Visit Notes:`)
        lines.push(doc.homeVisitNotes)
      }
    }

    lines.push('')
    lines.push(`═══════════════════════════════════════`)
    lines.push(`Exported on ${new Date().toLocaleString('en-IN')}`)

    return lines.join('\n')
  }

  const handleExport = async () => {
    const text = formatExportText()
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
  }

  const buttonStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    backgroundColor: copied ? '#22c55e' : '#e0e7ff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.8125rem',
    fontWeight: 500,
    color: copied ? '#fff' : '#4338ca',
    transition: 'all 0.2s ease'
  }

  return (
    <button style={buttonStyle} onClick={handleExport} title="Export full application with notes and status">
      <span style={{ fontSize: '1rem' }}>{copied ? '✓' : '📋'}</span>
      <span>{copied ? 'Copied!' : 'Export'}</span>
    </button>
  )
}

export function ApplicantInfoDisplay(props) {
  const { document } = props
  const client = useClient({ apiVersion: '2024-01-01' })
  const [catName, setCatName] = useState('')
  const [reassignedCatName, setReassignedCatName] = useState('')
  const [originalAppId, setOriginalAppId] = useState(null)
  const [assignedToName, setAssignedToName] = useState('')
  const [interviewedByName, setInterviewedByName] = useState('')
  const [homeVisitByName, setHomeVisitByName] = useState('')

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
    if (doc?.isDuplicateOf?._ref) {
      client.fetch(`*[_id == $id][0].applicationId`, { id: doc.isDuplicateOf._ref })
        .then(id => setOriginalAppId(id))
    } else {
      setOriginalAppId(null)
    }
  }, [doc?.isDuplicateOf, client])

  // Fetch assigned to name
  useEffect(() => {
    if (doc?.assignedTo?._ref) {
      client.fetch(`*[_id == $id][0].name`, { id: doc.assignedTo._ref })
        .then(name => setAssignedToName(name || ''))
    } else {
      setAssignedToName('')
    }
  }, [doc?.assignedTo?._ref, client])

  // Fetch interviewed by name
  useEffect(() => {
    if (doc?.interviewedBy?._ref) {
      client.fetch(`*[_id == $id][0].name`, { id: doc.interviewedBy._ref })
        .then(name => setInterviewedByName(name || ''))
    } else {
      setInterviewedByName('')
    }
  }, [doc?.interviewedBy?._ref, client])

  // Fetch home visit by name
  useEffect(() => {
    if (doc?.homeVisitBy?._ref) {
      client.fetch(`*[_id == $id][0].name`, { id: doc.homeVisitBy._ref })
        .then(name => setHomeVisitByName(name || ''))
    } else {
      setHomeVisitByName('')
    }
  }, [doc?.homeVisitBy?._ref, client])

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

  const isDuplicate = !!doc.isDuplicateOf

  return (
    <div style={styles.container}>
      <div style={{ ...styles.title, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Applicant Information</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ShareButton doc={doc} catName={catName} reassignedCatName={reassignedCatName} />
          <ExportButton
            doc={doc}
            catName={catName}
            reassignedCatName={reassignedCatName}
            assignedToName={assignedToName}
            interviewedByName={interviewedByName}
            homeVisitByName={homeVisitByName}
          />
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
