import { useEffect, useState } from 'react'
import { useClient, useFormValue } from 'sanity'

export function CatAdoptedNotice(props) {
  const client = useClient({ apiVersion: '2024-01-01' })
  const [catAdoptionInfo, setCatAdoptionInfo] = useState(null)
  const [loading, setLoading] = useState(true)

  // Get the cat reference from the current document
  const catRef = useFormValue(['cat'])
  const currentStatus = useFormValue(['status'])

  useEffect(() => {
    if (!catRef?._ref) {
      setLoading(false)
      return
    }

    // Check if this cat has been adopted by someone else
    client.fetch(
      `{
        "cat": *[_id == $catId][0] {
          _id,
          name
        },
        "adoptedApplication": *[_type == "application" && cat._ref == $catId && status == "adopted"][0] {
          _id,
          applicationId,
          applicantName
        }
      }`,
      { catId: catRef._ref }
    ).then(result => {
      setCatAdoptionInfo(result)
      setLoading(false)
    }).catch((err) => {
      console.error('Error checking cat adoption status:', err)
      setLoading(false)
    })
  }, [catRef, client])

  // Don't show if this application itself is the adopted one
  const documentId = useFormValue(['_id'])
  const isThisApplicationAdopted = catAdoptionInfo?.adoptedApplication?._id === documentId ||
    catAdoptionInfo?.adoptedApplication?._id === documentId?.replace('drafts.', '')

  // Only show notice if cat is adopted by someone else
  if (loading || !catAdoptionInfo?.adoptedApplication || isThisApplicationAdopted) {
    return null
  }

  const styles = {
    container: {
      backgroundColor: '#fef3c7',
      border: '1px solid #f59e0b',
      borderRadius: '6px',
      padding: '1rem',
      marginBottom: '1rem'
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      marginBottom: '0.5rem'
    },
    icon: {
      fontSize: '1.25rem'
    },
    title: {
      fontWeight: 600,
      color: '#92400e',
      fontSize: '0.875rem'
    },
    message: {
      color: '#78350f',
      fontSize: '0.8125rem',
      lineHeight: 1.5
    },
    catName: {
      fontWeight: 600
    },
    adoptedBy: {
      fontStyle: 'italic'
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.icon}>⚠️</span>
        <span style={styles.title}>Cat Already Adopted</span>
      </div>
      <div style={styles.message}>
        <span style={styles.catName}>{catAdoptionInfo.cat?.name}</span> has already been adopted by{' '}
        <span style={styles.adoptedBy}>
          {catAdoptionInfo.adoptedApplication.applicantName} (#{catAdoptionInfo.adoptedApplication.applicationId})
        </span>.
        <br /><br />
        Use the dropdown below to redirect this applicant to a different cat.
      </div>
    </div>
  )
}
