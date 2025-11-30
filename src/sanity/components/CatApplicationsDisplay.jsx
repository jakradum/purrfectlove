import { useEffect, useState, useCallback } from 'react'
import { useClient, useFormValue } from 'sanity'

export function CatApplicationsDisplay(props) {
  const client = useClient({ apiVersion: '2024-01-01' })
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [adoptedApp, setAdoptedApp] = useState(null)

  // Get document ID using useFormValue to access the document's _id
  const documentId = useFormValue(['_id'])

  const fetchApplications = useCallback(() => {
    if (!documentId) {
      setLoading(false)
      return
    }

    // Remove 'drafts.' prefix if present for the query
    const cleanId = documentId.replace('drafts.', '')

    client.fetch(
      `*[_type == "application" && cat._ref == $catId && !defined(isDuplicateOf)] | order(submittedAt desc) {
        _id,
        applicationId,
        applicantName,
        status,
        submittedAt
      }`,
      { catId: cleanId }
    ).then(apps => {
      setApplications(apps || [])
      // Find if any application has adopted status
      const adopted = apps?.find(app => app.status === 'adopted')
      setAdoptedApp(adopted || null)
      setLoading(false)
    }).catch((err) => {
      console.error('Error fetching applications:', err)
      setLoading(false)
    })
  }, [documentId, client])

  useEffect(() => {
    fetchApplications()

    // Set up a polling interval to refresh data (every 5 seconds)
    const interval = setInterval(fetchApplications, 5000)
    return () => clearInterval(interval)
  }, [fetchApplications])

  const statusLabels = {
    new: { label: 'New', color: '#3b82f6' },
    evaluation: { label: 'Evaluation', color: '#f59e0b' },
    adopted: { label: 'Adopted', color: '#22c55e' },
    rejected: { label: 'Rejected', color: '#ef4444' },
    returned: { label: 'Returned', color: '#8b5cf6' }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const styles = {
    container: {
      padding: '1rem',
      backgroundColor: '#f8fafc',
      borderRadius: '8px',
      marginBottom: '1rem'
    },
    header: {
      fontSize: '0.875rem',
      fontWeight: 600,
      color: '#334155',
      marginBottom: '0.75rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem'
    },
    statusBadge: {
      display: 'inline-flex',
      alignItems: 'center',
      padding: '0.25rem 0.75rem',
      borderRadius: '9999px',
      fontSize: '0.75rem',
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.05em'
    },
    helpText: {
      fontSize: '0.75rem',
      color: '#64748b',
      marginTop: '0.5rem',
      fontStyle: 'italic'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      marginTop: '1rem',
      fontSize: '0.8125rem'
    },
    th: {
      textAlign: 'left',
      padding: '0.5rem',
      borderBottom: '1px solid #e2e8f0',
      color: '#64748b',
      fontWeight: 500,
      fontSize: '0.75rem'
    },
    td: {
      padding: '0.5rem',
      borderBottom: '1px solid #f1f5f9',
      color: '#334155'
    },
    appId: {
      fontFamily: 'monospace',
      fontWeight: 600,
      color: '#1e40af'
    },
    statusPill: {
      display: 'inline-block',
      padding: '0.125rem 0.5rem',
      borderRadius: '9999px',
      fontSize: '0.6875rem',
      fontWeight: 500
    },
    noApps: {
      color: '#94a3b8',
      fontSize: '0.8125rem',
      padding: '0.5rem 0'
    },
    adoptedBanner: {
      backgroundColor: '#dcfce7',
      border: '1px solid #22c55e',
      borderRadius: '6px',
      padding: '0.75rem 1rem',
      marginBottom: '1rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem'
    },
    refreshNote: {
      fontSize: '0.6875rem',
      color: '#94a3b8',
      marginTop: '0.75rem'
    }
  }

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Loading applications...</div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        Adoption Status
      </div>

      {/* Show adopted banner if cat is adopted */}
      {adoptedApp && (
        <div style={styles.adoptedBanner}>
          <span style={{ fontSize: '1.25rem' }}>🎉</span>
          <div>
            <div style={{ fontWeight: 600, color: '#166534' }}>
              Adopted by {adoptedApp.applicantName}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#15803d' }}>
              Application #{adoptedApp.applicationId} • {formatDate(adoptedApp.submittedAt)}
            </div>
          </div>
        </div>
      )}

      {/* Status indicator */}
      {!adoptedApp && (
        <div>
          <span style={{
            ...styles.statusBadge,
            backgroundColor: applications.length > 0 ? '#fef3c7' : '#dcfce7',
            color: applications.length > 0 ? '#92400e' : '#166534'
          }}>
            {applications.length > 0 ? `${applications.length} Application${applications.length > 1 ? 's' : ''} Pending` : 'Available for Adoption'}
          </span>
        </div>
      )}

      <div style={styles.helpText}>
        Adoption status is determined by applications. Mark an application as "Adopted" to update this cat's status.
      </div>

      {/* Applications table */}
      {applications.length > 0 && (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>ID</th>
              <th style={styles.th}>Applicant</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Date</th>
            </tr>
          </thead>
          <tbody>
            {applications.map(app => {
              const statusInfo = statusLabels[app.status] || { label: app.status, color: '#6b7280' }
              return (
                <tr key={app._id}>
                  <td style={styles.td}>
                    <span style={styles.appId}>#{app.applicationId}</span>
                  </td>
                  <td style={styles.td}>{app.applicantName}</td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.statusPill,
                      backgroundColor: `${statusInfo.color}20`,
                      color: statusInfo.color
                    }}>
                      {statusInfo.label}
                    </span>
                  </td>
                  <td style={styles.td}>{formatDate(app.submittedAt)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}

      {applications.length === 0 && (
        <div style={styles.noApps}>No applications yet for this cat.</div>
      )}

      <div style={styles.refreshNote}>
        Auto-refreshes every 5 seconds
      </div>
    </div>
  )
}
