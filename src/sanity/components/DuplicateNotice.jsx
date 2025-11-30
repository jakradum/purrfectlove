import { useEffect, useState } from 'react'
import { useClient, useFormValue } from 'sanity'

export function DuplicateNotice(props) {
  const client = useClient({ apiVersion: '2024-01-01' })
  const [originalAppId, setOriginalAppId] = useState(null)

  // Get the isDuplicateOf value from the form
  const isDuplicateOf = useFormValue(['isDuplicateOf'])

  useEffect(() => {
    if (isDuplicateOf?._ref) {
      client.fetch(`*[_id == $id][0].applicationId`, { id: isDuplicateOf._ref })
        .then(id => setOriginalAppId(id))
    } else {
      setOriginalAppId(null)
    }
  }, [isDuplicateOf, client])

  // Only show when marked as duplicate
  if (!isDuplicateOf) {
    return null
  }

  return (
    <div style={{
      backgroundColor: '#fef3c7',
      border: '1px solid #f59e0b',
      borderRadius: '6px',
      padding: '0.75rem 1rem',
      marginBottom: '1rem'
    }}>
      <div style={{
        borderBottom: '1px dashed #d97706',
        paddingBottom: '0.5rem',
        marginBottom: '0.5rem',
        fontSize: '0.75rem',
        color: '#92400e',
        letterSpacing: '0.05em',
        fontWeight: 600
      }}>
        REPEAT APPLICATION
      </div>
      <div style={{ fontSize: '0.875rem', color: '#92400e' }}>
        Refer to the original application{' '}
        {originalAppId ? (
          <span style={{
            fontFamily: 'monospace',
            fontWeight: 700,
            backgroundColor: '#22c55e',
            color: '#fff',
            padding: '0.125rem 0.5rem',
            borderRadius: '3px'
          }}>#{originalAppId}</span>
        ) : (
          <span style={{ opacity: 0.6 }}>loading...</span>
        )}
      </div>
      <div style={{
        fontSize: '0.8125rem',
        color: '#a16207',
        marginTop: '0.5rem',
        fontStyle: 'italic'
      }}>
        Repeat applications are not editable. To edit this, remove the link to the repeated application above.
      </div>
    </div>
  )
}
